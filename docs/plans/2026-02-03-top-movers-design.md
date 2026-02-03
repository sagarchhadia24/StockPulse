# Top Movers - Design Document

## Overview

A dedicated `/movers` page showing today's 10 biggest gainers and 10 biggest losers, with user-selectable index (S&P 500, NASDAQ 100, or Dow 30).

## Requirements

- Display top 10 gainers and top 10 losers side-by-side
- User can select which index to view (S&P 500, NASDAQ 100, Dow 30)
- Each row shows: Symbol, Company Name, Price, $ Change, % Change
- Clicking a row navigates to `/stock/[symbol]`
- Responsive: stack vertically on mobile

## Data Source

Yahoo Finance 2 via existing `yahoo-finance2` package.

### Index Symbol Lists

Static arrays stored in `lib/indices.ts`:
- **S&P 500**: ~503 symbols
- **NASDAQ 100**: 100 symbols
- **Dow 30**: 30 symbols

Hardcoded lists (index composition changes infrequently - quarterly rebalancing).

### Fetching Strategy

1. Get all symbols for selected index
2. Batch fetch quotes using `yahooFinance.quote()`
3. Sort by `regularMarketChangePercent`
4. Return top 10 (gainers) and bottom 10 (losers)
5. Cache result for 5 minutes

## API Endpoint

`GET /api/market/movers?index=sp500|nasdaq100|dow30`

### Response

```json
{
  "index": "sp500",
  "gainers": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corp",
      "price": 142.50,
      "change": 8.25,
      "changePercent": 6.14
    }
  ],
  "losers": [...],
  "asOf": "2026-02-03T21:30:00Z"
}
```

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Top Movers                    [S&P 500 ▼] (dropdown)   │
├────────────────────────┬────────────────────────────────┤
│  📈 Gainers            │  📉 Losers                     │
├────────────────────────┼────────────────────────────────┤
│  NVDA  NVIDIA    +6.1% │  XYZ  Company     -4.2%        │
│  AAPL  Apple     +3.2% │  ABC  Company     -3.8%        │
│  ...                   │  ...                           │
└────────────────────────┴────────────────────────────────┘
```

Responsive: On mobile, stack tables vertically (gainers on top, losers below).

## New Files

```
lib/indices.ts                          # Symbol lists for SP500, NASDAQ100, DOW30
lib/movers.ts                           # Fetch & sort logic
app/api/market/movers/route.ts          # API endpoint
app/(dashboard)/movers/page.tsx         # Page component
components/movers/movers-table.tsx      # Table component
components/movers/index-selector.tsx    # Dropdown selector
```

## Components

### `movers-table.tsx`
- Props: `stocks`, `type` ("gainers" | "losers")
- Rows are clickable → navigate to `/stock/[symbol]`
- Green text for gainers, red for losers

### `index-selector.tsx`
- Dropdown to pick index (S&P 500, NASDAQ 100, Dow 30)
- Uses existing Radix Select component
- Stores selection in URL param (`/movers?index=sp500`)

## States

### Loading
Skeleton loaders in both table positions while fetching.

### Error Handling
- API failure: Show error message with retry button
- Partial data: Show what we have (don't fail entirely)
- Market closed: Show data from last trading day (Yahoo Finance handles this)

## Testing

1. `lib/movers.test.ts` - Unit tests for sorting/filtering logic
2. `components/movers/movers-table.test.tsx` - Component renders, handles click
3. `app/api/market/movers/route.test.ts` - API returns correct structure

## Technical Notes

- No database changes required (read-only from Yahoo Finance)
- No new dependencies
- 5-minute cache to reduce API load
- Add "Movers" link to sidebar navigation
