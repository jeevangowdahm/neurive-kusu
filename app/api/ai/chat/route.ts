import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    model = 'gemini-1.5-flash',
    version = 'v1',
    prompt,
    context = 'No specific document context provided.',
  } = body;

  const apiKey = body.apiKey || getApiKeyForFeature('chat');

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ success: false, error: 'Gemini API key is required' }, { status: 400 });
  }

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
  }

  const systemInstruction = `You are Neurive, the AI assistant for the Karnataka Digital Archives.
Help users explore Karnataka history, archives, land records, literature, and government gazettes.
Use the provided context when relevant and answer in the user's language when practical.

Context:
${context}`;

  const candidates = [
    { version, model },
    { version: 'v1', model: 'gemini-1.5-flash' },
    { version: 'v1beta', model: 'gemini-1.5-flash' },
    { version: 'v1', model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash' },
  ].filter((candidate, index, arr) =>
    arr.findIndex((item) => item.version === candidate.version && item.model === candidate.model) === index
  );

  let preferredError = '';
  let lastError = 'Gemini request failed';

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Gemini API responded with status ${response.status}`;
        
        if (i === 0) {
          preferredError = errMsg;
        }

        const lowerMsg = errMsg.toLowerCase();
        if (response.status === 400 && (lowerMsg.includes('key') || lowerMsg.includes('invalid'))) {
          return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }
        if (response.status === 403) {
          return NextResponse.json({ success: false, error: errMsg }, { status: 403 });
        }
        if (response.status === 429) {
          return NextResponse.json({ success: false, error: errMsg }, { status: 429 });
        }

        lastError = errMsg;
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = 'Empty response from Gemini';
        continue;
      }

      return NextResponse.json({ success: true, data: text });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (i === 0) {
        preferredError = errMsg;
      }
      lastError = errMsg;
    }
  }

  return NextResponse.json({ success: false, error: preferredError || lastError }, { status: 502 });
}
