// S&P 500 constituents (as of January 2025)
export const SP500_SYMBOLS: string[] = [
  // Communication Services
  "GOOGL", "GOOG", "META", "NFLX", "DIS", "CMCSA", "VZ", "T", "TMUS", "CHTR",
  "EA", "TTWO", "WBD", "PARA", "OMC", "IPG", "LYV", "MTCH", "FOXA", "FOX", "NWS", "NWSA",

  // Consumer Discretionary
  "AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "MAR",
  "ORLY", "AZO", "CMG", "DHI", "LEN", "GM", "F", "ROST", "YUM", "DG",
  "EBAY", "ETSY", "POOL", "PHM", "NVR", "GPC", "BBY", "ULTA", "DRI", "WYNN",
  "MGM", "CZR", "HLT", "EXPE", "CCL", "RCL", "NCLH", "LVS", "APTV", "BWA",
  "GRMN", "RL", "HAS", "TPR", "VFC", "PVH", "DECK",

  // Consumer Staples
  "PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ", "CL", "KMB",
  "GIS", "K", "HSY", "STZ", "KHC", "KR", "SYY", "ADM", "WBA", "EL",
  "TSN", "HRL", "CAG", "CPB", "SJM", "MKC", "CLX", "CHD", "BG", "TAP", "LW",

  // Energy
  "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "VLO", "PXD", "OXY",
  "HES", "DVN", "FANG", "HAL", "BKR", "KMI", "WMB", "OKE", "TRGP", "CTRA",
  "MRO", "APA", "EQT", "ENPH",

  // Financials
  "BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SCHW",
  "AXP", "C", "PNC", "USB", "TFC", "COF", "CB", "MMC", "AON", "ICE",
  "CME", "SPGI", "MCO", "MSCI", "FIS", "AIG", "MET", "PRU", "AFL", "TRV",
  "ALL", "PGR", "HIG", "CINF", "L", "AJG", "WRB", "GL", "BRO", "RJF",
  "FITB", "RF", "HBAN", "KEY", "CFG", "MTB", "NTRS", "STT", "NDAQ", "CBOE",
  "DFS", "SYF", "ALLY", "RE", "FRC", "SIVB",

  // Healthcare
  "UNH", "JNJ", "LLY", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY",
  "AMGN", "GILD", "VRTX", "REGN", "ISRG", "MDT", "SYK", "ZTS", "BDX", "CI",
  "ELV", "HUM", "CVS", "MCK", "CAH", "BSX", "EW", "DXCM", "IDXX", "IQV",
  "A", "MTD", "WAT", "HOLX", "TECH", "TFX", "BAX", "ALGN", "BIIB", "MRNA",
  "MOH", "CNC", "DGX", "LH", "VTRS", "OGN", "CTLT", "HSIC", "XRAY",

  // Industrials
  "CAT", "UNP", "HON", "UPS", "RTX", "BA", "DE", "LMT", "GE", "MMM",
  "ADP", "ITW", "EMR", "FDX", "NSC", "CSX", "GD", "NOC", "WM", "ETN",
  "PH", "PCAR", "CMI", "ROK", "FAST", "CTAS", "CPRT", "ODFL", "CARR", "OTIS",
  "AME", "IR", "TDG", "SWK", "DOV", "VRSK", "ROP", "GWW", "XYL", "LDOS",
  "J", "IEX", "TXT", "HWM", "PWR", "MAS", "NDSN", "WAB", "EXPD", "CHRW",
  "LUV", "DAL", "UAL", "AAL", "ALK", "JBHT", "PAYC", "PAYX", "GNRC",

  // Information Technology
  "AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CRM", "ADBE", "AMD", "INTC", "CSCO",
  "IBM", "QCOM", "TXN", "NOW", "INTU", "AMAT", "MU", "LRCX", "ADI", "KLAC",
  "SNPS", "CDNS", "MRVL", "FTNT", "PANW", "CRWD", "APH", "TEL", "ANSS", "KEYS",
  "MPWR", "FSLR", "ON", "SWKS", "QRVO", "MCHP", "NXPI", "ZBRA", "AKAM",
  "VRSN", "CDW", "EPAM", "CTSH", "IT", "ACN", "HPQ", "HPE", "DELL", "WDC",
  "STX", "NTAP", "JNPR", "GLW", "FFIV", "TRMB", "TYL", "PTC",

  // Materials
  "LIN", "APD", "SHW", "ECL", "FCX", "NEM", "NUE", "VMC", "MLM", "DOW",
  "DD", "PPG", "ALB", "CF", "MOS", "IFF", "CE", "EMN", "FMC", "BALL",
  "PKG", "SEE", "IP", "AVY", "AMCR", "WRK",

  // Real Estate
  "AMT", "PLD", "CCI", "EQIX", "PSA", "O", "WELL", "DLR", "SPG", "VICI",
  "AVB", "EQR", "ARE", "MAA", "UDR", "VTR", "HST", "KIM", "REG", "ESS",
  "CPT", "EXR", "PEAK", "SBAC", "IRM", "WY", "BXP", "SLG", "FRT", "CBRE",

  // Utilities
  "NEE", "DUK", "SO", "D", "AEP", "SRE", "EXC", "XEL", "PEG", "ED",
  "WEC", "ES", "AWK", "DTE", "ETR", "FE", "PPL", "AEE", "CMS", "CNP",
  "EVRG", "ATO", "NI", "LNT", "PNW", "NRG",
];

