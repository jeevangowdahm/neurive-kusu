import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey, model = 'gemini-1.5-flash', version = 'v1', query, searchResults = [] } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ success: false, error: 'Gemini API key is required' }, { status: 400 });
  }

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
  }

  const resultsContext = searchResults
    .slice(0, 5)
    .map((r: any, i: number) =>
      `[Document #${i + 1}]\nTitle: ${r.title}\nSource: ${r.source}\nYear: ${r.year}\nDescription: ${r.description || 'No description'}`
    )
    .join('\n\n');

  const prompt = `You are Neurive's Semantic Search Summarizer.
Analyze the search results provided below for the user query: "${query}".
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
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
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

      return NextResponse.json({ success: true, data: JSON.parse(text.trim()) });
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
