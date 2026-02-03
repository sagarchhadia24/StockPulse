# AI Insights Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build AI-generated stock analysis using Google Gemini Flash, displayed on stock detail pages with 24-hour caching.

**Architecture:** On-demand insight generation via API endpoint. Gemini Flash processes stock metrics and returns structured analysis. Results cached in Supabase for 24 hours to reduce API calls and improve UX.

**Tech Stack:** Next.js 16 App Router, Google Gemini API (free tier), Supabase (caching).

---

## Task 1: Create Database Migration for Insights Cache

**Files:**
- Create: `supabase/migrations/004_create_ai_insights.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/004_create_ai_insights.sql

-- AI insights cache table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  valuation_analysis TEXT NOT NULL,
  recent_performance TEXT NOT NULL,
  key_considerations TEXT[] NOT NULL,
  input_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_insights_symbol ON ai_insights(symbol);
CREATE INDEX IF NOT EXISTS idx_insights_generated_at ON ai_insights(generated_at);
```

**Step 2: Commit**

```bash
git add supabase/migrations/004_create_ai_insights.sql
git commit -m "feat(insights): add ai_insights table migration

Caches generated insights for 24 hours

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add TypeScript Types

**Files:**
- Modify: `types/stock.ts`

**Step 1: Add insight types**

Add at end of `types/stock.ts`:

```typescript
export interface AIInsight {
  id: string;
  symbol: string;
  summary: string;
  valuationAnalysis: string;
  recentPerformance: string;
  keyConsiderations: string[];
  inputData: InsightInputData;
  generatedAt: string;
}

export interface InsightInputData {
  price: number;
  changePercent: number;
  valueScore: number;
  classification: string;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  week52High: number;
  week52Low: number;
  sector: string;
}
```

**Step 2: Commit**

```bash
git add types/stock.ts
git commit -m "feat(insights): add AIInsight and InsightInputData types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Gemini API Client

**Files:**
- Create: `lib/gemini.ts`

**Step 1: Create the Gemini client**

```typescript
// lib/gemini.ts
import { InsightInputData } from "@/types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GeneratedInsight {
  summary: string;
  valuationAnalysis: string;
  recentPerformance: string;
  keyConsiderations: string[];
}

function buildPrompt(symbol: string, name: string, data: InsightInputData): string {
  const positionPercent = data.week52High > data.week52Low
    ? Math.round(((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100)
    : 50;

  return `You are a stock analyst assistant. Generate a concise insight for ${symbol} (${name}).

Current data:
- Price: $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}% today)
- Value Score: ${data.valueScore}/100 (${data.classification})
- P/E Ratio: ${data.peRatio?.toFixed(1) ?? 'N/A'}
- P/B Ratio: ${data.pbRatio?.toFixed(1) ?? 'N/A'}
- PEG Ratio: ${data.pegRatio?.toFixed(1) ?? 'N/A'}
- 52-week range: $${data.week52Low.toFixed(2)} - $${data.week52High.toFixed(2)} (currently at ${positionPercent}%)
- Sector: ${data.sector}

Write a brief analysis (150-200 words total) with these exact sections:

SUMMARY: (1-2 sentences) Is this stock undervalued, fairly valued, or overvalued and why?

VALUATION_ANALYSIS: (2-3 sentences) Explain the key metrics driving the score.

RECENT_PERFORMANCE: (1-2 sentences) Context on where price sits in 52-week range.

KEY_CONSIDERATIONS:
- (First bullet point about a risk or opportunity)
- (Second bullet point)
- (Third bullet point if relevant)

Be objective and data-driven. Avoid hype or recommendations to buy/sell. Use the exact section headers shown above.`;
}

function parseGeminiResponse(text: string): GeneratedInsight {
  // Parse the structured response
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=VALUATION_ANALYSIS:|$)/i);
  const valuationMatch = text.match(/VALUATION_ANALYSIS:\s*([\s\S]*?)(?=RECENT_PERFORMANCE:|$)/i);
  const performanceMatch = text.match(/RECENT_PERFORMANCE:\s*([\s\S]*?)(?=KEY_CONSIDERATIONS:|$)/i);
  const considerationsMatch = text.match(/KEY_CONSIDERATIONS:\s*([\s\S]*?)$/i);

  const summary = summaryMatch?.[1]?.trim() || "Analysis unavailable.";
  const valuationAnalysis = valuationMatch?.[1]?.trim() || "";
  const recentPerformance = performanceMatch?.[1]?.trim() || "";

  // Parse bullet points
  const considerationsText = considerationsMatch?.[1] || "";
  const keyConsiderations = considerationsText
    .split(/\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 3);

  return {
    summary,
    valuationAnalysis,
    recentPerformance,
    keyConsiderations: keyConsiderations.length > 0 ? keyConsiderations : ["No specific considerations identified."],
  };
}

export async function generateInsight(
  symbol: string,
  name: string,
  data: InsightInputData
): Promise<GeneratedInsight> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = buildPrompt(symbol, name, data);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result: GeminiResponse = await response.json();

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return parseGeminiResponse(text);
}
```

