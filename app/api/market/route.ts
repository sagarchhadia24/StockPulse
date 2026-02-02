import { NextResponse } from "next/server";
import { getMarketIndices } from "@/lib/yahoo-finance";
import { getCached, setCache } from "@/lib/cache";
import { MarketIndex } from "@/types";

const CACHE_KEY = "market-indices";

export async function GET() {
  try {
    const cached = getCached<MarketIndex[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        indices: cached,
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }

    const indices = await getMarketIndices();
    setCache(CACHE_KEY, indices);

    return NextResponse.json({
      indices,
      fromCache: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching market indices:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
