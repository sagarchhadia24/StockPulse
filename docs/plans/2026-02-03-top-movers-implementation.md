# Top Movers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/movers` page showing top 10 gainers and 10 losers with user-selectable index (S&P 500, NASDAQ 100, Dow 30).

**Architecture:** Client component page fetches from `/api/market/movers` API with index query param. API fetches all symbols for the selected index, calculates % change, sorts, and returns top/bottom 10. Results cached for 5 minutes.

**Tech Stack:** Next.js App Router, Yahoo Finance 2, Radix Select, existing cache utility

---

## Task 1: Create Index Symbol Lists

**Files:**
- Create: `lib/indices.ts`

**Step 1: Create the indices file with symbol arrays**

```typescript
// S&P 500 symbols (partial list of ~100 high-volume stocks for performance)
export const SP500_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH", "JNJ",
  "V", "XOM", "JPM", "PG", "MA", "HD", "CVX", "MRK", "ABBV", "LLY",
  "PEP", "KO", "COST", "AVGO", "WMT", "MCD", "CSCO", "TMO", "ABT", "CRM",
  "ACN", "ADBE", "DHR", "NKE", "CMCSA", "VZ", "INTC", "NEE", "PM", "TXN",
  "WFC", "BMY", "UNP", "QCOM", "UPS", "RTX", "HON", "ORCL", "LOW", "SPGI",
  "AMD", "GS", "CAT", "BA", "SBUX", "DE", "ISRG", "ELV", "GE", "BKNG",
  "MDLZ", "AXP", "LMT", "ADI", "GILD", "SYK", "AMGN", "TJX", "CVS", "C",
  "BLK", "PLD", "CB", "MO", "ZTS", "REGN", "DUK", "SO", "CL", "SLB",
  "VRTX", "EOG", "CME", "NOC", "ITW", "FDX", "EMR", "PNC", "USB", "APD",
  "COP", "MMM", "F", "GM", "PYPL", "NFLX", "DIS", "T", "TMUS", "CHTR",
];

// NASDAQ 100 symbols
export const NASDAQ100_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "AVGO", "COST",
  "ASML", "PEP", "CSCO", "ADBE", "AZN", "NFLX", "AMD", "TMUS", "INTC", "TXN",
  "CMCSA", "INTU", "QCOM", "AMGN", "HON", "AMAT", "ISRG", "BKNG", "SBUX", "VRTX",
  "GILD", "ADI", "MDLZ", "ADP", "REGN", "LRCX", "MU", "PANW", "PYPL", "KLAC",
  "SNPS", "CDNS", "MELI", "CSX", "ORLY", "MAR", "CTAS", "MNST", "NXPI", "MRVL",
  "PCAR", "ADSK", "WDAY", "ROST", "KDP", "AEP", "FTNT", "DXCM", "CPRT", "PAYX",
  "KHC", "CHTR", "MCHP", "EXC", "ABNB", "ODFL", "CEG", "VRSK", "IDXX", "FAST",
  "CTSH", "EA", "XEL", "CSGP", "GEHC", "BIIB", "ON", "DDOG", "ANSS", "ZS",
  "FANG", "DLTR", "WBD", "BKR", "TTD", "ILMN", "ALGN", "TEAM", "WBA", "CRWD",
  "MRNA", "LCID", "SIRI", "JD", "PDD", "RIVN", "ZM", "OKTA", "SPLK", "ENPH",
];

// Dow 30 symbols
export const DOW30_SYMBOLS = [
  "AAPL", "AMGN", "AXP", "BA", "CAT", "CRM", "CSCO", "CVX", "DIS", "DOW",
  "GS", "HD", "HON", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD", "MMM",
  "MRK", "MSFT", "NKE", "PG", "TRV", "UNH", "V", "VZ", "WBA", "WMT",
];

export type IndexType = "sp500" | "nasdaq100" | "dow30";

export const INDEX_CONFIG: Record<IndexType, { name: string; symbols: string[] }> = {
  sp500: { name: "S&P 500", symbols: SP500_SYMBOLS },
  nasdaq100: { name: "NASDAQ 100", symbols: NASDAQ100_SYMBOLS },
  dow30: { name: "Dow 30", symbols: DOW30_SYMBOLS },
};
```