**Step 2: Commit**

```bash
git add lib/gemini.ts
git commit -m "feat(insights): add Gemini API client

- Builds structured prompt with stock data
- Parses response into insight sections
- Error handling for API failures

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Insights Library

**Files:**
- Create: `lib/insights.ts`

**Step 1: Create the insights library**

```typescript
// lib/insights.ts
import { createClient } from "@/lib/supabase/server";
import { AIInsight, InsightInputData } from "@/types";
import { generateInsight } from "@/lib/gemini";

const CACHE_DURATION_HOURS = 24;

/**
 * Map database row to AIInsight interface
 */
function mapRowToInsight(row: any): AIInsight {
  return {
    id: row.id,
    symbol: row.symbol,
    summary: row.summary,
    valuationAnalysis: row.valuation_analysis,
    recentPerformance: row.recent_performance,
    keyConsiderations: row.key_considerations,
    inputData: row.input_data,
    generatedAt: row.generated_at,
  };
}

/**
 * Check if insight is still fresh (within cache duration)
 */
function isInsightFresh(generatedAt: string): boolean {
  const generatedDate = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < CACHE_DURATION_HOURS;
}

/**
 * Get cached insight for a symbol
 */
export async function getCachedInsight(symbol: string): Promise<AIInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  const insight = mapRowToInsight(data);

  // Check if still fresh
  if (!isInsightFresh(insight.generatedAt)) {
    return null;
  }

  return insight;
}

/**
 * Save insight to cache
 */
export async function saveInsight(
  symbol: string,
  insight: {
    summary: string;
    valuationAnalysis: string;
    recentPerformance: string;
    keyConsiderations: string[];
  },
  inputData: InsightInputData
): Promise<AIInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .upsert({
      symbol: symbol.toUpperCase(),
      summary: insight.summary,
      valuation_analysis: insight.valuationAnalysis,
      recent_performance: insight.recentPerformance,
      key_considerations: insight.keyConsiderations,
      input_data: inputData,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: "symbol",
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving insight:", error);
    return null;
  }

  return mapRowToInsight(data);
}

/**
 * Generate or retrieve insight for a stock
 */
export async function getOrGenerateInsight(
  symbol: string,
  name: string,
  inputData: InsightInputData,
  forceRefresh: boolean = false
): Promise<{ insight: AIInsight | null; cached: boolean; error?: string }> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedInsight(symbol);
    if (cached) {
      return { insight: cached, cached: true };
    }
  }

  // Generate new insight
  try {
    const generated = await generateInsight(symbol, name, inputData);

    // Save to cache
    const saved = await saveInsight(symbol, generated, inputData);

    return { insight: saved, cached: false };
  } catch (error) {
    console.error("Error generating insight:", error);
    return {
      insight: null,
      cached: false,
      error: error instanceof Error ? error.message : "Failed to generate insight",
    };
  }
}
```

**Step 2: Commit**

```bash
git add lib/insights.ts
git commit -m "feat(insights): add insights library with caching

- getCachedInsight: check cache freshness
- saveInsight: upsert to database
- getOrGenerateInsight: cache-first strategy

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Insight API Endpoint

**Files:**
- Create: `app/api/stocks/[symbol]/insight/route.ts`

**Step 1: Create the API route**

```typescript
// app/api/stocks/[symbol]/insight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/yahoo-finance";
import { calculateValueScore, classifyStock } from "@/lib/valuation";
import { getOrGenerateInsight } from "@/lib/insights";
import { InsightInputData } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Check for refresh flag in body
  let forceRefresh = false;
  try {
    const body = await request.json();
    forceRefresh = body.refresh === true;
  } catch {
    // No body or invalid JSON, that's fine
  }

  try {
    // Fetch current stock data
    const stock = await getStockQuote(upperSymbol);

    if (!stock) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    // Calculate value score
    const scored = calculateValueScore(stock);
    const classification = classifyStock(scored.valueScore);

    // Prepare input data for insight generation
    const inputData: InsightInputData = {
      price: stock.price,
      changePercent: stock.changePercent,
      valueScore: scored.valueScore,
      classification,
      peRatio: stock.peRatio,
      pbRatio: stock.pbRatio,
      pegRatio: stock.pegRatio,
      week52High: stock.week52High,
      week52Low: stock.week52Low,
      sector: stock.sector,
    };

    // Get or generate insight
    const result = await getOrGenerateInsight(
      upperSymbol,
      stock.name,
      inputData,
      forceRefresh
    );

    if (result.error || !result.insight) {
      return NextResponse.json(
        { error: result.error || "Failed to generate insight" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.insight,
      cached: result.cached,
    });
  } catch (error) {
    console.error("Error generating insight:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
```

