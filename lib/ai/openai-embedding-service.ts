import { getApiKeyForFeature } from './keys-config';

export interface OpenAIEmbeddingResult {
  embedding: number[];
  model: string;
  dimension: number;
  status: 'generated' | 'failed';
  error?: string;
}

/**
 * OpenAI Embedding Service for text-embedding-3-small
 * Used as primary embedding provider for superior semantic search
 */
export class OpenAIEmbeddingService {
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private static readonly DIMENSION = 1536;

  static async generateEmbedding(text: string): Promise<OpenAIEmbeddingResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        embedding: [],
        model: this.EMBEDDING_MODEL,
        dimension: 0,
        status: 'failed',
        error: 'OPENAI_API_KEY not configured'
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.EMBEDDING_MODEL,
          input: text.slice(0, 8000), // OpenAI token limit safety
          dimensions: this.DIMENSION
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `OpenAI API error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding || [];

      if (embedding.length !== this.DIMENSION) {
        throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
      }

      return {
        embedding,
        model: this.EMBEDDING_MODEL,
        dimension: this.DIMENSION,
        status: 'generated'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown OpenAI embedding error';
      console.error('OpenAI embedding error:', errorMsg);
      return {
        embedding: [],
        model: this.EMBEDDING_MODEL,
        dimension: 0,
        status: 'failed',
        error: errorMsg
      };
    }
  }

  static async generateBatchEmbeddings(texts: string[]): Promise<OpenAIEmbeddingResult[]> {
    const results: OpenAIEmbeddingResult[] = [];
    for (const text of texts) {
      const result = await this.generateEmbedding(text);
      results.push(result);
    }
    return results;
  }
}
