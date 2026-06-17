'use client';

/**
 * Client-side Rate Limiter
 * Prevents abuse by tracking and limiting action frequency
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

const storageKey = 'neurive_rate_limits';

function getStoredLimits(): Record<string, Array<{ timestamp: number }>> {
  try {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredLimits(limits: Record<string, Array<{ timestamp: number }>>): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(limits));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Check if an action is within rate limits
 */
export function checkRateLimit(action: string, config: RateLimitConfig): RateLimitResult {
  const key = `${config.identifier || 'default'}:${action}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const limits = getStoredLimits();
  const requests = (limits[key] || []).filter((r) => r.timestamp > windowStart);

  const remaining = Math.max(0, config.maxRequests - requests.length);
  const allowed = remaining > 0;

  const oldestInWindow = requests.length > 0 ? requests[0].timestamp : now;
  const resetAt = oldestInWindow + config.windowMs;
  const retryAfterMs = allowed ? 0 : resetAt - now;

  return {
    allowed,
    remaining,
    resetAt,
    retryAfterMs,
  };
}

/**
 * Record an action for rate limiting
 */
export function recordAction(action: string, config: RateLimitConfig): RateLimitResult {
  const key = `${config.identifier || 'default'}:${action}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const limits = getStoredLimits();
  const requests = (limits[key] || []).filter((r) => r.timestamp > windowStart);

  requests.push({ timestamp: now });
  limits[key] = requests;

  saveStoredLimits(limits);

  return checkRateLimit(action, config);
}

/**
 * Reset rate limit for an action
 */
export function resetRateLimit(action: string, identifier?: string): void {
  const key = `${identifier || 'default'}:${action}`;
  const limits = getStoredLimits();
  delete limits[key];
  saveStoredLimits(limits);
}

/**
 * Pre-configured rate limiters
 */
export const rateLimits = {
  search: { maxRequests: 30, windowMs: 60000 },
  viewArchive: { maxRequests: 100, windowMs: 60000 },
  download: { maxRequests: 10, windowMs: 60000 },
  bookmark: { maxRequests: 20, windowMs: 60000 },
  upload: { maxRequests: 5, windowMs: 300000 },
  apiCall: { maxRequests: 60, windowMs: 60000 },
  login: { maxRequests: 5, windowMs: 300000 },
  register: { maxRequests: 3, windowMs: 3600000 },
  annotation: { maxRequests: 30, windowMs: 60000 },
} as const;

/**
 * Check and record rate-limited action
 * Returns true if allowed, false if rate limited
 */
export function tryAction(action: keyof typeof rateLimits, identifier?: string): boolean {
  const config = { ...rateLimits[action], identifier };
  const result = checkRateLimit(action, config);

  if (!result.allowed) {
    return false;
  }

  recordAction(action, config);
  return true;
}

/**
 * Get remaining requests for an action
 */
export function getRemainingRequests(action: keyof typeof rateLimits, identifier?: string): number {
  const config = { ...rateLimits[action], identifier };
  return checkRateLimit(action, config).remaining;
}
