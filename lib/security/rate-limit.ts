import { NextRequest } from 'next/server';

// Structure rate limiting so that external backends (Redis/Upstash/Supabase) can be easily swapped in.
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

// Memory bucket store for serverless fallback (in-memory)
const memoryBuckets = new Map<string, { tokens: number; lastRefill: number }>();

class InMemoryRateLimiter {
  private limit: number;
  private refillRate: number; // tokens per second

  constructor(limit = 15, refillRate = 0.5) {
    this.limit = limit;
    this.refillRate = refillRate;
  }

  async check(ip: string): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = memoryBuckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.limit, lastRefill: now };
      memoryBuckets.set(ip, bucket);
    } else {
      // Calculate refilled tokens based on time elapsed
      const elapsedMs = now - bucket.lastRefill;
      const refilledTokens = (elapsedMs / 1000) * this.refillRate;
      
      bucket.tokens = Math.min(this.limit, bucket.tokens + refilledTokens);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        success: true,
        remaining: Math.floor(bucket.tokens),
        limit: this.limit
      };
    }

    return {
      success: false,
      remaining: 0,
      limit: this.limit
    };
  }
}

// Future expansion hook: Swap this class with a Redis/Upstash implementation if configured
class RedisRateLimiter {
  constructor(private redisUrl?: string) {}
  async check(ip: string): Promise<RateLimitResult> {
    // Upstash Redis rate-limiter fallback to memory if not connected
    console.warn('RedisRateLimiter: Upstash client connection not configured, falling back to memory bucket');
    return new InMemoryRateLimiter().check(ip);
  }
}

/**
 * Validates request rate limits based on client IP.
 * Defaults to 15 requests per 30 seconds window.
 */
export async function checkRateLimit(
  req: NextRequest,
  config?: { limit?: number; refillRate?: number }
): Promise<RateLimitResult> {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             '127.0.0.1';

  // Check if Redis is configured via env variables
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const limiter = redisUrl 
    ? new RedisRateLimiter(redisUrl) 
    : new InMemoryRateLimiter(config?.limit, config?.refillRate);

  return limiter.check(ip);
}
