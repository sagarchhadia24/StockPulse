# StockPulse - Design Document

**Date:** 2026-02-01
**Status:** Ready for Implementation

## Overview

StockPulse is a stock tracking application for S&P 500, NASDAQ, and Dow Jones index companies. It helps users identify undervalued and overvalued stocks through multi-factor analysis, browse stocks by sector, and maintain personal watchlists.

## Technology Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Data Source | Yahoo Finance API |
| Deployment | Vercel |

## Architecture

```
stockpulse/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── undervalued/   # Undervalued stocks dashboard
│   │   ├── overvalued/    # Overvalued stocks dashboard
│   │   ├── sectors/       # Stocks by category
│   │   ├── stock/[symbol] # Individual stock detail
│   │   └── watchlist/     # User's watchlist
│   └── api/               # API routes for data fetching
├── components/            # React components (shadcn/ui based)
├── lib/                   # Utilities, hooks, data fetching
│   ├── yahoo-finance.ts   # Yahoo Finance API wrapper
│   ├── valuation.ts       # Multi-factor scoring logic
│   └── supabase.ts        # Supabase client
└── types/                 # TypeScript type definitions
```

### Data Flow

- Server Components fetch stock data from Yahoo Finance API
- Valuation scores are calculated server-side
- Supabase handles user authentication and watchlist storage
- Client components handle interactivity (filtering, sorting, adding to watchlist)

## Multi-Factor Valuation Scoring

The scoring system calculates a **Value Score (0-100)** for each stock:

| Factor | Weight | Logic |
|--------|--------|-------|
| P/E Score | 30% | Compare to sector average. Lower P/E = higher score |
| P/B Score | 20% | Price-to-Book ratio vs sector. Lower = higher score |
| PEG Score | 25% | P/E divided by growth rate. Below 1 = good value |
| 52-Week Position | 25% | Where price sits in 52-week range. Lower = higher score |

### Classification

- **Score 70-100:** Undervalued (green) → "Good to Buy" dashboard
- **Score 40-69:** Fair Value (yellow) → Neutral
- **Score 0-39:** Overvalued (red) → "Avoid" dashboard

### Sector Comparison

Each stock is compared against its sector peers, not the entire market. A tech stock with P/E of 25 might be undervalued for tech but overvalued for utilities.

### Edge Cases

- Negative P/E (unprofitable companies): Excluded from P/E scoring, other factors weighted higher
- Missing data: Score based on available factors only, with a "data quality" indicator

## Dashboard Pages

### 1. Home Dashboard

Overview showing:
- Market summary (S&P 500, NASDAQ, Dow Jones current values)
- Top 5 undervalued stocks across all sectors
- Top 5 overvalued stocks to avoid
- User's watchlist summary (if logged in)

### 2. Undervalued Stocks Dashboard

Sortable/filterable table with:
- Stock symbol, name, sector, current price
- Value Score with visual indicator
- P/E, P/B, 52-week range mini-chart
- "Add to Watchlist" button

### 3. Overvalued Stocks Dashboard

Same layout as undervalued, filtered for low scores (stocks to avoid)

### 4. Sectors Page

Category cards for:
- Technology, Finance, Healthcare, Energy, Consumer, Industrial, Utilities, Real Estate, Materials, Communications

Each card shows:
- Sector average score and stock count
- Click to see all stocks in that sector

### 5. Watchlist Page

User's saved stocks with:
- Current price and value score
- Notes field per stock
- Quick remove button

## Stock Detail Page

Route: `/stock/[symbol]`

### Header Section

- Company name, symbol, sector badge
- Current price with real-time change (%, $)
- Value Score gauge (0-100 with color)
- "Add to Watchlist" / "Remove from Watchlist" button

### Key Metrics Grid

| Metric | Description |
|--------|-------------|
| Current Price | Latest trading price |
| 52-Week High | Highest price in past year |
| 52-Week Low | Lowest price in past year |
| P/E Ratio | Price to Earnings |
| P/B Ratio | Price to Book |
| PEG Ratio | P/E to Growth |
| Market Cap | Total market value |
| Dividend Yield | Annual dividend % |

### Price Chart

- Recharts line chart showing 1M, 3M, 6M, 1Y, 5Y views
- 52-week high/low markers on chart

### Latest News Section

- 5-10 recent news articles from Yahoo Finance
- Headline, source, timestamp, snippet
- Click to open full article in new tab

### Sector Comparison

- Mini table showing how this stock ranks vs sector peers

## Authentication & Database

### Supabase Auth

- Email/password sign up and login
- Optional: Google OAuth for quick sign-in
- Protected routes redirect to login if not authenticated
- Session persists across browser refreshes

### Database Schema

```sql
-- Users table (managed by Supabase Auth)

-- Watchlist table
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, symbol)
);

-- Row Level Security: Users can only access their own watchlist
```

### Guest Experience

- Users can browse all dashboards without logging in
- "Add to Watchlist" prompts login
- After login, redirect back to previous page

## Additional Features

### Stock Screener

Filter stocks by:
- Value Score range (e.g., 70-100 only)
- Sector selection
- Market cap (small/mid/large)
- Dividend yield minimum

### Trending Movers

Daily highlights:
- Biggest gainers/losers today
- Stocks with unusual volume
- Recent Value Score changes

### Search

Global search bar:
- Search by symbol or company name
- Autocomplete suggestions
- Quick navigation to stock detail

### Dark/Light Mode

Theme toggle with system preference detection

## Deployment

### Pipeline

1. GitHub repository for version control
2. Vercel connected to repo for auto-deploy
3. Environment variables in Vercel for Supabase keys
4. Preview deployments on pull requests

### Data Refresh Strategy

- Stock data cached for 15 minutes (avoid API rate limits)
- News refreshed on each page visit
- Full index data updated daily via cron (Vercel cron jobs)

## Future Considerations (Not in v1)

- Email alerts for watchlist price changes
- Portfolio tracking with purchase price
- Mobile app (React Native)

## UI Components (shadcn/ui)

- Data tables with sorting/filtering
- Cards for stock summaries
- Badges for value classification
- Skeleton loaders during data fetch
- Toast notifications for actions
