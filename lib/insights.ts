// lib/insights.ts
import { createClient } from "@/lib/supabase/server";
import { AIInsight, InsightInputData, AnalysisStyle } from "@/types";
import { generateInsight } from "@/lib/gemini";
import {
  validateInsightPrices,
  calculateConfidence,
  shouldInvalidateCache,
} from "@/lib/insights-validation";

const CACHE_DURATION_HOURS = 24;
const PRICE_CHANGE_THRESHOLD = 0.05; // 5% price change invalidates cache

/**
 * Map database row to AIInsight interface
 */
function mapRowToInsight(row: any): AIInsight {
  return {
    id: row.id,
    symbol: row.symbol,
    summary: row.summary,
    valuationAnalysis: row.valuation_analysis,
    recentPerformance: row.recent_performance,
    keyConsiderations: row.key_considerations,
    inputData: row.input_data,
    generatedAt: row.generated_at,
    confidence: row.confidence || "medium",
    sentimentScore: row.sentiment_score ?? null,
    sentimentLabel: row.sentiment_label ?? null,
    newsSummary: row.news_summary ?? null,
    preGenerated: row.pre_generated ?? false,
  };
}

/**
 * Check if insight is still fresh (within cache duration)
 */
function isInsightFresh(generatedAt: string): boolean {
  const generatedDate = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < CACHE_DURATION_HOURS;
}

/**
 * Get cached insight for a symbol
 */
export async function getCachedInsight(
  symbol: string,
  currentPrice?: number
): Promise<{ insight: AIInsight | null; stale: boolean; reason?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .single();

  if (error || !data) {
    return { insight: null, stale: false };
  }

  const insight = mapRowToInsight(data);

  // Check time-based freshness
  if (!isInsightFresh(insight.generatedAt)) {
    return { insight, stale: true, reason: "Cache expired (>24h old)" };
  }

  // Check price-based freshness (if current price provided)
  if (currentPrice && insight.inputData.price) {
    if (shouldInvalidateCache(insight.inputData.price, currentPrice, PRICE_CHANGE_THRESHOLD)) {
      const changePercent = ((currentPrice - insight.inputData.price) / insight.inputData.price * 100).toFixed(1);
      return {
        insight,
        stale: true,
        reason: `Price changed ${changePercent}% since generation`,
      };
    }
  }

  return { insight, stale: false };
}

/**
 * Save insight to cache
 */
export async function saveInsight(
  symbol: string,
  insight: {
    summary: string;
    valuationAnalysis: string;
    recentPerformance: string;
    keyConsiderations: string[];
  },
  inputData: InsightInputData,
  confidence: "high" | "medium" | "low",
  sentimentData?: {
    sentimentScore: number | null;
    sentimentLabel: string | null;
    newsSummary: string | null;
    preGenerated: boolean;
  }
): Promise<AIInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .upsert({
      symbol: symbol.toUpperCase(),
      summary: insight.summary,
      valuation_analysis: insight.valuationAnalysis,
      recent_performance: insight.recentPerformance,
      key_considerations: insight.keyConsiderations,
      input_data: inputData,
      confidence,
      generated_at: new Date().toISOString(),
      ...(sentimentData && {
        sentiment_score: sentimentData.sentimentScore,
        sentiment_label: sentimentData.sentimentLabel,
        news_summary: sentimentData.newsSummary,
        pre_generated: sentimentData.preGenerated,
      }),
    }, {
      onConflict: "symbol",
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving insight:", error);
    return null;
  }

  return mapRowToInsight(data);
}

/**
 * Generate or retrieve insight for a stock
 */
export async function getOrGenerateInsight(
  symbol: string,
  name: string,
  inputData: InsightInputData,
  forceRefresh: boolean = false,
  style: AnalysisStyle = "concise"
): Promise<{
  insight: AIInsight | null;
  cached: boolean;
  staleReason?: string;
  validationWarnings?: string[];
  error?: string;
}> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cacheResult = await getCachedInsight(symbol, inputData.price);

    if (cacheResult.insight && !cacheResult.stale) {
      return { insight: cacheResult.insight, cached: true };
    }

    // If stale but available, we'll regenerate but could return stale as fallback
    if (cacheResult.stale && cacheResult.insight) {
      console.log(`Cache stale for ${symbol}: ${cacheResult.reason}`);
    }
  }

  // Generate new insight
  try {
    const generated = await generateInsight(symbol, name, inputData, style);

    // Validate the generated content
    const fullText = `${generated.summary} ${generated.valuationAnalysis} ${generated.recentPerformance}`;
    const validation = validateInsightPrices(fullText, inputData);

    if (!validation.isValid) {
      console.warn(`Validation warnings for ${symbol}:`, validation.errors);
      // Still save but log the issues - could retry here in future
    }

    // Calculate confidence
    const confidence = calculateConfidence(inputData);

    // Save to cache
    const saved = await saveInsight(symbol, generated, inputData, confidence);

    return {
      insight: saved,
      cached: false,
      validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    };
  } catch (error) {
    console.error("Error generating insight:", error);

    // Try to return stale cache as fallback
    const fallback = await getCachedInsight(symbol);
    if (fallback.insight) {
      return {
        insight: fallback.insight,
        cached: true,
        staleReason: "Using cached version due to generation error",
        error: error instanceof Error ? error.message : "Failed to generate insight",
      };
    }

    return {
      insight: null,
      cached: false,
      error: error instanceof Error ? error.message : "Failed to generate insight",
    };
  }
}

/**
 * Get pre-generated insights (from cron job)
 */
export async function getPreGeneratedInsights(limit: number = 10): Promise<AIInsight[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("pre_generated", true)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching pre-generated insights:", error);
    return [];
  }

  return (data || []).map(mapRowToInsight);
}
