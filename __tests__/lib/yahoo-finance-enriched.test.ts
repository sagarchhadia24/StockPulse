import { getEarningsData, getAnalystRatings, getFinancialStatements } from "@/lib/yahoo-finance";

// Mock yahoo-finance2
const mockQuoteSummary = jest.fn();

jest.mock("yahoo-finance2", () => {
  return {
    __esModule: true,
    default: class {
      quoteSummary = mockQuoteSummary;
    },
  };
});

beforeEach(() => {
  mockQuoteSummary.mockReset();
});

describe("getEarningsData", () => {
  it("should map earnings data correctly from quoteSummary", async () => {
    mockQuoteSummary.mockResolvedValue({
      calendarEvents: {
        earnings: {
          earningsDate: [new Date("2025-04-25")],
        },
      },
      earningsHistory: {
        history: [
          {
            quarter: 1,
            period: "2024-Q1",
            epsEstimate: { raw: 1.5 },
            epsActual: { raw: 1.65 },
            epsDifference: { raw: 0.15 },
            surprisePercent: { raw: 0.1 },
          },
          {
            quarter: 2,
            period: "2024-Q2",
            epsEstimate: { raw: 1.6 },
            epsActual: { raw: 1.55 },
            epsDifference: { raw: -0.05 },
            surprisePercent: { raw: -0.03125 },
          },
        ],
      },
      earningsTrend: {
        trend: [
          { earningsEstimate: { avg: { raw: 6.5 } } },
          { earningsEstimate: { avg: { raw: 7.2 } } },
        ],
      },
    });

    const result = await getEarningsData("AAPL");

    expect(result).not.toBeNull();
    expect(result!.earningsDate).toBe("2025-04-25");
    expect(result!.epsTrailing).toBe(6.5);
    expect(result!.epsForward).toBe(7.2);
    expect(result!.earningsHistory).toHaveLength(2);
    expect(result!.earningsHistory[0]).toEqual({
      quarter: "Q1",
      date: "2024-Q1",
      epsEstimate: 1.5,
      epsActual: 1.65,
      epsSurprise: 0.15,
      epsSurprisePercent: 10, // 0.1 * 100
    });
    expect(result!.earningsHistory[1].epsSurprisePercent).toBeCloseTo(-3.125);
  });

  it("should return null when summary is empty", async () => {
    mockQuoteSummary.mockResolvedValue(null);

    const result = await getEarningsData("AAPL");

    expect(result).toBeNull();
  });

  it("should handle missing earnings date", async () => {
    mockQuoteSummary.mockResolvedValue({
      calendarEvents: {},
      earningsHistory: { history: [] },
      earningsTrend: { trend: [] },
    });

    const result = await getEarningsData("AAPL");

    expect(result).not.toBeNull();
    expect(result!.earningsDate).toBeNull();
    expect(result!.earningsHistory).toHaveLength(0);
    expect(result!.epsTrailing).toBeNull();
    expect(result!.epsForward).toBeNull();
  });

  it("should handle missing quarter field", async () => {
    mockQuoteSummary.mockResolvedValue({
      calendarEvents: {},
      earningsHistory: {
        history: [
          {
            period: "2024-Q1",
            epsEstimate: { raw: 1.0 },
            epsActual: { raw: 1.1 },
            epsDifference: { raw: 0.1 },
            surprisePercent: { raw: 0.1 },
          },
        ],
      },
      earningsTrend: { trend: [] },
    });

    const result = await getEarningsData("AAPL");

    expect(result!.earningsHistory[0].quarter).toBe("N/A");
  });

  it("should limit earnings history to 4 quarters", async () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      quarter: i + 1,
      period: `2024-Q${(i % 4) + 1}`,
      epsEstimate: { raw: 1.0 },
      epsActual: { raw: 1.1 },
      epsDifference: { raw: 0.1 },
      surprisePercent: { raw: 0.05 },
    }));

    mockQuoteSummary.mockResolvedValue({
      calendarEvents: {},
      earningsHistory: { history },
      earningsTrend: { trend: [] },
    });

    const result = await getEarningsData("AAPL");

    expect(result!.earningsHistory).toHaveLength(4);
  });

  it("should return null on timeout", async () => {
    mockQuoteSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 10000))
    );

    const result = await getEarningsData("AAPL");

    // withTimeout should return null fallback
    expect(result).toBeNull();
  }, 10000);
});

describe("getAnalystRatings", () => {
  it("should map analyst ratings correctly from quoteSummary", async () => {
    mockQuoteSummary.mockResolvedValue({
      financialData: {
        targetMeanPrice: { raw: 200.5 },
        targetMedianPrice: { raw: 195.0 },
        targetHighPrice: { raw: 250.0 },
        targetLowPrice: { raw: 160.0 },
        numberOfAnalystOpinions: { raw: 35 },
        recommendationKey: "buy",
        recommendationMean: { raw: 1.8 },
      },
    });

    const result = await getAnalystRatings("AAPL");

    expect(result).not.toBeNull();
    expect(result!.targetMean).toBe(200.5);
    expect(result!.targetMedian).toBe(195.0);
    expect(result!.targetHigh).toBe(250.0);
    expect(result!.targetLow).toBe(160.0);
    expect(result!.numberOfAnalysts).toBe(35);
    expect(result!.recommendation).toBe("buy");
    expect(result!.recommendationScore).toBe(1.8);
  });

  it("should return null when financialData is missing", async () => {
    mockQuoteSummary.mockResolvedValue({});

    const result = await getAnalystRatings("AAPL");

    expect(result).toBeNull();
  });

  it("should handle missing fields with null defaults", async () => {
    mockQuoteSummary.mockResolvedValue({
      financialData: {
        recommendationKey: "hold",
      },
    });

    const result = await getAnalystRatings("AAPL");

    expect(result).not.toBeNull();
    expect(result!.targetMean).toBeNull();
    expect(result!.targetMedian).toBeNull();
    expect(result!.targetHigh).toBeNull();
    expect(result!.targetLow).toBeNull();
    expect(result!.numberOfAnalysts).toBe(0);
    expect(result!.recommendation).toBe("hold");
    expect(result!.recommendationScore).toBeNull();
  });

  it("should default recommendation to 'none' when missing", async () => {
    mockQuoteSummary.mockResolvedValue({
      financialData: {
        targetMeanPrice: { raw: 100 },
      },
    });

    const result = await getAnalystRatings("AAPL");

    expect(result!.recommendation).toBe("none");
  });

  it("should return null on timeout", async () => {
    mockQuoteSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 10000))
    );

    const result = await getAnalystRatings("AAPL");

    expect(result).toBeNull();
  }, 10000);
});

