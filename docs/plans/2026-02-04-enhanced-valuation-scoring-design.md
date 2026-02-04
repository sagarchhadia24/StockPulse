# Enhanced Valuation Scoring System - Design Document

## Problem Statement

Current valuation scoring relies on P/E, P/B, PEG ratios and 52-week position. High-growth/unprofitable companies often have null P/E and PEG, causing unreliable scores (falls back to only P/B and 52-week position).

**Example:** A high-growth tech company with no earnings gets scored primarily on 52-week position, which doesn't reflect its true valuation.

## Solution Overview

1. Add P/S ratio scoring (works for unprofitable companies)
2. Add revenue growth scoring (rewards growth appropriately)
3. Implement stock type classification (value/growth/garp/dividend)
4. Apply different weight profiles based on stock type

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stock type count | 4 types (Value, Growth, GARP, Dividend) | More nuanced scoring with tailored weights |
| Revenue growth data | Fetch for ALL views | Consistent, accurate scoring everywhere |
| Implementation | All at once | Single cohesive release |

---

## Implementation Details

### 1. Type Definitions

**File:** `types/stock.ts`

```typescript
// New stock type classification
export type StockType = "value" | "growth" | "garp" | "dividend";

// Add to Stock interface
export interface Stock {
  // ... existing fields ...
  psRatio: number | null;        // NEW: Price-to-Sales ratio
  revenueGrowth: number | null;  // NEW: YoY revenue growth (0.15 = 15%)
}

// Update ScoreBreakdown
export interface ScoreBreakdown {
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
  psScore: number | null;           // NEW
  revenueGrowthScore: number | null; // NEW
  weekPositionScore: number;
}

// Update StockWithScore
export interface StockWithScore extends Stock {
  stockType: StockType;  // NEW
  valueScore: number;
  scoreBreakdown: ScoreBreakdown;
  dataQuality: "high" | "medium" | "low";
}
```

---

### 2. Sector Averages Data

**File:** `data/sector-averages.ts` (new file)

Move sector averages from `lib/valuation.ts` and add P/S averages:

```typescript
import { Sector } from "@/types";

export interface SectorAverages {
  avgPE: number;
  avgPB: number;
  avgPS: number;
}

export const SECTOR_AVERAGES: Record<Sector, SectorAverages> = {
  "Technology": { avgPE: 28, avgPB: 7, avgPS: 6.0 },
  "Healthcare": { avgPE: 22, avgPB: 4, avgPS: 3.5 },
  "Financials": { avgPE: 14, avgPB: 1.3, avgPS: 2.5 },
  "Consumer Discretionary": { avgPE: 24, avgPB: 5, avgPS: 1.8 },
  "Consumer Staples": { avgPE: 22, avgPB: 5, avgPS: 2.0 },
  "Energy": { avgPE: 12, avgPB: 1.8, avgPS: 1.0 },
  "Industrials": { avgPE: 20, avgPB: 4, avgPS: 1.5 },
  "Materials": { avgPE: 15, avgPB: 2.5, avgPS: 1.2 },
  "Real Estate": { avgPE: 35, avgPB: 2, avgPS: 8.0 },
  "Utilities": { avgPE: 18, avgPB: 1.8, avgPS: 2.5 },
  "Communication Services": { avgPE: 18, avgPB: 3, avgPS: 2.5 },
};
```

---

### 3. Yahoo Finance Data Fetching

**File:** `lib/yahoo-finance.ts`

Update `getStockQuote()` to fetch additional data:

```typescript
export async function getStockQuote(symbol: string): Promise<Stock | null> {
  const yf = await getYahooFinance();

  // Fetch both quote and quoteSummary for complete data
  const [quote, summary] = await Promise.all([
    yf.quote(symbol),
    yf.quoteSummary(symbol, { modules: ["financialData"] }),
  ]);

  return {
    // ... existing fields ...
    psRatio: quote.priceToSalesTrailing12Months ?? null,
    revenueGrowth: summary?.financialData?.revenueGrowth ?? null,
  };
}
```

**Performance considerations:**
- `quoteSummary` is slower (~500-2000ms per stock)
- Increase cache TTL for fundamental data (changes quarterly)
- Accept slightly slower loads for better accuracy

---

### 4. Stock Type Classification

**File:** `lib/valuation.ts`

