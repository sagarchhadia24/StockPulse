import {
  calculateValueScore,
  classifyStock,
  getScoreColor,
  getScoreBadgeVariant,
} from "@/lib/valuation";
import { Stock } from "@/types";

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
    week52High: 200,
    week52Low: 100,
    dividendYield: 0.5,
    volume: 50000000,
    avgVolume: 45000000,
    ...overrides,
  };
}

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
      expect(result.scoreBreakdown.weekPositionScore).toBeDefined();
    });

    it("should have high data quality when all metrics available", () => {
      const stock = createMockStock();
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("high");
    });

    it("should return higher score for undervalued stock", () => {
      // Stock with low P/E, low P/B, low PEG relative to sector
      const undervaluedStock = createMockStock({
        peRatio: 14, // 50% of tech average (28)
        pbRatio: 3.5, // 50% of tech average (7)
        pegRatio: 0.5, // Undervalued PEG
        price: 110, // Near 52-week low
      });
      const result = calculateValueScore(undervaluedStock);

      expect(result.valueScore).toBeGreaterThan(70);
    });

    it("should return lower score for overvalued stock", () => {
      // Stock with high P/E, high P/B, high PEG relative to sector
      const overvaluedStock = createMockStock({
        peRatio: 56, // 200% of tech average (28)
        pbRatio: 14, // 200% of tech average (7)
        pegRatio: 2.5, // Overvalued PEG
        price: 195, // Near 52-week high
      });
      const result = calculateValueScore(overvaluedStock);

      expect(result.valueScore).toBeLessThan(30);
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

    it("should have medium data quality with null P/E", () => {
      const stock = createMockStock({ peRatio: null });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("medium");
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
      });
      const result = calculateValueScore(stock);

      expect(result.scoreBreakdown.peScore).toBeNull();
      expect(result.scoreBreakdown.pbScore).toBeNull();
      expect(result.scoreBreakdown.pegScore).toBeNull();
      expect(result.scoreBreakdown.weekPositionScore).toBeDefined();
      expect(result.dataQuality).toBe("low");
    });

    it("should still calculate a valid score with only 52-week data", () => {
      const stock = createMockStock({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
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
      // Tech has avgPE: 28, avgPB: 7
      const techStock = createMockStock({
        sector: "Technology",
        peRatio: 28, // Equal to average
        pbRatio: 7,
      });
      const result = calculateValueScore(techStock);

      // At sector average, should be around 67 score ((1 - (1-0.5)/1.5) * 100)
      expect(result.scoreBreakdown.peScore).toBeCloseTo(67, 0);
      expect(result.scoreBreakdown.pbScore).toBeCloseTo(67, 0);
    });

    it("should use Financials sector averages correctly", () => {
      // Financials has avgPE: 14, avgPB: 1.3
      const financialStock = createMockStock({
        sector: "Financials",
        peRatio: 14, // Equal to average
        pbRatio: 1.3,
      });
      const result = calculateValueScore(financialStock);

      expect(result.scoreBreakdown.peScore).toBeCloseTo(67, 0);
      expect(result.scoreBreakdown.pbScore).toBeCloseTo(67, 0);
    });

    it("should use Energy sector averages correctly", () => {
      // Energy has avgPE: 12, avgPB: 1.8
      const energyStock = createMockStock({
        sector: "Energy",
        peRatio: 6, // 50% of average - should get 100
        pbRatio: 0.9, // 50% of average
      });
      const result = calculateValueScore(energyStock);

      expect(result.scoreBreakdown.peScore).toBe(100);
      expect(result.scoreBreakdown.pbScore).toBe(100);
    });
  });

  describe("data quality calculation", () => {
    it("should return high when PE, PB, and PEG are all available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: 5,
        pegRatio: 1.5,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("high");
    });

    it("should return medium when 2 of 3 ratios available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: 5,
        pegRatio: null,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("medium");
    });

    it("should return low when only 1 ratio available", () => {
      const stock = createMockStock({
        peRatio: 25,
        pbRatio: null,
        pegRatio: null,
      });
      const result = calculateValueScore(stock);

      expect(result.dataQuality).toBe("low");
    });

    it("should return low when no ratios available", () => {
      const stock = createMockStock({
        peRatio: null,
        pbRatio: null,
        pegRatio: null,
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
    it("should classify score 70 as undervalued", () => {
      expect(classifyStock(70)).toBe("undervalued");
    });

    it("should classify score above 70 as undervalued", () => {
      expect(classifyStock(85)).toBe("undervalued");
      expect(classifyStock(100)).toBe("undervalued");
    });

    it("should classify score 40 as fair", () => {
      expect(classifyStock(40)).toBe("fair");
    });

    it("should classify score 69 as fair", () => {
      expect(classifyStock(69)).toBe("fair");
    });

    it("should classify score between 40-69 as fair", () => {
      expect(classifyStock(50)).toBe("fair");
      expect(classifyStock(55)).toBe("fair");
    });

    it("should classify score 39 as overvalued", () => {
      expect(classifyStock(39)).toBe("overvalued");
    });

    it("should classify score below 40 as overvalued", () => {
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
    it("should return green for scores >= 70", () => {
      expect(getScoreColor(70)).toBe("text-green-500");
      expect(getScoreColor(85)).toBe("text-green-500");
      expect(getScoreColor(100)).toBe("text-green-500");
    });

    it("should return yellow for scores 40-69", () => {
      expect(getScoreColor(40)).toBe("text-yellow-500");
      expect(getScoreColor(55)).toBe("text-yellow-500");
      expect(getScoreColor(69)).toBe("text-yellow-500");
    });

    it("should return red for scores < 40", () => {
      expect(getScoreColor(39)).toBe("text-red-500");
      expect(getScoreColor(20)).toBe("text-red-500");
      expect(getScoreColor(0)).toBe("text-red-500");
    });
  });

  describe("boundary conditions", () => {
    it("should correctly handle boundary at 70", () => {
      expect(getScoreColor(70)).toBe("text-green-500");
      expect(getScoreColor(69)).toBe("text-yellow-500");
    });

    it("should correctly handle boundary at 40", () => {
      expect(getScoreColor(40)).toBe("text-yellow-500");
      expect(getScoreColor(39)).toBe("text-red-500");
    });
  });
});

describe("getScoreBadgeVariant", () => {
  describe("badge variant assignments", () => {
    it("should return default for scores >= 70", () => {
      expect(getScoreBadgeVariant(70)).toBe("default");
      expect(getScoreBadgeVariant(85)).toBe("default");
      expect(getScoreBadgeVariant(100)).toBe("default");
    });

    it("should return secondary for scores 40-69", () => {
      expect(getScoreBadgeVariant(40)).toBe("secondary");
      expect(getScoreBadgeVariant(55)).toBe("secondary");
      expect(getScoreBadgeVariant(69)).toBe("secondary");
    });

    it("should return destructive for scores < 40", () => {
      expect(getScoreBadgeVariant(39)).toBe("destructive");
      expect(getScoreBadgeVariant(20)).toBe("destructive");
      expect(getScoreBadgeVariant(0)).toBe("destructive");
    });
  });
});
