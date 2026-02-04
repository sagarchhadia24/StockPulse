import { Stock, StockWithScore, ScoreBreakdown, Sector, StockType } from "@/types";
import { SECTOR_AVERAGES } from "@/data/sector-averages";

// Weight profiles for different stock types
interface WeightProfile {
  pe: number;
  pb: number;
  peg: number;
  ps: number;
  revenueGrowth: number;
  weekPosition: number;
}

const WEIGHT_PROFILES: Record<StockType, WeightProfile> = {
  value: { pe: 0.35, pb: 0.25, peg: 0.15, ps: 0.10, revenueGrowth: 0.05, weekPosition: 0.10 },
  growth: { pe: 0.10, pb: 0.10, peg: 0.15, ps: 0.30, revenueGrowth: 0.25, weekPosition: 0.10 },
  garp: { pe: 0.20, pb: 0.15, peg: 0.25, ps: 0.15, revenueGrowth: 0.15, weekPosition: 0.10 },
  dividend: { pe: 0.25, pb: 0.20, peg: 0.10, ps: 0.15, revenueGrowth: 0.10, weekPosition: 0.20 },
};

/**
 * Classify stock type based on financial characteristics
 */
export function classifyStockType(stock: Stock): StockType {
  const hasProfits = stock.peRatio !== null && stock.peRatio > 0;
  const hasHighGrowth = stock.revenueGrowth !== null && stock.revenueGrowth > 0.15;
  const hasHighDividend = stock.dividendYield !== null && stock.dividendYield > 2.5;
  const hasVeryHighPE = stock.peRatio !== null && stock.peRatio > 40;
  const hasReasonablePEG = stock.pegRatio !== null && stock.pegRatio > 0 && stock.pegRatio < 2;
  const hasLowPEG = stock.pegRatio !== null && stock.pegRatio > 0 && stock.pegRatio < 1.5;

  // Dividend stocks: profitable, high dividend, not high growth
  if (hasHighDividend && hasProfits && !hasHighGrowth) return "dividend";

  // Growth stocks: high revenue growth OR very high P/E (suggests growth expectations)
  // Also classify as growth if unprofitable with high P/S (revenue-focused valuation)
  if (hasHighGrowth && (!hasProfits || hasVeryHighPE)) return "growth";
  if (!hasHighGrowth && hasVeryHighPE && !hasHighDividend) return "growth"; // High P/E without known growth still suggests growth stock

  // GARP (Growth at Reasonable Price): profitable with reasonable PEG
  // If we have high growth + reasonable PEG, it's GARP
  // Also if PEG < 1.5 with profits, likely GARP even without revenue growth data
  if (hasProfits && hasHighGrowth && hasReasonablePEG) return "garp";
  if (hasProfits && hasLowPEG && !hasHighDividend && !hasVeryHighPE) return "garp";

  // Default to value
  return "value";
}

/**
 * Get the weight profile for a stock type
 */
export function getWeightProfile(stockType: StockType): WeightProfile {
  return WEIGHT_PROFILES[stockType];
}

/**
 * Calculate P/E score (0-100)
 * Lower P/E compared to sector average = higher score
 * Score 50 at sector average (ratio = 1.0)
 */
