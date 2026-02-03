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