```typescript
export function classifyStockType(stock: Stock): StockType {
  const hasProfits = stock.peRatio !== null && stock.peRatio > 0;
  const hasHighGrowth = stock.revenueGrowth !== null && stock.revenueGrowth > 0.15;
  const hasHighDividend = stock.dividendYield !== null && stock.dividendYield > 2.5;
  const hasPEG = stock.pegRatio !== null && stock.pegRatio > 0;

  // Dividend: high yield, profitable, stable (not high growth)
  if (hasHighDividend && hasProfits && !hasHighGrowth) {
    return "dividend";
  }

  // Growth: high revenue growth, often unprofitable or very high P/E
  if (hasHighGrowth && (!hasProfits || stock.peRatio! > 40)) {
    return "growth";
  }

  // GARP: profitable with good growth and reasonable PEG
  if (hasProfits && hasHighGrowth && hasPEG && stock.pegRatio! < 2.0) {
    return "garp";
  }

  // Value: default for profitable companies
  return "value";
}
```

---

### 5. New Scoring Functions

**File:** `lib/valuation.ts`

#### P/S Score (0-100)

```typescript
function calculatePSScore(psRatio: number | null, sector: Sector): number | null {
  if (psRatio === null || psRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPS;
  const ratio = psRatio / sectorAvg;

  // Score: 100 at 0.25x average, 50 at 1x average, 0 at 3x average
  if (ratio <= 0.25) return 100;
  if (ratio >= 3) return 0;
  if (ratio <= 1) return Math.round(100 - ((ratio - 0.25) / 0.75) * 50);
  return Math.round(50 - ((ratio - 1) / 2) * 50);
}
```

#### Revenue Growth Score (0-100)

```typescript
function calculateRevenueGrowthScore(
  revenueGrowth: number | null,
  stockType: StockType
): number | null {
  if (revenueGrowth === null) return null;

  // Negative growth penalty
  if (revenueGrowth < -0.20) return 0;
  if (revenueGrowth < 0) return Math.round(25 + (revenueGrowth + 0.20) / 0.20 * 25);

  // For growth stocks: higher growth = better
  if (stockType === "growth") {
    if (revenueGrowth >= 0.50) return 100;  // 50%+ growth = max score
    if (revenueGrowth >= 0.25) return Math.round(75 + (revenueGrowth - 0.25) / 0.25 * 25);
    if (revenueGrowth >= 0.10) return Math.round(50 + (revenueGrowth - 0.10) / 0.15 * 25);
    return Math.round(50 * revenueGrowth / 0.10);
  }

  // For value/dividend stocks: moderate growth (5-15%) is ideal
  const idealGrowth = 0.10;
  const deviation = Math.abs(revenueGrowth - idealGrowth);
  if (deviation <= 0.05) return 100;
  if (deviation <= 0.15) return Math.round(100 - (deviation - 0.05) / 0.10 * 50);
  return Math.round(50 - Math.min(deviation - 0.15, 0.35) / 0.35 * 50);
}
```

---

### 6. Dynamic Weight Profiles

**File:** `lib/valuation.ts`

```typescript
interface WeightProfile {
  pe: number;
  pb: number;
  peg: number;
  ps: number;
  revenueGrowth: number;
  weekPosition: number;
}

const WEIGHT_PROFILES: Record<StockType, WeightProfile> = {
  value: {
    pe: 0.35,           // P/E primary for value
    pb: 0.25,           // Book value important
    peg: 0.15,
    ps: 0.10,
    revenueGrowth: 0.05,
    weekPosition: 0.10,
  },
  growth: {
    pe: 0.10,           // Often N/A
    pb: 0.10,
    peg: 0.15,
    ps: 0.30,           // Primary for growth
    revenueGrowth: 0.25, // Critical
    weekPosition: 0.10,
  },
  garp: {
    pe: 0.20,
    pb: 0.15,
    peg: 0.25,          // Key metric for GARP
    ps: 0.15,
    revenueGrowth: 0.15,
    weekPosition: 0.10,
  },
  dividend: {
    pe: 0.25,
    pb: 0.20,
    peg: 0.10,
    ps: 0.10,
    revenueGrowth: 0.10,
    weekPosition: 0.10,
    // Note: could add dividendYield as 7th factor
  },
};
```

---

### 7. Updated Score Calculation

**File:** `lib/valuation.ts`

