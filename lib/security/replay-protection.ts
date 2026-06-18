import { NextRequest, NextResponse } from 'next/server';

/**
 * Replay Attack Prevention
 *
 * Clients must include two headers on state-changing POST requests:
 *   X-Request-Timestamp  – Unix timestamp in seconds (string)
 *   X-Request-Nonce      – Unique random string (UUID v4 recommended)
 *
 * The server rejects requests whose timestamp is outside a ±5-minute window
 * and tracks seen nonces in an in-memory LRU set (TTL = 10 min).
 */

const TIMESTAMP_WINDOW_SECONDS = 5 * 60; // 5 minutes
const NONCE_TTL_MS = 10 * 60 * 1000;     // 10 minutes
const MAX_NONCE_CACHE = 10_000;

interface NonceEntry {
  seen: number; // epoch ms
}

const nonceCache = new Map<string, NonceEntry>();

// Prune expired nonces periodically (avoid unbounded growth)
function pruneNonces() {
  const now = Date.now();
  for (const [k, v] of nonceCache) {
    if (now - v.seen > NONCE_TTL_MS) nonceCache.delete(k);
  }
}

/**
 * Validate replay-attack prevention headers.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateReplayHeaders(req: NextRequest): string | null {
  const rawTs = req.headers.get('x-request-timestamp');
  const nonce = req.headers.get('x-request-nonce');

  if (!rawTs || !nonce) {
    return 'Missing X-Request-Timestamp or X-Request-Nonce header';
  }

  // ── Timestamp freshness check ──────────────────────────────────────────────
  const ts = parseInt(rawTs, 10);
  if (isNaN(ts)) return 'Invalid X-Request-Timestamp';

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TIMESTAMP_WINDOW_SECONDS) {
    return 'Request timestamp out of acceptable window (replay detected)';
  }

  // ── Nonce uniqueness check ─────────────────────────────────────────────────
  // Limit nonce length to avoid DoS via huge strings
  if (nonce.length < 8 || nonce.length > 128) {
    return 'Invalid nonce length';
  }

  if (nonceCache.size > MAX_NONCE_CACHE) pruneNonces();

  if (nonceCache.has(nonce)) {
    return 'Nonce already used (replay detected)';
  }

  nonceCache.set(nonce, { seen: Date.now() });

  return null; // valid
}

/**
 * Higher-order helper: wrap an API route handler with replay protection.
 * Usage:
 *   export const POST = withReplayProtection(async (req) => { ... });
 */
export function withReplayProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    // Only enforce on mutation methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const err = validateReplayHeaders(req);
      if (err) {
        return NextResponse.json({ success: false, error: err }, { status: 400 });
      }
    }
    return handler(req);
  };
}
