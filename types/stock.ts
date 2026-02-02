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
  week52High: number;
  week52Low: number;
  dividendYield: number | null;
  volume: number;
  avgVolume: number;
}

export interface StockWithScore extends Stock {
  valueScore: number;
  scoreBreakdown: ScoreBreakdown;
  dataQuality: "high" | "medium" | "low";
}

export interface ScoreBreakdown {
  peScore: number | null;
  pbScore: number | null;
  pegScore: number | null;
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
