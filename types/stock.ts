export interface Stock {
  symbol: string;
  name: string;
  sector: Sector;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  psRatio: number | null;
  revenueGrowth: number | null;
  week52High: number;
  week52Low: number;
  dividendYield: number | null;
  volume: number;
  avgVolume: number;
}

export type StockType = "value" | "growth" | "garp" | "dividend";

export interface StockWithScore extends Stock {
  valueScore: number;
  scoreBreakdown: ScoreBreakdown;
  dataQuality: "high" | "medium" | "low";
  stockType: StockType;
}

export interface ComparisonStock extends StockWithScore {
  ytdChange: number | null;
}

export interface ScoreBreakdown {
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
  psScore: number | null;
  revenueGrowthScore: number | null;
  weekPositionScore: number;
}

export type Sector =
  | "Technology"
  | "Healthcare"
  | "Financials"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Energy"
  | "Industrials"
  | "Materials"
  | "Real Estate"
  | "Utilities"
  | "Communication Services";

export const SECTORS: Sector[] = [
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Industrials",
  "Materials",
  "Real Estate",
  "Utilities",
  "Communication Services",
];

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface StockNews {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  notes: string | null;
  addedAt: string;
}

export interface SectorSummary {
  sector: Sector;
  stockCount: number;
  avgScore: number;
  topStock: string;
  topStockScore: number;
}

export interface ValuationSnapshot {
  id: string;
  symbol: string;
  snapshotDate: string;
  price: number;
  valueScore: number;
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
  weekPositionScore: number;
  createdAt: string;
}

export interface HistoryDataPoint {
  date: string;
  price: number;
  valueScore: number | null;
}

export type AlertType = 'price_above' | 'price_below' | 'valuation_above' | 'valuation_below';
export type AlertStatus = 'active' | 'triggered' | 'disabled';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  alertType: AlertType;
  threshold: number;
  status: AlertStatus;
  triggeredAt: string | null;
  triggeredValue: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  symbol: string;
  alertType: AlertType;
  threshold: number;
}

export interface UpdateAlertInput {
  status?: AlertStatus;
  threshold?: number;
}

export interface AIInsight {
  id: string;
  symbol: string;
  summary: string;
  valuationAnalysis: string;
  recentPerformance: string;
  keyConsiderations: string[];
  inputData: InsightInputData;
  generatedAt: string;
  confidence: 'high' | 'medium' | 'low';
  sentimentScore: number | null;
  sentimentLabel: 'bullish' | 'neutral' | 'bearish' | null;
  newsSummary: string | null;
  preGenerated: boolean;
}

export interface InsightInputData {
  price: number;
  changePercent: number;
  valueScore: number;
  classification: string;
  peRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  week52High: number;
  week52Low: number;
  sector: string;
  marketCap: number;
  marketCapCategory: MarketCapCategory;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  psRatio: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  stockType: string;
  sectorAvgPE: number;
  sectorAvgPB: number;
  sectorAvgPS: number;
  peVsSector: number | null;
  pbVsSector: number | null;
  psVsSector: number | null;
  dataCompleteness: number;
  analystTargetMedian?: number | null;
  analystRecommendation?: string | null;
  lastEpsSurprisePercent?: number | null;
}

export type AnalysisStyle = 'concise' | 'detailed';

export type MarketCapCategory = 'mega-cap' | 'large-cap' | 'mid-cap' | 'small-cap' | 'micro-cap';

export interface EarningsQuarter {
  quarter: string;
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  epsSurprisePercent: number | null;
}

export interface EarningsData {
  earningsDate: string | null;
  earningsHistory: EarningsQuarter[];
  epsTrailing: number | null;
  epsForward: number | null;
}

export interface AnalystRatings {
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  numberOfAnalysts: number;
  recommendation: string;
  recommendationScore: number | null;
}

export interface FinancialDataPoint {
  date: string;
  value: number;
}

export interface FinancialStatements {
  annualRevenue: FinancialDataPoint[];
  annualNetIncome: FinancialDataPoint[];
  annualFreeCashFlow: FinancialDataPoint[];
  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
}

export interface OHLCVDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioPosition {
  id: string;
  userId: string;
  symbol: string;
  shares: number;
  buyPrice: number;
  buyDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionInput {
  symbol: string;
  shares: number;
  buyPrice: number;
  buyDate?: string;
  notes?: string;
}

export interface UpdatePositionInput {
  shares?: number;
  buyPrice?: number;
  buyDate?: string;
  notes?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  positionCount: number;
}

export interface PortfolioPositionWithMarket extends PortfolioPosition {
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  sector: string;
}
