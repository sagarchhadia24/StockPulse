import YahooFinance from "yahoo-finance2";
import { Stock, StockNews, MarketIndex, Sector } from "@/types";

// Create a single instance of YahooFinance to be reused
const yahooFinance = new YahooFinance();

// Suppress Yahoo Finance validation warnings in development
yahooFinance.setGlobalConfig({ notifyRip498: false });

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
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    // Quote types have [key: string]: any index signature
    // Some fields like sector, dividendYield, pegRatio are only on certain quote types
    return {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      sector: mapSector(quote["sector"] as string | undefined),
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      peRatio: quote.trailingPE ?? null,
      pbRatio: quote.priceToBook ?? null,
      pegRatio: (quote["pegRatio"] as number | undefined) ?? null,
      week52High: quote.fiftyTwoWeekHigh || 0,
      week52Low: quote.fiftyTwoWeekLow || 0,
      dividendYield: (quote["dividendYield"] as number | undefined) ?? null,
      volume: quote.regularMarketVolume || 0,
      avgVolume: quote.averageDailyVolume10Day || 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
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
  try {
    const result = await yahooFinance.search(symbol, { newsCount: 10 });
    return (result.news || []).map((item) => ({
      title: item.title,
      link: item.link,
      source: item.publisher || "Unknown",
      publishedAt: item.providerPublishTime
        ? item.providerPublishTime.toISOString()
        : new Date().toISOString(),
      summary: undefined,
    }));
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

export async function getMarketIndices(): Promise<MarketIndex[]> {
  const indexSymbols = [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^IXIC", name: "NASDAQ" },
    { symbol: "^DJI", name: "Dow Jones" },
  ];

  const results = await Promise.allSettled(
    indexSymbols.map(async ({ symbol, name }) => {
      const quote = await yahooFinance.quote(symbol);
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
}

export async function getHistoricalPrices(
  symbol: string,
  period: "1mo" | "3mo" | "6mo" | "1y" | "5y" = "1y"
): Promise<{ date: string; price: number }[]> {
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: getStartDate(period),
      period2: new Date(),
    });

    return result.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      price: item.close,
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
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