// NASDAQ-100 constituents (as of January 2025)
export const NASDAQ100_SYMBOLS: string[] = [
  "AAPL", "ABNB", "ADBE", "ADI", "ADP", "ADSK", "AEP", "AMAT", "AMD", "AMGN",
  "AMZN", "ANSS", "ARM", "ASML", "AVGO", "AZN", "BIIB", "BKNG", "BKR", "CCEP",
  "CDNS", "CDW", "CEG", "CHTR", "CMCSA", "COST", "CPRT", "CRWD", "CSCO", "CSGP",
  "CSX", "CTAS", "CTSH", "DASH", "DDOG", "DLTR", "DXCM", "EA", "EXC", "FANG",
  "FAST", "FTNT", "GEHC", "GFS", "GILD", "GOOG", "GOOGL", "HON", "IDXX", "ILMN",
  "INTC", "INTU", "ISRG", "KDP", "KHC", "KLAC", "LIN", "LRCX", "LULU", "MAR",
  "MCHP", "MDB", "MDLZ", "MELI", "META", "MNST", "MRNA", "MRVL", "MSFT", "MU",
  "NFLX", "NVDA", "NXPI", "ODFL", "ON", "ORLY", "PANW", "PAYX", "PCAR", "PDD",
  "PEP", "PYPL", "QCOM", "REGN", "ROP", "ROST", "SBUX", "SMCI", "SNPS", "SPLK",
  "TEAM", "TMUS", "TSLA", "TTD", "TTWO", "TXN", "VRSK", "VRTX", "WBA", "WBD", "WDAY", "XEL", "ZS",
];

// Dow Jones Industrial Average (30 stocks)
export const DOW30_SYMBOLS: string[] = [
  "AAPL", "AMGN", "AMZN", "AXP", "BA", "CAT", "CRM", "CSCO", "CVX", "DIS",
  "DOW", "GS", "HD", "HON", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD",
  "MMM", "MRK", "MSFT", "NKE", "PG", "TRV", "UNH", "V", "VZ", "WMT",
];

// Combined unique list from all indices (de-duplicated)
export const ALL_SYMBOLS: string[] = [
  ...new Set([...SP500_SYMBOLS, ...NASDAQ100_SYMBOLS, ...DOW30_SYMBOLS]),
];

// Backwards compatibility - point to ALL_SYMBOLS
export const STOCK_SYMBOLS = ALL_SYMBOLS;
export const UNIQUE_SYMBOLS = ALL_SYMBOLS;

export const SYMBOL_COUNT = ALL_SYMBOLS.length;

// Expanded diverse sample with stocks from every sector (for pages that need limited data)
export const DIVERSE_SYMBOLS: string[] = [
  // Technology (10)
  "AAPL", "MSFT", "NVDA", "GOOGL", "CRM", "ADBE", "AMD", "INTC", "CSCO", "ORCL",
  // Healthcare (10)
  "UNH", "JNJ", "PFE", "ABBV", "CI", "LLY", "MRK", "TMO", "ABT", "DHR",
  // Financials (10)
  "JPM", "V", "MA", "BAC", "GS", "WFC", "MS", "BLK", "AXP", "C",
  // Consumer Discretionary (10)
  "AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "MAR",
  // Consumer Staples (8)
  "PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ",
  // Energy (8)
  "XOM", "CVX", "COP", "SLB", "OXY", "EOG", "MPC", "PSX",
  // Industrials (8)
  "CAT", "UNP", "HON", "BA", "GE", "UPS", "RTX", "LMT",
  // Materials (6)
  "LIN", "APD", "SHW", "FCX", "NEM", "NUE",
  // Real Estate (6)
  "AMT", "PLD", "EQIX", "O", "CCI", "PSA",
  // Utilities (6)
  "NEE", "DUK", "SO", "AEP", "D", "SRE",
  // Communication Services (6)
  "NFLX", "DIS", "VZ", "T", "CMCSA", "TMUS",
];
