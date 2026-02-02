import { Stock, StockWithScore, ScoreBreakdown, Sector } from "@/types";

interface SectorAverages {
  avgPE: number;
  avgPB: number;
}

// Industry average P/E and P/B ratios by sector (approximate values)
const SECTOR_AVERAGES: Record<Sector, SectorAverages> = {
  "Technology": { avgPE: 28, avgPB: 7 },
  "Healthcare": { avgPE: 22, avgPB: 4 },
  "Financials": { avgPE: 14, avgPB: 1.3 },
  "Consumer Discretionary": { avgPE: 24, avgPB: 5 },
  "Consumer Staples": { avgPE: 22, avgPB: 5 },
  "Energy": { avgPE: 12, avgPB: 1.8 },
  "Industrials": { avgPE: 20, avgPB: 4 },
  "Materials": { avgPE: 15, avgPB: 2.5 },
  "Real Estate": { avgPE: 35, avgPB: 2 },
  "Utilities": { avgPE: 18, avgPB: 1.8 },
  "Communication Services": { avgPE: 18, avgPB: 3 },
};

// Weights for each factor
const WEIGHTS = {
  pe: 0.30,
  pb: 0.20,
  peg: 0.25,
  weekPosition: 0.25,
};

/**
 * Calculate P/E score (0-100)
 * Lower P/E compared to sector average = higher score
 */
function calculatePEScore(peRatio: number | null, sector: Sector): number | null {
  if (peRatio === null || peRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPE;
  const ratio = peRatio / sectorAvg;

  // Score: 100 if PE is 50% below average, 0 if PE is 100% above average
  if (ratio <= 0.5) return 100;
  if (ratio >= 2) return 0;

  return Math.round(100 - ((ratio - 0.5) / 1.5) * 100);
}

/**
 * Calculate P/B score (0-100)
 * Lower P/B compared to sector average = higher score
 */
function calculatePBScore(pbRatio: number | null, sector: Sector): number | null {
  if (pbRatio === null || pbRatio <= 0) return null;

  const sectorAvg = SECTOR_AVERAGES[sector].avgPB;
  const ratio = pbRatio / sectorAvg;

  if (ratio <= 0.5) return 100;
  if (ratio >= 2) return 0;

  return Math.round(100 - ((ratio - 0.5) / 1.5) * 100);
}

/**
 * Calculate PEG score (0-100)
 * PEG < 1 is considered undervalued
 */
function calculatePEGScore(pegRatio: number | null): number | null {
  if (pegRatio === null || pegRatio <= 0) return null;

  // PEG of 0.5 or less = 100, PEG of 2 or more = 0
  if (pegRatio <= 0.5) return 100;
  if (pegRatio >= 2) return 0;

  return Math.round(100 - ((pegRatio - 0.5) / 1.5) * 100);
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
  ].filter((score) => score !== null).length;

  if (availableScores >= 3) return "high";
  if (availableScores >= 2) return "medium";
  return "low";
}

/**
 * Calculate the final value score for a stock
 */
export function calculateValueScore(stock: Stock): StockWithScore {
  const breakdown: ScoreBreakdown = {
    peScore: calculatePEScore(stock.peRatio, stock.sector),
    pbScore: calculatePBScore(stock.pbRatio, stock.sector),
    pegScore: calculatePEGScore(stock.pegRatio),
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
    weightedSum += breakdown.peScore * WEIGHTS.pe;
    totalWeight += WEIGHTS.pe;
  }
  if (breakdown.pbScore !== null) {
    weightedSum += breakdown.pbScore * WEIGHTS.pb;
    totalWeight += WEIGHTS.pb;
  }
  if (breakdown.pegScore !== null) {
    weightedSum += breakdown.pegScore * WEIGHTS.peg;
    totalWeight += WEIGHTS.peg;
  }

  // 52-week position is always available
  weightedSum += breakdown.weekPositionScore * WEIGHTS.weekPosition;
  totalWeight += WEIGHTS.weekPosition;

  const valueScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight * (totalWeight / (WEIGHTS.pe + WEIGHTS.pb + WEIGHTS.peg + WEIGHTS.weekPosition))) : 50;

  return {
    ...stock,
    valueScore: Math.min(100, Math.max(0, valueScore)),
    scoreBreakdown: breakdown,
    dataQuality: getDataQuality(breakdown),
  };
}

/**
 * Classify stock based on value score
 */
export function classifyStock(score: number): "undervalued" | "fair" | "overvalued" {
  if (score >= 70) return "undervalued";
  if (score >= 40) return "fair";
  return "overvalued";
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 70) return "default"; // green-ish
  if (score >= 40) return "secondary"; // neutral
  return "destructive"; // red
}
