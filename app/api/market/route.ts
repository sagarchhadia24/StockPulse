import { NextResponse } from "next/server";
import { getMarketIndices } from "@/lib/yahoo-finance";
import { getCached, setCache } from "@/lib/cache";
import { MarketIndex } from "@/types";

const CACHE_KEY = "market-indices";

// Mock indices for immediate response when Yahoo Finance is unavailable
const MOCK_INDICES: MarketIndex[] = [
  { symbol: "^GSPC", name: "S&P 500", value: 5998.74, change: 22.08, changePercent: 0.37 },
  { symbol: "^IXIC", name: "NASDAQ", value: 19627.44, change: -16.49, changePercent: -0.08 },
  { symbol: "^DJI", name: "Dow Jones", value: 44544.66, change: 134.13, changePercent: 0.30 },
];

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

    // If we got valid data, cache and return it
    if (indices && indices.length > 0 && indices[0].value > 0) {
      setCache(CACHE_KEY, indices);
      return NextResponse.json({
        indices,
        fromCache: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Return mock data if fetch returned empty/invalid data
    console.warn("Yahoo Finance returned invalid data, using mock indices");
    return NextResponse.json({
      indices: MOCK_INDICES,
      fromCache: false,
      mock: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching market indices:", error);
    // Return mock data on error instead of 500
    return NextResponse.json({
      indices: MOCK_INDICES,
      fromCache: false,
      mock: true,
      timestamp: new Date().toISOString(),
    });
  }
}
