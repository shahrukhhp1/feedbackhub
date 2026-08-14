export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  check(key: string, config: RateLimitConfig, now = Date.now()): RateLimitResult {
    const existing = this.buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      const resetAt = now + config.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: Math.max(config.maxRequests - 1, 0),
        resetAt,
      };
    }

    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    existing.count += 1;
    this.buckets.set(key, existing);

    return {
      allowed: true,
      remaining: Math.max(config.maxRequests - existing.count, 0),
      resetAt: existing.resetAt,
    };
  }

  clear(): void {
    this.buckets.clear();
  }
}

const ipLimiter = new InMemoryRateLimiter();
const installationLimiter = new InMemoryRateLimiter();

const DEFAULT_IP_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowMs: 60_000,
};

const DEFAULT_INSTALLATION_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export function checkIpRateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_IP_LIMIT,
): RateLimitResult {
  return ipLimiter.check(`ip:${ip}:${endpoint}`, config);
}

export function checkInstallationRateLimit(
  installationId: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_INSTALLATION_LIMIT,
): RateLimitResult {
  return installationLimiter.check(`installation:${installationId}:${endpoint}`, config);
}

export function resetRateLimits(): void {
  ipLimiter.clear();
  installationLimiter.clear();
}
