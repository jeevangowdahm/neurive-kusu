import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { sanitizePromptInput } from '@/lib/security/validation';

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rateCheck = await checkRateLimit(req, { limit: 8, refillRate: 0.08 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      image, // base64 string
      mimeType = 'image/jpeg',
      model = 'gemini-1.5-flash',
      version = 'v1',
    } = body;

    // ── Secret Key: NEVER accept from client body ────────────────────────────
    const apiKey = getApiKeyForFeature('agent');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'OCR service unavailable.' }, { status: 503 });
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ success: false, error: 'Base64 image is required' }, { status: 400 });
    }

    // ── Limit image payload size (prevent DoS via huge base64 upload) ────────
    if (image.length > 20 * 1024 * 1024) { // ~15 MB base64
      return NextResponse.json({ success: false, error: 'Image payload too large.' }, { status: 413 });
    }

    // Whitelist model & version to prevent injection via these parameters
    const ALLOWED_MODELS = new Set([
      'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b',
    ]);
    const ALLOWED_VERSIONS = new Set(['v1', 'v1beta']);
    const safeModel = ALLOWED_MODELS.has(model) ? model : 'gemini-1.5-flash';
    const safeVersion = ALLOWED_VERSIONS.has(version) ? version : 'v1';

    // Whitelist MIME types
    const ALLOWED_MIMES = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/gif', 'application/pdf',
    ]);
    const safeMime = ALLOWED_MIMES.has(mimeType) ? mimeType : 'image/jpeg';

    // Remove base64 data header if present
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    // ── Hardcoded system prompt (not user-controlled = no SSTI) ──────────────
    const systemPrompt = `You are the chief archivist agent for the Karnataka State Digital Archives.
Perform high-fidelity OCR, translation, and structured entity extraction on this historical document scan.
Identify the script (English, Kannada, or both), and transcribe all visible text line-by-line.
Verify historic spellings and dates.

Return ONLY raw JSON with this exact structure:
{
  "text": "Full original transcribed text...",
  "translation": "Complete English translation if written in Kannada...",
  "summary": "A 1-2 sentence high-level summary.",
  "explanation": "Detailed historical significance.",
  "document_type": "land_deed/court_order/manuscript/gazette/temple_record/revenue_register/report",
  "entities": [{"name": "Entity Name", "type": "person/place/event/organization/date"}],
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}`;

    const candidates = [
      { version: safeVersion, model: safeModel },
      { version: 'v1', model: 'gemini-1.5-flash' },
    ];

    let lastError = 'OCR processing failed';

    for (const candidate of candidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { inlineData: { mimeType: safeMime, data: base64Data } },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          lastError = err.error?.message || `API error ${response.status}`;
          if (response.status === 429) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
          }
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) { lastError = 'Empty response'; continue; }

        const parsedResult = JSON.parse(text.trim());
        return NextResponse.json({ success: true, data: parsedResult });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({ success: false, error: 'OCR service temporarily unavailable.' }, { status: 502 });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
