// lib/insights.ts
import { createClient } from "@/lib/supabase/server";
import { AIInsight, InsightInputData } from "@/types";
import { generateInsight } from "@/lib/gemini";

const CACHE_DURATION_HOURS = 24;

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
export async function getCachedInsight(symbol: string): Promise<AIInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("symbol", symbol.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  const insight = mapRowToInsight(data);

  // Check if still fresh
  if (!isInsightFresh(insight.generatedAt)) {
    return null;
  }

  return insight;
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
  inputData: InsightInputData
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
      generated_at: new Date().toISOString(),
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
  forceRefresh: boolean = false
): Promise<{ insight: AIInsight | null; cached: boolean; error?: string }> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedInsight(symbol);
    if (cached) {
      return { insight: cached, cached: true };
    }
  }

  // Generate new insight
  try {
    const generated = await generateInsight(symbol, name, inputData);

    // Save to cache
    const saved = await saveInsight(symbol, generated, inputData);

    return { insight: saved, cached: false };
  } catch (error) {
    console.error("Error generating insight:", error);
    return {
      insight: null,
      cached: false,
      error: error instanceof Error ? error.message : "Failed to generate insight",
    };
  }
}