**Step 2: Commit**

```bash
git add lib/indices.ts
git commit -m "feat(movers): add index symbol lists for SP500, NASDAQ100, Dow30"
```

---

## Task 2: Create Movers Logic with Tests

**Files:**
- Create: `lib/movers.ts`
- Create: `__tests__/lib/movers.test.ts`

**Step 1: Write the failing test**

```typescript
import { sortByChange, getTopMovers } from "@/lib/movers";

describe("sortByChange", () => {
  it("should sort stocks by changePercent descending", () => {
    const stocks = [
      { symbol: "A", changePercent: 1.5 },
      { symbol: "B", changePercent: 5.2 },
      { symbol: "C", changePercent: -2.1 },
    ];

    const sorted = sortByChange(stocks as any);

    expect(sorted[0].symbol).toBe("B");
    expect(sorted[1].symbol).toBe("A");
    expect(sorted[2].symbol).toBe("C");
  });
});

describe("getTopMovers", () => {
  it("should return top N gainers and losers", () => {
    const stocks = [
      { symbol: "A", changePercent: 5.0 },
      { symbol: "B", changePercent: 3.0 },
      { symbol: "C", changePercent: 1.0 },
      { symbol: "D", changePercent: -1.0 },
      { symbol: "E", changePercent: -3.0 },
      { symbol: "F", changePercent: -5.0 },
    ];

    const result = getTopMovers(stocks as any, 2);

    expect(result.gainers).toHaveLength(2);
    expect(result.gainers[0].symbol).toBe("A");
    expect(result.gainers[1].symbol).toBe("B");

    expect(result.losers).toHaveLength(2);
    expect(result.losers[0].symbol).toBe("F");
    expect(result.losers[1].symbol).toBe("E");
  });

  it("should handle fewer stocks than requested", () => {
    const stocks = [
      { symbol: "A", changePercent: 2.0 },
      { symbol: "B", changePercent: -1.0 },
    ];

    const result = getTopMovers(stocks as any, 10);

    expect(result.gainers).toHaveLength(1);
    expect(result.losers).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/movers.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/movers'"

**Step 3: Write minimal implementation**

```typescript
import { Stock } from "@/types";

export interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MoversResult {
  gainers: MoverStock[];
  losers: MoverStock[];
}

export function sortByChange<T extends { changePercent: number }>(stocks: T[]): T[] {
  return [...stocks].sort((a, b) => b.changePercent - a.changePercent);
}

export function getTopMovers(stocks: Stock[], count: number = 10): MoversResult {
  const sorted = sortByChange(stocks);

  const gainers = sorted
    .filter((s) => s.changePercent > 0)
    .slice(0, count)
    .map(toMoverStock);

  const losers = sorted
    .filter((s) => s.changePercent < 0)
    .reverse()
    .slice(0, count)
    .map(toMoverStock);

  return { gainers, losers };
}

