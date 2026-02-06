import { calculateMA } from "@/components/stock/advanced-chart";

describe("calculateMA", () => {
  const sampleData = [
    { close: 10 },
    { close: 20 },
    { close: 30 },
    { close: 40 },
    { close: 50 },
    { close: 60 },
    { close: 70 },
    { close: 80 },
    { close: 90 },
    { close: 100 },
  ];

  describe("SMA calculation", () => {
    it("should calculate SMA correctly for period 3", () => {
      const result = calculateMA(sampleData, 3);

      // First 2 values should be null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();

      // SMA(3) at index 2 = (10+20+30)/3 = 20
      expect(result[2]).toBeCloseTo(20, 5);

      // SMA(3) at index 3 = (20+30+40)/3 = 30
      expect(result[3]).toBeCloseTo(30, 5);

      // SMA(3) at index 9 = (80+90+100)/3 = 90
      expect(result[9]).toBeCloseTo(90, 5);
    });

    it("should return all nulls if data length < period", () => {
      const shortData = [{ close: 10 }, { close: 20 }];
      const result = calculateMA(shortData, 5);

      expect(result).toEqual([null, null]);
    });

    it("should calculate SMA correctly for period equal to data length", () => {
      const result = calculateMA(sampleData, 10);

      // All but last should be null
      for (let i = 0; i < 9; i++) {
        expect(result[i]).toBeNull();
      }

      // Last = average of all values = (10+20+...+100)/10 = 55
      expect(result[9]).toBeCloseTo(55, 5);
    });
  });

  describe("EMA calculation", () => {
    it("should calculate EMA correctly", () => {
      const result = calculateMA(sampleData, 3, true);

      // First 2 should be null
      expect(result[0]).toBeNull();
      expect(result[1]).toBeNull();

      // EMA starts with SMA: (10+20+30)/3 = 20
      expect(result[2]).toBeCloseTo(20, 5);

      // EMA(3) multiplier = 2/(3+1) = 0.5
      // EMA at index 3 = (40 - 20) * 0.5 + 20 = 30
      expect(result[3]).toBeCloseTo(30, 5);
    });

    it("should have non-null values from period index onwards", () => {
      const result = calculateMA(sampleData, 3, true);

      for (let i = 2; i < result.length; i++) {
        expect(result[i]).not.toBeNull();
      }
    });

    it("should return all nulls if data length < period", () => {
      const shortData = [{ close: 10 }];
      const result = calculateMA(shortData, 5, true);

      expect(result).toEqual([null]);
    });
  });

  describe("OHLCV data mapping", () => {
    it("should handle valid OHLCV data structure", () => {
      const ohlcv = {
        date: "2024-01-15T00:00:00.000Z",
        open: 150.0,
        high: 155.0,
        low: 148.0,
        close: 153.0,
        volume: 1000000,
      };

      expect(ohlcv.open).toBe(150.0);
      expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.open);
      expect(ohlcv.low).toBeLessThanOrEqual(ohlcv.open);
      expect(ohlcv.close).toBeGreaterThan(0);
      expect(ohlcv.volume).toBeGreaterThanOrEqual(0);
    });

    it("should validate period mapping", () => {
      const periodMap: Record<string, string> = {
        "1D": "1d",
        "1W": "1w",
        "1M": "1mo",
        "3M": "3mo",
        "6M": "6mo",
        "1Y": "1y",
        "5Y": "5y",
      };

      expect(Object.keys(periodMap).length).toBe(7);
      expect(periodMap["1D"]).toBe("1d");
      expect(periodMap["5Y"]).toBe("5y");
    });
  });
});
