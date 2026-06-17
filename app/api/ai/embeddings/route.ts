import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiKey,
      text, // string or string[]
      model = 'text-embedding-004',
      version = 'v1',
    } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ success: false, error: 'Gemini API key is required' }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text content is required' }, { status: 400 });
    }

    const texts = Array.isArray(text) ? text : [text];
    const embeddings: number[][] = [];

    // Loop through texts and get embeddings from Gemini API
    for (const textItem of texts) {
      try {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:embedContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${model}`,
            content: {
              parts: [{ text: textItem }],
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `Embedding API responded with status ${response.status}`;
          return NextResponse.json({ success: false, error: errMsg }, { status: response.status });
        }

        const data = await response.json();
        const values = data.embedding?.values;
        if (!values) {
          return NextResponse.json({ success: false, error: 'Invalid embedding values returned' }, { status: 502 });
        }

        embeddings.push(values);
      } catch (err) {
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
      }
    }

    // Return floats array
    return NextResponse.json({ 
      success: true, 
      data: Array.isArray(text) ? embeddings : embeddings[0] 
    });
  } catch (error) {
    console.error('Embeddings API endpoint crash:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server Error' }, { status: 500 });
  }
}
