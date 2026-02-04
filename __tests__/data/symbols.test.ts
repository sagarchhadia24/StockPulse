import {
  SP500_SYMBOLS,
  NASDAQ100_SYMBOLS,
  DOW30_SYMBOLS,
  ALL_SYMBOLS,
  UNIQUE_SYMBOLS,
  STOCK_SYMBOLS,
  DIVERSE_SYMBOLS,
  SYMBOL_COUNT,
} from "@/data/symbols";

describe("Symbol Data", () => {
  describe("Index Arrays", () => {
    it("should have approximately 500 S&P 500 symbols", () => {
      expect(SP500_SYMBOLS.length).toBeGreaterThanOrEqual(400);
      expect(SP500_SYMBOLS.length).toBeLessThanOrEqual(550);
    });

    it("should have approximately 100 NASDAQ-100 symbols", () => {
      expect(NASDAQ100_SYMBOLS.length).toBeGreaterThanOrEqual(95);
      expect(NASDAQ100_SYMBOLS.length).toBeLessThanOrEqual(110);
    });

    it("should have exactly 30 Dow Jones symbols", () => {
      expect(DOW30_SYMBOLS.length).toBe(30);
    });

    it("should have all symbols be non-empty strings", () => {
      const allSymbols = [...SP500_SYMBOLS, ...NASDAQ100_SYMBOLS, ...DOW30_SYMBOLS];
      allSymbols.forEach((symbol) => {
        expect(typeof symbol).toBe("string");
        expect(symbol.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Combined Arrays", () => {
    it("should have ALL_SYMBOLS with 400-600 unique symbols", () => {
      expect(ALL_SYMBOLS.length).toBeGreaterThanOrEqual(400);
      expect(ALL_SYMBOLS.length).toBeLessThanOrEqual(600);
    });

    it("should have no duplicates in ALL_SYMBOLS", () => {
      const uniqueSet = new Set(ALL_SYMBOLS);
      expect(uniqueSet.size).toBe(ALL_SYMBOLS.length);
    });

    it("should have UNIQUE_SYMBOLS equal to ALL_SYMBOLS", () => {
      expect(UNIQUE_SYMBOLS).toEqual(ALL_SYMBOLS);
    });

    it("should have STOCK_SYMBOLS equal to ALL_SYMBOLS for backwards compatibility", () => {
      expect(STOCK_SYMBOLS).toEqual(ALL_SYMBOLS);
    });

    it("should have SYMBOL_COUNT match ALL_SYMBOLS length", () => {
      expect(SYMBOL_COUNT).toBe(ALL_SYMBOLS.length);
    });
  });

  describe("DIVERSE_SYMBOLS", () => {
    it("should have 80-100 diverse symbols", () => {
      expect(DIVERSE_SYMBOLS.length).toBeGreaterThanOrEqual(80);
      expect(DIVERSE_SYMBOLS.length).toBeLessThanOrEqual(100);
    });

    it("should include stocks from all major sectors", () => {
      expect(DIVERSE_SYMBOLS).toContain("AAPL"); // Technology
      expect(DIVERSE_SYMBOLS).toContain("UNH"); // Healthcare
      expect(DIVERSE_SYMBOLS).toContain("JPM"); // Financials
      expect(DIVERSE_SYMBOLS).toContain("AMZN"); // Consumer Discretionary
      expect(DIVERSE_SYMBOLS).toContain("PG"); // Consumer Staples
      expect(DIVERSE_SYMBOLS).toContain("XOM"); // Energy
      expect(DIVERSE_SYMBOLS).toContain("CAT"); // Industrials
      expect(DIVERSE_SYMBOLS).toContain("LIN"); // Materials
      expect(DIVERSE_SYMBOLS).toContain("AMT"); // Real Estate
      expect(DIVERSE_SYMBOLS).toContain("NEE"); // Utilities
      expect(DIVERSE_SYMBOLS).toContain("NFLX"); // Communication Services
    });

    it("should have no duplicates", () => {
      const uniqueSet = new Set(DIVERSE_SYMBOLS);
      expect(uniqueSet.size).toBe(DIVERSE_SYMBOLS.length);
    });

    it("should be a subset of ALL_SYMBOLS", () => {
      const allSymbolsSet = new Set(ALL_SYMBOLS);
      DIVERSE_SYMBOLS.forEach((symbol) => {
        expect(allSymbolsSet.has(symbol)).toBe(true);
      });
    });
  });

  describe("Index Membership", () => {
    it("should include all Dow 30 stocks in S&P 500", () => {
      const sp500Set = new Set(SP500_SYMBOLS);
      DOW30_SYMBOLS.forEach((symbol) => {
        expect(sp500Set.has(symbol)).toBe(true);
      });
    });

    it("should include known major stocks", () => {
      const allSymbolsSet = new Set(ALL_SYMBOLS);
      const majorStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"];
      majorStocks.forEach((symbol) => {
        expect(allSymbolsSet.has(symbol)).toBe(true);
      });
    });
  });
});
