import { Stock, StockNews, MarketIndex, Sector, EarningsData, AnalystRatings, FinancialStatements, OHLCVDataPoint } from "@/types";

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

export interface GetStockQuoteOptions {
  /** Fetch extended data (revenue growth) via quoteSummary - slower, use for detail pages only */
  includeExtendedData?: boolean;
}

export async function getStockQuote(
  symbol: string,
  options: GetStockQuoteOptions = {}
): Promise<Stock | null> {
  const { includeExtendedData = false } = options;

  // Return mock data immediately if flag is set
  const mockFallback = getMockStock(symbol);
  if (USE_MOCK_DATA_ONLY) {
    return mockFallback;
  }

  const fetchQuote = async (): Promise<Stock | null> => {
    const yf = await getYahooFinance();

    const quote = await yf.quote(symbol) as Record<string, any>;
    if (!quote) return null;

    // Only fetch quoteSummary for detail pages to reduce API calls
    let revenueGrowth: number | null = null;
    if (includeExtendedData) {
      try {
        const summary = await Promise.race([
          yf.quoteSummary(symbol, { modules: ["financialData"] }) as Promise<Record<string, any>>,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
        revenueGrowth = summary?.financialData?.revenueGrowth?.raw ?? null;
      } catch {
        // Revenue growth is optional
      }
    }

    // Use SYMBOL_SECTORS as source of truth for sector, fallback to Yahoo Finance mapping
    const upperSymbol = symbol.toUpperCase();
    const sector = SYMBOL_SECTORS[upperSymbol] || mapSector(quote.sector as string | undefined);

    // Quote types have [key: string]: any index signature
    // Some fields like sector, dividendYield, pegRatio are only on certain quote types
    return {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || symbol,
      sector,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      peRatio: quote.trailingPE ?? null,
      pbRatio: quote.priceToBook ?? null,
      pegRatio: quote.pegRatio ?? null,
      psRatio: quote.priceToSalesTrailing12Months ?? null,
      revenueGrowth,
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

// Symbol to sector mapping for all stocks
export const SYMBOL_SECTORS: Record<string, Sector> = {
  // Technology
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", GOOG: "Technology",
  META: "Technology", NVDA: "Technology", AVGO: "Technology", ORCL: "Technology",
  CRM: "Technology", ADBE: "Technology", AMD: "Technology", INTC: "Technology",
  CSCO: "Technology", IBM: "Technology", QCOM: "Technology", TXN: "Technology",
  NOW: "Technology", INTU: "Technology", AMAT: "Technology", MU: "Technology",
  LRCX: "Technology", ADI: "Technology", KLAC: "Technology", SNPS: "Technology",
  CDNS: "Technology", MRVL: "Technology", FTNT: "Technology", PANW: "Technology",
  CRWD: "Technology",
  // Healthcare
  UNH: "Healthcare", JNJ: "Healthcare", LLY: "Healthcare", PFE: "Healthcare",
  ABBV: "Healthcare", MRK: "Healthcare", TMO: "Healthcare", ABT: "Healthcare",
  DHR: "Healthcare", BMY: "Healthcare", AMGN: "Healthcare", GILD: "Healthcare",
  VRTX: "Healthcare", REGN: "Healthcare", ISRG: "Healthcare", MDT: "Healthcare",
  SYK: "Healthcare", ZTS: "Healthcare", BDX: "Healthcare", CI: "Healthcare",
  ELV: "Healthcare", HUM: "Healthcare", CVS: "Healthcare", MCK: "Healthcare",
  CAH: "Healthcare",
  // Financials
  "BRK-B": "Financials", JPM: "Financials", V: "Financials", MA: "Financials",
  BAC: "Financials", WFC: "Financials", GS: "Financials", MS: "Financials",
  BLK: "Financials", SCHW: "Financials", AXP: "Financials", C: "Financials",
  PNC: "Financials", USB: "Financials", TFC: "Financials", COF: "Financials",
  CB: "Financials", MMC: "Financials", AON: "Financials", ICE: "Financials",
  CME: "Financials", SPGI: "Financials", MCO: "Financials", MSCI: "Financials",
  FIS: "Financials",
  // Consumer Discretionary
  AMZN: "Consumer Discretionary", TSLA: "Consumer Discretionary", HD: "Consumer Discretionary",
  MCD: "Consumer Discretionary", NKE: "Consumer Discretionary", LOW: "Consumer Discretionary",
  SBUX: "Consumer Discretionary", TJX: "Consumer Discretionary", BKNG: "Consumer Discretionary",
  MAR: "Consumer Discretionary", ORLY: "Consumer Discretionary", AZO: "Consumer Discretionary",
  CMG: "Consumer Discretionary", DHI: "Consumer Discretionary", LEN: "Consumer Discretionary",
  GM: "Consumer Discretionary", F: "Consumer Discretionary", ROST: "Consumer Discretionary",
  YUM: "Consumer Discretionary", DG: "Consumer Discretionary",
  // Consumer Staples
  PG: "Consumer Staples", KO: "Consumer Staples", PEP: "Consumer Staples",
  COST: "Consumer Staples", WMT: "Consumer Staples", PM: "Consumer Staples",
  MO: "Consumer Staples", MDLZ: "Consumer Staples", CL: "Consumer Staples",
  KMB: "Consumer Staples", GIS: "Consumer Staples", K: "Consumer Staples",
  HSY: "Consumer Staples", STZ: "Consumer Staples", KHC: "Consumer Staples",
  KR: "Consumer Staples", SYY: "Consumer Staples", ADM: "Consumer Staples",
  WBA: "Consumer Staples", EL: "Consumer Staples",
  // Energy
  XOM: "Energy", CVX: "Energy", COP: "Energy", EOG: "Energy", SLB: "Energy",
  MPC: "Energy", PSX: "Energy", VLO: "Energy", PXD: "Energy", OXY: "Energy",
  HES: "Energy", DVN: "Energy", FANG: "Energy", HAL: "Energy", BKR: "Energy",
  KMI: "Energy", WMB: "Energy", OKE: "Energy", TRGP: "Energy",
  // Industrials
  CAT: "Industrials", UNP: "Industrials", HON: "Industrials", UPS: "Industrials",
  RTX: "Industrials", BA: "Industrials", DE: "Industrials", LMT: "Industrials",
  GE: "Industrials", MMM: "Industrials", ADP: "Industrials", ITW: "Industrials",
  EMR: "Industrials", FDX: "Industrials", NSC: "Industrials", CSX: "Industrials",
  GD: "Industrials", NOC: "Industrials", WM: "Industrials", ETN: "Industrials",
  PH: "Industrials", PCAR: "Industrials", CMI: "Industrials", ROK: "Industrials",
  FAST: "Industrials",
  // Materials
  LIN: "Materials", APD: "Materials", SHW: "Materials", ECL: "Materials",
  FCX: "Materials", NEM: "Materials", NUE: "Materials", VMC: "Materials",
  MLM: "Materials", DOW: "Materials", DD: "Materials", PPG: "Materials",
  ALB: "Materials", CF: "Materials", MOS: "Materials", IFF: "Materials",
  CE: "Materials", EMN: "Materials",
  // Real Estate
  AMT: "Real Estate", PLD: "Real Estate", CCI: "Real Estate", EQIX: "Real Estate",
  PSA: "Real Estate", O: "Real Estate", WELL: "Real Estate", DLR: "Real Estate",
  SPG: "Real Estate", VICI: "Real Estate", AVB: "Real Estate", EQR: "Real Estate",
  ARE: "Real Estate", MAA: "Real Estate", UDR: "Real Estate", VTR: "Real Estate",
  HST: "Real Estate", KIM: "Real Estate",
  // Utilities
  NEE: "Utilities", DUK: "Utilities", SO: "Utilities", D: "Utilities",
  AEP: "Utilities", SRE: "Utilities", EXC: "Utilities", XEL: "Utilities",
  PEG: "Utilities", ED: "Utilities", WEC: "Utilities", ES: "Utilities",
  AWK: "Utilities", DTE: "Utilities", ETR: "Utilities", FE: "Utilities",
  PPL: "Utilities", AEE: "Utilities", CMS: "Utilities",
  // Communication Services
  NFLX: "Communication Services", DIS: "Communication Services", CMCSA: "Communication Services",
  VZ: "Communication Services", T: "Communication Services", TMUS: "Communication Services",
  CHTR: "Communication Services", EA: "Communication Services", TTWO: "Communication Services",
  WBD: "Communication Services", PARA: "Communication Services", OMC: "Communication Services",
  IPG: "Communication Services",
};

// Stock name mapping for common symbols
const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft Corporation", GOOGL: "Alphabet Inc.",
  GOOG: "Alphabet Inc.", META: "Meta Platforms Inc.", NVDA: "NVIDIA Corporation",
  AVGO: "Broadcom Inc.", ORCL: "Oracle Corporation", CRM: "Salesforce Inc.",
  ADBE: "Adobe Inc.", AMD: "Advanced Micro Devices", INTC: "Intel Corporation",
  CSCO: "Cisco Systems", IBM: "IBM Corporation", QCOM: "Qualcomm Inc.",
  TXN: "Texas Instruments", NOW: "ServiceNow Inc.", INTU: "Intuit Inc.",
  AMAT: "Applied Materials", MU: "Micron Technology", LRCX: "Lam Research",
  ADI: "Analog Devices", KLAC: "KLA Corporation", SNPS: "Synopsys Inc.",
  CDNS: "Cadence Design", MRVL: "Marvell Technology", FTNT: "Fortinet Inc.",
  PANW: "Palo Alto Networks", CRWD: "CrowdStrike Holdings",
  UNH: "UnitedHealth Group", JNJ: "Johnson & Johnson", LLY: "Eli Lilly",
  PFE: "Pfizer Inc.", ABBV: "AbbVie Inc.", MRK: "Merck & Co.",
  TMO: "Thermo Fisher Scientific", ABT: "Abbott Laboratories", DHR: "Danaher Corporation",
  BMY: "Bristol-Myers Squibb", AMGN: "Amgen Inc.", GILD: "Gilead Sciences",
  VRTX: "Vertex Pharmaceuticals", REGN: "Regeneron Pharmaceuticals", ISRG: "Intuitive Surgical",
  MDT: "Medtronic plc", SYK: "Stryker Corporation", ZTS: "Zoetis Inc.",
  BDX: "Becton Dickinson", CI: "Cigna Group", ELV: "Elevance Health",
  HUM: "Humana Inc.", CVS: "CVS Health", MCK: "McKesson Corporation",
  CAH: "Cardinal Health",
  "BRK-B": "Berkshire Hathaway", JPM: "JPMorgan Chase & Co.", V: "Visa Inc.",
  MA: "Mastercard Inc.", BAC: "Bank of America", WFC: "Wells Fargo",
  GS: "Goldman Sachs", MS: "Morgan Stanley", BLK: "BlackRock Inc.",
  SCHW: "Charles Schwab", AXP: "American Express", C: "Citigroup Inc.",
  PNC: "PNC Financial", USB: "U.S. Bancorp", TFC: "Truist Financial",
  COF: "Capital One", CB: "Chubb Limited", MMC: "Marsh McLennan",
  AON: "Aon plc", ICE: "Intercontinental Exchange", CME: "CME Group",
  SPGI: "S&P Global", MCO: "Moody's Corporation", MSCI: "MSCI Inc.",
  FIS: "Fidelity National",
  AMZN: "Amazon.com Inc.", TSLA: "Tesla Inc.", HD: "Home Depot",
  MCD: "McDonald's Corp.", NKE: "Nike Inc.", LOW: "Lowe's Companies",
  SBUX: "Starbucks Corp.", TJX: "TJX Companies", BKNG: "Booking Holdings",
  MAR: "Marriott International", ORLY: "O'Reilly Automotive", AZO: "AutoZone Inc.",
  CMG: "Chipotle Mexican Grill", DHI: "D.R. Horton", LEN: "Lennar Corporation",
  GM: "General Motors", F: "Ford Motor Company", ROST: "Ross Stores",
  YUM: "Yum! Brands", DG: "Dollar General",
  PG: "Procter & Gamble", KO: "Coca-Cola Company", PEP: "PepsiCo Inc.",
  COST: "Costco Wholesale", WMT: "Walmart Inc.", PM: "Philip Morris",
  MO: "Altria Group", MDLZ: "Mondelez International", CL: "Colgate-Palmolive",
  KMB: "Kimberly-Clark", GIS: "General Mills", K: "Kellogg Company",
  HSY: "Hershey Company", STZ: "Constellation Brands", KHC: "Kraft Heinz",
  KR: "Kroger Co.", SYY: "Sysco Corporation", ADM: "Archer-Daniels-Midland",
  WBA: "Walgreens Boots Alliance", EL: "Estee Lauder",
  XOM: "Exxon Mobil", CVX: "Chevron Corporation", COP: "ConocoPhillips",
  EOG: "EOG Resources", SLB: "Schlumberger", MPC: "Marathon Petroleum",
  PSX: "Phillips 66", VLO: "Valero Energy", PXD: "Pioneer Natural Resources",
  OXY: "Occidental Petroleum", HES: "Hess Corporation", DVN: "Devon Energy",
  FANG: "Diamondback Energy", HAL: "Halliburton", BKR: "Baker Hughes",
  KMI: "Kinder Morgan", WMB: "Williams Companies", OKE: "ONEOK Inc.",
  TRGP: "Targa Resources",
  CAT: "Caterpillar Inc.", UNP: "Union Pacific", HON: "Honeywell International",
  UPS: "United Parcel Service", RTX: "RTX Corporation", BA: "Boeing Company",
  DE: "Deere & Company", LMT: "Lockheed Martin", GE: "General Electric",
  MMM: "3M Company", ADP: "Automatic Data Processing", ITW: "Illinois Tool Works",
  EMR: "Emerson Electric", FDX: "FedEx Corporation", NSC: "Norfolk Southern",
  CSX: "CSX Corporation", GD: "General Dynamics", NOC: "Northrop Grumman",
  WM: "Waste Management", ETN: "Eaton Corporation", PH: "Parker-Hannifin",
  PCAR: "PACCAR Inc.", CMI: "Cummins Inc.", ROK: "Rockwell Automation",
  FAST: "Fastenal Company",
  LIN: "Linde plc", APD: "Air Products", SHW: "Sherwin-Williams",
  ECL: "Ecolab Inc.", FCX: "Freeport-McMoRan", NEM: "Newmont Corporation",
  NUE: "Nucor Corporation", VMC: "Vulcan Materials", MLM: "Martin Marietta",
  DOW: "Dow Inc.", DD: "DuPont de Nemours", PPG: "PPG Industries",
  ALB: "Albemarle Corporation", CF: "CF Industries", MOS: "Mosaic Company",
  IFF: "International Flavors", CE: "Celanese Corporation", EMN: "Eastman Chemical",
  AMT: "American Tower", PLD: "Prologis Inc.", CCI: "Crown Castle",
  EQIX: "Equinix Inc.", PSA: "Public Storage", O: "Realty Income",
  WELL: "Welltower Inc.", DLR: "Digital Realty", SPG: "Simon Property Group",
  VICI: "VICI Properties", AVB: "AvalonBay Communities", EQR: "Equity Residential",
  ARE: "Alexandria Real Estate", MAA: "Mid-America Apartment", UDR: "UDR Inc.",
  VTR: "Ventas Inc.", HST: "Host Hotels & Resorts", KIM: "Kimco Realty",
  NEE: "NextEra Energy", DUK: "Duke Energy", SO: "Southern Company",
  D: "Dominion Energy", AEP: "American Electric Power", SRE: "Sempra Energy",
  EXC: "Exelon Corporation", XEL: "Xcel Energy", PEG: "Public Service Enterprise",
  ED: "Consolidated Edison", WEC: "WEC Energy Group", ES: "Eversource Energy",
  AWK: "American Water Works", DTE: "DTE Energy", ETR: "Entergy Corporation",
  FE: "FirstEnergy Corp.", PPL: "PPL Corporation", AEE: "Ameren Corporation",
  CMS: "CMS Energy",
  NFLX: "Netflix Inc.", DIS: "Walt Disney Company", CMCSA: "Comcast Corporation",
  VZ: "Verizon Communications", T: "AT&T Inc.", TMUS: "T-Mobile US",
  CHTR: "Charter Communications", EA: "Electronic Arts", TTWO: "Take-Two Interactive",
  WBD: "Warner Bros. Discovery", PARA: "Paramount Global", OMC: "Omnicom Group",
  IPG: "Interpublic Group",
};

// Generate deterministic mock data for any symbol
function generateMockStock(symbol: string): Stock {
  const sector = SYMBOL_SECTORS[symbol] || "Technology";
  const name = STOCK_NAMES[symbol] || `${symbol} Corp.`;

  // Use symbol hash for deterministic random values
  const hash = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const basePrice = 50 + seededRandom(hash) * 400;
  const changePercent = (seededRandom(hash + 1) - 0.5) * 6;
  const change = basePrice * (changePercent / 100);
  const week52High = basePrice * (1 + seededRandom(hash + 2) * 0.3);
  const week52Low = basePrice * (1 - seededRandom(hash + 3) * 0.3);

  return {
    symbol,
    name,
    sector,
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    marketCap: Math.round(basePrice * 1000000000 * (1 + seededRandom(hash + 4) * 5)),
    peRatio: Math.round((10 + seededRandom(hash + 5) * 40) * 10) / 10,
    pbRatio: Math.round((1 + seededRandom(hash + 6) * 10) * 10) / 10,
    pegRatio: Math.round((0.5 + seededRandom(hash + 7) * 3) * 10) / 10,
    psRatio: Math.round((0.5 + seededRandom(hash + 12) * 8) * 10) / 10,
    revenueGrowth: seededRandom(hash + 13) > 0.2 ? Math.round((seededRandom(hash + 14) - 0.2) * 0.5 * 100) / 100 : null,
    week52High: Math.round(week52High * 100) / 100,
    week52Low: Math.round(week52Low * 100) / 100,
    dividendYield: seededRandom(hash + 8) > 0.3 ? Math.round(seededRandom(hash + 9) * 5 * 100) / 100 : null,
    volume: Math.round(seededRandom(hash + 10) * 50000000),
    avgVolume: Math.round(seededRandom(hash + 11) * 50000000),
  };
}

// Get mock data for a symbol - uses predefined data if available, otherwise generates it
function getMockStock(symbol: string): Stock {
  const upperSymbol = symbol.toUpperCase();
  if (MOCK_STOCKS[upperSymbol]) {
    return MOCK_STOCKS[upperSymbol];
  }
  if (SYMBOL_SECTORS[upperSymbol]) {
    return generateMockStock(upperSymbol);
  }
  return generateMockStock(upperSymbol);
}

const MOCK_STOCKS: Record<string, Stock> = {
  AAPL: {
    symbol: "AAPL", name: "Apple Inc.", sector: "Technology",
    price: 229.87, change: 1.23, changePercent: 0.54, marketCap: 3520000000000,
    peRatio: 37.2, pbRatio: 51.3, pegRatio: 2.1, psRatio: 8.5, revenueGrowth: 0.05,
    week52High: 260.1, week52Low: 164.08,
    dividendYield: 0.44, volume: 48200000, avgVolume: 52300000,
  },
  MSFT: {
    symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology",
    price: 415.50, change: -2.15, changePercent: -0.51, marketCap: 3090000000000,
    peRatio: 35.8, pbRatio: 12.1, pegRatio: 2.3, psRatio: 12.5, revenueGrowth: 0.16,
    week52High: 468.35, week52Low: 366.5,
    dividendYield: 0.72, volume: 18500000, avgVolume: 20100000,
  },
  GOOGL: {
    symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology",
    price: 191.24, change: 0.89, changePercent: 0.47, marketCap: 2350000000000,
    peRatio: 24.1, pbRatio: 7.2, pegRatio: 1.2, psRatio: 6.8, revenueGrowth: 0.14,
    week52High: 201.42, week52Low: 150.22,
    dividendYield: null, volume: 22100000, avgVolume: 24500000,
  },
  AMZN: {
    symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary",
    price: 225.94, change: 3.42, changePercent: 1.54, marketCap: 2380000000000,
    peRatio: 45.2, pbRatio: 8.9, pegRatio: 1.8, psRatio: 3.5, revenueGrowth: 0.12,
    week52High: 242.52, week52Low: 166.21,
    dividendYield: null, volume: 35200000, avgVolume: 38100000,
  },
  NVDA: {
    symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology",
    price: 134.70, change: 4.21, changePercent: 3.23, marketCap: 3310000000000,
    peRatio: 65.3, pbRatio: 52.1, pegRatio: 1.1, psRatio: 35.0, revenueGrowth: 1.22,
    week52High: 153.13, week52Low: 75.61,
    dividendYield: 0.03, volume: 312000000, avgVolume: 285000000,
  },
  TSLA: {
    symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary",
    price: 394.36, change: -8.52, changePercent: -2.12, marketCap: 1260000000000,
    peRatio: 112.5, pbRatio: 16.8, pegRatio: 3.2, psRatio: 12.5, revenueGrowth: 0.19,
    week52High: 488.54, week52Low: 138.8,
    dividendYield: null, volume: 95200000, avgVolume: 88500000,
  },
  JPM: {
    symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials",
    price: 195.50, change: 2.35, changePercent: 1.22, marketCap: 565000000000,
    peRatio: 10.2, pbRatio: 1.5, pegRatio: 0.8, psRatio: 3.2, revenueGrowth: 0.08,
    week52High: 220.0, week52Low: 180.0,
    dividendYield: 2.3, volume: 8500000, avgVolume: 9200000,
  },
  BAC: {
    symbol: "BAC", name: "Bank of America Corp.", sector: "Financials",
    price: 38.20, change: 0.45, changePercent: 1.19, marketCap: 302000000000,
    peRatio: 9.8, pbRatio: 0.95, pegRatio: 0.7, psRatio: 2.8, revenueGrowth: 0.05,
    week52High: 46.0, week52Low: 32.0,
    dividendYield: 2.6, volume: 35000000, avgVolume: 38000000,
  },
  XOM: {
    symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy",
    price: 105.80, change: 1.12, changePercent: 1.07, marketCap: 420000000000,
    peRatio: 8.5, pbRatio: 1.6, pegRatio: 0.6, psRatio: 1.1, revenueGrowth: -0.05,
    week52High: 125.0, week52Low: 95.0,
    dividendYield: 3.5, volume: 12000000, avgVolume: 14000000,
  },
  CVX: {
    symbol: "CVX", name: "Chevron Corporation", sector: "Energy",
    price: 148.30, change: 0.85, changePercent: 0.58, marketCap: 275000000000,
    peRatio: 9.2, pbRatio: 1.4, pegRatio: 0.5, psRatio: 1.3, revenueGrowth: -0.03,
    week52High: 175.0, week52Low: 140.0,
    dividendYield: 4.1, volume: 6500000, avgVolume: 7200000,
  },
  PFE: {
    symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare",
    price: 28.50, change: 0.32, changePercent: 1.14, marketCap: 160000000000,
    peRatio: 11.5, pbRatio: 1.8, pegRatio: 0.9, psRatio: 2.8, revenueGrowth: -0.15,
    week52High: 35.0, week52Low: 25.0,
    dividendYield: 5.8, volume: 28000000, avgVolume: 32000000,
  },
  VZ: {
    symbol: "VZ", name: "Verizon Communications", sector: "Communication Services",
    price: 42.80, change: 0.28, changePercent: 0.66, marketCap: 180000000000,
    peRatio: 9.5, pbRatio: 1.6, pegRatio: 0.8, psRatio: 1.3, revenueGrowth: 0.02,
    week52High: 48.0, week52Low: 38.0,
    dividendYield: 6.2, volume: 15000000, avgVolume: 18000000,
  },
  INTC: {
    symbol: "INTC", name: "Intel Corporation", sector: "Technology",
    price: 22.40, change: -0.35, changePercent: -1.54, marketCap: 95000000000,
    peRatio: 12.5, pbRatio: 1.2, pegRatio: 0.4, psRatio: 1.8, revenueGrowth: -0.08,
    week52High: 50.0, week52Low: 18.0,
    dividendYield: 1.4, volume: 45000000, avgVolume: 52000000,
  },
  F: {
    symbol: "F", name: "Ford Motor Company", sector: "Consumer Discretionary",
    price: 10.85, change: 0.15, changePercent: 1.40, marketCap: 43000000000,
    peRatio: 6.8, pbRatio: 1.1, pegRatio: 0.5, psRatio: 0.25, revenueGrowth: 0.06,
    week52High: 14.0, week52Low: 9.5,
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
    case "1d":
      return new Date(now.setDate(now.getDate() - 1));
    case "1w":
      return new Date(now.setDate(now.getDate() - 7));
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

export async function getEarningsData(symbol: string): Promise<EarningsData | null> {
  if (USE_MOCK_DATA_ONLY) return null;

  const fetchEarnings = async (): Promise<EarningsData | null> => {
    const yf = await getYahooFinance();
    const summary = await yf.quoteSummary(symbol, {
      modules: ["earningsTrend", "earningsHistory", "calendarEvents"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Record<string, any>;

    if (!summary) return null;

    // Extract earnings date from calendarEvents
    const earningsDate = summary.calendarEvents?.earnings?.earningsDate?.[0]
      ? new Date(summary.calendarEvents.earnings.earningsDate[0]).toISOString().split("T")[0]
      : null;

    // Extract earnings history
    const history = summary.earningsHistory?.history || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const earningsHistory = history.slice(0, 4).map((q: any) => ({
      quarter: q.quarter ? `Q${q.quarter}` : "N/A",
      date: q.period || "N/A",
      epsEstimate: q.epsEstimate?.raw ?? null,
      epsActual: q.epsActual?.raw ?? null,
      epsSurprise: q.epsDifference?.raw ?? null,
      epsSurprisePercent: q.surprisePercent?.raw ? q.surprisePercent.raw * 100 : null,
    }));

    // Extract EPS from earningsTrend
    const currentTrend = summary.earningsTrend?.trend?.[0];
    const epsTrailing = currentTrend?.earningsEstimate?.avg?.raw ?? null;
    const forwardTrend = summary.earningsTrend?.trend?.[1];
    const epsForward = forwardTrend?.earningsEstimate?.avg?.raw ?? null;

    return { earningsDate, earningsHistory, epsTrailing, epsForward };
  };

  return withTimeout(fetchEarnings, null);
}

export async function getAnalystRatings(symbol: string): Promise<AnalystRatings | null> {
  if (USE_MOCK_DATA_ONLY) return null;

  const fetchRatings = async (): Promise<AnalystRatings | null> => {
    const yf = await getYahooFinance();
    const summary = await yf.quoteSummary(symbol, {
      modules: ["financialData"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Record<string, any>;

    const fd = summary?.financialData;
    if (!fd) return null;

    return {
      targetMean: fd.targetMeanPrice?.raw ?? null,
      targetMedian: fd.targetMedianPrice?.raw ?? null,
      targetHigh: fd.targetHighPrice?.raw ?? null,
      targetLow: fd.targetLowPrice?.raw ?? null,
      numberOfAnalysts: fd.numberOfAnalystOpinions?.raw ?? 0,
      recommendation: fd.recommendationKey || "none",
      recommendationScore: fd.recommendationMean?.raw ?? null,
    };
  };

  return withTimeout(fetchRatings, null);
}

export async function getFinancialStatements(symbol: string): Promise<FinancialStatements | null> {
  if (USE_MOCK_DATA_ONLY) return null;

  const fetchFinancials = async (): Promise<FinancialStatements | null> => {
    const yf = await getYahooFinance();
    const summary = await yf.quoteSummary(symbol, {
      modules: ["incomeStatementHistory", "cashflowStatementHistory", "financialData"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Record<string, any>;

    if (!summary) return null;

    const incomeHistory = summary.incomeStatementHistory?.incomeStatementHistory || [];
    const cashflowHistory = summary.cashflowStatementHistory?.cashflowStatements || [];
    const fd = summary.financialData || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annualRevenue = incomeHistory.map((stmt: any) => ({
      date: stmt.endDate ? new Date(stmt.endDate).toISOString().split("T")[0] : "N/A",
      value: stmt.totalRevenue?.raw ?? 0,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annualNetIncome = incomeHistory.map((stmt: any) => ({
      date: stmt.endDate ? new Date(stmt.endDate).toISOString().split("T")[0] : "N/A",
      value: stmt.netIncome?.raw ?? 0,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annualFreeCashFlow = cashflowHistory.map((stmt: any) => ({
      date: stmt.endDate ? new Date(stmt.endDate).toISOString().split("T")[0] : "N/A",
      value: (stmt.totalCashFromOperatingActivities?.raw ?? 0) - (stmt.capitalExpenditures?.raw ?? 0),
    }));

    return {
      annualRevenue,
      annualNetIncome,
      annualFreeCashFlow,
      profitMargin: fd.profitMargins?.raw ?? null,
      operatingMargin: fd.operatingMargins?.raw ?? null,
      returnOnEquity: fd.returnOnEquity?.raw ?? null,
      debtToEquity: fd.debtToEquity?.raw ?? null,
      currentRatio: fd.currentRatio?.raw ?? null,
    };
  };

  return withTimeout(fetchFinancials, null);
}

export async function getOHLCVHistory(
  symbol: string,
  period: string = "1y"
): Promise<OHLCVDataPoint[]> {
  if (USE_MOCK_DATA_ONLY) return [];

  const fetchOHLCV = async (): Promise<OHLCVDataPoint[]> => {
    const yf = await getYahooFinance();

    // Determine appropriate interval based on period
    let interval: string = "1d";
    if (period === "1d") interval = "5m";
    else if (period === "1w") interval = "15m";

    const result = await yf.historical(symbol, {
      period1: getStartDate(period),
      period2: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: interval as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Array<Record<string, any>>;

    return result.map((item) => ({
      date: item.date instanceof Date
        ? item.date.toISOString()
        : new Date(item.date).toISOString(),
      open: item.open ?? item.close ?? 0,
      high: item.high ?? item.close ?? 0,
      low: item.low ?? item.close ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
    }));
  };

  return withTimeout(fetchOHLCV, []);
}
