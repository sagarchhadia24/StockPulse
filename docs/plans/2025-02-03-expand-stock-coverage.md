# Expand Stock Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand StockPulse from 234 stocks to ~550 unique stocks covering S&P 500, NASDAQ-100, and Dow Jones indices.

**Architecture:** Static symbol data file with index-specific arrays. Yahoo Finance API provides sector data for unmapped stocks. Over/undervalued pages scan all stocks with batch processing and caching.

**Tech Stack:** Next.js 14, TypeScript, Yahoo Finance API, in-memory cache

---

## Task 1: Add S&P 500 Symbols

**Files:**
- Modify: `data/symbols.ts`

**Step 1: Create SP500_SYMBOLS array**

Add at the top of `data/symbols.ts`, replacing the existing `STOCK_SYMBOLS` array:

```typescript
// S&P 500 constituents (as of January 2025)
export const SP500_SYMBOLS: string[] = [
  // Communication Services
  "GOOGL", "GOOG", "META", "NFLX", "DIS", "CMCSA", "VZ", "T", "TMUS", "CHTR",
  "EA", "TTWO", "WBD", "PARA", "OMC", "IPG", "LYV", "MTCH", "FOXA", "FOX", "NWS", "NWSA",

  // Consumer Discretionary
  "AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "MAR",
  "ORLY", "AZO", "CMG", "DHI", "LEN", "GM", "F", "ROST", "YUM", "DG",
  "EBAY", "ETSY", "POOL", "PHM", "NVR", "GPC", "BBY", "ULTA", "DRI", "WYNN",
  "MGM", "CZR", "HLT", "EXPE", "CCL", "RCL", "NCLH", "LVS", "APTV", "BWA",
  "GRMN", "RL", "HAS", "TPR", "VFC", "PVH", "DECK",

  // Consumer Staples
  "PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ", "CL", "KMB",
  "GIS", "K", "HSY", "STZ", "KHC", "KR", "SYY", "ADM", "WBA", "EL",
  "TSN", "HRL", "CAG", "CPB", "SJM", "MKC", "CLX", "CHD", "BG", "TAP", "LW",

  // Energy
  "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "PXD", "OXY",
  "HES", "DVN", "FANG", "HAL", "BKR", "KMI", "WMB", "OKE", "TRGP", "CTRA",
  "MRO", "APA", "EQT", "ENPH",

  // Financials
  "BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SCHW",
  "AXP", "C", "PNC", "USB", "TFC", "COF", "CB", "MMC", "AON", "ICE",
  "CME", "SPGI", "MCO", "MSCI", "FIS", "AIG", "MET", "PRU", "AFL", "TRV",
  "ALL", "PGR", "HIG", "CINF", "L", "AJG", "WRB", "GL", "BRO", "RJF",
  "FITB", "RF", "HBAN", "KEY", "CFG", "MTB", "NTRS", "STT", "NDAQ", "CBOE",
  "DFS", "SYF", "ALLY", "RE", "FRC", "SIVB",

  // Healthcare
  "UNH", "JNJ", "LLY", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY",
  "AMGN", "GILD", "VRTX", "REGN", "ISRG", "MDT", "SYK", "ZTS", "BDX", "CI",
  "ELV", "HUM", "CVS", "MCK", "CAH", "BSX", "EW", "DXCM", "IDXX", "IQV",
  "A", "MTD", "WAT", "HOLX", "TECH", "TFX", "BAX", "ALGN", "BIIB", "MRNA",
  "MOH", "CNC", "DGX", "LH", "VTRS", "OGN", "CTLT", "HSIC", "XRAY",

  // Industrials
  "CAT", "UNP", "HON", "UPS", "RTX", "BA", "DE", "LMT", "GE", "MMM",
  "ADP", "ITW", "EMR", "FDX", "NSC", "CSX", "GD", "NOC", "WM", "ETN",
  "PH", "PCAR", "CMI", "ROK", "FAST", "CTAS", "CPRT", "ODFL", "CARR", "OTIS",
  "AME", "IR", "TDG", "SWK", "DOV", "VRSK", "ROP", "GWW", "XYL", "LDOS",
  "J", "IEX", "TXT", "HWM", "PWR", "MAS", "NDSN", "WAB", "EXPD", "CHRW",
  "LUV", "DAL", "UAL", "AAL", "ALK", "JBHT", "PAYC", "PAYX", "GNRC",

  // Information Technology
  "AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CRM", "ADBE", "AMD", "INTC", "CSCO",
  "IBM", "QCOM", "TXN", "NOW", "INTU", "AMAT", "MU", "LRCX", "ADI", "KLAC",
  "SNPS", "CDNS", "MRVL", "FTNT", "PANW", "CRWD", "APH", "TEL", "ANSS", "KEYS",
  "MPWR", "FSLR", "ENPH", "ON", "SWKS", "QRVO", "MCHP", "NXPI", "ZBRA", "AKAM",
  "VRSN", "CDW", "EPAM", "CTSH", "IT", "ACN", "HPQ", "HPE", "DELL", "WDC",
  "STX", "NTAP", "JNPR", "GLW", "FFIV", "TRMB", "TYL", "PTC", "PAYC",

  // Materials
  "LIN", "APD", "SHW", "ECL", "FCX", "NEM", "NUE", "VMC", "MLM", "DOW",
  "DD", "PPG", "ALB", "CF", "MOS", "IFF", "CE", "EMN", "FMC", "BALL",
  "PKG", "SEE", "IP", "AVY", "AMCR", "WRK",

  // Real Estate
  "AMT", "PLD", "CCI", "EQIX", "PSA", "O", "WELL", "DLR", "SPG", "VICI",
  "AVB", "EQR", "ARE", "MAA", "UDR", "VTR", "HST", "KIM", "REG", "ESS",
  "CPT", "EXR", "PEAK", "SBAC", "IRM", "WY", "BXP", "SLG", "FRT", "CBRE",

  // Utilities
  "NEE", "DUK", "SO", "D", "AEP", "SRE", "EXC", "XEL", "PEG", "ED",
  "WEC", "ES", "AWK", "DTE", "ETR", "FE", "PPL", "AEE", "CMS", "CNP",
  "EVRG", "ATO", "NI", "LNT", "PNW", "NRG",
];
```

