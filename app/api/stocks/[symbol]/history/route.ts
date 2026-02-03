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
