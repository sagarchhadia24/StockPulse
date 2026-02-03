import { sortByChange, getTopMovers } from "@/lib/movers";

describe("sortByChange", () => {
  it("should sort stocks by changePercent descending", () => {
    const stocks = [
      { symbol: "A", changePercent: 1.5 },
      { symbol: "B", changePercent: 5.2 },
      { symbol: "C", changePercent: -2.1 },
    ];

    const sorted = sortByChange(stocks as any);

    expect(sorted[0].symbol).toBe("B");
    expect(sorted[1].symbol).toBe("A");
    expect(sorted[2].symbol).toBe("C");
  });
});

describe("getTopMovers", () => {
  it("should return top N gainers and losers", () => {
    const stocks = [
      { symbol: "A", changePercent: 5.0 },
      { symbol: "B", changePercent: 3.0 },
      { symbol: "C", changePercent: 1.0 },
      { symbol: "D", changePercent: -1.0 },
      { symbol: "E", changePercent: -3.0 },
      { symbol: "F", changePercent: -5.0 },
    ];

    const result = getTopMovers(stocks as any, 2);

    expect(result.gainers).toHaveLength(2);
    expect(result.gainers[0].symbol).toBe("A");
    expect(result.gainers[1].symbol).toBe("B");

    expect(result.losers).toHaveLength(2);
    expect(result.losers[0].symbol).toBe("F");
    expect(result.losers[1].symbol).toBe("E");
  });

  it("should handle fewer stocks than requested", () => {
    const stocks = [
      { symbol: "A", changePercent: 2.0 },
      { symbol: "B", changePercent: -1.0 },
    ];

    const result = getTopMovers(stocks as any, 10);

    expect(result.gainers).toHaveLength(1);
    expect(result.losers).toHaveLength(1);
  });
});