**Step 2: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add data/symbols.ts
git commit -m "feat(data): add S&P 500 symbols array"
```

---

## Task 2: Add NASDAQ-100 and Dow Jones Symbols

**Files:**
- Modify: `data/symbols.ts`

**Step 1: Add NASDAQ100_SYMBOLS array**

Add after SP500_SYMBOLS:

```typescript
// NASDAQ-100 constituents (as of January 2025)
export const NASDAQ100_SYMBOLS: string[] = [
  "AAPL", "ABNB", "ADBE", "ADI", "ADP", "ADSK", "AEP", "AMAT", "AMD", "AMGN",
  "AMZN", "ANSS", "ARM", "ASML", "AVGO", "AZN", "BIIB", "BKNG", "BKR", "CCEP",
  "CDNS", "CDW", "CEG", "CHTR", "CMCSA", "COST", "CPRT", "CRWD", "CSCO", "CSGP",
  "CSX", "CTAS", "CTSH", "DASH", "DDOG", "DLTR", "DXCM", "EA", "EXC", "FANG",
  "FAST", "FTNT", "GEHC", "GFS", "GILD", "GOOG", "GOOGL", "HON", "IDXX", "ILMN",
  "INTC", "INTU", "ISRG", "KDP", "KHC", "KLAC", "LIN", "LRCX", "LULU", "MAR",
  "MCHP", "MDB", "MDLZ", "MELI", "META", "MNST", "MRNA", "MRVL", "MSFT", "MU",
  "NFLX", "NVDA", "NXPI", "ODFL", "ON", "ORLY", "PANW", "PAYX", "PCAR", "PDD",
  "PEP", "PYPL", "QCOM", "REGN", "ROP", "ROST", "SBUX", "SMCI", "SNPS", "SPLK",
  "TEAM", "TMUS", "TSLA", "TTD", "TTWO", "TXN", "VRSK", "VRTX", "WBA", "WBD", "WDAY", "XEL", "ZS",
];
```

**Step 2: Add DOW30_SYMBOLS array**

Add after NASDAQ100_SYMBOLS:

```typescript
// Dow Jones Industrial Average (30 stocks)
export const DOW30_SYMBOLS: string[] = [
  "AAPL", "AMGN", "AMZN", "AXP", "BA", "CAT", "CRM", "CSCO", "CVX", "DIS",
  "DOW", "GS", "HD", "HON", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD",
  "MMM", "MRK", "MSFT", "NKE", "PG", "TRV", "UNH", "V", "VZ", "WMT",
];
```

**Step 3: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add data/symbols.ts
git commit -m "feat(data): add NASDAQ-100 and Dow 30 symbols"
```

