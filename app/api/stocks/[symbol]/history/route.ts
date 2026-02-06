// app/api/stocks/[symbol]/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHistoricalPrices, getOHLCVHistory } from "@/lib/yahoo-finance";
import { getValuationSnapshots, mergeHistoryWithSnapshots } from "@/lib/snapshots";

type Period = "1d" | "1w" | "1mo" | "3mo" | "6mo" | "1y" | "5y";

const VALID_PERIODS: Period[] = ["1d", "1w", "1mo", "3mo", "6mo", "1y", "5y"];

function getStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "1d":
      return new Date(now.setDate(now.getDate() - 1));
    case "1w":
      return new Date(now.setDate(now.getDate() - 7));
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "5y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
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
  const format = searchParams.get("format");

  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `Invalid period. Use: ${VALID_PERIODS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // OHLCV format for advanced chart
    if (format === "ohlcv") {
      const ohlcv = await getOHLCVHistory(symbol, period);
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        period,
        format: "ohlcv",
        data: ohlcv,
      });
    }

    // Default format with valuation snapshots
    const startDate = getStartDate(period);
    const endDate = new Date();

    const [priceHistory, snapshots] = await Promise.all([
      getHistoricalPrices(symbol, period as "1mo" | "3mo" | "6mo" | "1y" | "5y"),
      getValuationSnapshots(symbol, startDate, endDate),
    ]);

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
