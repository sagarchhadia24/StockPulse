// app/api/stocks/[symbol]/insight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/yahoo-finance";
import { calculateValueScore, classifyStock } from "@/lib/valuation";
import { getOrGenerateInsight } from "@/lib/insights";
import { InsightInputData } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Check for refresh flag in body
  let forceRefresh = false;
  try {
    const body = await request.json();
    forceRefresh = body.refresh === true;
  } catch {
    // No body or invalid JSON, that's fine
  }

  try {
    // Fetch current stock data
    const stock = await getStockQuote(upperSymbol);

    if (!stock) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    // Calculate value score
    const scored = calculateValueScore(stock);
    const classification = classifyStock(scored.valueScore);

    // Prepare input data for insight generation
    const inputData: InsightInputData = {
      price: stock.price,
      changePercent: stock.changePercent,
      valueScore: scored.valueScore,
      classification,
      peRatio: stock.peRatio,
      pbRatio: stock.pbRatio,
      pegRatio: stock.pegRatio,
      week52High: stock.week52High,
      week52Low: stock.week52Low,
      sector: stock.sector,
    };

    // Get or generate insight
    const result = await getOrGenerateInsight(
      upperSymbol,
      stock.name,
      inputData,
      forceRefresh
    );

    if (result.error || !result.insight) {
      return NextResponse.json(
        { error: result.error || "Failed to generate insight" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.insight,
      cached: result.cached,
    });
  } catch (error) {
    console.error("Error generating insight:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