---

## Task 3: Create Combined Symbol Arrays

**Files:**
- Modify: `data/symbols.ts`

**Step 1: Create ALL_SYMBOLS and update exports**

Replace the old STOCK_SYMBOLS definition and add at the end of the file:

```typescript
// Combined unique list from all indices (de-duplicated)
export const ALL_SYMBOLS: string[] = [
  ...new Set([...SP500_SYMBOLS, ...NASDAQ100_SYMBOLS, ...DOW30_SYMBOLS]),
];

// Backwards compatibility - point to ALL_SYMBOLS
export const STOCK_SYMBOLS = ALL_SYMBOLS;
export const UNIQUE_SYMBOLS = ALL_SYMBOLS;

export const SYMBOL_COUNT = ALL_SYMBOLS.length;

// Expanded diverse sample with stocks from every sector (for pages that need limited data)
export const DIVERSE_SYMBOLS: string[] = [
  // Technology (10)
  "AAPL", "MSFT", "NVDA", "GOOGL", "CRM", "ADBE", "AMD", "INTC", "CSCO", "ORCL",
  // Healthcare (10)
  "UNH", "JNJ", "PFE", "ABBV", "CI", "LLY", "MRK", "TMO", "ABT", "DHR",
  // Financials (10)
  "JPM", "V", "MA", "BAC", "GS", "WFC", "MS", "BLK", "AXP", "C",
  // Consumer Discretionary (10)
  "AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "MAR",
  // Consumer Staples (8)
  "PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ",
  // Energy (8)
  "XOM", "CVX", "COP", "SLB", "OXY", "EOG", "MPC", "PSX",
  // Industrials (8)
  "CAT", "UNP", "HON", "BA", "GE", "UPS", "RTX", "LMT",
  // Materials (6)
  "LIN", "APD", "SHW", "FCX", "NEM", "NUE",
  // Real Estate (6)
  "AMT", "PLD", "EQIX", "O", "CCI", "PSA",
  // Utilities (6)
  "NEE", "DUK", "SO", "AEP", "D", "SRE",
  // Communication Services (6)
  "NFLX", "DIS", "VZ", "T", "CMCSA", "TMUS",
];
```

**Step 2: Remove the old STOCK_SYMBOLS array definition**

Delete the old commented section that defined STOCK_SYMBOLS by sector.

**Step 3: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add data/symbols.ts
git commit -m "feat(data): create combined ALL_SYMBOLS array with ~550 stocks"
```

---

## Task 4: Write Test for Symbol Data

**Files:**
- Create: `__tests__/data/symbols.test.ts`

**Step 1: Write the test file**

```typescript
import {
  SP500_SYMBOLS,
  NASDAQ100_SYMBOLS,
  DOW30_SYMBOLS,
  ALL_SYMBOLS,
  UNIQUE_SYMBOLS,
  STOCK_SYMBOLS,
  DIVERSE_SYMBOLS,
  SYMBOL_COUNT,
} from "@/data/symbols";

