import { Sector } from "@/types";

export interface SectorAverages {
  avgPE: number;
  avgPB: number;
  avgPS: number;
}

// Industry average P/E, P/B, and P/S ratios by sector (approximate values)
export const SECTOR_AVERAGES: Record<Sector, SectorAverages> = {
  "Technology": { avgPE: 28, avgPB: 7, avgPS: 6.0 },
  "Healthcare": { avgPE: 22, avgPB: 4, avgPS: 3.5 },
  "Financials": { avgPE: 14, avgPB: 1.3, avgPS: 2.5 },
  "Consumer Discretionary": { avgPE: 24, avgPB: 5, avgPS: 1.8 },
  "Consumer Staples": { avgPE: 22, avgPB: 5, avgPS: 2.0 },
  "Energy": { avgPE: 12, avgPB: 1.8, avgPS: 1.0 },
  "Industrials": { avgPE: 20, avgPB: 4, avgPS: 1.5 },
  "Materials": { avgPE: 15, avgPB: 2.5, avgPS: 1.2 },
  "Real Estate": { avgPE: 35, avgPB: 2, avgPS: 8.0 },
  "Utilities": { avgPE: 18, avgPB: 1.8, avgPS: 2.5 },
  "Communication Services": { avgPE: 18, avgPB: 3, avgPS: 2.5 },
};
