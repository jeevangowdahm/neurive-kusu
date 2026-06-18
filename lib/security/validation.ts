'use client';

/**
 * Input Validation & Sanitization
 * Prevents XSS, injection, ReDoS, SSTI, and malformed data
 */

// ── ReDoS-safe constants ──────────────────────────────────────────────────────
// All regexes here are written to avoid catastrophic backtracking.
// Rules: no nested quantifiers, no ambiguous alternation on overlapping sets.

/** Max password length to prevent LPDoS (long-password DOS) */
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

/** Max search query length */
const MAX_QUERY_LENGTH = 500;

/**
 * Sanitize a plain string input – removes characters that enable
 * XSS / SSTI / template-injection in rendered output.
 * ReDoS-safe: single-pass replacements, no backtracking.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')           // strip angle brackets (XSS / HTML injection)
    .replace(/\{\{.*?\}\}/g, '')     // strip Mustache / Jinja2 / Nunjucks templates  ← SSTI
    .replace(/\$\{[^}]*\}/g, '')     // strip JS template literals  ← SSTI
    .replace(/javascript:/gi, '')    // strip JS pseudo-protocol
    .replace(/#\{[^}]*\}/g, '')      // strip Ruby/EJS interpolation  ← SSTI
    .replace(/<%.*?%>/g, '')         // strip ERB / EJS tags  ← SSTI
    .replace(/on[a-z]{1,20}=/gi, '') // strip inline event handlers (ReDoS-safe: bounded {1,20})
    .trim();
}

/**
 * Sanitize HTML content – allow only a safe subset of tags.
 * ReDoS-safe: uses a simple character-class match, no nested quantifiers.
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  const allowedTags = new Set(['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a']);
  // Safe regex: [^>]* is bounded by the presence of > so no catastrophic backtracking
  return input.replace(/<\/?([a-zA-Z]{1,20})[^>]*>/g, (match, tagName) => {
    if (!allowedTags.has(tagName.toLowerCase())) return '';
    if (tagName.toLowerCase() === 'a') {
      return match.replace(/href="[^"]{0,2048}javascript:[^"]*"/gi, 'href="#"');
    }
    return match;
  });
}

/**
 * Sanitize a prompt / template string before sending to an LLM.
 * Strips known SSTI payloads and prompt-injection delimiters.
 */
export function sanitizePromptInput(input: string): string {
  if (typeof input !== 'string') return '';
  let s = sanitizeString(input);
  // Remove common LLM prompt-injection patterns
  s = s.replace(/ignore previous instructions?/gi, '[filtered]');
  s = s.replace(/system\s*:/gi, '[filtered]');
  s = s.replace(/\[INST\]/gi, '[filtered]');
  s = s.replace(/\[\/INST\]/gi, '[filtered]');
  s = s.replace(/<\|[a-z]{1,30}\|>/gi, '[filtered]'); // <|im_start|> etc.
  return s.trim();
}

/**
 * Validate and sanitize search query.
 * Caps length to prevent ReDoS downstream and LPDoS-style abuse.
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { valid: false, sanitized: '', error: 'Query is empty' };
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return { valid: false, sanitized: '', error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` };
  }

  const sanitized = sanitizeString(query);

  if (sanitized.length < 2) {
    return { valid: false, sanitized: '', error: 'Query too short (min 2 characters)' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate file upload.
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): {
  valid: boolean;
  error?: string;
} {
  const maxFileSize = 100 * 1024 * 1024; // 100 MB
  const allowedTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'text/plain',
    'text/csv',
  ]);

  const allowedExtensions = new Set([
    '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif',
    '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.txt', '.csv',
  ]);

  if (file.size > maxFileSize) {
    return { valid: false, error: `File too large (max ${maxFileSize / 1024 / 1024} MB)` };
  }

  if (!allowedTypes.has(file.type)) {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.has(ext)) {
      return { valid: false, error: `File type not allowed: ${file.type || ext}` };
    }
  }

  return { valid: true };
}

/**
 * Validate email format.
 * ReDoS-safe: simple structural check, no catastrophic backtracking.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321 max
  // Simple, ReDoS-safe check: one @ sign, non-empty local and domain parts
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length > 64 || domain.length < 3 || !domain.includes('.')) return false;
  // No nested quantifiers – safe against ReDoS
  return /^[^\s@<>]+$/.test(local) && /^[^\s@<>]+$/.test(domain);
}

/**
 * Validate password strength.
 * Enforces MAX_PASSWORD_LENGTH to prevent LPDoS attacks.
 */
export function validatePassword(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];

  // ── LPDoS guard ─────────────────────────────────────────────────────────────
  if (!password || typeof password !== 'string') {
    return { valid: false, score: 0, feedback: ['Password is required'] };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      score: 0,
      feedback: [`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`],
    };
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 12) score++;
  // ReDoS-safe: these character-class regexes have no backtracking
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < MIN_PASSWORD_LENGTH) feedback.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
  if (!/[A-Z]/.test(password)) feedback.push('Include uppercase letter');
  if (!/[a-z]/.test(password)) feedback.push('Include lowercase letter');
  if (!/[0-9]/.test(password)) feedback.push('Include number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Include special character');

  return { valid: score >= 4, score, feedback };
}

/**
 * Validate URL format.
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename for safe storage.
 * ReDoS-safe: simple character whitelist replacement.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'unnamed';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')          // collapse consecutive dots
    .substring(0, 255);
}

/**
 * Validate tag input.
 */
export function validateTags(tags: string[]): {
  valid: boolean;
  sanitized: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized: string[] = [];

  if (!Array.isArray(tags)) return { valid: false, sanitized: [], errors: ['Tags must be an array'] };
  if (tags.length > 20) errors.push('Maximum 20 tags allowed');

  for (const tag of tags) {
    const clean = sanitizeString(String(tag)).substring(0, 50);
    if (clean.length > 0) sanitized.push(clean);
  }

  return { valid: errors.length === 0, sanitized, errors };
}

/**
 * Validate that a URL is safe from SSRF (Server-Side Request Forgery).
 * Blocks localhost, private IPs, link-local, and cloud metadata URLs.
 * Requires HTTPS protocol.
 */
export function isSafeURL(urlStr: string): boolean {
  try {
    if (!urlStr || typeof urlStr !== 'string') return false;
    if (!urlStr.startsWith('https://')) return false;
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === 'localhost.localdomain' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // ReDoS-safe IPv4 check: fixed-width digit groups
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Pattern);
    if (ipv4Match) {
      const parts = [
        parseInt(ipv4Match[1], 10),
        parseInt(ipv4Match[2], 10),
        parseInt(ipv4Match[3], 10),
        parseInt(ipv4Match[4], 10),
      ];
      if (
        parts[0] === 127 ||
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254) ||
        parts[0] === 0 ||
        parts[0] >= 224
      ) {
        return false;
      }
    }

    // IPv6 checks
    if (hostname.includes(':')) {
      if (
        hostname === '::1' ||
        hostname.startsWith('fe80:') ||
        hostname.startsWith('fc00:') ||
        hostname.startsWith('fd00:')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password length only (server-side guard for LPDoS).
 * Call this BEFORE any hashing / bcrypt operation.
 */
export function assertPasswordLength(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}
