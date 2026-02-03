// S&P 500 symbols (partial list of ~100 high-volume stocks for performance)
export const SP500_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH", "JNJ",
  "V", "XOM", "JPM", "PG", "MA", "HD", "CVX", "MRK", "ABBV", "LLY",
  "PEP", "KO", "COST", "AVGO", "WMT", "MCD", "CSCO", "TMO", "ABT", "CRM",
  "ACN", "ADBE", "DHR", "NKE", "CMCSA", "VZ", "INTC", "NEE", "PM", "TXN",
  "WFC", "BMY", "UNP", "QCOM", "UPS", "RTX", "HON", "ORCL", "LOW", "SPGI",
  "AMD", "GS", "CAT", "BA", "SBUX", "DE", "ISRG", "ELV", "GE", "BKNG",
  "MDLZ", "AXP", "LMT", "ADI", "GILD", "SYK", "AMGN", "TJX", "CVS", "C",
  "BLK", "PLD", "CB", "MO", "ZTS", "REGN", "DUK", "SO", "CL", "SLB",
  "VRTX", "EOG", "CME", "NOC", "ITW", "FDX", "EMR", "PNC", "USB", "APD",
  "COP", "MMM", "F", "GM", "PYPL", "NFLX", "DIS", "T", "TMUS", "CHTR",
];

// NASDAQ 100 symbols
export const NASDAQ100_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "AVGO", "COST",
  "ASML", "PEP", "CSCO", "ADBE", "AZN", "NFLX", "AMD", "TMUS", "INTC", "TXN",
  "CMCSA", "INTU", "QCOM", "AMGN", "HON", "AMAT", "ISRG", "BKNG", "SBUX", "VRTX",
  "GILD", "ADI", "MDLZ", "ADP", "REGN", "LRCX", "MU", "PANW", "PYPL", "KLAC",
  "SNPS", "CDNS", "MELI", "CSX", "ORLY", "MAR", "CTAS", "MNST", "NXPI", "MRVL",
  "PCAR", "ADSK", "WDAY", "ROST", "KDP", "AEP", "FTNT", "DXCM", "CPRT", "PAYX",
  "KHC", "CHTR", "MCHP", "EXC", "ABNB", "ODFL", "CEG", "VRSK", "IDXX", "FAST",
  "CTSH", "EA", "XEL", "CSGP", "GEHC", "BIIB", "ON", "DDOG", "ANSS", "ZS",
  "FANG", "DLTR", "WBD", "BKR", "TTD", "ILMN", "ALGN", "TEAM", "WBA", "CRWD",
  "MRNA", "LCID", "SIRI", "JD", "PDD", "RIVN", "ZM", "OKTA", "SPLK", "ENPH",
];

// Dow 30 symbols
export const DOW30_SYMBOLS = [
  "AAPL", "AMGN", "AXP", "BA", "CAT", "CRM", "CSCO", "CVX", "DIS", "DOW",
  "GS", "HD", "HON", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD", "MMM",
  "MRK", "MSFT", "NKE", "PG", "TRV", "UNH", "V", "VZ", "WBA", "WMT",
];

export type IndexType = "sp500" | "nasdaq100" | "dow30";

export const INDEX_CONFIG: Record<IndexType, { name: string; symbols: string[] }> = {
  sp500: { name: "S&P 500", symbols: SP500_SYMBOLS },
  nasdaq100: { name: "NASDAQ 100", symbols: NASDAQ100_SYMBOLS },
  dow30: { name: "Dow 30", symbols: DOW30_SYMBOLS },
};
