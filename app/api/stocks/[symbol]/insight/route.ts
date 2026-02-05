// app/api/stocks/[symbol]/insight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/yahoo-finance";
import { calculateValueScore, classifyStock, classifyStockType, getStockTypeLabel } from "@/lib/valuation";
import { getOrGenerateInsight } from "@/lib/insights";
import { InsightInputData, AnalysisStyle } from "@/types";
import { SECTOR_AVERAGES } from "@/data/sector-averages";
import {
  getMarketCapCategory,
  calculateDataCompleteness,
} from "@/lib/insights-validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  // Parse request body
  let forceRefresh = false;
  let analysisStyle: AnalysisStyle = "concise";
  try {
    const body = await request.json();
    forceRefresh = body.refresh === true;
    if (body.style === "detailed") {
      analysisStyle = "detailed";
    }
  } catch {
    // No body or invalid JSON, use defaults
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

    // Calculate value score and stock type
    const scored = calculateValueScore(stock);
    const classification = classifyStock(scored.valueScore);
    const stockType = classifyStockType(stock);

    // Get sector averages
    const sectorAvg = SECTOR_AVERAGES[stock.sector] || {
      avgPE: 20,
      avgPB: 3,
      avgPS: 2,
    };

    // Calculate sector comparisons
    const peVsSector = stock.peRatio ? stock.peRatio / sectorAvg.avgPE : null;
    const pbVsSector = stock.pbRatio ? stock.pbRatio / sectorAvg.avgPB : null;
    const psVsSector = stock.psRatio ? stock.psRatio / sectorAvg.avgPS : null;

    // Calculate volume ratio
    const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1;

    // Build enhanced input data
    const inputData: InsightInputData = {
      // Core price data
      price: stock.price,
      changePercent: stock.changePercent,
      valueScore: scored.valueScore,
      classification,

      // Valuation ratios
      peRatio: stock.peRatio,
      pbRatio: stock.pbRatio,
      pegRatio: stock.pegRatio,
      psRatio: stock.psRatio,

      // Price range
      week52High: stock.week52High,
      week52Low: stock.week52Low,

      // Sector and type
      sector: stock.sector,
      stockType: getStockTypeLabel(stockType),

      // New enhanced fields
      marketCap: stock.marketCap,
      marketCapCategory: getMarketCapCategory(stock.marketCap),
      volume: stock.volume,
      avgVolume: stock.avgVolume,
      volumeRatio,
      dividendYield: stock.dividendYield,
      revenueGrowth: stock.revenueGrowth,

      // Sector comparisons
      sectorAvgPE: sectorAvg.avgPE,
      sectorAvgPB: sectorAvg.avgPB,
      sectorAvgPS: sectorAvg.avgPS,
      peVsSector,
      pbVsSector,
      psVsSector,

      // Data quality
      dataCompleteness: 0, // Will be calculated below
    };

    // Calculate data completeness
    inputData.dataCompleteness = calculateDataCompleteness(inputData);

    // Get or generate insight
    const result = await getOrGenerateInsight(
      upperSymbol,
      stock.name,
      inputData,
      forceRefresh,
      analysisStyle
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
