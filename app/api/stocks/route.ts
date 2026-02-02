import { NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getCached, setCache } from "@/lib/cache";
import { UNIQUE_SYMBOLS } from "@/data/symbols";
import { StockWithScore } from "@/types";

const CACHE_KEY = "all-stocks";
const BATCH_SIZE = 50;

export async function GET() {
  try {
    // Check cache first
    const cached = getCached<StockWithScore[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        stocks: cached,
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch in batches to avoid rate limits
    const allStocks: StockWithScore[] = [];

    for (let i = 0; i < UNIQUE_SYMBOLS.length; i += BATCH_SIZE) {
      const batch = UNIQUE_SYMBOLS.slice(i, i + BATCH_SIZE);
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);

      // Small delay between batches
      if (i + BATCH_SIZE < UNIQUE_SYMBOLS.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Cache the results
    setCache(CACHE_KEY, allStocks);

    return NextResponse.json({
      stocks: allStocks,
      fromCache: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
