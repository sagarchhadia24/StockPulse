# Peer Comparison Feature Design

## Overview

A peer comparison tool that lets users compare up to 4 stocks side-by-side, focusing on valuation metrics and performance. Accessible from both a dedicated page and stock detail pages, with URL-based sharing.

## User Experience

### Entry Points

1. **Dedicated Page (`/compare`)**
   - Empty state shows search box with prompt "Add up to 4 stocks to compare"
   - Auto-complete search as user types
   - Each added stock appears as a removable chip above the comparison table

2. **From Stock Detail (`/stock/[symbol]`)**
   - "Compare" button in stock header area
   - Navigates to `/compare?symbols=AAPL` (pre-populated with current stock)

### URL Structure

```
/compare?symbols=AAPL,MSFT,GOOGL,AMZN
```

- Comma-separated symbols in query param
- Invalid symbols silently ignored
- Empty/missing param shows empty state
- Shareable by copying URL

### Adding Stocks

- Search input with autocomplete (symbol + company name)
- Max 4 stocks enforced - search disabled at limit
- "Similar stocks" section shows 3-4 same-sector suggestions based on first stock added

## Comparison Table

### Layout

- Desktop: Side-by-side columns (1 per stock)
- Mobile: Horizontal scroll or stacked cards

### Metrics Displayed

| Row | Description |
|-----|-------------|
| **Header** | Symbol, Company Name, Remove button |
| **Price** | Current price, daily change ($ and %) |
| **Value Score** | 0-100 score with color badge |
| **P/E Ratio** | Value + comparison to sector avg |
| **P/B Ratio** | Value + comparison to sector avg |
| **PEG Ratio** | Value |
| **52-Week Range** | Visual bar showing current position |
| **YTD Change** | Percentage change year-to-date |
| **Dividend Yield** | Percentage or "—" if none |
| **Sector** | Sector name |

### Visual Highlights

- Best Value Score gets subtle highlight or badge
- Best metric in each row is bolded
- Score breakdown shown on hover/tooltip

## Similar Stocks Suggestions

- Shows 4 stocks from same sector as first added stock
- Excludes stocks already in comparison
- Mini cards with: Symbol, Name, Value Score
- Click to add directly

## Technical Implementation

### Data Fetching

- Use `getMultipleQuotes(symbols)` for parallel fetching
- Apply `calculateValueScore()` to each result
- Server-side rendering (no client-side API calls)
- YTD change from `getHistoricalPrices(symbol, '1y')`

### File Structure

```
app/(dashboard)/compare/page.tsx    # Main comparison page
components/compare/
  comparison-table.tsx              # The metrics table
  stock-search.tsx                  # Autocomplete search input
  similar-stocks.tsx                # Sector-based suggestions
  stock-column.tsx                  # Single stock column
lib/
  compare.ts                        # Helpers: getYTDChange(), getBestMetric()
```

### New Types

```typescript
interface ComparisonStock extends StockWithScore {
  ytdChange: number | null;
}
```

### Changes to Existing Files

- `app/(dashboard)/stock/[symbol]/page.tsx` - Add "Compare" button
- `types/stock.ts` - Add ComparisonStock interface

## Scope

### In Scope

- `/compare` page with stock search
- "Compare" button on stock detail pages
- Comparison table with valuation + performance metrics
- Same-sector stock suggestions
- Visual highlighting of best values
- Mobile-responsive layout

### Out of Scope

- Saved comparisons to database
- Export to PDF/image
- Historical comparison
- Custom metric selection

## Dependencies

- No new npm packages
- No database changes
- No new API integrations
- Uses existing Yahoo Finance + valuation logic
