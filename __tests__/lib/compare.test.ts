import { calculateYTDChange, findBestValue, getBestMetric } from "@/lib/compare";

describe("calculateYTDChange", () => {
  it("should calculate positive YTD change correctly", () => {
    const history = [
      { date: "2026-01-02", price: 100 },
      { date: "2026-01-15", price: 110 },
      { date: "2026-02-01", price: 120 },
    ];
    const currentPrice = 120;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(20); // 20% increase from 100 to 120
  });

  it("should calculate negative YTD change correctly", () => {
    const history = [
      { date: "2026-01-02", price: 100 },
      { date: "2026-02-01", price: 80 },
    ];
    const currentPrice = 80;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(-20); // 20% decrease from 100 to 80
  });

  it("should return null for empty history", () => {
    const result = calculateYTDChange([], 100);
    expect(result).toBeNull();
  });

  it("should use earliest date in current year", () => {
    const history = [
      { date: "2025-12-15", price: 90 }, // Last year, ignore
      { date: "2026-01-02", price: 100 }, // First day this year
      { date: "2026-02-01", price: 110 },
    ];
    const currentPrice = 110;

    const result = calculateYTDChange(history, currentPrice);

    expect(result).toBe(10); // From 100, not 90
  });
});

describe("findBestValue", () => {
  it("should return index of highest value score", () => {
    const scores = [45, 72, 58, 65];
    expect(findBestValue(scores)).toBe(1);
  });

  it("should return 0 for single stock", () => {
    const scores = [55];
    expect(findBestValue(scores)).toBe(0);
  });

  it("should return first index on tie", () => {
    const scores = [70, 70, 50];
    expect(findBestValue(scores)).toBe(0);
  });
});

describe("getBestMetric", () => {
  it("should find lowest P/E as best (lower is better)", () => {
    const values = [25, 18, 30, null];
    expect(getBestMetric(values, "lowest")).toBe(1);
  });

  it("should find highest dividend yield as best", () => {
    const values = [2.5, 3.1, 1.8, null];
    expect(getBestMetric(values, "highest")).toBe(1);
  });

  it("should skip null values", () => {
    const values = [null, null, 20, 25];
    expect(getBestMetric(values, "lowest")).toBe(2);
  });

  it("should return -1 if all values are null", () => {
    const values = [null, null, null];
    expect(getBestMetric(values, "lowest")).toBe(-1);
  });
});
