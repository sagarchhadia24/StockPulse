// Top stocks from S&P 500, NASDAQ, and Dow Jones
// This list is updated periodically and includes major companies from all sectors

export const STOCK_SYMBOLS = [
  // Technology
  "AAPL", "MSFT", "GOOGL", "GOOG", "META", "NVDA", "AVGO", "ORCL", "CRM", "ADBE",
  "AMD", "INTC", "CSCO", "IBM", "QCOM", "TXN", "NOW", "INTU", "AMAT", "MU",
  "LRCX", "ADI", "KLAC", "SNPS", "CDNS", "MRVL", "FTNT", "PANW", "CRWD",

  // Healthcare
  "UNH", "JNJ", "LLY", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY",
  "AMGN", "GILD", "VRTX", "REGN", "ISRG", "MDT", "SYK", "ZTS", "BDX", "CI",
  "ELV", "HUM", "CVS", "MCK", "CAH",

  // Financials
  "BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SCHW",
  "AXP", "C", "PNC", "USB", "TFC", "COF", "CB", "MMC", "AON", "ICE",
  "CME", "SPGI", "MCO", "MSCI", "FIS",

  // Consumer Discretionary
  "AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "MAR",
  "ORLY", "AZO", "CMG", "DHI", "LEN", "GM", "F", "ROST", "YUM", "DG",

  // Consumer Staples
  "PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ", "CL", "KMB",
  "GIS", "K", "HSY", "STZ", "KHC", "KR", "SYY", "ADM", "WBA", "EL",

  // Energy
  "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "PXD", "OXY",
  "HES", "DVN", "FANG", "HAL", "BKR", "KMI", "WMB", "OKE", "TRGP",

  // Industrials
  "CAT", "UNP", "HON", "UPS", "RTX", "BA", "DE", "LMT", "GE", "MMM",
  "ADP", "ITW", "EMR", "FDX", "NSC", "CSX", "GD", "NOC", "WM", "ETN",
  "PH", "PCAR", "CMI", "ROK", "FAST",

  // Materials
  "LIN", "APD", "SHW", "ECL", "FCX", "NEM", "NUE", "VMC", "MLM", "DOW",
  "DD", "PPG", "ALB", "CF", "MOS", "IFF", "CE", "EMN",

  // Real Estate
  "AMT", "PLD", "CCI", "EQIX", "PSA", "O", "WELL", "DLR", "SPG", "VICI",
  "AVB", "EQR", "ARE", "MAA", "UDR", "VTR", "HST", "KIM",

  // Utilities
  "NEE", "DUK", "SO", "D", "AEP", "SRE", "EXC", "XEL", "PEG", "ED",
  "WEC", "ES", "AWK", "DTE", "ETR", "FE", "PPL", "AEE", "CMS",

  // Communication Services
  "GOOG", "GOOGL", "META", "NFLX", "DIS", "CMCSA", "VZ", "T", "TMUS", "CHTR",
  "EA", "TTWO", "WBD", "PARA", "OMC", "IPG",
];

// Unique symbols (remove duplicates)
export const UNIQUE_SYMBOLS = [...new Set(STOCK_SYMBOLS)];

export const SYMBOL_COUNT = UNIQUE_SYMBOLS.length;
