# Historical Valuation Feature Design

## Overview

A historical valuation chart on stock detail pages showing price and value score over time, powered by daily snapshots stored in Supabase.

## User Experience

### Location

New "Valuation History" section on stock detail page (`/stock/[symbol]`), below current stock metrics.

### Chart Display

- Dual-axis line chart using Recharts
- Left axis: Value Score (0-100)
- Right axis: Price ($)
- Two lines: blue for price, green/yellow/red gradient for valuation score
- Time period selector: 1M | 3M | 6M | 1Y buttons above chart

### Empty State

Since snapshots start from feature launch:
- Message: "Valuation history tracking started [date]. Check back soon for trends."
- Price history chart still displays (from Yahoo Finance)
- Valuation line appears as data accumulates

### Interactions

- Hover tooltip: Date, Price, Value Score, Classification
- Period buttons update chart client-side (no page reload)

## Data Storage

### Database Schema

```sql
CREATE TABLE valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  snapshot_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  value_score INTEGER NOT NULL,
  pe_score INTEGER,
  pb_score INTEGER,
  peg_score INTEGER,
  week_position_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, snapshot_date)
);

CREATE INDEX idx_snapshots_symbol_date ON valuation_snapshots(symbol, snapshot_date);
```

### Snapshot Job

- **Trigger:** Vercel Cron Job daily at ~4:30 PM ET (market close)
- **Process:**
  1. Fetch quotes for all ~200 stocks via `getMultipleQuotes()`
  2. Calculate value scores via `calculateValueScore()`
  3. Batch insert into `valuation_snapshots`
- **Endpoint:** `app/api/cron/snapshot-valuations/route.ts`
- **Auth:** Secured with `CRON_SECRET` environment variable

### Data Retention

- Keep all data indefinitely
- ~200 stocks × 365 days × ~100 bytes = ~7MB/year

## Technical Implementation

### API Endpoint

```
GET /api/stocks/[symbol]/history?period=1y
```

Response:
```typescript
{
  symbol: string;
  history: Array<{
    date: string;
    price: number;
    valueScore: number | null;
  }>;
}
```

### Data Merging Logic

1. Fetch price history from Yahoo Finance
2. Fetch valuation snapshots from Supabase
3. Merge by date - prices always present, scores only where snapshots exist

### File Structure

```
app/api/cron/snapshot-valuations/route.ts   # Daily cron job
app/api/stocks/[symbol]/history/route.ts    # History API endpoint
components/stock/
  valuation-history-chart.tsx               # Dual-axis chart
  period-selector.tsx                       # 1M/3M/6M/1Y buttons
lib/
  snapshots.ts                              # DB queries for snapshots
supabase/migrations/
  002_create_valuation_snapshots.sql        # New table
```

### New Types

```typescript
interface ValuationSnapshot {
  symbol: string;
  snapshotDate: string;
  price: number;
  valueScore: number;
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
  weekPositionScore: number;
}

interface HistoryDataPoint {
  date: string;
  price: number;
  valueScore: number | null;
}
```

## Scope

### In Scope

- Daily cron job to snapshot all ~200 stocks
- New `valuation_snapshots` Supabase table
- Dual-axis chart on stock detail page
- Period selector (1M, 3M, 6M, 1Y)
- Graceful empty state while data accumulates

### Out of Scope

- Historical data before feature launch
- Custom date range selection
- Score component breakdown chart
- Alerts based on historical trends

## Dependencies

- Vercel Cron (free tier supports daily jobs)
- Supabase (existing integration)
- Recharts (already installed)
