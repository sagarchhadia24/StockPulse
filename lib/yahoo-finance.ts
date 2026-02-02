import { Stock, StockNews, MarketIndex, Sector } from "@/types";

// Set to true to use mock data only (bypass Yahoo Finance completely)
const USE_MOCK_DATA_ONLY = false;

// Lazy load yahoo-finance2 to avoid blocking on import
let yahooFinance: InstanceType<typeof import("yahoo-finance2").default> | null = null;
async function getYahooFinance() {
  if (!yahooFinance) {
    const { default: YahooFinance } = await import("yahoo-finance2");
    yahooFinance = new YahooFinance();
  }
  return yahooFinance;
}

// Timeout wrapper for Yahoo Finance calls
const TIMEOUT_MS = 5000; // 5 second timeout

async function withTimeout<T>(
  promiseFactory: () => Promise<T>,
  fallback: T
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Yahoo Finance timeout")), TIMEOUT_MS)
  );
  try {
    return await Promise.race([promiseFactory(), timeoutPromise]);
  } catch (error) {
    console.warn("Yahoo Finance call failed, using fallback:", error);
    return fallback;
  }
}

// Map Yahoo Finance sector names to our Sector type
function mapSector(yahooSector: string | undefined): Sector {
  const sectorMap: Record<string, Sector> = {
    Technology: "Technology",
    Healthcare: "Healthcare",
    "Financial Services": "Financials",
    "Consumer Cyclical": "Consumer Discretionary",
    "Consumer Defensive": "Consumer Staples",
    Energy: "Energy",
    Industrials: "Industrials",
    "Basic Materials": "Materials",
    "Real Estate": "Real Estate",
    Utilities: "Utilities",
    "Communication Services": "Communication Services",
  };
  return sectorMap[yahooSector || ""] || "Technology";
}

export async function getStockQuote(symbol: string): Promise<Stock | null> {
  // Return mock data immediately if flag is set
  const mockFallback = MOCK_STOCKS[symbol.toUpperCase()] || null;
  if (USE_MOCK_DATA_ONLY) {
    return mockFallback;
  }

  const fetchQuote = async (): Promise<Stock | null> => {
    const yf = await getYahooFinance();
    const quote = await yf.quote(symbol) as Record<string, any>;
    if (!quote) return null;

    // Quote types have [key: string]: any index signature
    // Some fields like sector, dividendYield, pegRatio are only on certain quote types
    return {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      sector: mapSector(quote.sector as string | undefined),
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      peRatio: quote.trailingPE ?? null,
      pbRatio: quote.priceToBook ?? null,
      pegRatio: quote.pegRatio ?? null,
      week52High: quote.fiftyTwoWeekHigh || 0,
      week52Low: quote.fiftyTwoWeekLow || 0,
      dividendYield: quote.dividendYield ?? null,
      volume: quote.regularMarketVolume || 0,
      avgVolume: quote.averageDailyVolume10Day || 0,
    };
  };

  return withTimeout(fetchQuote, mockFallback);
}

export async function getMultipleQuotes(symbols: string[]): Promise<Stock[]> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => getStockQuote(symbol))
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<Stock | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as Stock);
}

export async function getStockNews(symbol: string): Promise<StockNews[]> {
  if (USE_MOCK_DATA_ONLY) {
    return [];
  }

  const fetchNews = async (): Promise<StockNews[]> => {
    const yf = await getYahooFinance();
    const result = await yf.search(symbol, { newsCount: 10 }) as Record<string, any>;
    const news = result.news || [];
    return news.map((item: any) => ({
      title: item.title,
      link: item.link,
      source: item.publisher || "Unknown",
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      summary: undefined,
    }));
  };

  return withTimeout(fetchNews, []);
}

// Mock data for when Yahoo Finance is unavailable
const MOCK_INDICES: MarketIndex[] = [
  { symbol: "^GSPC", name: "S&P 500", value: 5998.74, change: 22.08, changePercent: 0.37 },
  { symbol: "^IXIC", name: "NASDAQ", value: 19627.44, change: -16.49, changePercent: -0.08 },
  { symbol: "^DJI", name: "Dow Jones", value: 44544.66, change: 134.13, changePercent: 0.30 },
];

