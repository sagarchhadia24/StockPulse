import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    const config = { maxRequests: 3, windowMs: 60000 };

    const result1 = checkRateLimit("test-key-1", config);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit("test-key-1", config);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit("test-key-1", config);
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("should block requests over the limit", () => {
    const config = { maxRequests: 2, windowMs: 60000 };

    checkRateLimit("test-key-2", config);
    checkRateLimit("test-key-2", config);

    const result = checkRateLimit("test-key-2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("should allow requests after sliding window expires", () => {
    const config = { maxRequests: 2, windowMs: 60000 };

    checkRateLimit("test-key-3", config);
    checkRateLimit("test-key-3", config);

    // Blocked
    const blocked = checkRateLimit("test-key-3", config);
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    jest.advanceTimersByTime(61000);

    const allowed = checkRateLimit("test-key-3", config);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(1);
  });

  it("should track independent keys separately", () => {
    const config = { maxRequests: 1, windowMs: 60000 };

    checkRateLimit("user-a", config);
    const blockedA = checkRateLimit("user-a", config);
    expect(blockedA.allowed).toBe(false);

    // Different key should still be allowed
    const allowedB = checkRateLimit("user-b", config);
    expect(allowedB.allowed).toBe(true);
  });

  it("should report accurate remaining count", () => {
    const config = { maxRequests: 5, windowMs: 60000 };

    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("test-key-5", config);
      expect(result.remaining).toBe(5 - 1 - i);
    }

    const result = checkRateLimit("test-key-5", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should export pre-configured rate limits", () => {
    expect(RATE_LIMITS.aiInsight).toEqual({ maxRequests: 5, windowMs: 60000 });
    expect(RATE_LIMITS.stockApi).toEqual({ maxRequests: 30, windowMs: 60000 });
    expect(RATE_LIMITS.portfolioWrite).toEqual({
      maxRequests: 20,
      windowMs: 60000,
    });
  });
});
