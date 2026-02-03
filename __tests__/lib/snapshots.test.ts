// __tests__/lib/snapshots.test.ts
import { mergeHistoryWithSnapshots } from "@/lib/snapshots";

describe("mergeHistoryWithSnapshots", () => {
  it("should merge price history with valuation snapshots", () => {
    const priceHistory = [
      { date: "2026-01-01", price: 100 },
      { date: "2026-01-02", price: 105 },
      { date: "2026-01-03", price: 102 },
    ];
    const snapshots = [
      { snapshotDate: "2026-01-01", valueScore: 65 },
      { snapshotDate: "2026-01-03", valueScore: 70 },
    ];

    const result = mergeHistoryWithSnapshots(priceHistory, snapshots);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: "2026-01-01", price: 100, valueScore: 65 });
    expect(result[1]).toEqual({ date: "2026-01-02", price: 105, valueScore: null });
    expect(result[2]).toEqual({ date: "2026-01-03", price: 102, valueScore: 70 });
  });

  it("should handle empty snapshots", () => {
    const priceHistory = [
      { date: "2026-01-01", price: 100 },
      { date: "2026-01-02", price: 105 },
    ];

    const result = mergeHistoryWithSnapshots(priceHistory, []);

    expect(result).toHaveLength(2);
    expect(result[0].valueScore).toBeNull();
    expect(result[1].valueScore).toBeNull();
  });

  it("should handle empty price history", () => {
    const result = mergeHistoryWithSnapshots([], []);
    expect(result).toHaveLength(0);
  });
});
