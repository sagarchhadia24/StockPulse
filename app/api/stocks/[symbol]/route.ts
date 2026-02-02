import { NextResponse } from "next/server";
import { getStockQuote, getStockNews, getHistoricalPrices } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getCached, setCache } from "@/lib/cache";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const cacheKey = `stock-${symbol}`;

  try {
    // Check cache
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // Fetch stock data, news, and historical prices in parallel
    const [stock, news, history] = await Promise.all([
      getStockQuote(symbol),
      getStockNews(symbol),
      getHistoricalPrices(symbol, "1y"),
    ]);

    if (!stock) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    const scoredStock = calculateValueScore(stock);

    const result = {
      stock: scoredStock,
      news,
      history,
      timestamp: new Date().toISOString(),
    };

    setCache(cacheKey, result);

    return NextResponse.json({ ...result, fromCache: false });
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
