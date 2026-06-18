import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { sanitizePromptInput } from '@/lib/security/validation';

export async function POST(req: NextRequest) {
  const rateCheck = await checkRateLimit(req, { limit: 15, refillRate: 0.2 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { text, model = 'text-embedding-004', version = 'v1' } = body;

    // ── Secret Key: server-side only ─────────────────────────────────────────
    const apiKey = getApiKeyForFeature('search');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Embedding service unavailable.' }, { status: 503 });
    }

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text content is required' }, { status: 400 });
    }

    // Whitelist model & version
    const ALLOWED_MODELS = new Set(['text-embedding-004', 'text-embedding-003']);
    const ALLOWED_VERSIONS = new Set(['v1', 'v1beta']);
    const safeModel = ALLOWED_MODELS.has(model) ? model : 'text-embedding-004';
    const safeVersion = ALLOWED_VERSIONS.has(version) ? version : 'v1';

    const texts: string[] = Array.isArray(text) ? text.slice(0, 50) : [text]; // cap batch size
    const embeddings: number[][] = [];

    for (const textItem of texts) {
      // ── SSTI guard on text before sending to external API ──────────────────
      const safeText = sanitizePromptInput(String(textItem).substring(0, 8000));

      const url = `https://generativelanguage.googleapis.com/${safeVersion}/models/${safeModel}:embedContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${safeModel}`,
          content: { parts: [{ text: safeText }] },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errMsg = err.error?.message || `API error ${response.status}`;
        if (response.status === 429) {
          return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
        }
        return NextResponse.json({ success: false, error: errMsg }, { status: response.status });
      }

      const data = await response.json();
      const values = data.embedding?.values;
      if (!values) {
        return NextResponse.json({ success: false, error: 'Invalid embedding values returned' }, { status: 502 });
      }
      embeddings.push(values);
    }

    return NextResponse.json({
      success: true,
      data: Array.isArray(text) ? embeddings : embeddings[0],
    });
  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
