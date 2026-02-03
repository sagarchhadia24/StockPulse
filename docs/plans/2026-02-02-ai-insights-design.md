# AI Insights Feature Design

## Overview

AI-generated stock analysis using Google Gemini Flash, displayed on stock detail pages with 24-hour caching. Provides valuation explanation, performance context, and key considerations.

## User Experience

### Location

New "AI Analysis" section on stock detail page (`/stock/[symbol]`), below stock metrics.

### States

**No insight cached:**
- Shows "Generate AI Insight" button
- Loading spinner while generating (1-2 seconds)

**Insight cached (< 24 hours old):**
- Displays insight immediately
- Shows timestamp: "Generated 3 hours ago"
- "Refresh" button to regenerate

**Generation error:**
- Message: "Couldn't generate insight. Try again."
- Retry button

### Insight Content

Structured output with sections:
- **Summary** - 1-2 sentence verdict
- **Valuation Analysis** - Why the score is what it is
- **Recent Performance** - Price movement context
- **Key Considerations** - 2-3 bullet points on risks/catalysts

Total length: ~150-200 words (concise, scannable)

## AI Integration

### Provider

Google Gemini Flash (free tier)
- 15 requests/minute
- 1 million tokens/day
- Model: `gemini-1.5-flash`

### Prompt

```
You are a stock analyst assistant. Generate a concise insight for {symbol} ({name}).

Current data:
- Price: ${price} ({changePercent}% today)
- Value Score: {valueScore}/100 ({classification})
- P/E: {pe} (sector avg: {sectorPE})
- P/B: {pb} (sector avg: {sectorPB})
- PEG: {peg}
- 52-week range: ${low} - ${high} (currently at {positionPercent}%)
- Sector: {sector}

Write a brief analysis (150-200 words) with:
1. Summary (1-2 sentences): Is this stock undervalued, fairly valued, or overvalued and why?
2. Valuation Analysis: Explain the key metrics driving the score
3. Recent Performance: Context on where price sits in 52-week range
4. Key Considerations: 2-3 bullet points on risks or factors to watch

Be objective and data-driven. Avoid hype or recommendations to buy/sell.
```

### Response Handling

- Request JSON output format from Gemini
- Parse into structured `AIInsight` object
- Fallback to plain text display if parsing fails

## Data Storage

### Database Schema

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  valuation_analysis TEXT NOT NULL,
  recent_performance TEXT NOT NULL,
  key_considerations TEXT[] NOT NULL,
  input_data JSONB NOT NULL,  -- snapshot of metrics used
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insights_symbol ON ai_insights(symbol);
CREATE INDEX idx_insights_generated_at ON ai_insights(generated_at);
```

### Cache Logic

1. Check if insight exists and is < 24 hours old
2. If yes, return cached insight
3. If no, generate new insight, upsert to database, return

## Technical Implementation

### File Structure

```
app/api/stocks/[symbol]/insight/route.ts   # Generate/fetch insight
components/stock/
  ai-insight-section.tsx                   # UI section with button/display
  insight-content.tsx                      # Formatted insight display
lib/
  gemini.ts                                # Gemini API client
  insights.ts                              # Cache logic, DB queries
supabase/migrations/
  004_create_ai_insights.sql               # New table
```

### New Types

```typescript
interface AIInsight {
  symbol: string;
  summary: string;
  valuationAnalysis: string;
  recentPerformance: string;
  keyConsiderations: string[];
  generatedAt: string;
}

interface InsightInputData {
  price: number;
  valueScore: number;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  week52High: number;
  week52Low: number;
  sector: string;
}
```

### API Endpoint

```
POST /api/stocks/[symbol]/insight
```

Response:
```json
{
  "symbol": "AAPL",
  "summary": "Apple appears fairly valued with its P/E slightly above sector average...",
  "valuationAnalysis": "The Value Score of 58 reflects...",
  "recentPerformance": "Currently trading at 75% of its 52-week range...",
  "keyConsiderations": [
    "iPhone sales growth slowing in key markets",
    "Services revenue continues strong growth",
    "AI integration in upcoming products could drive sentiment"
  ],
  "generatedAt": "2026-02-02T15:30:00Z",
  "cached": true
}
```

## Scope

### In Scope

- On-demand AI insight generation
- Google Gemini Flash integration (free tier)
- 24-hour caching in Supabase
- Structured output: summary, valuation, performance, considerations
- "Generate Insight" / "Refresh" buttons on stock detail page

### Out of Scope

- Pre-generated insights for all stocks
- News sentiment analysis
- Earnings/analyst data integration
- Comparison insights (multiple stocks)
- User feedback on insight quality

## Dependencies

- Google Gemini API (free tier) - **new dependency**
- Supabase (existing)

## Environment Variables

```
GEMINI_API_KEY=your_api_key_here
```