const MOCK_STOCKS: Record<string, Stock> = {
  AAPL: {
    symbol: "AAPL", name: "Apple Inc.", sector: "Technology",
    price: 229.87, change: 1.23, changePercent: 0.54, marketCap: 3520000000000,
    peRatio: 37.2, pbRatio: 51.3, pegRatio: 2.1, week52High: 260.1, week52Low: 164.08,
    dividendYield: 0.44, volume: 48200000, avgVolume: 52300000,
  },
  MSFT: {
    symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology",
    price: 415.50, change: -2.15, changePercent: -0.51, marketCap: 3090000000000,
    peRatio: 35.8, pbRatio: 12.1, pegRatio: 2.3, week52High: 468.35, week52Low: 366.5,
    dividendYield: 0.72, volume: 18500000, avgVolume: 20100000,
  },
  GOOGL: {
    symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology",
    price: 191.24, change: 0.89, changePercent: 0.47, marketCap: 2350000000000,
    peRatio: 24.1, pbRatio: 7.2, pegRatio: 1.2, week52High: 201.42, week52Low: 150.22,
    dividendYield: null, volume: 22100000, avgVolume: 24500000,
  },
  AMZN: {
    symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary",
    price: 225.94, change: 3.42, changePercent: 1.54, marketCap: 2380000000000,
    peRatio: 45.2, pbRatio: 8.9, pegRatio: 1.8, week52High: 242.52, week52Low: 166.21,
    dividendYield: null, volume: 35200000, avgVolume: 38100000,
  },
  NVDA: {
    symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology",
    price: 134.70, change: 4.21, changePercent: 3.23, marketCap: 3310000000000,
    peRatio: 65.3, pbRatio: 52.1, pegRatio: 1.1, week52High: 153.13, week52Low: 75.61,
    dividendYield: 0.03, volume: 312000000, avgVolume: 285000000,
  },
  TSLA: {
    symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary",
    price: 394.36, change: -8.52, changePercent: -2.12, marketCap: 1260000000000,
    peRatio: 112.5, pbRatio: 16.8, pegRatio: 3.2, week52High: 488.54, week52Low: 138.8,
    dividendYield: null, volume: 95200000, avgVolume: 88500000,
  },
  // Undervalued stocks (low P/E, low P/B, low PEG relative to sector)
  JPM: {
    symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials",
    price: 195.50, change: 2.35, changePercent: 1.22, marketCap: 565000000000,
    peRatio: 10.2, pbRatio: 1.5, pegRatio: 0.8, week52High: 220.0, week52Low: 180.0,
    dividendYield: 2.3, volume: 8500000, avgVolume: 9200000,
  },
  BAC: {
    symbol: "BAC", name: "Bank of America Corp.", sector: "Financials",
    price: 38.20, change: 0.45, changePercent: 1.19, marketCap: 302000000000,
    peRatio: 9.8, pbRatio: 0.95, pegRatio: 0.7, week52High: 46.0, week52Low: 32.0,
    dividendYield: 2.6, volume: 35000000, avgVolume: 38000000,
  },
  XOM: {
    symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy",
    price: 105.80, change: 1.12, changePercent: 1.07, marketCap: 420000000000,
    peRatio: 8.5, pbRatio: 1.6, pegRatio: 0.6, week52High: 125.0, week52Low: 95.0,
    dividendYield: 3.5, volume: 12000000, avgVolume: 14000000,
  },
  CVX: {
    symbol: "CVX", name: "Chevron Corporation", sector: "Energy",
    price: 148.30, change: 0.85, changePercent: 0.58, marketCap: 275000000000,
    peRatio: 9.2, pbRatio: 1.4, pegRatio: 0.5, week52High: 175.0, week52Low: 140.0,
    dividendYield: 4.1, volume: 6500000, avgVolume: 7200000,
  },
  PFE: {
    symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare",
    price: 28.50, change: 0.32, changePercent: 1.14, marketCap: 160000000000,
    peRatio: 11.5, pbRatio: 1.8, pegRatio: 0.9, week52High: 35.0, week52Low: 25.0,
    dividendYield: 5.8, volume: 28000000, avgVolume: 32000000,
  },
  VZ: {
    symbol: "VZ", name: "Verizon Communications", sector: "Communication Services",
    price: 42.80, change: 0.28, changePercent: 0.66, marketCap: 180000000000,
    peRatio: 9.5, pbRatio: 1.6, pegRatio: 0.8, week52High: 48.0, week52Low: 38.0,
    dividendYield: 6.2, volume: 15000000, avgVolume: 18000000,
  },
  INTC: {
    symbol: "INTC", name: "Intel Corporation", sector: "Technology",
    price: 22.40, change: -0.35, changePercent: -1.54, marketCap: 95000000000,
    peRatio: 12.5, pbRatio: 1.2, pegRatio: 0.4, week52High: 50.0, week52Low: 18.0,
    dividendYield: 1.4, volume: 45000000, avgVolume: 52000000,
  },
  F: {
    symbol: "F", name: "Ford Motor Company", sector: "Consumer Discretionary",
    price: 10.85, change: 0.15, changePercent: 1.40, marketCap: 43000000000,
    peRatio: 6.8, pbRatio: 1.1, pegRatio: 0.5, week52High: 14.0, week52Low: 9.5,
    dividendYield: 5.5, volume: 55000000, avgVolume: 62000000,
  },
};

export async function getMarketIndices(): Promise<MarketIndex[]> {
  if (USE_MOCK_DATA_ONLY) {
    return MOCK_INDICES;
  }

  const indexSymbols = [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^IXIC", name: "NASDAQ" },
    { symbol: "^DJI", name: "Dow Jones" },
  ];

  const fetchIndices = async (): Promise<MarketIndex[]> => {
    const yf = await getYahooFinance();
    const results = await Promise.allSettled(
      indexSymbols.map(async ({ symbol, name }) => {
        const quote = await yf.quote(symbol) as Record<string, any> | null;
        return {
          symbol,
          name,
          value: quote?.regularMarketPrice || 0,
          change: quote?.regularMarketChange || 0,
          changePercent: quote?.regularMarketChangePercent || 0,
        };
      })
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<MarketIndex> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);
  };

  return withTimeout(fetchIndices, MOCK_INDICES);
}

export async function getHistoricalPrices(
  symbol: string,
  period: "1mo" | "3mo" | "6mo" | "1y" | "5y" = "1y"
): Promise<{ date: string; price: number }[]> {
  if (USE_MOCK_DATA_ONLY) {
    return [];
  }

  const fetchHistorical = async (): Promise<{ date: string; price: number }[]> => {
    const yf = await getYahooFinance();
    const result = await yf.historical(symbol, {
      period1: getStartDate(period),
      period2: new Date(),
    }) as Array<{ date: Date; close: number }>;

    return result.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      price: item.close,
    }));
  };

  return withTimeout(fetchHistorical, []);
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "5y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
    default:
      return new Date(now.setFullYear(now.getFullYear() - 1));
  }
}