```typescript
export function calculateValueScore(stock: Stock): StockWithScore {
  // Step 1: Classify stock type
  const stockType = classifyStockType(stock);
  const weights = WEIGHT_PROFILES[stockType];

  // Step 2: Calculate all component scores
  const breakdown: ScoreBreakdown = {
    peScore: calculatePEScore(stock.peRatio, stock.sector),
    pbScore: calculatePBScore(stock.pbRatio, stock.sector),
    pegScore: calculatePEGScore(stock.pegRatio),
    psScore: calculatePSScore(stock.psRatio, stock.sector),
    revenueGrowthScore: calculateRevenueGrowthScore(stock.revenueGrowth, stockType),
    weekPositionScore: calculateWeekPositionScore(stock.price, stock.week52High, stock.week52Low),
  };

  // Step 3: Calculate weighted average (redistribute weights for null values)
  let totalWeight = 0;
  let weightedSum = 0;

  const scoreWeightPairs = [
    { score: breakdown.peScore, weight: weights.pe },
    { score: breakdown.pbScore, weight: weights.pb },
    { score: breakdown.pegScore, weight: weights.peg },
    { score: breakdown.psScore, weight: weights.ps },
    { score: breakdown.revenueGrowthScore, weight: weights.revenueGrowth },
    { score: breakdown.weekPositionScore, weight: weights.weekPosition },
  ];

  for (const { score, weight } of scoreWeightPairs) {
    if (score !== null) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  const valueScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  return {
    ...stock,
    stockType,
    valueScore: Math.min(100, Math.max(0, valueScore)),
    scoreBreakdown: breakdown,
    dataQuality: getDataQuality(breakdown),
  };
}
```

---

### 8. UI Updates

#### Stock Detail Page

**File:** `app/(dashboard)/stock/[symbol]/page.tsx`

Add stock type badge and expanded score breakdown:

```tsx
{/* Stock type badge next to sector */}
<Badge variant={getStockTypeBadgeVariant(stock.stockType)}>
  {stock.stockType.toUpperCase()}
</Badge>

{/* Expanded score breakdown - 6 columns */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  <ScoreItem label="P/E" score={breakdown.peScore} weight={weights.pe} />
  <ScoreItem label="P/B" score={breakdown.pbScore} weight={weights.pb} />
  <ScoreItem label="PEG" score={breakdown.pegScore} weight={weights.peg} />
  <ScoreItem label="P/S" score={breakdown.psScore} weight={weights.ps} />
  <ScoreItem label="Growth" score={breakdown.revenueGrowthScore} weight={weights.revenueGrowth} />
  <ScoreItem label="52W Pos" score={breakdown.weekPositionScore} weight={weights.weekPosition} />
</div>
```

#### Stock Card Component

**File:** `components/stock/stock-card.tsx`

Add stock type indicator with color coding:
- Value: Blue (`bg-blue-100 text-blue-700`)
- Growth: Purple (`bg-purple-100 text-purple-700`)
- GARP: Green (`bg-green-100 text-green-700`)
- Dividend: Amber (`bg-amber-100 text-amber-700`)

#### Stock Metrics Component

**File:** `components/stock/stock-metrics.tsx`

Add P/S ratio and revenue growth to metrics display.

---

## Files to Modify

| File | Changes |
|------|---------|
| `types/stock.ts` | Add StockType, psRatio, revenueGrowth, updated ScoreBreakdown |
| `data/sector-averages.ts` | New file with sector P/S averages |
| `lib/yahoo-finance.ts` | Extract P/S, add quoteSummary for revenueGrowth |
| `lib/valuation.ts` | classifyStockType, P/S score, growth score, weight profiles |
| `app/(dashboard)/stock/[symbol]/page.tsx` | Stock type badge, 6-column breakdown |
| `components/stock/stock-card.tsx` | Stock type indicator badge |
| `components/stock/stock-metrics.tsx` | Display P/S and revenue growth |

---

## Testing Strategy

### Unit Tests

Update `__tests__/lib/valuation.test.ts`:
- Test `classifyStockType()` with various stock profiles
- Test `calculatePSScore()` with sector comparisons
- Test `calculateRevenueGrowthScore()` for growth vs value stocks
- Test weight redistribution when metrics are null

### Manual Testing

| Stock | Expected Type | Why |
|-------|---------------|-----|
| NVDA | Growth | High revenue growth, high P/E |
| TSLA | Growth | High growth, volatile P/E |
| JNJ | Dividend | High dividend yield, stable |
| AAPL | GARP | Profitable + growth + reasonable PEG |
| BRK-B | Value | Low P/E, profitable |
| T | Dividend | High yield, lower growth |

### Verification

- Stocks with null P/E should now get meaningful scores via P/S
- Growth stocks should not be penalized for high/missing P/E
- Value stocks should still weight P/E appropriately

---

## Implementation Order

1. Type definitions (`types/stock.ts`)
2. Sector averages data (`data/sector-averages.ts`)
3. Yahoo Finance updates (`lib/yahoo-finance.ts`)
4. Valuation logic (`lib/valuation.ts`)
5. UI updates (detail page, stock card, metrics)
6. Mock data updates
7. Unit tests
8. Manual testing and verification
