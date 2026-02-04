// Re-export full index symbol lists from central data source
import {
  SP500_SYMBOLS as SP500_FULL,
  NASDAQ100_SYMBOLS as NASDAQ100_FULL,
  DOW30_SYMBOLS as DOW30_FULL,
} from "@/data/symbols";

// Export full symbol lists for movers and other features
export const SP500_SYMBOLS = SP500_FULL;
export const NASDAQ100_SYMBOLS = NASDAQ100_FULL;
export const DOW30_SYMBOLS = DOW30_FULL;

export type IndexType = "sp500" | "nasdaq100" | "dow30";

export const INDEX_CONFIG: Record<IndexType, { name: string; symbols: string[] }> = {
  sp500: { name: "S&P 500", symbols: SP500_SYMBOLS },
  nasdaq100: { name: "NASDAQ 100", symbols: NASDAQ100_SYMBOLS },
  dow30: { name: "Dow 30", symbols: DOW30_SYMBOLS },
};
