import {
  validateInsightPrices,
  extractPricesFromText,
  calculateConfidence,
  getMarketCapCategory,
} from "@/lib/insights-validation";
import { InsightInputData } from "@/types";

describe("extractPricesFromText", () => {
  it("should extract dollar amounts from text", () => {
    const text = "The stock is trading at $775.50, down from its high of $850.00";
    const prices = extractPricesFromText(text);
    expect(prices).toContain(775.5);
    expect(prices).toContain(850);
  });

  it("should handle prices with commas", () => {
    const text = "Market cap of $1,234.56";
    const prices = extractPricesFromText(text);
    expect(prices).toContain(1234.56);
  });

  it("should return empty array for text without prices", () => {
    const text = "This is a growth stock with strong fundamentals";
    const prices = extractPricesFromText(text);
    expect(prices).toHaveLength(0);
  });
});

describe("validateInsightPrices", () => {
  const mockInputData: Partial<InsightInputData> = {
    price: 775.50,
    week52Low: 650.00,
    week52High: 850.00,
  };

  it("should return true when prices are within tolerance", () => {
    const text = "Trading at $775.50, within range of $650 to $850";
    const result = validateInsightPrices(text, mockInputData as InsightInputData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect significantly wrong prices", () => {
    const text = "Trading at $75 (wrong - should be $775.50)";
    const result = validateInsightPrices(text, mockInputData as InsightInputData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should allow 5% tolerance for rounding", () => {
    const text = "Trading near $780"; // ~0.6% off from 775.50
    const result = validateInsightPrices(text, mockInputData as InsightInputData);
    expect(result.isValid).toBe(true);
  });
});

describe("calculateConfidence", () => {
  it("should return high confidence when all metrics available", () => {
    const inputData: Partial<InsightInputData> = {
      peRatio: 18,
      pbRatio: 2.5,
      pegRatio: 1.2,
      psRatio: 3.0,
      revenueGrowth: 0.15,
      dividendYield: 1.5,
      dataCompleteness: 100,
    };
    expect(calculateConfidence(inputData as InsightInputData)).toBe("high");
  });

  it("should return medium confidence when some metrics missing", () => {
    const inputData: Partial<InsightInputData> = {
      peRatio: 18,
      pbRatio: 2.5,
      pegRatio: null,
      psRatio: null,
      revenueGrowth: null,
      dividendYield: null,
      dataCompleteness: 50,
    };
    expect(calculateConfidence(inputData as InsightInputData)).toBe("medium");
  });

  it("should return low confidence when most metrics missing", () => {
    const inputData: Partial<InsightInputData> = {
      peRatio: null,
      pbRatio: null,
      pegRatio: null,
      psRatio: null,
      revenueGrowth: null,
      dividendYield: null,
      dataCompleteness: 20,
    };
    expect(calculateConfidence(inputData as InsightInputData)).toBe("low");
  });
});

describe("getMarketCapCategory", () => {
  it("should categorize mega-cap (>200B)", () => {
    expect(getMarketCapCategory(250_000_000_000)).toBe("mega-cap");
  });

  it("should categorize large-cap (10B-200B)", () => {
    expect(getMarketCapCategory(50_000_000_000)).toBe("large-cap");
  });

  it("should categorize mid-cap (2B-10B)", () => {
    expect(getMarketCapCategory(5_000_000_000)).toBe("mid-cap");
  });

  it("should categorize small-cap (300M-2B)", () => {
    expect(getMarketCapCategory(1_000_000_000)).toBe("small-cap");
  });

  it("should categorize micro-cap (<300M)", () => {
    expect(getMarketCapCategory(100_000_000)).toBe("micro-cap");
  });
});
