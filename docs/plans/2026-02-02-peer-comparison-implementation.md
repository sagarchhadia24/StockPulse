# Peer Comparison Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a stock comparison tool that lets users compare up to 4 stocks side-by-side on valuation and performance metrics.

**Architecture:** URL-driven comparison page that reads symbols from query params, fetches data server-side, displays in a responsive table with "best value" highlighting. Reuses existing stock search component pattern.

**Tech Stack:** Next.js 16 App Router, React Server Components, existing Yahoo Finance integration, Recharts for 52-week range visualization.

---

## Task 1: Create Compare Helper Functions

**Files:**
- Create: `lib/compare.ts`
- Test: `__tests__/lib/compare.test.ts`

**Step 1: Write the failing test for YTD change calculation**

```typescript
// __tests__/lib/compare.test.ts
import { calculateYTDChange, findBestValue, getBestMetric } from "@/lib/compare";

describe("calculateYTDChange", () => {
  it("should calculate positive YTD change correctly", () => {
    const history = [
      { date: "2026-01-02", price: 100 },
      { date: "2026-01-15", price: 110 },
      { date: "2026-02-01", price: 120 },
    ];
    const currentPrice = 120;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(20); // 20% increase from 100 to 120
  });

  it("should calculate negative YTD change correctly", () => {
    const history = [
      { date: "2026-01-02", price: 100 },
      { date: "2026-02-01", price: 80 },
    ];
    const currentPrice = 80;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(-20); // 20% decrease from 100 to 80
  });

  it("should return null for empty history", () => {
    const result = calculateYTDChange([], 100);
    expect(result).toBeNull();
  });

  it("should use earliest date in current year", () => {
    const history = [
      { date: "2025-12-15", price: 90 }, // Last year, ignore
      { date: "2026-01-02", price: 100 }, // First day this year
      { date: "2026-02-01", price: 110 },
    ];
    const currentPrice = 110;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(10); // From 100, not 90
  });
});

describe("findBestValue", () => {
  it("should return index of highest value score", () => {
    const scores = [45, 72, 58, 65];
    expect(findBestValue(scores)).toBe(1);
  });

  it("should return 0 for single stock", () => {
    const scores = [55];
    expect(findBestValue(scores)).toBe(0);
  });

  it("should return first index on tie", () => {
    const scores = [70, 70, 50];
    expect(findBestValue(scores)).toBe(0);
  });
});

describe("getBestMetric", () => {
  it("should find lowest P/E as best (lower is better)", () => {
    const values = [25, 18, 30, null];
    expect(getBestMetric(values, "lowest")).toBe(1);
  });

  it("should find highest dividend yield as best", () => {
    const values = [2.5, 3.1, 1.8, null];
    expect(getBestMetric(values, "highest")).toBe(1);
  });

  it("should skip null values", () => {
    const values = [null, null, 20, 25];
    expect(getBestMetric(values, "lowest")).toBe(2);
  });

  it("should return -1 if all values are null", () => {
    const values = [null, null, null];
    expect(getBestMetric(values, "lowest")).toBe(-1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/compare.test.ts`
Expected: FAIL with "Cannot find module '@/lib/compare'"

**Step 3: Write minimal implementation**

