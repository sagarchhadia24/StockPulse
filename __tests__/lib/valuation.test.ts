import {
  calculateValueScore,
  classifyStock,
  getScoreColor,
  getScoreBadgeVariant,
  classifyStockType,
  getStockTypeLabel,
  getStockTypeColor,
  getWeightProfile,
} from "@/lib/valuation";
import { Stock, StockType } from "@/types";

// Helper function to create a base stock with default values
function createMockStock(overrides: Partial<Stock> = {}): Stock {
  return {
    symbol: "TEST",
    name: "Test Company",
    sector: "Technology",
    price: 150,
    change: 2.5,
    changePercent: 1.7,
    marketCap: 2500000000000,
    peRatio: 25,
    pbRatio: 6,
    pegRatio: 1.2,
    psRatio: 5.0,
    revenueGrowth: 0.10,
    week52High: 200,
    week52Low: 100,
    dividendYield: 0.5,
    volume: 50000000,
    avgVolume: 45000000,
    ...overrides,
  };
}

describe("classifyStockType", () => {
  describe("value stock classification", () => {
    it("should classify a typical value stock as value", () => {
      const stock = createMockStock({
        peRatio: 15,
        revenueGrowth: 0.05,
        dividendYield: 1.5,
        pegRatio: 2.5, // High PEG, not GARP
      });
      expect(classifyStockType(stock)).toBe("value");
    });

    it("should classify stock with moderate P/E and high PEG as value", () => {
      const stock = createMockStock({
        peRatio: 20,
        revenueGrowth: null,
        dividendYield: null,
        pegRatio: 2.0, // Not low enough for GARP
      });
      expect(classifyStockType(stock)).toBe("value");
    });
  });

  describe("growth stock classification", () => {
    it("should classify high growth stock with high P/E as growth", () => {
      const stock = createMockStock({
        peRatio: 60, // > 40
        revenueGrowth: 0.25, // > 15%
        dividendYield: null,
      });
      expect(classifyStockType(stock)).toBe("growth");
    });

    it("should classify high growth unprofitable stock as growth", () => {
      const stock = createMockStock({
        peRatio: null, // Unprofitable
        revenueGrowth: 0.30,
        dividendYield: null,
      });
      expect(classifyStockType(stock)).toBe("growth");
    });

    it("should classify NVDA-like stock as growth", () => {
      // NVDA has high P/E (65.3) and high growth (122%)
      const stock = createMockStock({
        peRatio: 65.3,
        revenueGrowth: 1.22,
        dividendYield: 0.03,
        pegRatio: 1.1,
      });
      expect(classifyStockType(stock)).toBe("growth");
    });

    it("should classify very high P/E stock as growth even without revenue growth data", () => {
      const stock = createMockStock({
        peRatio: 50, // > 40
        revenueGrowth: null, // Unknown
        dividendYield: 0.5, // Low dividend
      });
      expect(classifyStockType(stock)).toBe("growth");
    });

    it("should classify TSLA-like stock as growth based on P/E alone", () => {
      const stock = createMockStock({
        peRatio: 112.5, // Very high P/E
        revenueGrowth: null, // Might be unknown
        dividendYield: null,
        pegRatio: 3.2,
      });
      expect(classifyStockType(stock)).toBe("growth");
    });
  });

  describe("GARP stock classification", () => {
    it("should classify GARP stock with high growth and reasonable PEG", () => {
      const stock = createMockStock({
        peRatio: 30, // Profitable but not super high
        revenueGrowth: 0.20, // High growth
        pegRatio: 1.5, // < 2
        dividendYield: 0.5,
      });
      expect(classifyStockType(stock)).toBe("garp");
    });

    it("should classify GOOGL-like stock as garp", () => {
      const stock = createMockStock({
        peRatio: 24.1,
        revenueGrowth: 0.16, // Just above 15%
        pegRatio: 1.2,
        dividendYield: null,
      });
      expect(classifyStockType(stock)).toBe("garp");
    });

    it("should classify stock with low PEG as GARP even without revenue growth data", () => {
      const stock = createMockStock({
        peRatio: 15,
        revenueGrowth: null, // Unknown
        pegRatio: 1.0, // Low PEG suggests growth at reasonable price
        dividendYield: 1.0, // Low dividend
      });
      expect(classifyStockType(stock)).toBe("garp");
    });

    it("should classify JPM-like stock with low PEG as GARP", () => {
      const stock = createMockStock({
        sector: "Financials",
        peRatio: 10.2,
        revenueGrowth: null,
        pegRatio: 0.8, // Very low PEG
        dividendYield: 2.3, // Below 2.5% threshold
      });
      expect(classifyStockType(stock)).toBe("garp");
    });
  });

  describe("dividend stock classification", () => {
    it("should classify high dividend stock as dividend", () => {
      const stock = createMockStock({
        peRatio: 12,
        revenueGrowth: 0.03, // Low growth
        dividendYield: 4.5, // > 2.5%
      });
      expect(classifyStockType(stock)).toBe("dividend");
    });

    it("should classify VZ-like stock as dividend", () => {
      const stock = createMockStock({
        sector: "Communication Services",
        peRatio: 9.5,
        revenueGrowth: 0.02,
        dividendYield: 6.2,
        pegRatio: 0.8,
      });
      expect(classifyStockType(stock)).toBe("dividend");
    });

    it("should NOT classify high dividend + high growth as dividend", () => {
      const stock = createMockStock({
        peRatio: 15,
        revenueGrowth: 0.25, // High growth
        dividendYield: 3.0,
      });
      // High growth overrides dividend classification
      expect(classifyStockType(stock)).not.toBe("dividend");
    });
  });
});

