/**
 * Neurive AI Services Module
 * Unified interface for all AI-powered archival intelligence features
 */

// Hybrid Search
export * from './hybrid-search';
export { hybridSearch, vectorSearch, bm25Search } from './hybrid-search';

// RAG Pipeline
export * from './rag-pipeline';
export { retrieveContext, generateRAGAnswer, RAGChat, streamRAGAnswer } from './rag-pipeline';

// Knowledge Graph
export * from './knowledge-graph';
export {
  buildKnowledgeGraph,
  findRelatedEntities,
  searchEntities,
  addEntity,
  addRelationship,
} from './knowledge-graph';

// Multilingual AI
export * from './multilingual-ai';
export {
  detectLanguage,
  transliterate,
  translate,
  expandQueryMultilingual,
  crossLanguageSearch,
} from './multilingual-ai';

// Multimodal Search
export * from './multimodal-search';
export {
  imageSearch,
  multimodalSearch,
  storeImageEmbedding,
  clusterSimilarImages,
  mapSearch,
} from './multimodal-search';

// OCR Pipeline
export * from './ocr-pipeline';
export { processDocumentPipeline, chunkDocument, getOCRJobStatus } from './ocr-pipeline';

// Ingestion Queue
export * from './ingestion-queue';
export {
  queueDocumentIngestion,
  processNextInQueue,
  getIngestionMetrics,
  bulkQueueDocuments,
} from './ingestion-queue';

// Caching Layer
export * from './cache-layer';
export { searchCache, graphCache, ragCache, invalidateArchiveCache, QueryBatcher } from './cache-layer';

/**
 * Main AI Service Orchestrator
 */
export class NeuriveAIServices {
  /**
   * Execute comprehensive AI search across all modalities
   */
  static async intelligentSearch(query: string, options?: { includeMultimodal?: boolean }) {
    const results: {
      keyword: any[];
      semantic: any[];
      entities: any[];
      multimodal: any[];
    } = {
      keyword: [],
      semantic: [],
      entities: [],
      multimodal: [],
    };

    // Run searches in parallel
    const [hybrid, entities] = await Promise.all([
      import('./hybrid-search').then((m) => m.hybridSearch({ query, limit: 10 })),
      import('./knowledge-graph').then((m) => m.searchEntities(query)),
    ]);

    results.keyword = hybrid;
    results.entities = entities;

    // Optional: multimodal search
    if (options?.includeMultimodal) {
      const multimodal = await import('./multimodal-search').then((m) =>
        m.multimodalSearch(query, undefined, 5)
      );
      results.multimodal = multimodal;
    }

    return results;
  }

  /**
   * Generate intelligent answer with context
   */
  static async answerQuestion(question: string) {
    const { retrieveContext, generateRAGAnswer } = await import('./rag-pipeline');

    const context = await retrieveContext(question);
    const answer = await generateRAGAnswer(context);

    return answer;
  }

  /**
   * Build and traverse knowledge graph
   */
  static async exploreHistory(entityName: string) {
    const { searchEntities, findRelatedEntities, buildKnowledgeGraph } = await import(
      './knowledge-graph'
    );

    // Find entity
    const entities = await searchEntities(entityName);
    if (entities.length === 0) return null;

    const entity = entities[0];

    // Build graph around entity
    const [relatedEntities, fullGraph] = await Promise.all([
      findRelatedEntities(entity.id, 2),
      buildKnowledgeGraph(),
    ]);

    return {
      entity,
      relatedEntities,
      graph: fullGraph,
    };
  }

  /**
   * Search across languages
   */
  static async searchMultilingually(query: string) {
    const { crossLanguageSearch, detectLanguage } = await import('./multilingual-ai');

    const detection = detectLanguage(query);

    const results = await crossLanguageSearch(query, async (q, lang) => {
      return []; // Would call actual search
    });

    return {
      detectedLanguage: detection,
      results,
    };
  }

  /**
   * Process document with full AI pipeline
   */
  static async processDocument(archiveId: string) {
    const { processDocumentPipeline, getOCRJobStatus } = await import('./ocr-pipeline');

    // Start processing
    await processDocumentPipeline(archiveId);

    // Get status
    const status = await getOCRJobStatus(archiveId);

    return status;
  }

  /**
   * Get ingestion pipeline metrics
   */
  static async getSystemMetrics() {
    const { getIngestionMetrics } = await import('./ingestion-queue');
    const { getGlobalCacheStats } = await import('./cache-layer');

    const [ingestion, cache] = await Promise.all([getIngestionMetrics(), Promise.resolve(getGlobalCacheStats())]);

    return {
      ingestion,
      cache,
      timestamp: Date.now(),
    };
  }
}

/**
 * Export singleton instance
 */
export const aiServices = NeuriveAIServices;