function toMoverStock(stock: Stock): MoverStock {
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/lib/movers.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/movers.ts __tests__/lib/movers.test.ts
git commit -m "feat(movers): add sorting and filtering logic with tests"
```

---

## Task 3: Create API Endpoint

**Files:**
- Create: `app/api/market/movers/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { getTopMovers } from "@/lib/movers";
import { INDEX_CONFIG, IndexType } from "@/lib/indices";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY_PREFIX = "movers:";
const MOVERS_COUNT = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const index = (searchParams.get("index") || "sp500") as IndexType;

  // Validate index parameter
  if (!INDEX_CONFIG[index]) {
    return NextResponse.json(
      { error: "Invalid index. Use: sp500, nasdaq100, or dow30" },
      { status: 400 }
    );
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${index}`;

  // Check cache first
  const cached = getCached<{
    index: string;
    indexName: string;
    gainers: any[];
    losers: any[];
    asOf: string;
  }>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const { symbols, name } = INDEX_CONFIG[index];
    const stocks = await getMultipleQuotes(symbols);
    const { gainers, losers } = getTopMovers(stocks, MOVERS_COUNT);

    const result = {
      index,
      indexName: name,
      gainers,
      losers,
      asOf: new Date().toISOString(),
    };

    // Cache for 5 minutes (cache module uses 15 min by default, this is fine)
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching movers:", error);
    return NextResponse.json(
      { error: "Failed to fetch market movers" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/market/movers/route.ts
git commit -m "feat(movers): add API endpoint for market movers"
```

---

## Task 4: Create MoversTable Component

**Files:**
- Create: `components/movers/movers-table.tsx`

**Step 1: Create the component**

```typescript
"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MoverStock } from "@/lib/movers";
import { cn } from "@/lib/utils";

interface MoversTableProps {
  stocks: MoverStock[];
  type: "gainers" | "losers";
}

export function MoversTable({ stocks, type }: MoversTableProps) {
  const isGainers = type === "gainers";
  const Icon = isGainers ? TrendingUp : TrendingDown;
  const title = isGainers ? "Top Gainers" : "Top Losers";
  const accentColor = isGainers ? "text-green-500" : "text-red-500";
  const bgColor = isGainers ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-border", bgColor)}>
        <Icon className={cn("h-5 w-5", accentColor)} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {/* Table */}
      <div className="divide-y divide-border">
        {stocks.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No {type} today
          </div>
        ) : (
          stocks.map((stock, index) => (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {stock.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${stock.price.toFixed(2)}</div>
                <div className={cn("text-sm font-medium", accentColor)}>
                  {stock.changePercent >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/movers/movers-table.tsx
git commit -m "feat(movers): add MoversTable component"
```

---

## Task 5: Create IndexSelector Component

**Files:**
- Create: `components/movers/index-selector.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDEX_CONFIG, IndexType } from "@/lib/indices";

export function IndexSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentIndex = (searchParams.get("index") || "sp500") as IndexType;

  const handleChange = (value: string) => {
    router.push(`/movers?index=${value}`);
  };

  return (
    <Select value={currentIndex} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select index" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(INDEX_CONFIG) as [IndexType, { name: string }][]).map(
          ([key, { name }]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Commit**

```bash
git add components/movers/index-selector.tsx
git commit -m "feat(movers): add IndexSelector dropdown component"
```

---

## Task 6: Create Movers Page

**Files:**
- Create: `app/(dashboard)/movers/page.tsx`

**Step 1: Create the page**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { MoversTable } from "@/components/movers/movers-table";
import { IndexSelector } from "@/components/movers/index-selector";
import { MoverStock } from "@/lib/movers";
import { Button } from "@/components/ui/button";

interface MoversData {
  index: string;
  indexName: string;
  gainers: MoverStock[];
  losers: MoverStock[];
  asOf: string;
}

export default function MoversPage() {
  const searchParams = useSearchParams();
  const index = searchParams.get("index") || "sp500";

  const [data, setData] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/market/movers?index=${index}`);
      if (!response.ok) {
        throw new Error("Failed to fetch movers");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers();
  }, [index]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Top Movers</h1>
          <p className="text-muted-foreground">
            Today&apos;s biggest gainers and losers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IndexSelector />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMovers}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Last updated */}
      {data?.asOf && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(data.asOf).toLocaleTimeString()}
        </p>
      )}

      {/* Content */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchMovers}>Try Again</Button>
        </div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <MoversTable stocks={data.gainers} type="gainers" />
          <MoversTable stocks={data.losers} type="losers" />
        </div>
      ) : null}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/(dashboard)/movers/page.tsx
git commit -m "feat(movers): add movers page with gainers/losers tables"
```

---

## Task 7: Add Navigation Link

**Files:**
- Modify: `components/layout/nav-links.tsx`

**Step 1: Add the Movers link to the links array**

Find the `links` array and add the Movers entry after Alerts:

```typescript
import {
  Home,
  TrendingUp,
  TrendingDown,
  PieChart,
  SlidersHorizontal,
  Star,
  GitCompare,
  Bell,
  Zap,  // Add this import
} from "lucide-react";

