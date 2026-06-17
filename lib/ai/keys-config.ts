// Central Gemini API Keys Configuration Manager
// Maps each of the 5 different API keys to a specific system feature

export const DEFAULT_GEMINI_KEYS = {
  search: process.env.GEMINI_KEY_SEARCH || '',
  agent: process.env.GEMINI_KEY_AGENT || '',
  chat: process.env.GEMINI_KEY_CHAT || '',
  finding: process.env.GEMINI_KEY_FINDING || '',
  graph: process.env.GEMINI_KEY_GRAPH || ''
};

export type GeminiFeature = 'search' | 'agent' | 'chat' | 'finding' | 'graph';

/**
 * Retrieves the appropriate Gemini API key for a given feature.
 * Prioritizes user overrides stored in localStorage (on the client side)
 * or environment variables (on the server side).
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
    default:
      return baseKey;
  }
}
