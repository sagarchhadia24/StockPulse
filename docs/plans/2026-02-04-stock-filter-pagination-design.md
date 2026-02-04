# Stock Filter & Pagination Design

## Overview

Add sector filtering and pagination to the undervalued and overvalued pages.

**Current state:**
- Undervalued page: ~132 stocks displayed in one long table
- Overvalued page: ~182 stocks displayed in one long table
- No filtering or pagination

**Goal:**
- Sector dropdown filter (All Sectors + 11 GICS sectors)
- Pagination with 25 items per page default
- URL-based state for shareable links

## UI Design

### Filter Bar Layout

```
[Sector: All Sectors v]                    Showing 1-25 of 132  [< Prev] [1] [2] [3] ... [6] [Next >]

+--------------------------------------------------------------------------------------------------+
| Symbol  |  Name  |  Sector  |  Price  |  Change  |  Score  |  P/E  |  52W Range  |              |
+--------------------------------------------------------------------------------------------------+
|  ...    |  ...   |   ...    |   ...   |   ...    |   ...   |  ...  |    ...      |              |
```

- Left: Sector dropdown
- Right: Pagination controls with stock count

### URL State

Query params: `/undervalued?sector=Technology&page=2`

- `sector`: "all" (default) or one of 11 GICS sectors
- `page`: 1-based page number (default: 1)

When sector changes, page resets to 1.

## Component Structure

### New Component: `StockTableFilters`

Location: `components/stock/stock-table-filters.tsx`

Props:
- `stocks`: Full filtered stock array (for counting)
- `currentSector`: Current sector filter value
- `currentPage`: Current page number
- `itemsPerPage`: Items per page (default 25)
- `onSectorChange`: Callback for sector change
- `onPageChange`: Callback for page change

### Modified Pages

**`app/(dashboard)/undervalued/page.tsx`**
- Add client component wrapper for URL state
- Filter stocks by sector client-side
- Paginate filtered results
- Render `StockTableFilters` above `StockTable`

**`app/(dashboard)/overvalued/page.tsx`**
- Same changes as undervalued page

## Implementation Tasks

1. Create `StockTableFilters` component
   - Sector dropdown using Radix Select
   - Pagination controls (prev/next, page numbers)
   - "Showing X-Y of Z stocks" display

2. Update undervalued page
   - Add `useSearchParams` for URL state
   - Add sector filtering logic
   - Add pagination logic
   - Integrate `StockTableFilters`

3. Update overvalued page
   - Same changes as undervalued

## Sectors (from types/stock.ts)

1. Technology
2. Healthcare
3. Financials
4. Consumer Discretionary
5. Consumer Staples
6. Energy
7. Industrials
8. Materials
9. Real Estate
10. Utilities
11. Communication Services

## No Changes Required

- API endpoints (data already includes sector)
- `StockTable` component (already displays sector)
- Data fetching logic
- `StockTableSkeleton` component