```typescript
// lib/compare.ts

/**
 * Calculate Year-to-Date percentage change
 * Uses the first trading day of the current year as baseline
 */
export function calculateYTDChange(
  history: { date: string; price: number }[],
  currentPrice: number
): number | null {
  if (history.length === 0) return null;

  const currentYear = new Date().getFullYear();

  // Find first date in current year
  const ytdHistory = history
    .filter((h) => new Date(h.date).getFullYear() === currentYear)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (ytdHistory.length === 0) return null;

  const startPrice = ytdHistory[0].price;
  if (startPrice === 0) return null;

  const change = ((currentPrice - startPrice) / startPrice) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Find index of stock with best (highest) value score
 */
export function findBestValue(scores: number[]): number {
  if (scores.length === 0) return -1;

  let bestIndex = 0;
  let bestScore = scores[0];

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Find index of best metric value (handling nulls)
 * @param mode "lowest" for P/E, P/B, PEG; "highest" for dividend yield
 */
export function getBestMetric(
  values: (number | null)[],
  mode: "lowest" | "highest"
): number {
  let bestIndex = -1;
  let bestValue: number | null = null;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === null) continue;

    if (bestValue === null) {
      bestValue = value;
      bestIndex = i;
    } else if (mode === "lowest" && value < bestValue) {
      bestValue = value;
      bestIndex = i;
    } else if (mode === "highest" && value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }

  return bestIndex;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/compare.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/compare.ts __tests__/lib/compare.test.ts
git commit -m "feat(compare): add helper functions for stock comparison

- calculateYTDChange: compute year-to-date percentage change
- findBestValue: identify stock with highest value score
- getBestMetric: find best metric accounting for nulls

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add ComparisonStock Type

**Files:**
- Modify: `types/stock.ts`

**Step 1: Add the new type**

Add at end of `types/stock.ts`:

```typescript
export interface ComparisonStock extends StockWithScore {
  ytdChange: number | null;
}
```

**Step 2: Run existing tests to ensure no breakage**

Run: `npm test`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add types/stock.ts
git commit -m "feat(types): add ComparisonStock interface

Extends StockWithScore with ytdChange for peer comparison feature

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Stock Search Component for Compare Page

**Files:**
- Create: `components/compare/compare-search.tsx`

**Step 1: Create the component**

```tsx
// components/compare/compare-search.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

const SYMBOL_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  JNJ: "Johnson & Johnson",
};

interface CompareSearchProps {
  selectedSymbols: string[];
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
  maxSymbols?: number;
}

