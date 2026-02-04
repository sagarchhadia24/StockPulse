import { NextResponse } from "next/server";
import { getMultipleQuotes } from "@/lib/yahoo-finance";
import { calculateValueScore } from "@/lib/valuation";
import { getCached, setCache } from "@/lib/cache";
import { ALL_SYMBOLS } from "@/data/symbols";
import { StockWithScore, Stock } from "@/types";

const CACHE_KEY = "all-stocks";
const BATCH_SIZE = 30;
const BATCH_DELAY_MS = 50;
const FETCH_TIMEOUT_MS = 120000; // 120 second total timeout for all fetches

// Mock stocks for immediate response when Yahoo Finance is unavailable
const MOCK_STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", price: 229.87, change: 1.23, changePercent: 0.54, marketCap: 3520000000000, peRatio: 37.2, pbRatio: 51.3, pegRatio: 2.1, psRatio: 8.5, revenueGrowth: 0.05, week52High: 260.1, week52Low: 164.08, dividendYield: 0.44, volume: 48200000, avgVolume: 52300000 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", price: 415.50, change: -2.15, changePercent: -0.51, marketCap: 3090000000000, peRatio: 35.8, pbRatio: 12.1, pegRatio: 2.3, psRatio: 12.5, revenueGrowth: 0.16, week52High: 468.35, week52Low: 366.5, dividendYield: 0.72, volume: 18500000, avgVolume: 20100000 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 191.24, change: 0.89, changePercent: 0.47, marketCap: 2350000000000, peRatio: 24.1, pbRatio: 7.2, pegRatio: 1.2, psRatio: 6.8, revenueGrowth: 0.14, week52High: 201.42, week52Low: 150.22, dividendYield: null, volume: 22100000, avgVolume: 24500000 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", price: 225.94, change: 3.42, changePercent: 1.54, marketCap: 2380000000000, peRatio: 45.2, pbRatio: 8.9, pegRatio: 1.8, psRatio: 3.5, revenueGrowth: 0.12, week52High: 242.52, week52Low: 166.21, dividendYield: null, volume: 35200000, avgVolume: 38100000 },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", price: 134.70, change: 4.21, changePercent: 3.23, marketCap: 3310000000000, peRatio: 65.3, pbRatio: 52.1, pegRatio: 1.1, psRatio: 35.0, revenueGrowth: 1.22, week52High: 153.13, week52Low: 75.61, dividendYield: 0.03, volume: 312000000, avgVolume: 285000000 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", price: 394.36, change: -8.52, changePercent: -2.12, marketCap: 1260000000000, peRatio: 112.5, pbRatio: 16.8, pegRatio: 3.2, psRatio: 12.5, revenueGrowth: 0.19, week52High: 488.54, week52Low: 138.8, dividendYield: null, volume: 95200000, avgVolume: 88500000 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication Services", price: 612.77, change: 5.32, changePercent: 0.88, marketCap: 1550000000000, peRatio: 28.4, pbRatio: 9.1, pegRatio: 1.4, psRatio: 10.5, revenueGrowth: 0.22, week52High: 638.4, week52Low: 414.5, dividendYield: 0.35, volume: 12500000, avgVolume: 14200000 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", price: 252.30, change: 1.85, changePercent: 0.74, marketCap: 725000000000, peRatio: 13.2, pbRatio: 2.1, pegRatio: 1.8, psRatio: 3.2, revenueGrowth: 0.08, week52High: 280.25, week52Low: 182.64, dividendYield: 2.1, volume: 8200000, avgVolume: 9100000 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", price: 317.45, change: 2.11, changePercent: 0.67, marketCap: 625000000000, peRatio: 31.5, pbRatio: 15.2, pegRatio: 1.9, psRatio: 16.0, revenueGrowth: 0.10, week52High: 325.82, week52Low: 252.7, dividendYield: 0.72, volume: 5800000, avgVolume: 6400000 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 147.82, change: -0.45, changePercent: -0.30, marketCap: 355000000000, peRatio: 15.8, pbRatio: 5.8, pegRatio: 2.5, psRatio: 4.2, revenueGrowth: 0.03, week52High: 168.85, week52Low: 140.68, dividendYield: 3.2, volume: 6100000, avgVolume: 7200000 },
];

async function fetchWithTimeout(): Promise<StockWithScore[]> {
  const allStocks: StockWithScore[] = [];
  const totalBatches = Math.ceil(ALL_SYMBOLS.length / BATCH_SIZE);

  for (let i = 0; i < ALL_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = ALL_SYMBOLS.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const stocks = await getMultipleQuotes(batch);
      const scoredStocks = stocks.map(calculateValueScore);
      allStocks.push(...scoredStocks);

      console.log(`Processed batch ${batchNumber}/${totalBatches} (${allStocks.length} stocks)`);
    } catch (error) {
      console.warn(`Batch ${batchNumber} failed, continuing...`, error);
    }

    // Add small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < ALL_SYMBOLS.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return allStocks;
}

export async function GET() {
  try {
    // Check cache first
    const cached = getCached<StockWithScore[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        stocks: cached,
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Try to fetch with a timeout, fall back to mock data
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)
    );

    const result = await Promise.race([fetchWithTimeout(), timeoutPromise]);

    if (result && result.length > 0) {
      setCache(CACHE_KEY, result);
      return NextResponse.json({
        stocks: result,
        fromCache: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Return mock data if fetch failed or timed out
    console.warn("Yahoo Finance unavailable, returning mock data");
    const mockScored = MOCK_STOCKS.map(calculateValueScore);
    return NextResponse.json({
      stocks: mockScored,
      fromCache: false,
      mock: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    // Return mock data on error
    const mockScored = MOCK_STOCKS.map(calculateValueScore);
    return NextResponse.json({
      stocks: mockScored,
      fromCache: false,
      mock: true,
      timestamp: new Date().toISOString(),
    });
  }
}