describe("getFinancialStatements", () => {
  it("should map financial statements correctly from quoteSummary", async () => {
    mockQuoteSummary.mockResolvedValue({
      incomeStatementHistory: {
        incomeStatementHistory: [
          {
            endDate: new Date("2024-09-28"),
            totalRevenue: { raw: 391035000000 },
            netIncome: { raw: 93736000000 },
          },
          {
            endDate: new Date("2023-09-30"),
            totalRevenue: { raw: 383285000000 },
            netIncome: { raw: 96995000000 },
          },
        ],
      },
      cashflowStatementHistory: {
        cashflowStatements: [
          {
            endDate: new Date("2024-09-28"),
            totalCashFromOperatingActivities: { raw: 118254000000 },
            capitalExpenditures: { raw: 9959000000 },
          },
          {
            endDate: new Date("2023-09-30"),
            totalCashFromOperatingActivities: { raw: 110543000000 },
            capitalExpenditures: { raw: 10959000000 },
          },
        ],
      },
      financialData: {
        profitMargins: { raw: 0.2397 },
        operatingMargins: { raw: 0.3156 },
        returnOnEquity: { raw: 1.6094 },
        debtToEquity: { raw: 151.86 },
        currentRatio: { raw: 0.87 },
      },
    });

    const result = await getFinancialStatements("AAPL");

    expect(result).not.toBeNull();
    expect(result!.annualRevenue).toHaveLength(2);
    expect(result!.annualRevenue[0]).toEqual({
      date: "2024-09-28",
      value: 391035000000,
    });
    expect(result!.annualNetIncome[0]).toEqual({
      date: "2024-09-28",
      value: 93736000000,
    });
    expect(result!.annualFreeCashFlow[0]).toEqual({
      date: "2024-09-28",
      value: 118254000000 - 9959000000,
    });
    expect(result!.profitMargin).toBe(0.2397);
    expect(result!.operatingMargin).toBe(0.3156);
    expect(result!.returnOnEquity).toBe(1.6094);
    expect(result!.debtToEquity).toBe(151.86);
    expect(result!.currentRatio).toBe(0.87);
  });

  it("should return null when summary is empty", async () => {
    mockQuoteSummary.mockResolvedValue(null);

    const result = await getFinancialStatements("AAPL");

    expect(result).toBeNull();
  });

  it("should handle missing income and cashflow history", async () => {
    mockQuoteSummary.mockResolvedValue({
      financialData: {
        profitMargins: { raw: 0.15 },
      },
    });

    const result = await getFinancialStatements("AAPL");

    expect(result).not.toBeNull();
    expect(result!.annualRevenue).toHaveLength(0);
    expect(result!.annualNetIncome).toHaveLength(0);
    expect(result!.annualFreeCashFlow).toHaveLength(0);
    expect(result!.profitMargin).toBe(0.15);
    expect(result!.operatingMargin).toBeNull();
  });

  it("should handle missing financial ratios with null defaults", async () => {
    mockQuoteSummary.mockResolvedValue({
      incomeStatementHistory: { incomeStatementHistory: [] },
      cashflowStatementHistory: { cashflowStatements: [] },
      financialData: {},
    });

    const result = await getFinancialStatements("AAPL");

    expect(result).not.toBeNull();
    expect(result!.profitMargin).toBeNull();
    expect(result!.operatingMargin).toBeNull();
    expect(result!.returnOnEquity).toBeNull();
    expect(result!.debtToEquity).toBeNull();
    expect(result!.currentRatio).toBeNull();
  });

  it("should handle missing endDate in statements", async () => {
    mockQuoteSummary.mockResolvedValue({
      incomeStatementHistory: {
        incomeStatementHistory: [
          {
            totalRevenue: { raw: 100000 },
            netIncome: { raw: 20000 },
          },
        ],
      },
      cashflowStatementHistory: {
        cashflowStatements: [
          {
            totalCashFromOperatingActivities: { raw: 30000 },
            capitalExpenditures: { raw: 5000 },
          },
        ],
      },
      financialData: {},
    });

    const result = await getFinancialStatements("AAPL");

    expect(result!.annualRevenue[0].date).toBe("N/A");
    expect(result!.annualFreeCashFlow[0].value).toBe(25000);
  });

  it("should return null on timeout", async () => {
    mockQuoteSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 10000))
    );

    const result = await getFinancialStatements("AAPL");

    expect(result).toBeNull();
  }, 10000);
});