describe("Symbol Data", () => {
  describe("Index Arrays", () => {
    it("should have approximately 500 S&P 500 symbols", () => {
      expect(SP500_SYMBOLS.length).toBeGreaterThanOrEqual(450);
      expect(SP500_SYMBOLS.length).toBeLessThanOrEqual(550);
    });

    it("should have approximately 100 NASDAQ-100 symbols", () => {
      expect(NASDAQ100_SYMBOLS.length).toBeGreaterThanOrEqual(95);
      expect(NASDAQ100_SYMBOLS.length).toBeLessThanOrEqual(110);
    });

    it("should have exactly 30 Dow Jones symbols", () => {
      expect(DOW30_SYMBOLS.length).toBe(30);
    });

    it("should have all symbols be non-empty strings", () => {
      const allSymbols = [...SP500_SYMBOLS, ...NASDAQ100_SYMBOLS, ...DOW30_SYMBOLS];
      allSymbols.forEach((symbol) => {
        expect(typeof symbol).toBe("string");
        expect(symbol.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Combined Arrays", () => {
    it("should have ALL_SYMBOLS with 500-600 unique symbols", () => {
      expect(ALL_SYMBOLS.length).toBeGreaterThanOrEqual(500);
      expect(ALL_SYMBOLS.length).toBeLessThanOrEqual(600);
    });

    it("should have no duplicates in ALL_SYMBOLS", () => {
      const uniqueSet = new Set(ALL_SYMBOLS);
      expect(uniqueSet.size).toBe(ALL_SYMBOLS.length);
    });

    it("should have UNIQUE_SYMBOLS equal to ALL_SYMBOLS", () => {
      expect(UNIQUE_SYMBOLS).toEqual(ALL_SYMBOLS);
    });

    it("should have STOCK_SYMBOLS equal to ALL_SYMBOLS for backwards compatibility", () => {
      expect(STOCK_SYMBOLS).toEqual(ALL_SYMBOLS);
    });

    it("should have SYMBOL_COUNT match ALL_SYMBOLS length", () => {
      expect(SYMBOL_COUNT).toBe(ALL_SYMBOLS.length);
    });
  });

  describe("DIVERSE_SYMBOLS", () => {
    it("should have 80-100 diverse symbols", () => {
      expect(DIVERSE_SYMBOLS.length).toBeGreaterThanOrEqual(80);
      expect(DIVERSE_SYMBOLS.length).toBeLessThanOrEqual(100);
    });

    it("should include stocks from all major sectors", () => {
      // Check for representative stocks from each sector
      expect(DIVERSE_SYMBOLS).toContain("AAPL"); // Technology
      expect(DIVERSE_SYMBOLS).toContain("UNH"); // Healthcare
      expect(DIVERSE_SYMBOLS).toContain("JPM"); // Financials
      expect(DIVERSE_SYMBOLS).toContain("AMZN"); // Consumer Discretionary
      expect(DIVERSE_SYMBOLS).toContain("PG"); // Consumer Staples
      expect(DIVERSE_SYMBOLS).toContain("XOM"); // Energy
      expect(DIVERSE_SYMBOLS).toContain("CAT"); // Industrials
      expect(DIVERSE_SYMBOLS).toContain("LIN"); // Materials
      expect(DIVERSE_SYMBOLS).toContain("AMT"); // Real Estate
      expect(DIVERSE_SYMBOLS).toContain("NEE"); // Utilities
      expect(DIVERSE_SYMBOLS).toContain("NFLX"); // Communication Services
    });

    it("should have no duplicates", () => {
      const uniqueSet = new Set(DIVERSE_SYMBOLS);
      expect(uniqueSet.size).toBe(DIVERSE_SYMBOLS.length);
    });

    it("should be a subset of ALL_SYMBOLS", () => {
      const allSymbolsSet = new Set(ALL_SYMBOLS);
      DIVERSE_SYMBOLS.forEach((symbol) => {
        expect(allSymbolsSet.has(symbol)).toBe(true);
      });
    });
  });

  describe("Index Membership", () => {
    it("should include all Dow 30 stocks in S&P 500", () => {
      const sp500Set = new Set(SP500_SYMBOLS);
      DOW30_SYMBOLS.forEach((symbol) => {
        expect(sp500Set.has(symbol)).toBe(true);
      });
    });

    it("should include known major stocks", () => {
      const allSymbolsSet = new Set(ALL_SYMBOLS);
      const majorStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"];
      majorStocks.forEach((symbol) => {
        expect(allSymbolsSet.has(symbol)).toBe(true);
      });
    });
  });
});
```

**Step 2: Run the test**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npm test -- __tests__/data/symbols.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add __tests__/data/symbols.test.ts
git commit -m "test(data): add symbol data validation tests"
```

---

## Task 5: Update API Route for Large Dataset

**Files:**
- Modify: `app/api/stocks/route.ts`

**Step 1: Update imports and constants**

Replace the top of the file:

```typescript
import { NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getCached, setCache } from "@/lib/cache";
import { ALL_SYMBOLS } from "@/data/symbols";
import { StockWithScore, Stock } from "@/types";

const CACHE_KEY = "all-stocks";
const BATCH_SIZE = 30; // Reduced for reliability with larger dataset
const BATCH_DELAY_MS = 50; // Small delay between batches
const FETCH_TIMEOUT_MS = 120000; // 2 minute timeout for ~550 stocks
```

**Step 2: Update fetchWithTimeout function**

Replace the fetchWithTimeout function:

```typescript
async function fetchWithTimeout(): Promise<StockWithScore[]> {
  const allStocks: StockWithScore[] = [];
  const totalBatches = Math.ceil(ALL_SYMBOLS.length / BATCH_SIZE);

  for (let i = 0; i < ALL_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = ALL_SYMBOLS.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);

      console.log(`Processed batch ${batchNumber}/${totalBatches} (${allStocks.length} stocks)`);
    } catch (error) {
      console.warn(`Batch ${batchNumber} failed, continuing...`, error);
    }

    // Add small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < ALL_SYMBOLS.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return allStocks;
}
```

**Step 3: Update the import in the file**

Change line 5 from:
```typescript
import { UNIQUE_SYMBOLS } from "@/data/symbols";
```
to:
```typescript
import { ALL_SYMBOLS } from "@/data/symbols";
```

**Step 4: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/api/stocks/route.ts
git commit -m "feat(api): optimize stocks route for ~550 symbols"
```

---

## Task 6: Update Overvalued Page

**Files:**
- Modify: `app/(dashboard)/overvalued/page.tsx`

**Step 1: Update import**

Change line 6 from:
```typescript
import { DIVERSE_SYMBOLS } from "@/data/symbols";
```
to:
```typescript
import { ALL_SYMBOLS } from "@/data/symbols";
```

**Step 2: Update getStocksData function**

Replace the function:

```typescript
async function getStocksData() {
  // Process in batches for reliability
  const BATCH_SIZE = 30;
  const allStocks: any[] = [];

  for (let i = 0; i < ALL_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = ALL_SYMBOLS.slice(i, i + BATCH_SIZE);
    try {
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);
    } catch (error) {
      console.warn(`Batch starting at ${i} failed, continuing...`);
    }
  }

  return { stocks: allStocks };
}
```

**Step 3: Update page description**

Update the description text to reflect the larger dataset:

```typescript
<p className="text-muted-foreground">
  Stocks with value scores below 40 - consider avoiding or selling.
  High valuations relative to sector averages and near 52-week highs.
  Scanning {ALL_SYMBOLS.length} stocks from S&P 500, NASDAQ-100, and Dow Jones.
</p>
```

Add the import for ALL_SYMBOLS count display.

**Step 4: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/\(dashboard\)/overvalued/page.tsx
git commit -m "feat(overvalued): scan all ~550 stocks for overvalued"
```

---

## Task 7: Update Undervalued Page

**Files:**
- Modify: `app/(dashboard)/undervalued/page.tsx`

**Step 1: Update import**

Change line 6 from:
```typescript
import { DIVERSE_SYMBOLS } from "@/data/symbols";
```
to:
```typescript
import { ALL_SYMBOLS } from "@/data/symbols";
```

**Step 2: Update getStocksData function**

Replace the function (same as overvalued):

```typescript
async function getStocksData() {
  // Process in batches for reliability
  const BATCH_SIZE = 30;
  const allStocks: any[] = [];

  for (let i = 0; i < ALL_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = ALL_SYMBOLS.slice(i, i + BATCH_SIZE);
    try {
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);
    } catch (error) {
      console.warn(`Batch starting at ${i} failed, continuing...`);
    }
  }

  return { stocks: allStocks };
}
```

**Step 3: Update page description**

```typescript
<p className="text-muted-foreground">
  Stocks with value scores of 70 or higher - potential buying opportunities
  based on P/E, P/B, PEG ratios and 52-week position.
  Scanning {ALL_SYMBOLS.length} stocks from S&P 500, NASDAQ-100, and Dow Jones.
</p>
```

**Step 4: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/\(dashboard\)/undervalued/page.tsx
git commit -m "feat(undervalued): scan all ~550 stocks for undervalued"
```

---

## Task 8: Run Full Test Suite

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npm test`
Expected: All new tests pass, no new failures introduced

**Step 2: Run TypeScript check**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Run linter**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npm run lint`
Expected: No new lint errors

---

## Task 9: Manual Verification

**Files:**
- None (verification only)

**Step 1: Start development server**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && npm run dev`

**Step 2: Verify search functionality**

1. Navigate to http://localhost:3000
2. Use the search bar to search for:
   - "AAPL" (should find Apple)
   - "ABNB" (Airbnb - new NASDAQ-100 stock)
   - "SMCI" (Super Micro - new NASDAQ-100 stock)
3. Verify results appear and link to correct stock pages

**Step 3: Verify overvalued page**

1. Navigate to http://localhost:3000/overvalued
2. Wait for page to load (may take 30-60 seconds)
3. Verify stocks appear with valueScore < 40
4. Count should show more stocks than before

**Step 4: Verify undervalued page**

1. Navigate to http://localhost:3000/undervalued
2. Wait for page to load
3. Verify stocks appear with valueScore >= 70

**Step 5: Stop development server**

Press Ctrl+C to stop the server

---

## Task 10: Final Commit and Summary

**Files:**
- None (documentation only)

**Step 1: Review all changes**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && git log --oneline main..HEAD`

Expected commits:
1. feat(data): add S&P 500 symbols array
2. feat(data): add NASDAQ-100 and Dow 30 symbols
3. feat(data): create combined ALL_SYMBOLS array with ~550 stocks
4. test(data): add symbol data validation tests
5. feat(api): optimize stocks route for ~550 symbols
6. feat(overvalued): scan all ~550 stocks for overvalued
7. feat(undervalued): scan all ~550 stocks for undervalued

**Step 2: Verify symbol count**

Run: `cd /mnt/c/Work/Learning/Projects/StockPulse/.worktrees/feature-expand-stock-coverage && node -e "const {ALL_SYMBOLS} = require('./data/symbols'); console.log('Total symbols:', ALL_SYMBOLS.length)"`

Expected: Total symbols: ~530-560

---

## Summary

| Task | Description | Files Modified |
|------|-------------|----------------|
| 1 | Add S&P 500 symbols | `data/symbols.ts` |
| 2 | Add NASDAQ-100 & Dow 30 | `data/symbols.ts` |
| 3 | Create combined arrays | `data/symbols.ts` |
| 4 | Write symbol tests | `__tests__/data/symbols.test.ts` |
| 5 | Update API route | `app/api/stocks/route.ts` |
| 6 | Update overvalued page | `app/(dashboard)/overvalued/page.tsx` |
| 7 | Update undervalued page | `app/(dashboard)/undervalued/page.tsx` |
| 8 | Run test suite | - |
| 9 | Manual verification | - |
| 10 | Final review | - |

**Total estimated unique symbols:** ~530-560 (after de-duplication)
