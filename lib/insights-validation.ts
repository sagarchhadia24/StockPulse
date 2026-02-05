// lib/insights-validation.ts
import { InsightInputData, MarketCapCategory } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Extract all dollar amounts from text
 */
export function extractPricesFromText(text: string): number[] {
  // Match $X, $X.XX, $X,XXX, $X,XXX.XX patterns
  const priceRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g;
  const matches = text.matchAll(priceRegex);

  return Array.from(matches).map(match => {
    // Remove commas and parse
    return parseFloat(match[1].replace(/,/g, ""));
  });
}

/**
 * Validate that prices mentioned in AI text are reasonably accurate
 */
export function validateInsightPrices(
  text: string,
  inputData: InsightInputData
): ValidationResult {
  const extractedPrices = extractPricesFromText(text);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Known valid prices from input
  const validPrices = [
    inputData.price,
    inputData.week52Low,
    inputData.week52High,
  ].filter(p => p != null);

  const TOLERANCE = 0.05; // 5% tolerance for rounding

  for (const extractedPrice of extractedPrices) {
    // Check if this price is close to any valid price
    const isValid = validPrices.some(validPrice => {
      const diff = Math.abs(extractedPrice - validPrice) / validPrice;
      return diff <= TOLERANCE;
    });

    if (!isValid) {
      // Check if it's a significant error (off by more than 2x or less than 0.5x)
      const closestValid = validPrices.reduce((closest, p) =>
        Math.abs(p - extractedPrice) < Math.abs(closest - extractedPrice) ? p : closest
      );

      const ratio = extractedPrice / closestValid;
      if (ratio < 0.5 || ratio > 2) {
        errors.push(
          `Price $${extractedPrice.toFixed(2)} appears incorrect. Expected near $${closestValid.toFixed(2)}`
        );
      } else {
        warnings.push(
          `Price $${extractedPrice.toFixed(2)} differs from expected $${closestValid.toFixed(2)}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate confidence level based on data completeness
 */
export function calculateConfidence(
  inputData: InsightInputData
): "high" | "medium" | "low" {
  const metrics = [
    inputData.peRatio,
    inputData.pbRatio,
    inputData.pegRatio,
    inputData.psRatio,
    inputData.revenueGrowth,
    inputData.dividendYield,
  ];

  const availableCount = metrics.filter(m => m !== null && m !== undefined).length;
  const completeness = inputData.dataCompleteness ?? (availableCount / metrics.length) * 100;

  if (completeness >= 70 && availableCount >= 4) return "high";
  if (completeness >= 40 && availableCount >= 2) return "medium";
  return "low";
}

/**
 * Categorize market cap
 */
export function getMarketCapCategory(marketCap: number): MarketCapCategory {
  if (marketCap >= 200_000_000_000) return "mega-cap";
  if (marketCap >= 10_000_000_000) return "large-cap";
  if (marketCap >= 2_000_000_000) return "mid-cap";
  if (marketCap >= 300_000_000) return "small-cap";
  return "micro-cap";
}

/**
 * Calculate data completeness percentage
 */
export function calculateDataCompleteness(inputData: Partial<InsightInputData>): number {
  const requiredFields = [
    inputData.price,
    inputData.peRatio,
    inputData.pbRatio,
    inputData.pegRatio,
    inputData.psRatio,
    inputData.revenueGrowth,
    inputData.dividendYield,
    inputData.week52High,
    inputData.week52Low,
    inputData.volume,
    inputData.avgVolume,
  ];

  const available = requiredFields.filter(f => f !== null && f !== undefined).length;
  return Math.round((available / requiredFields.length) * 100);
}

/**
 * Check if cache should be invalidated due to significant price change
 */
export function shouldInvalidateCache(
  cachedPrice: number,
  currentPrice: number,
  threshold: number = 0.05
): boolean {
  const change = Math.abs(currentPrice - cachedPrice) / cachedPrice;
  return change > threshold;
}
