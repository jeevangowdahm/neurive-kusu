'use client';

import { supabase } from '@/lib/supabase';

/**
 * RAG (Retrieval Augmented Generation) Pipeline
 * Retrieves relevant documents and generates grounded answers
 */

export interface RAGContext {
  query: string;
  retrievedChunks: ChunkResult[];
  sources: SourceReference[];
  confidence: number;
}

export interface ChunkResult {
  chunkId: string;
  archiveId: string;
  content: string;
  similarity: number;
  source: string;
}

export interface SourceReference {
  archiveId: string;
  title: string;
  url: string;
  relevance: number;
  citationText: string;
}

export interface RAGAnswer {
  answer: string;
  sources: SourceReference[];
  confidence: number;
  followUpQuestions: string[];
  metadata: {
    retrievalTime: number;
    chunkCount: number;
    sourceCount: number;
  };
}

/**
 * Retrieve context chunks for RAG
 */
export async function retrieveContext(
  query: string,
  limit: number = 5,
  similarityThreshold: number = 0.5
): Promise<RAGContext> {
  try {
    const startTime = Date.now();

    // Get chunk embeddings (in production, would use real embeddings)
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select(
        `
        id,
        archive_id,
        content,
        chunk_index,
        archives (
          id,
          title,
          file_url,
          thumbnail_url
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to chunk results
    const chunkResults: ChunkResult[] = (chunks || [])
      .map((chunk: any) => ({
        chunkId: chunk.id,
        archiveId: chunk.archive_id,
        content: chunk.content,
        similarity: Math.random() * 0.5 + 0.5, // Mock similarity
        source: chunk.archives?.title || 'Unknown',
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // Extract unique sources
    const sourceMap = new Map<string, SourceReference>();
    chunkResults.forEach((chunk) => {
      if (!sourceMap.has(chunk.archiveId)) {
        sourceMap.set(chunk.archiveId, {
          archiveId: chunk.archiveId,
          title: chunk.source,
          url: `/archive/${chunk.archiveId}`,
          relevance: chunk.similarity,
          citationText: chunk.content.substring(0, 100) + '...',
        });
      }
    });

    return {
      query,
      retrievedChunks: chunkResults,
      sources: (() => { const arr: any[] = []; sourceMap.forEach((v) => arr.push(v)); return arr; })(),
      confidence: Math.min(chunkResults.length / limit, 1),
    };
  } catch (error) {
    console.error('Context retrieval error:', error);
    return {
      query,
      retrievedChunks: [],
      sources: [],
      confidence: 0,
    };
  }
}

/**
 * Generate answer from retrieved context
 */
export async function generateRAGAnswer(context: RAGContext): Promise<RAGAnswer> {
  try {
    // Build context string from chunks
    const contextString = context.retrievedChunks
      .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
      .join('\n\n');

    // Generate answer (mock for production, use real LLM)
    const answer = generateAnswerFromContext(context.query, contextString, context.sources);

    // Generate follow-up questions
    const followUps = generateFollowUpQuestions(context.query);

    return {
      answer,
      sources: context.sources,
      confidence: context.confidence,
      followUpQuestions: followUps,
      metadata: {
        retrievalTime: 100, // Mock
        chunkCount: context.retrievedChunks.length,
        sourceCount: context.sources.length,
      },
    };
  } catch (error) {
    console.error('Answer generation error:', error);
    return {
      answer: 'Unable to generate answer. Please try again.',
      sources: context.sources,
      confidence: 0,
      followUpQuestions: [],
      metadata: {
        retrievalTime: 0,
        chunkCount: 0,
        sourceCount: 0,
      },
    };
  }
}

/**
 * Generate answer text from context (mock implementation)
 */
function generateAnswerFromContext(query: string, context: string, sources: SourceReference[]): string {
  // In production, this would use a real LLM API with prompt engineering
  // For now, generate a contextual answer

  const templates: Record<string, string> = {
    'what is': `Based on the archival records, the answer to your question about "${query.replace('what is', '').trim()}" can be found in ${sources.length > 0 ? `${sources[0].title}` : 'the archives'}. `,
    'when did': `According to historical documents, the event occurred during the period documented in ${sources.length > 0 ? sources[0].title : 'the records'}. `,
    'who was': `The person you're asking about is referenced in multiple historical archives, particularly in ${sources.length > 0 ? sources[0].title : 'archival records'}. `,
    'where is': `The location mentioned in your query is documented in ${sources.length > 0 ? sources[0].title : 'geographical records'}. `,
  };

  let answer = 'Based on the available archival evidence, ';

  for (const [key, template] of Object.entries(templates)) {
    if (query.toLowerCase().startsWith(key)) {
      answer = template;
      break;
    }
  }

  answer += `The records contain detailed information that provides context for understanding this aspect of Karnataka's history.`;

  if (sources.length > 0) {
    answer += ` This information is sourced from ${sources.map((s) => `"${s.title}"`).join(', ')}.`;
  }

  return answer;
}

/**
 * Generate relevant follow-up questions
 */
function generateFollowUpQuestions(originalQuery: string): string[] {
  const followUps = [
    `What is the historical context of ${originalQuery}?`,
    `Which districts were most affected by ${originalQuery}?`,
    `What were the long-term consequences of ${originalQuery}?`,
    `Who were the key figures involved in ${originalQuery}?`,
    `What primary sources document ${originalQuery}?`,
  ];

  return followUps.slice(0, 3);
}

/**
 * Stream RAG response (for real-time UI updates)
 * Returns an array of chunks that can be rendered progressively
 */
export async function streamRAGAnswer(context: RAGContext): Promise<string[]> {
  const chunks: string[] = [];
  try {
    // Source information first
    chunks.push(`Sources: ${context.sources.map((s) => s.title).join(', ')}\n\n`);

    // Answer chunks (simulated streaming)
    const answer = generateAnswerFromContext(context.query, '', context.sources);
    const words = answer.split(' ');

    for (let i = 0; i < words.length; i += 3) {
      chunks.push(words.slice(i, i + 3).join(' ') + ' ');
    }

    // Citations
    chunks.push(`\n\nCitations:\n`);
    for (const source of context.sources) {
      chunks.push(`- [${source.title}](${source.url})\n`);
    }
  } catch (error) {
    chunks.push(`Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  return chunks;
}

/**
 * Chat with RAG (multi-turn conversation)
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  timestamp?: number;
}

export class RAGChat {
  private conversationHistory: ConversationMessage[] = [];
  private maxHistory = 10;

  addMessage(role: 'user' | 'assistant', content: string, sources?: SourceReference[]): void {
    this.conversationHistory.push({
      role,
      content,
      sources,
      timestamp: Date.now(),
    });

    // Keep history size manageable
    if (this.conversationHistory.length > this.maxHistory) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
    }
  }

  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  getContext(): string {
    return this.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async respondToQuery(query: string): Promise<RAGAnswer> {
    // Add user message
    this.addMessage('user', query);

    // Retrieve context
    const context = await retrieveContext(query);

    // Generate answer
    const answer = await generateRAGAnswer(context);

    // Add assistant message
    this.addMessage('assistant', answer.answer, answer.sources);

    return answer;
  }
}

/**
 * Hallucination detection - ensure responses are grounded in sources
 */
export function detectHallucination(answer: string, sourceContent: string): number {
  // Calculate how much of the answer is supported by source content
  const answerWords = new Set(answer.toLowerCase().split(/\s+/));
  const sourceWords = new Set(sourceContent.toLowerCase().split(/\s+/));

  const coverage = Array.from(answerWords).filter((word) => sourceWords.has(word)).length /
    answerWords.size || 0;

  // Hallucination score: 1 = fully grounded, 0 = not grounded
  return Math.min(coverage, 1);
}

/**
 * Confidence scoring for answers
 */
export function scoreAnswerConfidence(
  answerLength: number,
  sourceCount: number,
  averageSimilarity: number
): number {
  // Factors:
  // - Answer length (longer = more detailed, up to a point)
  // - Number of sources (more sources = more evidence)
  // - Average similarity of sources

  const lengthScore = Math.min(answerLength / 500, 1) * 0.3;
  const sourceScore = Math.min(sourceCount / 5, 1) * 0.3;
  const similarityScore = averageSimilarity * 0.4;

  return Math.min(lengthScore + sourceScore + similarityScore, 1);
}
