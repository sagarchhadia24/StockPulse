# Watchlist & Live Prices Design

**Date:** 2026-02-02
**Status:** Approved

## Overview

Two features to enhance the StockPulse dashboard:
1. **Basic Watchlist** - Add/remove stocks, synced via Supabase
2. **Live Price Updates** - Dashboard prices refresh automatically via polling

---

## Feature 1: Basic Watchlist

### Database Schema

```sql
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

-- Row Level Security
alter table watchlist enable row level security;

create policy "Users can view own watchlist"
  on watchlist for select using (auth.uid() = user_id);

create policy "Users can add to watchlist"
  on watchlist for insert with check (auth.uid() = user_id);

create policy "Users can remove from watchlist"
  on watchlist for delete using (auth.uid() = user_id);

-- Index for fast lookups
create index watchlist_user_id_idx on watchlist(user_id);
```

### API Layer

**New file: `lib/watchlist.ts`**

```typescript
export async function getWatchlist(userId: string): Promise<string[]>
export async function addToWatchlist(userId: string, symbol: string): Promise<void>
export async function removeFromWatchlist(userId: string, symbol: string): Promise<void>
export async function isInWatchlist(userId: string, symbol: string): Promise<boolean>
```

**API Routes:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/watchlist` | Get user's watchlist with stock data |
| POST | `/api/watchlist` | Add symbol `{ symbol: "AAPL" }` |
| DELETE | `/api/watchlist/[symbol]` | Remove symbol |

### Data Flow

1. `WatchlistButton` calls POST/DELETE
2. API verifies auth via Supabase session
3. Returns updated watchlist or error
4. UI updates optimistically, reverts on failure

---

## Feature 2: Live Price Updates

### Approach: Polling with Smart Refresh

Yahoo Finance doesn't offer streaming, so we use intelligent polling.

**New hook: `lib/use-live-prices.ts`**

```typescript
export function useLivePrices(symbols: string[], interval = 30000) {
  // Polls /api/stocks for given symbols every 30 seconds
  // Only runs when tab is visible (Page Visibility API)
  // Pauses when user is idle
  // Returns { prices, isLive, lastUpdated }
}
```

### Where Polling is Used

- `MarketOverview` - Polls market indices every 30s
- `StockCard` components on dashboard - Batch poll top stocks
- `Stock/[symbol]` detail page - Polls single stock when viewing

### Visual Indicators

- Small "Live" badge with pulsing dot when actively updating
- "Last updated: X ago" timestamp
- Brief flash/highlight when price changes

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `lib/watchlist.ts` | Watchlist CRUD functions |
| `lib/use-live-prices.ts` | Polling hook |
| `app/api/watchlist/route.ts` | GET, POST watchlist |
| `app/api/watchlist/[symbol]/route.ts` | DELETE endpoint |
| `components/ui/live-indicator.tsx` | Pulsing "Live" badge |
| `supabase/migrations/001_watchlist.sql` | Database migration |

### Files to Modify

| File | Changes |
|------|---------|
| `components/stock/watchlist-button.tsx` | Wire up API calls |
| `components/dashboard/market-overview.tsx` | Add polling |
| `components/stock/stock-card.tsx` | Accept live prices, highlight changes |
| `app/(dashboard)/watchlist/page.tsx` | Full implementation |
| `app/(dashboard)/stock/[symbol]/page.tsx` | Add polling |

---

## Design Decisions

### Why Polling Over WebSocket

- Yahoo Finance API doesn't support streaming
- Simpler to implement and debug
- 30s interval is reasonable for non-day-traders
- No connection management complexity

### Why No Global State Manager

- Each component manages its own polling via the hook
- Hook deduplicates requests (same symbols = single API call)
- Keeps architecture simple

### Why RLS Over API-Level Auth

- Supabase RLS provides defense in depth
- Policies are declarative and auditable
- Reduces API code complexity
