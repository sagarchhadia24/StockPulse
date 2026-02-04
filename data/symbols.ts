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

// Diverse sample with stocks from every sector (for pages that need limited data)
export const DIVERSE_SYMBOLS = [
  // Technology (5)
  "AAPL", "MSFT", "NVDA", "GOOGL", "CRM",
  // Healthcare (5)
  "UNH", "JNJ", "PFE", "ABBV", "CI",
  // Financials (5)
  "JPM", "V", "MA", "BAC", "GS",
  // Consumer Discretionary (5)
  "AMZN", "TSLA", "HD", "MCD", "NKE",
  // Consumer Staples (5)
  "PG", "KO", "PEP", "COST", "WMT",
  // Energy (5)
  "XOM", "CVX", "COP", "SLB", "OXY",
  // Industrials (5)
  "CAT", "UNP", "HON", "BA", "GE",
  // Materials (4)
  "LIN", "APD", "SHW", "FCX",
  // Real Estate (4)
  "AMT", "PLD", "EQIX", "O",
  // Utilities (4)
  "NEE", "DUK", "SO", "AEP",
  // Communication Services (4)
  "NFLX", "DIS", "VZ", "T",
];