describe("getWeightProfile", () => {
  it("should return correct weights for value stocks", () => {
    const weights = getWeightProfile("value");
    expect(weights.pe).toBe(0.35);
    expect(weights.pb).toBe(0.25);
    expect(weights.peg).toBe(0.15);
    expect(weights.ps).toBe(0.10);
    expect(weights.revenueGrowth).toBe(0.05);
    expect(weights.weekPosition).toBe(0.10);
  });

  it("should return correct weights for growth stocks", () => {
    const weights = getWeightProfile("growth");
    expect(weights.pe).toBe(0.10);
    expect(weights.ps).toBe(0.30);
    expect(weights.revenueGrowth).toBe(0.25);
  });

  it("should return correct weights for GARP stocks", () => {
    const weights = getWeightProfile("garp");
    expect(weights.peg).toBe(0.25);
    expect(weights.revenueGrowth).toBe(0.15);
  });

  it("should return correct weights for dividend stocks", () => {
    const weights = getWeightProfile("dividend");
    expect(weights.weekPosition).toBe(0.20);
    expect(weights.peg).toBe(0.10);
  });

  it("should have weights that sum to 1.0 for each type", () => {
    const types: StockType[] = ["value", "growth", "garp", "dividend"];
    for (const type of types) {
      const weights = getWeightProfile(type);
      const sum = weights.pe + weights.pb + weights.peg + weights.ps + weights.revenueGrowth + weights.weekPosition;
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });
});

describe("calculateValueScore", () => {
  describe("with all metrics available", () => {
    it("should return a score between 0 and 100", () => {
      const stock = createMockStock();
      const result = calculateValueScore(stock);

      expect(result.valueScore).toBeGreaterThanOrEqual(0);
      expect(result.valueScore).toBeLessThanOrEqual(100);
    });

    it("should include all score breakdown components", () => {
      const stock = createMockStock();
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.peScore).not.toBeNull();
      expect(result.scoreBreakdown.pbScore).not.toBeNull();
      expect(result.scoreBreakdown.pegScore).not.toBeNull();
      expect(result.scoreBreakdown.psScore).not.toBeNull();
      expect(result.scoreBreakdown.revenueGrowthScore).not.toBeNull();
      expect(result.scoreBreakdown.weekPositionScore).toBeDefined();
    });

    it("should include stockType in result", () => {
      const stock = createMockStock();
      const result = calculateValueScore(stock);

      expect(result.stockType).toBeDefined();
      expect(["value", "growth", "garp", "dividend"]).toContain(result.stockType);
    });

    it("should have high data quality when 4+ metrics available", () => {
      const stock = createMockStock();
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("high");
    });

    it("should return higher score for undervalued stock", () => {
      // Stock with low P/E, low P/B, low PEG, low P/S relative to sector
      const undervaluedStock = createMockStock({
        peRatio: 14, // 50% of tech average (28)
        pbRatio: 3.5, // 50% of tech average (7)
        pegRatio: 0.5, // Undervalued PEG
        psRatio: 3.0, // 50% of tech average (6.0)
        revenueGrowth: 0.10,
        price: 110, // Near 52-week low
      });
      const result = calculateValueScore(undervaluedStock);

      expect(result.valueScore).toBeGreaterThan(65);
    });

    it("should return lower score for overvalued stock", () => {
      // Stock with high P/E, high P/B, high PEG, high P/S relative to sector
      const overvaluedStock = createMockStock({
        peRatio: 56, // 200% of tech average (28)
        pbRatio: 14, // 200% of tech average (7)
        pegRatio: 2.5, // Overvalued PEG
        psRatio: 18.0, // 300% of tech average (6.0)
        revenueGrowth: -0.05,
        price: 195, // Near 52-week high
      });
      const result = calculateValueScore(overvaluedStock);

      expect(result.valueScore).toBeLessThan(35);
    });
  });

  describe("P/S score calculation", () => {
    it("should give high P/S score when P/S is low vs sector", () => {
      const stock = createMockStock({
        sector: "Technology",
        psRatio: 1.5, // 0.25x of tech average (6.0)
      });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.psScore).toBe(100);
    });

    it("should give 50 P/S score at sector average", () => {
      const stock = createMockStock({
        sector: "Technology",
        psRatio: 6.0, // Equal to tech average
      });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.psScore).toBe(50);
    });

    it("should give 0 P/S score when P/S is 3x sector average", () => {
      const stock = createMockStock({
        sector: "Technology",
        psRatio: 18.0, // 3x tech average (6.0)
      });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.psScore).toBe(0);
    });

    it("should handle null P/S ratio", () => {
      const stock = createMockStock({ psRatio: null });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.psScore).toBeNull();
    });
  });

  describe("revenue growth score calculation", () => {
    it("should give high score for moderate growth in value stock", () => {
      const stock = createMockStock({
        peRatio: 15, // Value stock
        revenueGrowth: 0.10, // 10% - ideal for value
        dividendYield: 1.0,
        pegRatio: 2.0, // High PEG, ensures it's classified as value not GARP
      });
      const result = calculateValueScore(stock);
      expect(result.stockType).toBe("value");
      expect(result.scoreBreakdown.revenueGrowthScore).toBe(100);
    });

    it("should penalize high growth in value stock", () => {
      const stock = createMockStock({
        peRatio: 15,
        revenueGrowth: 0.35, // 35% - too high for value
        dividendYield: 1.0,
        pegRatio: 3.0, // High PEG so not GARP
      });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.revenueGrowthScore).toBeLessThan(80);
    });

    it("should reward high growth in growth stock", () => {
      const stock = createMockStock({
        peRatio: 60, // Growth stock
        revenueGrowth: 0.50, // 50% growth
      });
      const result = calculateValueScore(stock);
      expect(result.stockType).toBe("growth");
      expect(result.scoreBreakdown.revenueGrowthScore).toBe(100);
    });

    it("should handle null revenue growth", () => {
      const stock = createMockStock({ revenueGrowth: null });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.revenueGrowthScore).toBeNull();
    });

    it("should penalize negative growth", () => {
      const stock = createMockStock({
        revenueGrowth: -0.10, // -10%
      });
      const result = calculateValueScore(stock);
      expect(result.scoreBreakdown.revenueGrowthScore).toBeLessThan(30);
    });
  });

  describe("with missing P/E ratio", () => {
    it("should handle null P/E ratio", () => {
      const stock = createMockStock({ peRatio: null });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.peScore).toBeNull();
      expect(result.valueScore).toBeGreaterThanOrEqual(0);
      expect(result.valueScore).toBeLessThanOrEqual(100);
    });

    it("should have high data quality with null P/E (4 metrics still available)", () => {
      const stock = createMockStock({ peRatio: null });
      const result = calculateValueScore(stock);

      // With 5 metrics total, 4 available is still "high"
      expect(result.dataQuality).toBe("high");
    });
  });

  describe("with missing P/B ratio", () => {
    it("should handle null P/B ratio", () => {
      const stock = createMockStock({ pbRatio: null });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.pbScore).toBeNull();
      expect(result.valueScore).toBeGreaterThanOrEqual(0);
      expect(result.valueScore).toBeLessThanOrEqual(100);
    });
  });

  describe("with missing PEG ratio", () => {
    it("should handle null PEG ratio", () => {
      const stock = createMockStock({ pegRatio: null });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.pegScore).toBeNull();
      expect(result.valueScore).toBeGreaterThanOrEqual(0);
      expect(result.valueScore).toBeLessThanOrEqual(100);
    });
  });

  describe("with multiple missing ratios", () => {
    it("should handle all ratios missing except 52-week", () => {
      const stock = createMockStock({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
        psRatio: null,
        revenueGrowth: null,
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.peScore).toBeNull();
      expect(result.scoreBreakdown.pbScore).toBeNull();
      expect(result.scoreBreakdown.pegScore).toBeNull();
      expect(result.scoreBreakdown.psScore).toBeNull();
      expect(result.scoreBreakdown.revenueGrowthScore).toBeNull();
      expect(result.scoreBreakdown.weekPositionScore).toBeDefined();
      expect(result.dataQuality).toBe("low");
    });

    it("should still calculate a valid score with only 52-week data", () => {
      const stock = createMockStock({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
        psRatio: null,
        revenueGrowth: null,
      });
      const result = calculateValueScore(stock);

      expect(result.valueScore).toBeGreaterThanOrEqual(0);
      expect(result.valueScore).toBeLessThanOrEqual(100);
    });
  });

  describe("with negative P/E ratio", () => {
    it("should treat negative P/E as null (no score)", () => {
      const stock = createMockStock({ peRatio: -5 });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.peScore).toBeNull();
    });

    it("should treat zero P/E as null (no score)", () => {
      const stock = createMockStock({ peRatio: 0 });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.peScore).toBeNull();
    });
  });

  describe("52-week position scoring", () => {
    it("should give high score when price is at 52-week low", () => {
      const stock = createMockStock({
        price: 100, // At 52-week low
        week52High: 200,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.weekPositionScore).toBe(100);
    });

    it("should give low score when price is at 52-week high", () => {
      const stock = createMockStock({
        price: 200, // At 52-week high
        week52High: 200,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.weekPositionScore).toBe(0);
    });

    it("should give 50 when price is at midpoint", () => {
      const stock = createMockStock({
        price: 150, // Midpoint
        week52High: 200,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.weekPositionScore).toBe(50);
    });

    it("should handle equal high and low (edge case)", () => {
      const stock = createMockStock({
        price: 100,
        week52High: 100,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.weekPositionScore).toBe(50);
    });
  });

  describe("sector-specific scoring", () => {
    it("should use Technology sector averages correctly", () => {
      // Tech has avgPE: 28, avgPB: 7, avgPS: 6.0
      const techStock = createMockStock({
        sector: "Technology",
        peRatio: 28, // Equal to average
        pbRatio: 7,
        psRatio: 6.0,
      });
      const result = calculateValueScore(techStock);

      // At sector average, should be 50 (neutral)
      expect(result.scoreBreakdown.peScore).toBe(50);
      expect(result.scoreBreakdown.pbScore).toBe(50);
      expect(result.scoreBreakdown.psScore).toBe(50);
    });

    it("should use Financials sector averages correctly", () => {
      // Financials has avgPE: 14, avgPB: 1.3, avgPS: 2.5
      const financialStock = createMockStock({
        sector: "Financials",
        peRatio: 14, // Equal to average
        pbRatio: 1.3,
        psRatio: 2.5,
      });
      const result = calculateValueScore(financialStock);

      expect(result.scoreBreakdown.peScore).toBe(50);
      expect(result.scoreBreakdown.pbScore).toBe(50);
      expect(result.scoreBreakdown.psScore).toBe(50);
    });

    it("should use Energy sector averages correctly", () => {
      // Energy has avgPE: 12, avgPB: 1.8, avgPS: 1.0
      const energyStock = createMockStock({
        sector: "Energy",
        peRatio: 6, // 50% of average - should get 100
        pbRatio: 0.9, // 50% of average
        psRatio: 0.25, // 25% of average
      });
      const result = calculateValueScore(energyStock);

      expect(result.scoreBreakdown.peScore).toBe(100);
      expect(result.scoreBreakdown.pbScore).toBe(100);
      expect(result.scoreBreakdown.psScore).toBe(100);
    });
  });

  describe("data quality calculation", () => {
    it("should return high when 4+ metrics available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: 5,
        pegRatio: 1.5,
        psRatio: 5.0,
        revenueGrowth: 0.10,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("high");
    });

    it("should return medium when 2-3 ratios available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: 5,
        pegRatio: null,
        psRatio: null,
        revenueGrowth: null,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("medium");
    });

    it("should return low when only 1 ratio available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: null,
        pegRatio: null,
        psRatio: null,
        revenueGrowth: null,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("low");
    });

    it("should return low when no ratios available", () => {
      const stock = createMockStock({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
        psRatio: null,
        revenueGrowth: null,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("low");
    });
  });

  describe("score boundary conditions", () => {
    it("should cap maximum score at 100", () => {
      const stock = createMockStock({
        peRatio: 5, // Very low
        pbRatio: 1, // Very low
        pegRatio: 0.1, // Very low
        psRatio: 0.5, // Very low
        revenueGrowth: 0.10,
        price: 100, // At 52-week low
        week52High: 200,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.valueScore).toBeLessThanOrEqual(100);
    });

    it("should have minimum score of 0", () => {
      const stock = createMockStock({
        peRatio: 100, // Very high
        pbRatio: 50, // Very high
        pegRatio: 10, // Very high
        psRatio: 50, // Very high
        revenueGrowth: -0.30,
        price: 200, // At 52-week high
        week52High: 200,
        week52Low: 100,
      });
      const result = calculateValueScore(stock);

      expect(result.valueScore).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("classifyStock", () => {
  describe("classification boundaries", () => {
    it("should classify score 65 as undervalued", () => {
      expect(classifyStock(65)).toBe("undervalued");
    });

    it("should classify score above 65 as undervalued", () => {
      expect(classifyStock(85)).toBe("undervalued");
      expect(classifyStock(100)).toBe("undervalued");
    });

    it("should classify score 35 as fair", () => {
      expect(classifyStock(35)).toBe("fair");
    });

    it("should classify score 64 as fair", () => {
      expect(classifyStock(64)).toBe("fair");
    });

    it("should classify score between 35-64 as fair", () => {
      expect(classifyStock(50)).toBe("fair");
      expect(classifyStock(55)).toBe("fair");
    });

    it("should classify score 34 as overvalued", () => {
      expect(classifyStock(34)).toBe("overvalued");
    });

    it("should classify score below 35 as overvalued", () => {
      expect(classifyStock(20)).toBe("overvalued");
      expect(classifyStock(0)).toBe("overvalued");
    });
  });

  describe("edge cases", () => {
    it("should handle score of 0", () => {
      expect(classifyStock(0)).toBe("overvalued");
    });

    it("should handle score of 100", () => {
      expect(classifyStock(100)).toBe("undervalued");
    });
  });
});

describe("getScoreColor", () => {
  describe("color assignments", () => {
    it("should return green for scores >= 65", () => {
      expect(getScoreColor(65)).toBe("text-green-500");
      expect(getScoreColor(85)).toBe("text-green-500");
      expect(getScoreColor(100)).toBe("text-green-500");
    });

    it("should return yellow for scores 35-64", () => {
      expect(getScoreColor(35)).toBe("text-yellow-500");
      expect(getScoreColor(50)).toBe("text-yellow-500");
      expect(getScoreColor(64)).toBe("text-yellow-500");
    });

    it("should return red for scores < 35", () => {
      expect(getScoreColor(34)).toBe("text-red-500");
      expect(getScoreColor(20)).toBe("text-red-500");
      expect(getScoreColor(0)).toBe("text-red-500");
    });
  });

  describe("boundary conditions", () => {
    it("should correctly handle boundary at 65", () => {
      expect(getScoreColor(65)).toBe("text-green-500");
      expect(getScoreColor(64)).toBe("text-yellow-500");
    });

    it("should correctly handle boundary at 35", () => {
      expect(getScoreColor(35)).toBe("text-yellow-500");
      expect(getScoreColor(34)).toBe("text-red-500");
    });
  });
});

describe("getScoreBadgeVariant", () => {
  describe("badge variant assignments", () => {
    it("should return default for scores >= 65", () => {
      expect(getScoreBadgeVariant(65)).toBe("default");
      expect(getScoreBadgeVariant(85)).toBe("default");
      expect(getScoreBadgeVariant(100)).toBe("default");
    });

    it("should return secondary for scores 35-64", () => {
      expect(getScoreBadgeVariant(35)).toBe("secondary");
      expect(getScoreBadgeVariant(50)).toBe("secondary");
      expect(getScoreBadgeVariant(64)).toBe("secondary");
    });

    it("should return destructive for scores < 35", () => {
      expect(getScoreBadgeVariant(34)).toBe("destructive");
      expect(getScoreBadgeVariant(20)).toBe("destructive");
      expect(getScoreBadgeVariant(0)).toBe("destructive");
    });
  });
});

describe("getStockTypeLabel", () => {
  it("should return correct labels for each stock type", () => {
    expect(getStockTypeLabel("value")).toBe("Value");
    expect(getStockTypeLabel("growth")).toBe("Growth");
    expect(getStockTypeLabel("garp")).toBe("GARP");
    expect(getStockTypeLabel("dividend")).toBe("Dividend");
  });
});

describe("getStockTypeColor", () => {
  it("should return blue color for value stocks", () => {
    expect(getStockTypeColor("value")).toContain("blue");
  });

  it("should return purple color for growth stocks", () => {
    expect(getStockTypeColor("growth")).toContain("purple");
  });

  it("should return green color for GARP stocks", () => {
    expect(getStockTypeColor("garp")).toContain("green");
  });

  it("should return amber color for dividend stocks", () => {
    expect(getStockTypeColor("dividend")).toContain("amber");
  });
});