function calculatePEScore(peRatio: number | null, sector: Sector): number | null {
  if (peRatio === null || peRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPE;
  const ratio = peRatio / sectorAvg;

  // Score: 100 at 0.5x average, 50 at 1x average, 0 at 2x average
  if (ratio <= 0.5) return 100;
  if (ratio >= 2) return 0;
  if (ratio <= 1) return Math.round(100 - ((ratio - 0.5) / 0.5) * 50);
  return Math.round(50 - ((ratio - 1) / 1) * 50);
}

/**
 * Calculate P/B score (0-100)
 * Lower P/B compared to sector average = higher score
 * Score 50 at sector average (ratio = 1.0)
 */
function calculatePBScore(pbRatio: number | null, sector: Sector): number | null {
  if (pbRatio === null || pbRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPB;
  const ratio = pbRatio / sectorAvg;

  // Score: 100 at 0.5x average, 50 at 1x average, 0 at 2x average
  if (ratio <= 0.5) return 100;
  if (ratio >= 2) return 0;
  if (ratio <= 1) return Math.round(100 - ((ratio - 0.5) / 0.5) * 50);
  return Math.round(50 - ((ratio - 1) / 1) * 50);
}

/**
 * Calculate PEG score (0-100)
 * PEG < 1 is considered undervalued, PEG = 1 is fair value
 * Score 50 at PEG = 1.0
 */
function calculatePEGScore(pegRatio: number | null): number | null {
  if (pegRatio === null || pegRatio <= 0) return null;

  // Score: 100 at PEG 0.5, 50 at PEG 1.0, 0 at PEG 2.0
  if (pegRatio <= 0.5) return 100;
  if (pegRatio >= 2) return 0;
  if (pegRatio <= 1) return Math.round(100 - ((pegRatio - 0.5) / 0.5) * 50);
  return Math.round(50 - ((pegRatio - 1) / 1) * 50);
}

/**
 * Calculate P/S score (0-100)
 * Lower P/S compared to sector average = higher score
 * Score 50 at sector average, 100 at 0.25x, 0 at 3x
 */
function calculatePSScore(psRatio: number | null, sector: Sector): number | null {
  if (psRatio === null || psRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPS;
  const ratio = psRatio / sectorAvg;

  // Score: 100 at 0.25x average, 50 at 1x average, 0 at 3x average
  if (ratio <= 0.25) return 100;
  if (ratio >= 3) return 0;
  if (ratio <= 1) return Math.round(100 - ((ratio - 0.25) / 0.75) * 50);
  return Math.round(50 - ((ratio - 1) / 2) * 50);
}

/**
 * Calculate Revenue Growth score (0-100)
 * Scoring varies by stock type:
 * - Growth stocks: higher growth = better (50%+ growth = 100)
 * - Value stocks: moderate growth is ideal (5-15% = 100)
 */
function calculateRevenueGrowthScore(growth: number | null, stockType: StockType): number | null {
  if (growth === null) return null;

  if (stockType === "growth" || stockType === "garp") {
    // For growth stocks: higher is better
    // 0% = 25, 15% = 50, 30% = 75, 50%+ = 100
    if (growth >= 0.5) return 100;
    if (growth <= 0) return Math.max(0, 25 + growth * 100); // Negative growth penalized
    if (growth <= 0.15) return Math.round(25 + (growth / 0.15) * 25);
    if (growth <= 0.30) return Math.round(50 + ((growth - 0.15) / 0.15) * 25);
    return Math.round(75 + ((growth - 0.30) / 0.20) * 25);
  } else {
    // For value/dividend stocks: moderate growth is ideal (5-15%)
    // <0% = 20, 0% = 50, 5-15% = 100, 30%+ = 60
    if (growth < 0) return Math.max(0, Math.round(20 + growth * 100));
    if (growth < 0.05) return Math.round(50 + (growth / 0.05) * 50);
    if (growth <= 0.15) return 100;
    if (growth <= 0.30) return Math.round(100 - ((growth - 0.15) / 0.15) * 40);
    return 60; // Very high growth for value stock is unusual
  }
}

/**
 * Calculate 52-week position score (0-100)
 * Lower in range = higher score (potential for upside)
 */
function calculateWeekPositionScore(
  price: number,
  week52High: number,
  week52Low: number
): number {
  if (week52High <= week52Low) return 50;

  const range = week52High - week52Low;
  const position = (price - week52Low) / range;

  // Invert: lower position = higher score
  return Math.round((1 - position) * 100);
}

/**
 * Determine data quality based on available metrics
 */
function getDataQuality(breakdown: ScoreBreakdown): "high" | "medium" | "low" {
  const availableScores = [
    breakdown.peScore,
    breakdown.pbScore,
    breakdown.pegScore,
    breakdown.psScore,
    breakdown.revenueGrowthScore,
  ].filter((score) => score !== null).length;

  if (availableScores >= 4) return "high";
  if (availableScores >= 2) return "medium";
  return "low";
}

/**
 * Calculate the final value score for a stock
 */
export function calculateValueScore(stock: Stock): StockWithScore {
  // Determine stock type first
  const stockType = classifyStockType(stock);
  const weights = WEIGHT_PROFILES[stockType];

  const breakdown: ScoreBreakdown = {
    peScore: calculatePEScore(stock.peRatio, stock.sector),
    pbScore: calculatePBScore(stock.pbRatio, stock.sector),
    pegScore: calculatePEGScore(stock.pegRatio),
    psScore: calculatePSScore(stock.psRatio, stock.sector),
    revenueGrowthScore: calculateRevenueGrowthScore(stock.revenueGrowth, stockType),
    weekPositionScore: calculateWeekPositionScore(
      stock.price,
      stock.week52High,
      stock.week52Low
    ),
  };

  // Calculate weighted average, adjusting weights for missing values
  let totalWeight = 0;
  let weightedSum = 0;

  if (breakdown.peScore !== null) {
    weightedSum += breakdown.peScore * weights.pe;
    totalWeight += weights.pe;
  }
  if (breakdown.pbScore !== null) {
    weightedSum += breakdown.pbScore * weights.pb;
    totalWeight += weights.pb;
  }
  if (breakdown.pegScore !== null) {
    weightedSum += breakdown.pegScore * weights.peg;
    totalWeight += weights.peg;
  }
  if (breakdown.psScore !== null) {
    weightedSum += breakdown.psScore * weights.ps;
    totalWeight += weights.ps;
  }
  if (breakdown.revenueGrowthScore !== null) {
    weightedSum += breakdown.revenueGrowthScore * weights.revenueGrowth;
    totalWeight += weights.revenueGrowth;
  }

  // 52-week position is always available
  weightedSum += breakdown.weekPositionScore * weights.weekPosition;
  totalWeight += weights.weekPosition;

  const valueScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

  return {
    ...stock,
    valueScore: Math.min(100, Math.max(0, valueScore)),
    scoreBreakdown: breakdown,
    dataQuality: getDataQuality(breakdown),
    stockType,
  };
}

/**
 * Classify stock based on value score
 * Thresholds adjusted so average stocks (score ~50) fall in "fair" range
 */
export function classifyStock(score: number): "undervalued" | "fair" | "overvalued" {
  if (score >= 65) return "undervalued";
  if (score >= 35) return "fair";
  return "overvalued";
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 65) return "text-green-500";
  if (score >= 35) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 65) return "default"; // green-ish
  if (score >= 35) return "secondary"; // neutral
  return "destructive"; // red
}

/**
 * Get stock type display name
 */
export function getStockTypeLabel(stockType: StockType): string {
  const labels: Record<StockType, string> = {
    value: "Value",
    growth: "Growth",
    garp: "GARP",
    dividend: "Dividend",
  };
  return labels[stockType];
}

/**
 * Get stock type color for badge
 */
export function getStockTypeColor(stockType: StockType): string {
  const colors: Record<StockType, string> = {
    value: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    growth: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    garp: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dividend: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };
  return colors[stockType];
}
