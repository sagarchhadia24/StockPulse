# Historical Valuation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a historical valuation chart showing price and value score over time, powered by daily snapshots stored in Supabase.

**Architecture:** Daily Vercel cron job snapshots all ~200 stocks' valuations to Supabase. Stock detail page displays dual-axis chart merging Yahoo Finance price history with stored valuation snapshots.

**Tech Stack:** Next.js 16 App Router, Vercel Cron, Supabase PostgreSQL, Recharts (existing).

---

## Task 1: Create Database Migration

**Files:**
- Create: `supabase/migrations/002_create_valuation_snapshots.sql`

**Step 1: Write the migration**

```sql
-- supabase/migrations/002_create_valuation_snapshots.sql

-- Valuation snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS valuation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  snapshot_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  value_score INTEGER NOT NULL,
  pe_score INTEGER,
  pb_score INTEGER,
  peg_score INTEGER,
  week_position_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, snapshot_date)
);

-- Index for efficient queries by symbol and date range
CREATE INDEX IF NOT EXISTS idx_snapshots_symbol_date
  ON valuation_snapshots(symbol, snapshot_date DESC);

-- Index for cron job to check latest snapshot date
CREATE INDEX IF NOT EXISTS idx_snapshots_date
  ON valuation_snapshots(snapshot_date DESC);
```

**Step 2: Commit**

```bash
git add supabase/migrations/002_create_valuation_snapshots.sql
git commit -m "feat(history): add valuation_snapshots table migration

Stores daily valuation scores for historical charting

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**Note:** Run this migration in Supabase dashboard or via CLI before continuing.

---

## Task 2: Add TypeScript Types

**Files:**
- Modify: `types/stock.ts`

**Step 1: Add the new types**

Add at end of `types/stock.ts`:

```typescript
export interface ValuationSnapshot {
  id: string;
  symbol: string;
  snapshotDate: string;
  price: number;
  valueScore: number;
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
  weekPositionScore: number;
  createdAt: string;
}

export interface HistoryDataPoint {
  date: string;
  price: number;
  valueScore: number | null;
}
```

**Step 2: Commit**

```bash
git add types/stock.ts
git commit -m "feat(history): add ValuationSnapshot and HistoryDataPoint types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Snapshots Library

**Files:**
- Create: `lib/snapshots.ts`
- Test: `__tests__/lib/snapshots.test.ts`

**Step 1: Write the failing test**

```typescript
// __tests__/lib/snapshots.test.ts
import { mergeHistoryWithSnapshots } from "@/lib/snapshots";

describe("mergeHistoryWithSnapshots", () => {
  it("should merge price history with valuation snapshots", () => {
    const priceHistory = [
      { date: "2026-01-01", price: 100 },
      { date: "2026-01-02", price: 105 },
      { date: "2026-01-03", price: 102 },
    ];
    const snapshots = [
      { snapshotDate: "2026-01-01", valueScore: 65 },
      { snapshotDate: "2026-01-03", valueScore: 70 },
    ];

    const result = mergeHistoryWithSnapshots(priceHistory, snapshots);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: "2026-01-01", price: 100, valueScore: 65 });
    expect(result[1]).toEqual({ date: "2026-01-02", price: 105, valueScore: null });
    expect(result[2]).toEqual({ date: "2026-01-03", price: 102, valueScore: 70 });
  });

  it("should handle empty snapshots", () => {
    const priceHistory = [
      { date: "2026-01-01", price: 100 },
      { date: "2026-01-02", price: 105 },
    ];

    const result = mergeHistoryWithSnapshots(priceHistory, []);

    expect(result).toHaveLength(2);
    expect(result[0].valueScore).toBeNull();
    expect(result[1].valueScore).toBeNull();
  });

  it("should handle empty price history", () => {
    const result = mergeHistoryWithSnapshots([], []);
    expect(result).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/lib/snapshots.test.ts`
Expected: FAIL with "Cannot find module '@/lib/snapshots'"

