import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { sanitizePromptInput } from '@/lib/security/validation';

export async function POST(req: NextRequest) {
  const rateCheck = await checkRateLimit(req, { limit: 10, refillRate: 0.1 });
  if (!rateCheck.success) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { model = 'gemini-1.5-flash', version = 'v1', query, searchResults = [] } = body;

    // ── Secret Key: server-side only ─────────────────────────────────────────
    const apiKey = getApiKeyForFeature('search');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI service unavailable.' }, { status: 503 });
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Whitelist model & version
    const ALLOWED_MODELS = new Set([
      'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b',
    ]);
    const ALLOWED_VERSIONS = new Set(['v1', 'v1beta']);
    const safeModel = ALLOWED_MODELS.has(model) ? model : 'gemini-1.5-flash';
    const safeVersion = ALLOWED_VERSIONS.has(version) ? version : 'v1';

    // ── SSTI guard ────────────────────────────────────────────────────────────
    const safeQuery = sanitizePromptInput(query.substring(0, 500));

    const resultsContext = (Array.isArray(searchResults) ? searchResults : [])
      .slice(0, 5)
      .map((r: any, i: number) =>
        `[Document #${i + 1}]\nTitle: ${sanitizePromptInput(String(r.title || ''))}\nSource: ${sanitizePromptInput(String(r.source || ''))}\nYear: ${sanitizePromptInput(String(r.year || ''))}\nDescription: ${sanitizePromptInput(String(r.description || 'No description'))}`
      )
      .join('\n\n');

    const prompt = `You are Neurive's Semantic Search Summarizer.
Analyze the search results provided below for the user query: "${safeQuery}".
Return ONLY raw JSON with this structure:
{
  "answer": "Detailed answer matching the query language",
  "explanation": "Brief sentence explaining the search query intent.",
  "summary": "Concise 1-2 sentence overview summary.",
  "search_terms": ["term1", "term2", "term3"],
  "suggested_categories": ["CategoryName1", "CategoryName2"],
  "suggested_districts": ["DistrictName1", "DistrictName2"],
  "relatedEntities": [{"name": "EntityName", "type": "person/place/event"}],
  "confidence": 0.9
}

Documents context:
${resultsContext}`;

    const candidates = [
      { version: safeVersion, model: safeModel },
      { version: 'v1', model: 'gemini-1.5-flash' },
    ];

    let lastError = 'Gemini request failed';

    for (const candidate of candidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
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

        return NextResponse.json({ success: true, data: JSON.parse(text.trim()) });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({ success: false, error: 'AI service temporarily unavailable.' }, { status: 502 });
  } catch (error) {
    console.error('Search summary API error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
