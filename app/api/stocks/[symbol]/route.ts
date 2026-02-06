import { NextResponse } from "next/server";
import { getStockQuote, getStockNews, getHistoricalPrices, getEarningsData, getAnalystRatings, getFinancialStatements } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getCached, setCache } from "@/lib/cache";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const { searchParams } = new URL(request.url);
  const enriched = searchParams.get("enriched") === "true";
  const cacheKey = enriched ? `stock-enriched-${symbol}` : `stock-${symbol}`;

  try {
    // Check cache
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    if (enriched) {
      const [stock, news, history, earnings, analystRatings, financials] = await Promise.all([
        getStockQuote(symbol),
        getStockNews(symbol),
        getHistoricalPrices(symbol, "1y"),
        getEarningsData(symbol),
        getAnalystRatings(symbol),
        getFinancialStatements(symbol),
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
        earnings,
        analystRatings,
        financials,
        timestamp: new Date().toISOString(),
      };

      setCache(cacheKey, result);

      return NextResponse.json({ ...result, fromCache: false });
    }

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
