# StockPulse

A smart stock analysis dashboard that helps investors identify undervalued and overvalued stocks using valuation metrics.

## Features

### Core Dashboard
- **Market Overview** - Live indices (S&P 500, NASDAQ, Dow Jones) with real-time updates
- **Stock Valuation Scoring** - Proprietary algorithm using P/E, P/B, PEG, and 52-week position
- **Top Undervalued/Overvalued** - Curated lists of stocks by value score

### Stock Analysis
- **Detailed Stock Pages** - Price charts, valuation metrics, score breakdown
- **Historical Valuation** - Track how a stock's value score changed over time
- **AI Insights** - AI-generated analysis explaining valuation and context (powered by Google Gemini)

### Portfolio Tools
- **Watchlist** - Save stocks with personal notes
- **Price Alerts** - Email notifications when stocks hit price or valuation targets
- **Peer Comparison** - Compare up to 4 stocks side-by-side on valuation metrics
- **Stock Screener** - Filter stocks by sector, valuation, and metrics

### User Experience
- **Responsive Design** - Mobile hamburger menu with slide-in drawer
- **Dark/Light Theme** - Toggle between themes
- **Live Price Updates** - 30-second polling with visual feedback
- **Authentication** - Supabase Auth for secure user accounts

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Stock Data**: Yahoo Finance 2 API
- **AI**: Google Gemini 2.5 Flash
- **Email**: Resend
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Google AI Studio account (for AI Insights)
- Resend account (for Price Alerts)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd StockPulse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Apply migrations in supabase/migrations/ to your Supabase project

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for cron jobs) | Yes |
| `CRON_SECRET` | Secret for authenticating cron endpoints | Yes |
| `RESEND_API_KEY` | Resend API key for email alerts | Yes |
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |

## Project Structure

```
StockPulse/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Main app pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── stock/[symbol]/  # Stock detail pages
│   │   ├── watchlist/       # User watchlist
│   │   ├── alerts/          # Price alerts management
│   │   ├── compare/         # Peer comparison
│   │   ├── undervalued/     # Undervalued stocks
│   │   ├── overvalued/      # Overvalued stocks
│   │   ├── sectors/         # Sector analysis
│   │   └── screener/        # Stock screener
│   └── api/                 # API routes
│       ├── stocks/          # Stock data endpoints
│       ├── alerts/          # Alert CRUD
│       └── cron/            # Scheduled jobs
├── components/
│   ├── dashboard/           # Dashboard components
│   ├── layout/              # Header, nav, mobile drawer
│   ├── stock/               # Stock-related components
│   └── ui/                  # Shared UI components
├── lib/                     # Utilities and API clients
├── hooks/                   # Custom React hooks
├── supabase/migrations/     # Database migrations
└── __tests__/               # Test files
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm test           # Run tests
npm run lint       # Run linter
```

## Cron Jobs

The app uses Vercel Cron for scheduled tasks:

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/cron/snapshot-valuations` | 4:30 PM ET weekdays | Save daily valuation snapshots |
| `/api/cron/check-alerts` | 4:35 PM ET weekdays | Check and send price alerts |

## License

MIT
