import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { getTopMovers, MoverStock } from "@/lib/movers";
import { INDEX_CONFIG, IndexType } from "@/lib/indices";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY_PREFIX = "movers:";
const MOVERS_COUNT = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const index = (searchParams.get("index") || "sp500") as IndexType;

  // Validate index parameter
  if (!INDEX_CONFIG[index]) {
    return NextResponse.json(
      { error: "Invalid index. Use: sp500, nasdaq100, or dow30" },
      { status: 400 }
    );
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${index}`;

  // Check cache first
  const cached = getCached<{
    index: string;
    indexName: string;
    gainers: MoverStock[];
    losers: MoverStock[];
    asOf: string;
  }>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const { symbols, name } = INDEX_CONFIG[index];
    const stocks = await getMultipleQuotes(symbols);
    const { gainers, losers } = getTopMovers(stocks, MOVERS_COUNT);

    const result = {
      index,
      indexName: name,
      gainers,
      losers,
      asOf: new Date().toISOString(),
    };

    // Cache for 5 minutes (cache module uses 15 min by default, this is fine)
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching movers:", error);
    return NextResponse.json(
      { error: "Failed to fetch market movers" },
      { status: 500 }
    );
  }
}
