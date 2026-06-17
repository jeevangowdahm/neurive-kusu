import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiKey,
      image, // base64 string
      mimeType = 'image/jpeg',
      language = 'both',
      model = 'gemini-1.5-flash',
      version = 'v1',
    } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ success: false, error: 'Gemini API key is required' }, { status: 400 });
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ success: false, error: 'Base64 image is required' }, { status: 400 });
    }

    // Remove base64 data header if present
    const base64Data = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    const systemPrompt = `You are the chief archivist agent for the Karnataka State Digital Archives.
Perform high-fidelity OCR, translation, and structured entity extraction on this historical document scan.
Identify the script (English, Kannada, or both), and transcribe all visible text line-by-line.
Verify historic spellings and dates.

Return ONLY raw JSON with this exact structure:
{
  "text": "Full original transcribed text...",
  "translation": "Complete English translation if written in Kannada, or Kannada translation if written in English...",
  "summary": "A 1-2 sentence high-level summary of the document.",
  "explanation": "A detailed explanation of its historical significance, transactions, or decrees.",
  "document_type": "land_deed/court_order/manuscript/gazette/temple_record/revenue_register/report",
  "entities": [
    {"name": "Entity Name", "type": "person/place/event/organization/date"}
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}`;

    const candidates = [
      { version, model },
      { version: 'v1', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
    ];

    let preferredError = '';
    let lastError = 'OCR processing failed';

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
                parts: [
                  { text: systemPrompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `Gemini API responded with status ${response.status}`;
          
          if (i === 0) preferredError = errMsg;
          lastError = errMsg;
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = 'Empty response from Gemini OCR';
          continue;
        }

        const parsedResult = JSON.parse(text.trim());
        return NextResponse.json({ success: true, data: parsedResult });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (i === 0) preferredError = errMsg;
        lastError = errMsg;
      }
    }

    return NextResponse.json({ success: false, error: preferredError || lastError }, { status: 502 });
  } catch (error) {
    console.error('OCR API endpoint crash:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server Error' }, { status: 500 });
  }
}
