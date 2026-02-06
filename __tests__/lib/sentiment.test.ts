import { analyzeNewsSentiment, batchAnalyzeSentiment } from "@/lib/sentiment";

// Mock fetch
global.fetch = jest.fn();

describe("analyzeNewsSentiment", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("should return neutral for empty headlines", async () => {
    const result = await analyzeNewsSentiment("AAPL", []);
    expect(result.label).toBe("neutral");
    expect(result.score).toBe(0);
  });

  it("should return neutral when API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await analyzeNewsSentiment("AAPL", ["Good news"]);
    expect(result.label).toBe("neutral");
  });

  it("should parse bullish sentiment correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"score": 0.7, "label": "bullish", "summary": "Strong positive outlook"}' }],
          },
        }],
      }),
    });

    const result = await analyzeNewsSentiment("AAPL", ["Apple beats earnings"]);
    expect(result.score).toBe(0.7);
    expect(result.label).toBe("bullish");
    expect(result.summary).toBe("Strong positive outlook");
  });

  it("should parse bearish sentiment correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"score": -0.6, "label": "bearish", "summary": "Negative outlook"}' }],
          },
        }],
      }),
    });

    const result = await analyzeNewsSentiment("AAPL", ["Apple misses revenue"]);
    expect(result.score).toBe(-0.6);
    expect(result.label).toBe("bearish");
  });

  it("should clamp scores to valid range", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"score": 2.5, "label": "bullish", "summary": "Test"}' }],
          },
        }],
      }),
    });

    const result = await analyzeNewsSentiment("AAPL", ["Test headline"]);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.score).toBeGreaterThanOrEqual(-1);
  });

  it("should handle API errors gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await analyzeNewsSentiment("AAPL", ["Test headline"]);
    expect(result.label).toBe("neutral");
    expect(result.score).toBe(0);
  });

  it("should derive label from score regardless of API response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"score": 0.5, "label": "neutral", "summary": "Test"}' }],
          },
        }],
      }),
    });

    const result = await analyzeNewsSentiment("AAPL", ["Test"]);
    // Score 0.5 > 0.2, so label should be bullish regardless of API saying neutral
    expect(result.label).toBe("bullish");
  });
});

describe("batchAnalyzeSentiment", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("should process multiple stocks", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"score": 0.3, "label": "bullish", "summary": "Positive"}' }],
          },
        }],
      }),
    });

    const results = await batchAnalyzeSentiment([
      { symbol: "AAPL", headlines: ["Good news"] },
      { symbol: "MSFT", headlines: ["Good news too"] },
    ]);

    expect(results.size).toBe(2);
    expect(results.has("AAPL")).toBe(true);
    expect(results.has("MSFT")).toBe(true);
  });

  it("should handle empty input", async () => {
    const results = await batchAnalyzeSentiment([]);
    expect(results.size).toBe(0);
  });
});
