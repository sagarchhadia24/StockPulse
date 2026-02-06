interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const requestLog = new Map<string, number[]>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestLog.entries()) {
      const filtered = timestamps.filter((t) => now - t < 5 * 60 * 1000);
      if (filtered.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, filtered);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = requestLog.get(key) || [];
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= config.maxRequests) {
    const oldestInWindow = recentTimestamps[0];
    const resetAt = oldestInWindow + config.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  recentTimestamps.push(now);
  requestLog.set(key, recentTimestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - recentTimestamps.length,
    resetAt: now + config.windowMs,
  };
}

export const RATE_LIMITS = {
  aiInsight: { maxRequests: 5, windowMs: 60 * 1000 },
  stockApi: { maxRequests: 30, windowMs: 60 * 1000 },
  portfolioWrite: { maxRequests: 20, windowMs: 60 * 1000 },
};
