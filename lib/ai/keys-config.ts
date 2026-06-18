// Central Gemini API Keys Configuration Manager
// Maps each of the 6 different API keys to specific system features
// All keys fall back to GEMINI_API_KEY as the primary fallback

export const DEFAULT_GEMINI_KEYS = {
  search: process.env.GEMINI_KEY_SEARCH || process.env.GEMINI_API_KEY || '',
  agent: process.env.GEMINI_KEY_AGENT || process.env.GEMINI_API_KEY || '',
  chat: process.env.GEMINI_KEY_CHAT || process.env.GEMINI_API_KEY || '',
  finding: process.env.GEMINI_KEY_FINDING || process.env.GEMINI_API_KEY || '',
  graph: process.env.GEMINI_KEY_GRAPH || process.env.GEMINI_API_KEY || '',
  other: process.env.GEMINI_KEY_OTHER || process.env.GEMINI_API_KEY || ''
};

export type GeminiFeature = 'search' | 'agent' | 'chat' | 'finding' | 'graph' | 'other';

// Feature descriptions for admin UI
export const FEATURE_DESCRIPTIONS: Record<GeminiFeature, string> = {
  search: 'Search functionality - hybrid search, query understanding, result ranking',
  agent: 'AI agents - document analysis, summarization, insight extraction',
  chat: 'RAG chatbot - conversational AI, document Q&A',
  finding: 'Document finding - smart discovery, recommendation engine',
  graph: 'Knowledge graph - entity extraction, relationship mapping',
  other: 'Other operations - OCR, embeddings fallback, misc AI tasks'
};

/**
 * Retrieves the appropriate Gemini API key for a given feature.
 * Cascading fallback: feature-specific key -> GEMINI_API_KEY -> empty string
 */
export function getApiKeyForFeature(feature: GeminiFeature): string {
  const baseKey = process.env.GEMINI_API_KEY || '';

  switch (feature) {
    case 'search':
      return process.env.GEMINI_KEY_SEARCH || baseKey;
    case 'agent':
      return process.env.GEMINI_KEY_AGENT || baseKey;
    case 'chat':
      return process.env.GEMINI_KEY_CHAT || baseKey;
    case 'finding':
      return process.env.GEMINI_KEY_FINDING || baseKey;
    case 'graph':
      return process.env.GEMINI_KEY_GRAPH || baseKey;
    case 'other':
      return process.env.GEMINI_KEY_OTHER || baseKey;
    default:
      return baseKey;
  }
}

/**
 * Get all configured keys (masked for admin display)
 */
export function getConfiguredKeys(): Record<GeminiFeature, { configured: boolean; masked: string }> {
  const features: GeminiFeature[] = ['search', 'agent', 'chat', 'finding', 'graph', 'other'];
  return features.reduce((acc, feature) => {
    const key = getApiKeyForFeature(feature);
    acc[feature] = {
      configured: !!key,
      masked: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : 'Not configured'
    };
    return acc;
  }, {} as Record<GeminiFeature, { configured: boolean; masked: string }>);
}