export function CompareSearch({
  selectedSymbols,
  onAddSymbol,
  onRemoveSymbol,
  maxSymbols = 4,
}: CompareSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAtLimit = selectedSymbols.length >= maxSymbols;

  useEffect(() => {
    if (query.length < 1 || isAtLimit) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const upperQuery = query.toUpperCase();
    const filtered = UNIQUE_SYMBOLS.filter(
      (symbol) =>
        !selectedSymbols.includes(symbol) &&
        (symbol.includes(upperQuery) ||
          SYMBOL_NAMES[symbol]?.toUpperCase().includes(upperQuery))
    ).slice(0, 6);

    setResults(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, selectedSymbols, isAtLimit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    onAddSymbol(symbol);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected symbols as chips */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSymbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00dc82]/10 border border-[#00dc82]/20 text-sm font-medium text-[#00dc82]"
            >
              {symbol}
              <button
                onClick={() => onRemoveSymbol(symbol)}
                className="hover:bg-[#00dc82]/20 rounded p-0.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div
          className={cn(
            "relative flex items-center rounded-xl transition-all duration-300",
            "bg-white/5 border border-white/10",
            isAtLimit && "opacity-50 cursor-not-allowed"
          )}
        >
          <Search className="absolute left-3 h-4 w-4 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isAtLimit
                ? `Maximum ${maxSymbols} stocks reached`
                : "Search stocks to compare..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAtLimit}
            className={cn(
              "w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40",
              "focus:outline-none transition-all duration-300",
              isAtLimit && "cursor-not-allowed"
            )}
          />
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 w-full glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {results.map((symbol, index) => (
              <button
                key={symbol}
                onClick={() => handleSelect(symbol)}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between gap-4 transition-colors",
                  "hover:bg-white/5",
                  selectedIndex === index && "bg-[#00dc82]/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <TrendingUp className="h-4 w-4 text-[#00dc82]" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">{symbol}</span>
                    {SYMBOL_NAMES[symbol] && (
                      <p className="text-xs text-white/50">{SYMBOL_NAMES[symbol]}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-white/40">
        {selectedSymbols.length} of {maxSymbols} stocks selected
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/compare/compare-search.tsx
git commit -m "feat(compare): add stock search component for comparison

- Autocomplete search filtering available symbols
- Selected symbols shown as removable chips
- Enforces max 4 stocks limit
- Keyboard navigation support

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Comparison Table Component

**Files:**
- Create: `components/compare/comparison-table.tsx`

**Step 1: Create the component**

```tsx
// components/compare/comparison-table.tsx
import { ComparisonStock } from "@/types";
import { Badge } from "@/components/ui/badge";
import { RangeBar } from "@/components/ui/range-bar";
import { cn } from "@/lib/utils";
import { findBestValue, getBestMetric } from "@/lib/compare";
import { classifyStock, getScoreColor } from "@/lib/valuation";
import { X, Crown } from "lucide-react";

// Sector averages for comparison display
const SECTOR_AVERAGES: Record<string, { pe: number; pb: number }> = {
  Technology: { pe: 28, pb: 7 },
  Healthcare: { pe: 22, pb: 4 },
  Financials: { pe: 14, pb: 1.3 },
  "Consumer Discretionary": { pe: 24, pb: 5 },
  "Consumer Staples": { pe: 22, pb: 5 },
  Energy: { pe: 12, pb: 1.8 },
  Industrials: { pe: 20, pb: 4 },
  Materials: { pe: 15, pb: 2.5 },
  "Real Estate": { pe: 35, pb: 2 },
  Utilities: { pe: 18, pb: 1.8 },
  "Communication Services": { pe: 18, pb: 3 },
};

interface ComparisonTableProps {
  stocks: ComparisonStock[];
  onRemoveStock: (symbol: string) => void;
}

export function ComparisonTable({ stocks, onRemoveStock }: ComparisonTableProps) {
  if (stocks.length === 0) {
    return null;
  }

  // Calculate best values for highlighting
  const valueScores = stocks.map((s) => s.valueScore);
  const peRatios = stocks.map((s) => s.peRatio);
  const pbRatios = stocks.map((s) => s.pbRatio);
  const pegRatios = stocks.map((s) => s.pegRatio);
  const dividends = stocks.map((s) => s.dividendYield);
  const ytdChanges = stocks.map((s) => s.ytdChange);

  const bestValueIndex = findBestValue(valueScores);
  const bestPEIndex = getBestMetric(peRatios, "lowest");
  const bestPBIndex = getBestMetric(pbRatios, "lowest");
  const bestPEGIndex = getBestMetric(pegRatios, "lowest");
  const bestDividendIndex = getBestMetric(dividends, "highest");
  const bestYTDIndex = getBestMetric(ytdChanges, "highest");

  const formatRatio = (value: number | null, sectorAvg?: number): string => {
    if (value === null) return "—";
    if (sectorAvg) {
      const ratio = (value / sectorAvg).toFixed(2);
      return `${value.toFixed(1)} · ${ratio}x`;
    }
    return value.toFixed(1);
  };

  const formatPercent = (value: number | null): string => {
    if (value === null) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-4 min-w-full pb-4">
        {stocks.map((stock, index) => {
          const isBestValue = index === bestValueIndex;
          const classification = classifyStock(stock.valueScore);
          const scoreColor = getScoreColor(stock.valueScore);
          const sectorAvg = SECTOR_AVERAGES[stock.sector];

          return (
            <div
              key={stock.symbol}
              className={cn(
                "flex-1 min-w-[240px] max-w-[300px] rounded-xl border bg-white/5 overflow-hidden",
                isBestValue
                  ? "border-[#00dc82]/50 ring-1 ring-[#00dc82]/20"
                  : "border-white/10"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {stock.symbol}
                      </span>
                      {isBestValue && (
                        <Crown className="h-4 w-4 text-[#00dc82]" />
                      )}
                    </div>
                    <p className="text-sm text-white/60 truncate max-w-[180px]">
                      {stock.name}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveStock(stock.symbol)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-white/40" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="p-4 space-y-4">
                {/* Price */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      ${stock.price.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        stock.changePercent >= 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </div>

                {/* Value Score */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Value Score</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold", scoreColor)}>
                      {stock.valueScore}
                    </span>
                    <Badge
                      variant={
                        classification === "undervalued"
                          ? "default"
                          : classification === "overvalued"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {classification}
                    </Badge>
                  </div>
                </div>

                {/* P/E Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">P/E Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPEIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.peRatio, sectorAvg?.pe)}
                  </span>
                </div>

                {/* P/B Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">P/B Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPBIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.pbRatio, sectorAvg?.pb)}
                  </span>
                </div>

                {/* PEG Ratio */}
                <div>
                  <p className="text-xs text-white/40 mb-1">PEG Ratio</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestPEGIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {formatRatio(stock.pegRatio)}
                  </span>
                </div>

                {/* 52-Week Range */}
                <div>
                  <p className="text-xs text-white/40 mb-2">52-Week Range</p>
                  <RangeBar
                    low={stock.week52Low}
                    high={stock.week52High}
                    current={stock.price}
                  />
                </div>

                {/* YTD Change */}
                <div>
                  <p className="text-xs text-white/40 mb-1">YTD Change</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestYTDIndex
                        ? "text-[#00dc82]"
                        : stock.ytdChange !== null && stock.ytdChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    )}
                  >
                    {formatPercent(stock.ytdChange)}
                  </span>
                </div>

                {/* Dividend Yield */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Dividend Yield</p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index === bestDividendIndex ? "text-[#00dc82]" : "text-white"
                    )}
                  >
                    {stock.dividendYield !== null
                      ? `${stock.dividendYield.toFixed(2)}%`
                      : "—"}
                  </span>
                </div>

                {/* Sector */}
                <div>
                  <p className="text-xs text-white/40 mb-1">Sector</p>
                  <Badge variant="outline" className="text-xs">
                    {stock.sector}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/compare/comparison-table.tsx
git commit -m "feat(compare): add comparison table component

- Side-by-side stock columns with all metrics
- Best value highlighted with crown icon
- Best metric in each row highlighted in green
- 52-week range visual bar
- Sector-relative P/E and P/B display

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Similar Stocks Component

**Files:**
- Create: `components/compare/similar-stocks.tsx`

**Step 1: Create the component**

```tsx
// components/compare/similar-stocks.tsx
import { StockWithScore } from "@/types";
import { Badge } from "@/components/ui/badge";
import { classifyStock, getScoreColor } from "@/lib/valuation";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface SimilarStocksProps {
  stocks: StockWithScore[];
  onAddStock: (symbol: string) => void;
  disabled?: boolean;
}

export function SimilarStocks({ stocks, onAddStock, disabled }: SimilarStocksProps) {
  if (stocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/60">Similar Stocks</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stocks.map((stock) => {
          const classification = classifyStock(stock.valueScore);
          const scoreColor = getScoreColor(stock.valueScore);

          return (
            <button
              key={stock.symbol}
              onClick={() => onAddStock(stock.symbol)}
              disabled={disabled}
              className={cn(
                "p-3 rounded-lg border border-white/10 bg-white/5 text-left transition-all",
                "hover:border-[#00dc82]/30 hover:bg-white/8",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">{stock.symbol}</span>
                  <p className="text-xs text-white/50 truncate max-w-[100px]">
                    {stock.name}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-white/40" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn("text-lg font-bold", scoreColor)}>
                  {stock.valueScore}
                </span>
                <Badge
                  variant={
                    classification === "undervalued"
                      ? "default"
                      : classification === "overvalued"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {classification}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/compare/similar-stocks.tsx
git commit -m "feat(compare): add similar stocks suggestions component

- Shows same-sector stocks as suggestions
- Displays symbol, name, and value score
- Click to add to comparison
- Disabled state when at max stocks

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Compare Page

**Files:**
- Create: `app/(dashboard)/compare/page.tsx`

**Step 1: Create the page**

```tsx
// app/(dashboard)/compare/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { ComparePageClient } from "./compare-page-client";
import { getMultipleQuotes, getHistoricalPrices } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { calculateYTDChange } from "@/lib/compare";
import { ComparisonStock, StockWithScore } from "@/types";
import { SYMBOL_SECTORS } from "@/lib/yahoo-finance";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Compare Stocks | StockPulse",
  description: "Compare up to 4 stocks side-by-side on valuation and performance metrics",
};

// Get sector for a symbol
function getSymbolSector(symbol: string): string {
  // Import from yahoo-finance.ts or use a simplified version
  const SECTORS: Record<string, string> = {
    AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", NVDA: "Technology",
    AMZN: "Consumer Discretionary", TSLA: "Consumer Discretionary",
    JPM: "Financials", BAC: "Financials", GS: "Financials",
    JNJ: "Healthcare", UNH: "Healthcare", PFE: "Healthcare",
    XOM: "Energy", CVX: "Energy",
    // Add more as needed
  };
  return SECTORS[symbol] || "Technology";
}

async function getComparisonData(symbols: string[]): Promise<{
  stocks: ComparisonStock[];
  similarStocks: StockWithScore[];
}> {
  if (symbols.length === 0) {
    return { stocks: [], similarStocks: [] };
  }

  // Fetch stock data
  const rawStocks = await getMultipleQuotes(symbols);

  // Calculate value scores and YTD changes
  const stocks: ComparisonStock[] = await Promise.all(
    rawStocks.map(async (stock) => {
      const scored = calculateValueScore(stock);
      const history = await getHistoricalPrices(stock.symbol, "1y");
      const ytdChange = calculateYTDChange(history, stock.price);
      return { ...scored, ytdChange };
    })
  );

  // Get similar stocks (same sector as first stock)
  let similarStocks: StockWithScore[] = [];
  if (stocks.length > 0) {
    const firstSector = stocks[0].sector;
    const sectorSymbols = Object.entries(SYMBOL_SECTORS || {})
      .filter(([sym, sector]) => sector === firstSector && !symbols.includes(sym))
      .map(([sym]) => sym)
      .slice(0, 4);

    if (sectorSymbols.length > 0) {
      const sectorStocks = await getMultipleQuotes(sectorSymbols);
      similarStocks = sectorStocks.map((s) => calculateValueScore(s));
    }
  }

  return { stocks, similarStocks };
}

function CompareSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full max-w-md" />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[500px] w-[280px]" />
        ))}
      </div>
    </div>
  );
}

async function CompareContent({
  symbols,
}: {
  symbols: string[];
}) {
  const { stocks, similarStocks } = await getComparisonData(symbols);

  return (
    <ComparePageClient
      initialStocks={stocks}
      initialSimilarStocks={similarStocks}
      initialSymbols={symbols}
    />
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const params = await searchParams;
  const symbolsParam = params.symbols || "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Compare Stocks</h1>
        <p className="text-white/60 mt-1">
          Compare up to 4 stocks side-by-side on valuation metrics
        </p>
      </div>

      <Suspense fallback={<CompareSkeleton />}>
        <CompareContent symbols={symbols} />
      </Suspense>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/compare/page.tsx
git commit -m "feat(compare): add compare page server component

- Reads symbols from URL query params
- Fetches stock data with value scores and YTD changes
- Fetches similar stocks from same sector
- Server-side rendering with Suspense

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Compare Page Client Component

**Files:**
- Create: `app/(dashboard)/compare/compare-page-client.tsx`

**Step 1: Create the client component**

```tsx
// app/(dashboard)/compare/compare-page-client.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CompareSearch } from "@/components/compare/compare-search";
import { ComparisonTable } from "@/components/compare/comparison-table";
import { SimilarStocks } from "@/components/compare/similar-stocks";
import { ComparisonStock, StockWithScore } from "@/types";
import { GitCompare } from "lucide-react";

interface ComparePageClientProps {
  initialStocks: ComparisonStock[];
  initialSimilarStocks: StockWithScore[];
  initialSymbols: string[];
}

export function ComparePageClient({
  initialStocks,
  initialSimilarStocks,
  initialSymbols,
}: ComparePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURL = useCallback(
    (symbols: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (symbols.length > 0) {
        params.set("symbols", symbols.join(","));
      } else {
        params.delete("symbols");
      }
      router.push(`/compare?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleAddSymbol = useCallback(
    (symbol: string) => {
      if (initialSymbols.length >= 4) return;
      if (initialSymbols.includes(symbol)) return;
      updateURL([...initialSymbols, symbol]);
    },
    [initialSymbols, updateURL]
  );

  const handleRemoveSymbol = useCallback(
    (symbol: string) => {
      updateURL(initialSymbols.filter((s) => s !== symbol));
    },
    [initialSymbols, updateURL]
  );

  const isAtLimit = initialSymbols.length >= 4;

  return (
    <div className="space-y-8">
      {/* Search */}
      <CompareSearch
        selectedSymbols={initialSymbols}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
        maxSymbols={4}
      />

      {/* Empty State */}
      {initialStocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <GitCompare className="h-8 w-8 text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No stocks selected
          </h2>
          <p className="text-white/60 max-w-md">
            Search for stocks above to add them to your comparison. You can compare
            up to 4 stocks side-by-side.
          </p>
        </div>
      )}

      {/* Comparison Table */}
      {initialStocks.length > 0 && (
        <ComparisonTable stocks={initialStocks} onRemoveStock={handleRemoveSymbol} />
      )}

      {/* Similar Stocks Suggestions */}
      {initialStocks.length > 0 && initialSimilarStocks.length > 0 && (
        <SimilarStocks
          stocks={initialSimilarStocks}
          onAddStock={handleAddSymbol}
          disabled={isAtLimit}
        />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/compare/compare-page-client.tsx
git commit -m "feat(compare): add compare page client component

- Manages URL state for symbol selection
- Handles add/remove symbol interactions
- Renders empty state, comparison table, and similar stocks
- URL updates trigger server re-fetch

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Compare Button to Stock Detail Page

**Files:**
- Modify: `app/(dashboard)/stock/[symbol]/page.tsx`

**Step 1: Add the Compare button**

In `StockDetailContent` component, after the `WatchlistButton`, add:

```tsx
// Add import at top
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";

// In the header section, after WatchlistButton:
<Link href={`/compare?symbols=${stock.symbol}`}>
  <Button variant="outline" size="sm" className="gap-2">
    <GitCompare className="h-4 w-4" />
    Compare
  </Button>
</Link>
```

The modified header section should look like:

```tsx
<div className="flex items-center gap-4">
  <Card className="w-32">
    <CardContent className="p-4 text-center">
      <p className="text-sm text-muted-foreground">Value Score</p>
      <p className={cn("text-3xl font-bold", scoreColor)}>
        {stock.valueScore}
      </p>
      <Badge
        variant={
          classification === "undervalued"
            ? "default"
            : classification === "overvalued"
            ? "destructive"
            : "secondary"
        }
      >
        {classification}
      </Badge>
    </CardContent>
  </Card>
  <div className="flex flex-col gap-2">
    <WatchlistButton symbol={stock.symbol} variant="full" />
    <Link href={`/compare?symbols=${stock.symbol}`}>
      <Button variant="outline" size="sm" className="gap-2 w-full">
        <GitCompare className="h-4 w-4" />
        Compare
      </Button>
    </Link>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/stock/\[symbol\]/page.tsx
git commit -m "feat(compare): add Compare button to stock detail page

- Links to /compare with current stock pre-selected
- Positioned alongside watchlist button

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Compare Link to Navigation

**Files:**
- Modify: `components/layout/nav-links.tsx`

**Step 1: Check current nav structure and add Compare link**

Add to the navigation links array:

```tsx
{ href: "/compare", label: "Compare", icon: GitCompare }
```

Import `GitCompare` from `lucide-react`.

**Step 2: Commit**

```bash
git add components/layout/nav-links.tsx
git commit -m "feat(compare): add Compare link to navigation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Fix SYMBOL_SECTORS Export

**Files:**
- Modify: `lib/yahoo-finance.ts`

**Step 1: Export SYMBOL_SECTORS**

At line 215 in `lib/yahoo-finance.ts`, change:

```typescript
const SYMBOL_SECTORS: Record<string, Sector> = {
```

to:

```typescript
export const SYMBOL_SECTORS: Record<string, Sector> = {
```

**Step 2: Commit**

```bash
git add lib/yahoo-finance.ts
git commit -m "fix(compare): export SYMBOL_SECTORS for sector-based suggestions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Manual Testing

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Test compare page**

1. Navigate to `http://localhost:3000/compare`
2. Verify empty state displays correctly
3. Search for "AAPL" and add it
4. Verify URL updates to `/compare?symbols=AAPL`
5. Add MSFT, GOOGL, NVDA
6. Verify max 4 limit works
7. Verify similar stocks section appears
8. Click similar stock to add (should fail if at limit)
9. Remove a stock and verify URL updates
10. Verify best value is highlighted with crown
11. Verify best metrics are highlighted in green

**Step 3: Test from stock detail page**

1. Navigate to `http://localhost:3000/stock/AAPL`
2. Click "Compare" button
3. Verify redirects to `/compare?symbols=AAPL`

**Step 4: Test URL sharing**

1. Copy URL `/compare?symbols=AAPL,MSFT,GOOGL`
2. Open in new tab
3. Verify all stocks load correctly

---

## Task 12: Final Commit

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Create summary commit if any fixes were needed**

```bash
git add -A
git commit -m "chore(compare): final cleanup and fixes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan creates the Peer Comparison feature with:

1. **Helper functions** (`lib/compare.ts`) - YTD calculation, best value finding
2. **Type extension** - `ComparisonStock` with YTD change
3. **Components**:
   - `CompareSearch` - Stock search with chips
   - `ComparisonTable` - Side-by-side metrics display
   - `SimilarStocks` - Sector-based suggestions
4. **Pages**:
   - `/compare` - Server component with data fetching
   - Client component for URL state management
5. **Integration**:
   - Compare button on stock detail page
   - Navigation link

Total: ~12 tasks, each completable in 2-5 minutes.
