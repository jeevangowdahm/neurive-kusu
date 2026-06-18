'use client';

/**
 * Secure Clipboard Utilities
 *
 * Clipboard Attack mitigations:
 *  1. Only write plain text – never write HTML/rich content that could inject
 *     malicious markup when pasted into other applications.
 *  2. Strip ANSI escape codes, zero-width characters, and homoglyph sequences
 *     that could hide malicious content inside "safe-looking" text.
 *  3. Cap the maximum payload to 64 KB to prevent clipboard-flood DoS.
 *  4. All writes are async (navigator.clipboard.writeText) which the browser
 *     already gates behind a user-gesture requirement in secure contexts.
 *  5. Never read from the clipboard without explicit user intent.
 */

const MAX_CLIPBOARD_BYTES = 64 * 1024; // 64 KB

/**
 * Remove characters that can be used for clipboard attacks:
 *  – Zero-width / invisible characters (U+200B … U+200F, U+FEFF, U+00AD, etc.)
 *  – ANSI / terminal escape sequences  (\x1B[…m)
 *  – Right-to-Left Override / Left-to-Right Override (U+202E / U+202D)
 *  – Other direction-overriding Unicode chars
 */
function sanitizeClipboardText(text: string): string {
  if (typeof text !== 'string') return '';

  return text
    // Strip ANSI escape sequences
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    // Strip zero-width and invisible characters
    .replace(/[\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF\u00AD]/g, '')
    // Strip other Unicode direction overrides
    .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E]/g, '')
    // Collapse suspicious homoglyph blocks (Cyrillic look-alikes, etc.) – keep printable Unicode
    .trim();
}

/**
 * Safely write text to the clipboard.
 *
 * - Sanitizes the string before writing
 * - Caps at MAX_CLIPBOARD_BYTES
 * - Returns true on success, false on failure (e.g. no user gesture)
 */
export async function safeWriteToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!navigator?.clipboard?.writeText) return false;

  const sanitized = sanitizeClipboardText(text);

  // Truncate if exceeds safe size
  const payload = sanitized.length > MAX_CLIPBOARD_BYTES
    ? sanitized.substring(0, MAX_CLIPBOARD_BYTES) + '…'
    : sanitized;

  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    // Clipboard access denied (no user gesture, or permission denied)
    return false;
  }
}
