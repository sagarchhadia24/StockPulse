# Expand Stock Coverage to Full Index Universe

## Overview

Expand StockPulse stock coverage from 234 stocks to the complete constituents of S&P 500, NASDAQ-100, and Dow Jones Industrial Average indices.

## Scope

**Target Coverage:**
- S&P 500: ~500 stocks
- NASDAQ-100: ~100 stocks
- Dow Jones Industrial Average: 30 stocks
- **Total unique stocks: ~530-550** (after de-duplication)

**Approach:**
- Static data file with hardcoded symbols
- Yahoo Finance API fallback for sector data on unmapped stocks
- Scan all stocks for over/undervalued pages

## Data Structure

Update `data/symbols.ts`:

```typescript
// Index-specific arrays for filtering/categorization
export const SP500_SYMBOLS: string[] = [...];     // ~500 symbols
export const NASDAQ100_SYMBOLS: string[] = [...]; // ~100 symbols
export const DOW30_SYMBOLS: string[] = [...];     // 30 symbols

// Combined unique list (de-duplicated)
export const ALL_SYMBOLS: string[] = [...];       // ~530-550 unique

// Curated subset for limited data needs
export const DIVERSE_SYMBOLS: string[] = [...];   // ~100 stocks

// Backwards compatibility
export const STOCK_SYMBOLS = ALL_SYMBOLS;
export const UNIQUE_SYMBOLS = ALL_SYMBOLS;
```

## Architecture Changes

### Files to Modify

| File | Changes |
|------|---------|
| `data/symbols.ts` | Add ~550 symbols organized by index membership |
| `lib/yahoo-finance.ts` | Optionally expand STOCK_NAMES for popular stocks |
| `app/api/stocks/route.ts` | Optimize batching, add caching headers |
| `app/(dashboard)/overvalued/page.tsx` | Use ALL_SYMBOLS instead of DIVERSE_SYMBOLS |
| `app/(dashboard)/undervalued/page.tsx` | Use ALL_SYMBOLS instead of DIVERSE_SYMBOLS |

### Sector Handling

- Keep existing `SYMBOL_SECTORS` mapping for current 234 stocks
- New stocks use Yahoo Finance API sector data via `mapSector()` fallback
- No manual sector mapping required for new symbols

## Performance Strategy

### Batch Processing
- Process stocks in parallel batches of 20-30
- Use `Promise.allSettled` to handle partial failures
- Continue processing if some symbols fail

### Caching
- Leverage existing `lib/cache.ts` infrastructure
- Cache stock data for 5-15 minutes
- Add Next.js caching headers to API routes

### Expected Performance
- Initial load: 15-30 seconds for all ~550 stocks
- Cached load: < 1 second
- Search: Instant (client-side filtering)

## Implementation Steps

### Step 1: Expand data/symbols.ts
- Add complete S&P 500 constituent list
- Add NASDAQ-100 constituent list
- Add Dow Jones 30 constituent list
- Create combined de-duplicated ALL_SYMBOLS array
- Expand DIVERSE_SYMBOLS to ~100 stocks

### Step 2: Update lib/yahoo-finance.ts
- Expand STOCK_NAMES with additional popular stock names
- No changes to sector fallback logic

### Step 3: Update API route
- Increase batch size for better throughput
- Add caching headers for Next.js caching
- Default to ALL_SYMBOLS data source

### Step 4: Update over/undervalued pages
- Change from DIVERSE_SYMBOLS to ALL_SYMBOLS
- Add loading state indicator for large dataset

### Step 5: Testing
- Verify search works with expanded symbol list
- Test over/undervalued pages load correctly
- Confirm valuation scoring works for new stocks

## Data Sources for Index Constituents

- S&P 500: Wikipedia or official S&P Global list
- NASDAQ-100: NASDAQ official website
- Dow Jones: S&P Dow Jones Indices official list

## Success Criteria

- [ ] All ~550 unique stocks searchable in global search
- [ ] Over/undervalued pages scan all stocks
- [ ] Valuation scoring works for new stocks
- [ ] Page load time acceptable with caching
- [ ] No regression in existing functionality