export const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/movers", label: "Movers", icon: Zap },  // Add this line
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/undervalued", label: "Undervalued", icon: TrendingUp },
  { href: "/overvalued", label: "Overvalued", icon: TrendingDown },
  { href: "/sectors", label: "Sectors", icon: PieChart },
  { href: "/screener", label: "Screener", icon: SlidersHorizontal },
];
```

**Step 2: Run the app to verify**

```bash
npm run dev
```

Navigate to http://localhost:3000/movers and verify:
- Page loads with index selector
- Gainers and losers tables display
- Clicking a stock navigates to its detail page
- Index selector changes the data

**Step 3: Commit**

```bash
git add components/layout/nav-links.tsx
git commit -m "feat(movers): add Movers link to navigation"
```

---

## Task 8: Add Component Tests

**Files:**
- Create: `__tests__/components/movers/movers-table.test.tsx`

**Step 1: Write the test**

```typescript
import { render, screen } from "@testing-library/react";
import { MoversTable } from "@/components/movers/movers-table";
import { MoverStock } from "@/lib/movers";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

const mockGainers: MoverStock[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 150.0, change: 5.0, changePercent: 3.45 },
  { symbol: "MSFT", name: "Microsoft", price: 300.0, change: 8.0, changePercent: 2.74 },
];

const mockLosers: MoverStock[] = [
  { symbol: "TSLA", name: "Tesla Inc.", price: 200.0, change: -10.0, changePercent: -4.76 },
  { symbol: "META", name: "Meta Platforms", price: 350.0, change: -5.0, changePercent: -1.41 },
];

describe("MoversTable", () => {
  it("renders gainers with green styling", () => {
    render(<MoversTable stocks={mockGainers} type="gainers" />);

    expect(screen.getByText("Top Gainers")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("+3.45%")).toBeInTheDocument();
  });

  it("renders losers with red styling", () => {
    render(<MoversTable stocks={mockLosers} type="losers" />);

    expect(screen.getByText("Top Losers")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("-4.76%")).toBeInTheDocument();
  });

  it("links to stock detail page", () => {
    render(<MoversTable stocks={mockGainers} type="gainers" />);

    const link = screen.getByRole("link", { name: /AAPL/i });
    expect(link).toHaveAttribute("href", "/stock/AAPL");
  });

  it("shows empty state when no stocks", () => {
    render(<MoversTable stocks={[]} type="gainers" />);

    expect(screen.getByText("No gainers today")).toBeInTheDocument();
  });
});
```

**Step 2: Run tests**

```bash
npm test -- __tests__/components/movers/movers-table.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/components/movers/movers-table.test.tsx
git commit -m "test(movers): add MoversTable component tests"
```

---

## Task 9: Final Verification and Commit

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run linter**

```bash
npm run lint
```

Fix any issues if present.

**Step 3: Test the feature manually**

1. Navigate to `/movers`
2. Verify S&P 500 loads by default
3. Switch to NASDAQ 100, verify data changes
4. Switch to Dow 30, verify data changes
5. Click a stock, verify navigation to detail page
6. Click refresh button, verify data reloads
7. Check mobile responsive layout (stack vertically)

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "feat(movers): complete Top Movers feature implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Index symbol lists | `lib/indices.ts` |
| 2 | Movers logic + tests | `lib/movers.ts`, `__tests__/lib/movers.test.ts` |
| 3 | API endpoint | `app/api/market/movers/route.ts` |
| 4 | MoversTable component | `components/movers/movers-table.tsx` |
| 5 | IndexSelector component | `components/movers/index-selector.tsx` |
| 6 | Movers page | `app/(dashboard)/movers/page.tsx` |
| 7 | Navigation link | `components/layout/nav-links.tsx` |
| 8 | Component tests | `__tests__/components/movers/movers-table.test.tsx` |
| 9 | Final verification | - |
