import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { expandQuery } from '@/lib/query-expansion';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { RAGChain } from '@/lib/ai/rag-chain';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';


const EVIDENCE_THRESHOLD = 0.20;

interface SearchFilters {
  category?: string;
  district?: string;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
}

/**
 * Generate query vector embedding on the server side using Process.env.GEMINI_API_KEY
 */
async function generateQueryEmbedding(
  query: string,
  apiKey: string,
  model: string = 'text-embedding-004',
  version: string = 'v1'
): Promise<number[] | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:embedContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text: query }],
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Gemini embeddings API responded with status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const embedding: number[] = json.embedding?.values || [];

    if (embedding.length !== 1536) {
      console.warn(`Embeddings API returned ${embedding.length} dimensions, but database expects 1536. Skipping vector search.`);
      return null;
    }

    return embedding;
  } catch (err) {
    console.error('Error generating query embedding on server:', err);
    return null;
  }
}

/**
 * Helper to compute cosine similarity locally on the server
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Helper to parse pgvector string format (e.g. "[0.1, 0.2, ...]")
 */
function parseVectorString(vec: any): number[] | null {
  if (!vec) return null;
  if (Array.isArray(vec)) return vec;
  try {
    const cleaned = String(vec).replace(/[\[\]]/g, '');
    return cleaned.split(',').map(parseFloat);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const apiKey = getApiKeyForFeature('chat');

  try {
    // Rate limit check
    const rateCheck = await checkRateLimit(req, { limit: 10, refillRate: 0.1 });
    if (!rateCheck.success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Chat API rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const {
      message,
      session_id,
      document_id,
      filters = {}
    } = body as {
      message: string;
      session_id?: string;
      document_id?: string;
      filters?: SearchFilters;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    // 1. Check user authentication and role
    const { data: { user } } = await supabase.auth.getUser();
    let userRole: 'admin' | 'archivist' | 'researcher' | 'user' | 'guest' = 'guest';
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role) {
        userRole = profile.role as any;
      }
    }

    // 2. Execute modular RAG Chain
    const ragRes = await RAGChain.execute({
      message,
      documentId: document_id,
      filters: {
        district: filters.district,
        category: filters.category,
        language: filters.language,
        yearFrom: filters.yearFrom ? parseInt(filters.yearFrom.toString()) : undefined,
        yearTo: filters.yearTo ? parseInt(filters.yearTo.toString()) : undefined,
      },
      apiKey,
      userRole,
    });

    // 3. Format citations for return
    const citations = ragRes.citations.map((c) => ({
      document_id: c.documentId,
      title: c.title,
      page_number: c.pageNumber,
      snippet: c.snippet,
      relevance_score: c.score,
      citation_number: c.citationNumber,
      is_primary: true
    }));

    // 4. Save history to database if authenticated and evidence was found
    let finalSessionId = session_id || '';
    if (user && ragRes.evidenceFound) {
      try {
        if (!finalSessionId) {
          const sessionTitle = message.substring(0, 40) + (message.length > 40 ? '...' : '');
          const { data: newSession, error: sessErr } = await supabase
            .from('chat_sessions')
            .insert([{ user_id: user.id, title: sessionTitle }])
            .select('id')
            .single();

          if (sessErr) throw sessErr;
          finalSessionId = newSession.id;
        }

        // Insert User message
        await supabase.from('chat_messages').insert([{
          session_id: finalSessionId,
          user_id: user.id,
          role: 'user',
          content: message,
          citations: [],
          confidence_score: 1.0,
          feedback: null
        }]);

        // Insert Assistant message
        await supabase.from('chat_messages').insert([{
          session_id: finalSessionId,
          user_id: user.id,
          role: 'assistant',
          content: ragRes.answer,
          citations: citations,
          confidence_score: ragRes.confidenceScore,
          feedback: null
        }]);

      } catch (dbErr) {
        console.error('Error saving chat session/messages to database:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      answer: ragRes.answer,
      citations,
      confidence_score: ragRes.confidenceScore,
      used_chunks: [], 
      session_id: finalSessionId || null
    });

  } catch (error) {
    console.error('RAG Chat API failure:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Chat Server Error'
    }, { status: 500 });
  }
}
