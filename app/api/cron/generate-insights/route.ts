// app/api/cron/generate-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMultipleQuotes, getStockNews } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { DIVERSE_SYMBOLS } from "@/data/symbols";
import { batchAnalyzeSentiment } from "@/lib/sentiment";
import { saveInsight } from "@/lib/insights";
import { generateInsight } from "@/lib/gemini";
import { InsightInputData } from "@/types";
import { SECTOR_AVERAGES } from "@/data/sector-averages";
import {
  getMarketCapCategory,
  calculateDataCompleteness,
  calculateConfidence,
} from "@/lib/insights-validation";
import { classifyStockType, getStockTypeLabel, classifyStock } from "@/lib/valuation";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log("[Cron] Starting AI insight generation");

    // Step 1: Fetch top 50 diverse symbols
    const symbols = DIVERSE_SYMBOLS.slice(0, 50);
    const stocks = await getMultipleQuotes(symbols);
    console.log(`[Cron] Fetched ${stocks.length} stocks`);

    // Step 2: Score all stocks
    const scored = stocks.map((stock) => ({
      stock,
      scored: calculateValueScore(stock),
    }));

    // Step 3: Pick top 20 most interesting (furthest from score=50)
    const sorted = scored
      .sort((a, b) => Math.abs(b.scored.valueScore - 50) - Math.abs(a.scored.valueScore - 50))
      .slice(0, 20);

    // Step 4: Fetch news for selected stocks
    const newsPromises = sorted.map(({ stock }) =>
      getStockNews(stock.symbol).then((news) => ({
        symbol: stock.symbol,
        headlines: news.map((n) => n.title),
      }))
    );
    const newsResults = await Promise.allSettled(newsPromises);
    const newsMap = new Map<string, string[]>();
    newsResults.forEach((result) => {
      if (result.status === "fulfilled") {
        newsMap.set(result.value.symbol, result.value.headlines);
      }
    });

    // Step 5: Batch sentiment analysis
    const sentimentInput = sorted.map(({ stock }) => ({
      symbol: stock.symbol,
      headlines: newsMap.get(stock.symbol) || [],
    }));
    const sentimentResults = await batchAnalyzeSentiment(sentimentInput);

    // Step 6: Generate insights with delays
    let generated = 0;
    for (const { stock, scored: scoredStock } of sorted) {
      try {
        const stockType = classifyStockType(stock);
        const classification = classifyStock(scoredStock.valueScore);
        const sectorAvg = SECTOR_AVERAGES[stock.sector] || { avgPE: 20, avgPB: 3, avgPS: 2 };
        const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1;

        const inputData: InsightInputData = {
          price: stock.price,
          changePercent: stock.changePercent,
          valueScore: scoredStock.valueScore,
          classification,
          peRatio: stock.peRatio,
          pbRatio: stock.pbRatio,
          pegRatio: stock.pegRatio,
          psRatio: stock.psRatio,
          week52High: stock.week52High,
          week52Low: stock.week52Low,
          sector: stock.sector,
          stockType: getStockTypeLabel(stockType),
          marketCap: stock.marketCap,
          marketCapCategory: getMarketCapCategory(stock.marketCap),
          volume: stock.volume,
          avgVolume: stock.avgVolume,
          volumeRatio,
          dividendYield: stock.dividendYield,
          revenueGrowth: stock.revenueGrowth,
          sectorAvgPE: sectorAvg.avgPE,
          sectorAvgPB: sectorAvg.avgPB,
          sectorAvgPS: sectorAvg.avgPS,
          peVsSector: stock.peRatio ? stock.peRatio / sectorAvg.avgPE : null,
          pbVsSector: stock.pbRatio ? stock.pbRatio / sectorAvg.avgPB : null,
          psVsSector: stock.psRatio ? stock.psRatio / sectorAvg.avgPS : null,
          dataCompleteness: 0,
        };
        inputData.dataCompleteness = calculateDataCompleteness(inputData);

        const insight = await generateInsight(stock.symbol, stock.name, inputData, "concise");
        const confidence = calculateConfidence(inputData);
        const sentiment = sentimentResults.get(stock.symbol);

        await saveInsight(stock.symbol, insight, inputData, confidence, {
          sentimentScore: sentiment?.score ?? null,
          sentimentLabel: sentiment?.label ?? null,
          newsSummary: sentiment?.summary ?? null,
          preGenerated: true,
        });

        generated++;
        console.log(`[Cron] Generated insight for ${stock.symbol} (${generated}/${sorted.length})`);

        // Delay between Gemini calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Cron] Failed to generate insight for ${stock.symbol}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms. Generated ${generated} insights`);

    return NextResponse.json({
      success: true,
      stocksAnalyzed: sorted.length,
      insightsGenerated: generated,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights", details: String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
