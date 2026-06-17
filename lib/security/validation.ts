'use client';

/**
 * Input Validation & Sanitization
 * Prevents XSS, injection, and malformed data
 */

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Sanitize HTML content - allow only safe tags
 */
export function sanitizeHTML(input: string): string {
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'];
  const tagRegex = /<\/?([a-zA-Z]+)[^>]*>/g;

  return input.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      if (tagName.toLowerCase() === 'a') {
        return match.replace(/href="[^"]*javascript:[^"]*"/gi, 'href="#"');
      }
      return match;
    }
    return '';
  });
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!query || query.trim().length === 0) {
    return { valid: false, sanitized: '', error: 'Query is empty' };
  }

  if (query.length > 500) {
    return { valid: false, sanitized: '', error: 'Query too long (max 500 characters)' };
  }

  const sanitized = sanitizeString(query);

  if (sanitized.length < 2) {
    return { valid: false, sanitized: '', error: 'Query too short (min 2 characters)' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): {
  valid: boolean;
  error?: string;
} {
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
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
  ];

  const allowedExtensions = [
    '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif',
    '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.txt', '.csv',
  ];

  if (file.size > maxFileSize) {
    return { valid: false, error: `File too large (max ${maxFileSize / 1024 / 1024}MB)` };
  }

  if (!allowedTypes.includes(file.type)) {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
      return { valid: false, error: `File type not allowed: ${file.type || ext}` };
    }
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 8) feedback.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Include uppercase letter');
  if (!/[a-z]/.test(password)) feedback.push('Include lowercase letter');
  if (!/[0-9]/.test(password)) feedback.push('Include number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Include special character');

  return {
    valid: score >= 4,
    score,
    feedback,
  };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Validate tag input
 */
export function validateTags(tags: string[]): {
  valid: boolean;
  sanitized: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized: string[] = [];

  if (tags.length > 20) {
    errors.push('Maximum 20 tags allowed');
  }

  for (const tag of tags) {
    const clean = sanitizeString(tag).substring(0, 50);
    if (clean.length > 0) {
      sanitized.push(clean);
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate that a URL is safe from SSRF (Server-Side Request Forgery)
 * Blocks localhost, private IPs, link-local, and cloud metadata URLs.
 * Requires HTTPS protocol.
 */
export function isSafeURL(urlStr: string): boolean {
  try {
    if (!urlStr || typeof urlStr !== 'string') {
      return false;
    }
    if (!urlStr.startsWith('https://')) {
      return false; // HTTPS only
    }
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block local/loopback/metadata hostnames
    if (
      hostname === 'localhost' ||
      hostname === 'localhost.localdomain' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }
    
    // Check for IP address formats
    // IPv4 regexes for private ranges
    // Loopback: 127.0.0.0/8
    // Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    // Link-local/Metadata: 169.254.169.254
    // Broadcast/Special: 0.0.0.0, 255.255.255.255
    const ipv4Pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipv4Pattern.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      if (
        parts[0] === 127 ||
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254) ||
        parts[0] === 0 ||
        parts[0] >= 224 // Multicast/Reserved
      ) {
        return false;
      }
    }
    
    // IPv6 checks
    if (hostname.includes(':')) {
      // Loopback ::1, link-local fe80::, unique local fc00::/fd00::
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