**Step 3: Write the implementation**

```typescript
// lib/snapshots.ts
import { createClient } from "@/lib/supabase/server";
import { ValuationSnapshot, HistoryDataPoint } from "@/types";

/**
 * Merge price history with valuation snapshots by date
 */
export function mergeHistoryWithSnapshots(
  priceHistory: { date: string; price: number }[],
  snapshots: { snapshotDate: string; valueScore: number }[]
): HistoryDataPoint[] {
  const snapshotMap = new Map(
    snapshots.map((s) => [s.snapshotDate, s.valueScore])
  );

  return priceHistory.map((point) => ({
    date: point.date,
    price: point.price,
    valueScore: snapshotMap.get(point.date) ?? null,
  }));
}

/**
 * Fetch valuation snapshots for a symbol within a date range
 */
export async function getValuationSnapshots(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<ValuationSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valuation_snapshots")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .gte("snapshot_date", startDate.toISOString().split("T")[0])
    .lte("snapshot_date", endDate.toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true });

  if (error) {
    console.error("Error fetching valuation snapshots:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    snapshotDate: row.snapshot_date,
    price: parseFloat(row.price),
    valueScore: row.value_score,
    peScore: row.pe_score,
    pbScore: row.pb_score,
    pegScore: row.peg_score,
    weekPositionScore: row.week_position_score,
    createdAt: row.created_at,
  }));
}

/**
 * Save valuation snapshots (used by cron job)
 */
export async function saveValuationSnapshots(
  snapshots: Omit<ValuationSnapshot, "id" | "createdAt">[]
): Promise<{ success: boolean; count: number }> {
  if (snapshots.length === 0) {
    return { success: true, count: 0 };
  }

  const supabase = await createClient();

  const rows = snapshots.map((s) => ({
    symbol: s.symbol.toUpperCase(),
    snapshot_date: s.snapshotDate,
    price: s.price,
    value_score: s.valueScore,
    pe_score: s.peScore,
    pb_score: s.pbScore,
    peg_score: s.pegScore,
    week_position_score: s.weekPositionScore,
  }));

  const { error } = await supabase
    .from("valuation_snapshots")
    .upsert(rows, { onConflict: "symbol,snapshot_date" });

  if (error) {
    console.error("Error saving valuation snapshots:", error);
    return { success: false, count: 0 };
  }

  return { success: true, count: rows.length };
}

/**
 * Get the date of the most recent snapshot
 */
export async function getLatestSnapshotDate(): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valuation_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.snapshot_date;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/lib/snapshots.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/snapshots.ts __tests__/lib/snapshots.test.ts
git commit -m "feat(history): add snapshots library for DB operations

- mergeHistoryWithSnapshots: combine price and valuation data
- getValuationSnapshots: fetch snapshots by date range
- saveValuationSnapshots: upsert snapshots (for cron)
- getLatestSnapshotDate: check latest data

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Daily Snapshot Cron Job

**Files:**
- Create: `app/api/cron/snapshot-valuations/route.ts`

**Step 1: Create the cron endpoint**

```typescript
// app/api/cron/snapshot-valuations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { saveValuationSnapshots } from "@/lib/snapshots";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const today = new Date().toISOString().split("T")[0];

  try {
    console.log(`[Cron] Starting valuation snapshot for ${today}`);
    console.log(`[Cron] Processing ${UNIQUE_SYMBOLS.length} symbols`);

    // Fetch all stock quotes
    const stocks = await getMultipleQuotes(UNIQUE_SYMBOLS);
    console.log(`[Cron] Fetched ${stocks.length} stocks`);

    // Calculate value scores and prepare snapshots
    const snapshots = stocks.map((stock) => {
      const scored = calculateValueScore(stock);
      return {
        symbol: stock.symbol,
        snapshotDate: today,
        price: stock.price,
        valueScore: scored.valueScore,
        peScore: scored.scoreBreakdown.peScore,
        pbScore: scored.scoreBreakdown.pbScore,
        pegScore: scored.scoreBreakdown.pegScore,
        weekPositionScore: scored.scoreBreakdown.weekPositionScore,
      };
    });

    // Save to database
    const result = await saveValuationSnapshots(snapshots);

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms. Saved ${result.count} snapshots`);

    return NextResponse.json({
      success: result.success,
      date: today,
      stocksProcessed: stocks.length,
      snapshotsSaved: result.count,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to process snapshots", details: String(error) },
      { status: 500 }
    );
  }
}

// Vercel Cron configuration
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max
```

**Step 2: Create vercel.json for cron configuration**

```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot-valuations",
      "schedule": "30 21 * * 1-5"
    }
  ]
}
```

Note: `30 21 * * 1-5` = 4:30 PM ET (21:30 UTC) on weekdays.

**Step 3: Commit**

```bash
git add app/api/cron/snapshot-valuations/route.ts vercel.json
git commit -m "feat(history): add daily valuation snapshot cron job

- Fetches all ~200 stocks daily
- Calculates and stores value scores
- Runs at 4:30 PM ET (market close) on weekdays
- Protected by CRON_SECRET

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create History API Endpoint

**Files:**
- Create: `app/api/stocks/[symbol]/history/route.ts`

**Step 1: Create the API route**

```typescript
// app/api/stocks/[symbol]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHistoricalPrices } from "@/lib/yahoo-finance";
import { getValuationSnapshots, mergeHistoryWithSnapshots } from "@/lib/snapshots";

type Period = "1mo" | "3mo" | "6mo" | "1y";

function getStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setFullYear(now.getFullYear() - 1));
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get("period") || "1y") as Period;

  if (!["1mo", "3mo", "6mo", "1y"].includes(period)) {
    return NextResponse.json(
      { error: "Invalid period. Use: 1mo, 3mo, 6mo, 1y" },
      { status: 400 }
    );
  }

  try {
    const startDate = getStartDate(period);
    const endDate = new Date();

    // Fetch data in parallel
    const [priceHistory, snapshots] = await Promise.all([
      getHistoricalPrices(symbol, period),
      getValuationSnapshots(symbol, startDate, endDate),
    ]);

    // Merge price history with valuation snapshots
    const history = mergeHistoryWithSnapshots(
      priceHistory,
      snapshots.map((s) => ({
        snapshotDate: s.snapshotDate,
        valueScore: s.valueScore,
      }))
    );

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      period,
      history,
      snapshotCount: snapshots.length,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/stocks/\[symbol\]/history/route.ts
git commit -m "feat(history): add stock history API endpoint

GET /api/stocks/[symbol]/history?period=1y
- Merges Yahoo Finance prices with Supabase snapshots
- Supports 1mo, 3mo, 6mo, 1y periods

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Valuation History Chart Component

**Files:**
- Create: `components/stock/valuation-history-chart.tsx`

**Step 1: Create the dual-axis chart component**

```tsx
// components/stock/valuation-history-chart.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryDataPoint } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { Info } from "lucide-react";

interface ValuationHistoryChartProps {
  symbol: string;
  initialData?: HistoryDataPoint[];
}

type Period = "1mo" | "3mo" | "6mo" | "1y";

export function ValuationHistoryChart({
  symbol,
  initialData,
}: ValuationHistoryChartProps) {
  const [period, setPeriod] = useState<Period>("1y");
  const [data, setData] = useState<HistoryDataPoint[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stocks/${symbol}/history?period=${period}`
        );
        if (!response.ok) throw new Error("Failed to fetch history");

        const result = await response.json();
        setData(result.history);
      } catch (err) {
        setError("Failed to load history data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol, period]);

  // Check if we have any valuation data
  const hasValuationData = data.some((d) => d.valueScore !== null);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const priceData = payload.find((p: any) => p.dataKey === "price");
    const scoreData = payload.find((p: any) => p.dataKey === "valueScore");

    const score = scoreData?.value;
    const classification = score ? classifyStock(score) : null;

    return (
      <div className="bg-[#0c1222] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-white/60 mb-2">
          {new Date(label).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {priceData && (
          <p className="text-sm text-white">
            <span className="text-blue-400">Price:</span> $
            {priceData.value.toFixed(2)}
          </p>
        )}
        {score !== null && score !== undefined && (
          <p className="text-sm text-white">
            <span className="text-[#00dc82]">Value Score:</span> {score}
            <span className="text-white/60 ml-1">({classification})</span>
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-white/60">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Valuation History</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="1mo">1M</TabsTrigger>
              <TabsTrigger value="3mo">3M</TabsTrigger>
              <TabsTrigger value="6mo">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {!hasValuationData && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-400">
              Valuation tracking just started. Score history will appear as data
              accumulates.
            </p>
          </div>
        )}

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                stroke="rgba(255,255,255,0.1)"
              />
              {/* Price axis (right) */}
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                tickFormatter={(value) => `$${value}`}
                stroke="rgba(255,255,255,0.1)"
              />
              {/* Value Score axis (left) */}
              <YAxis
                yAxisId="score"
                orientation="left"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }}
                stroke="rgba(255,255,255,0.1)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-white/80 text-sm">{value}</span>
                )}
              />
              {/* Price line */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              {/* Value Score line */}
              {hasValuationData && (
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="valueScore"
                  stroke="#00dc82"
                  strokeWidth={2}
                  dot={false}
                  name="Value Score"
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/stock/valuation-history-chart.tsx
git commit -m "feat(history): add dual-axis valuation history chart

- Price on right axis, Value Score on left
- Period selector (1M, 3M, 6M, 1Y)
- Custom tooltip with classification
- Empty state message when no valuation data yet

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Chart to Stock Detail Page

**Files:**
- Modify: `app/(dashboard)/stock/[symbol]/page.tsx`

**Step 1: Import and add the chart**

Add import at top:

```tsx
import { ValuationHistoryChart } from "@/components/stock/valuation-history-chart";
```

Add the chart section after `<StockMetrics stock={stock} />`:

```tsx
{/* Valuation History */}
<ValuationHistoryChart symbol={stock.symbol} />
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/stock/\[symbol\]/page.tsx
git commit -m "feat(history): add valuation history chart to stock detail page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add CRON_SECRET to Environment

**Step 1: Generate a secure secret**

Run: `openssl rand -hex 32`

**Step 2: Add to .env.local**

```
CRON_SECRET=<generated-secret>
```

**Step 3: Add to Vercel environment variables**

In Vercel dashboard, add `CRON_SECRET` with the same value.

**Note:** Don't commit .env.local to git.

---

## Task 9: Manual Testing

**Step 1: Test the cron endpoint locally**

```bash
curl -H "Authorization: Bearer <your-cron-secret>" \
  http://localhost:3000/api/cron/snapshot-valuations
```

Expected: JSON response with `success: true` and snapshot count.

**Step 2: Test the history API**

```bash
curl http://localhost:3000/api/stocks/AAPL/history?period=1mo
```

Expected: JSON with `history` array (prices present, valueScore may be null initially).

**Step 3: Test the chart on stock detail page**

1. Navigate to `http://localhost:3000/stock/AAPL`
2. Verify "Valuation History" chart appears
3. Verify period selector works
4. Verify empty state message shows (until snapshots exist)

**Step 4: Run cron job to create initial data**

Trigger the cron endpoint manually, then refresh stock page to see valuation line appear.

---

## Task 10: Final Verification

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(history): final cleanup and fixes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan creates the Historical Valuation feature with:

1. **Database** - `valuation_snapshots` table in Supabase
2. **Library** (`lib/snapshots.ts`) - CRUD operations for snapshots
3. **Cron Job** - Daily snapshot at market close
4. **API** - `/api/stocks/[symbol]/history` endpoint
5. **UI** - Dual-axis chart on stock detail page

Total: ~10 tasks, builds on existing Recharts and Supabase infrastructure.
