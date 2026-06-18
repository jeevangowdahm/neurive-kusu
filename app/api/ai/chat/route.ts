import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { sanitizePromptInput } from '@/lib/security/validation';

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rateCheck = await checkRateLimit(req, { limit: 10, refillRate: 0.1 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      model = 'gemini-1.5-flash',
      version = 'v1',
      prompt,
      context = 'No specific document context provided.',
    } = body;

    // ── Secret Key: NEVER accept from client body ────────────────────────────
    // Always read the key from the server-side environment only.
    const apiKey = getApiKeyForFeature('chat');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI service unavailable.' }, { status: 503 });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // ── SSTI / Prompt-Injection guard ────────────────────────────────────────
    const safePrompt = sanitizePromptInput(prompt);
    const safeContext = sanitizePromptInput(String(context).substring(0, 4000));

    // Whitelist model names to prevent injection via model parameter
    const ALLOWED_MODELS = new Set([
      'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro',
      'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp',
    ]);
    const ALLOWED_VERSIONS = new Set(['v1', 'v1beta']);
    const safeModel = ALLOWED_MODELS.has(model) ? model : 'gemini-1.5-flash';
    const safeVersion = ALLOWED_VERSIONS.has(version) ? version : 'v1';

    const systemInstruction = `You are Neurive, the AI assistant for the Karnataka Digital Archives.
Help users explore Karnataka history, archives, land records, literature, and government gazettes.
Use the provided context when relevant and answer in the user's language when practical.

Context:
${safeContext}`;

    const candidates = [
      { version: safeVersion, model: safeModel },
      { version: 'v1', model: 'gemini-1.5-flash' },
    ].filter((c, i, arr) =>
      arr.findIndex((x) => x.version === c.version && x.model === c.model) === i
    );

    let lastError = 'Gemini request failed';

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
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${safePrompt}` }],
              },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
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

        return NextResponse.json({ success: true, data: text });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({ success: false, error: 'AI service temporarily unavailable.' }, { status: 502 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