**Step 2: Commit**

```bash
git add app/api/stocks/\[symbol\]/insight/route.ts
git commit -m "feat(insights): add insight generation API endpoint

POST /api/stocks/[symbol]/insight
- Fetches current stock data
- Returns cached insight if fresh
- Generates new insight via Gemini if needed
- Supports force refresh with body.refresh=true

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create AI Insight Section Component

**Files:**
- Create: `components/stock/ai-insight-section.tsx`

**Step 1: Create the component**

```tsx
// components/stock/ai-insight-section.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsight } from "@/types";
import { Sparkles, RefreshCw, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightSectionProps {
  symbol: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffHours >= 24) {
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  }
  if (diffHours >= 1) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
}

export function AIInsightSection({ symbol }: AIInsightSectionProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const generateInsight = async (refresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stocks/${symbol}/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate insight");
      }

      const data = await response.json();
      setInsight(data);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00dc82]" />
            AI Analysis
          </CardTitle>
          {insight && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(insight.generatedAt)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateInsight(true)}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#00dc82]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-[#00dc82]" />
            </div>
            <p className="text-white/60 mb-4">
              Get AI-powered analysis of this stock's valuation and key considerations.
            </p>
            <Button onClick={() => generateInsight()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Insight
                </>
              )}
            </Button>
          </div>
        )}

        {loading && !insight && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateInsight()}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <p className="text-white leading-relaxed">{insight.summary}</p>
            </div>

            {/* Valuation Analysis */}
            <div>
              <h4 className="text-sm font-medium text-white/60 mb-2">
                Valuation Analysis
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                {insight.valuationAnalysis}
              </p>
            </div>

            {/* Recent Performance */}
            <div>
              <h4 className="text-sm font-medium text-white/60 mb-2">
                Recent Performance
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                {insight.recentPerformance}
              </p>
            </div>

            {/* Key Considerations */}
            <div>
              <h4 className="text-sm font-medium text-white/60 mb-2">
                Key Considerations
              </h4>
              <ul className="space-y-2">
                {insight.keyConsiderations.map((consideration, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="text-[#00dc82] mt-1">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-white/40 border-t border-white/10 pt-4">
              AI-generated analysis based on current metrics. Not financial advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/stock/ai-insight-section.tsx
git commit -m "feat(insights): add AI insight section component

- Generate on demand with button
- Display cached/fresh indicator
- Refresh button to regenerate
- Error handling with retry
- Structured display of analysis sections

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add AI Insight Section to Stock Detail Page

**Files:**
- Modify: `app/(dashboard)/stock/[symbol]/page.tsx`

**Step 1: Add import and component**

Add import:
```tsx
import { AIInsightSection } from "@/components/stock/ai-insight-section";
```

Add after the Valuation History chart section (or after Score Breakdown if History not yet added):
```tsx
{/* AI Insight */}
<AIInsightSection symbol={stock.symbol} />
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/stock/\[symbol\]/page.tsx
git commit -m "feat(insights): add AI insight section to stock detail page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Environment Variable

**Step 1: Get Gemini API Key**

1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key

**Step 2: Add to .env.local**

```
GEMINI_API_KEY=AIzaSy...
```

**Step 3: Add to Vercel**

In Vercel dashboard, add `GEMINI_API_KEY`.

---

## Task 9: Final Testing & Verification

**Step 1: Run all tests**

Run: `npm test`

**Step 2: Run linter**

Run: `npm run lint`

**Step 3: Build check**

Run: `npm run build`

**Step 4: Manual testing**

1. Navigate to `/stock/AAPL`
2. Click "Generate AI Insight"
3. Verify insight displays with all sections
4. Verify timestamp shows
5. Click refresh to regenerate
6. Navigate away and back - should show cached insight
7. Test error handling by using invalid API key

---

## Summary

This implementation plan creates the AI Insights feature with:

1. **Database** - `ai_insights` cache table
2. **Gemini client** (`lib/gemini.ts`) - API integration
3. **Insights library** (`lib/insights.ts`) - Cache management
4. **API** - `/api/stocks/[symbol]/insight` endpoint
5. **UI** - Insight section component on stock detail page

Total: ~9 tasks, requires Google Gemini API key.

## Dependencies Note

This feature is independent and can be implemented in any order relative to the other features. It only requires:
- Existing stock data fetching (`lib/yahoo-finance.ts`)
- Existing valuation scoring (`lib/valuation.ts`)
- Supabase (existing integration)
- Google Gemini API key (new)
