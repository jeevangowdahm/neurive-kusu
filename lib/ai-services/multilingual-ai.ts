'use client';

/**
 * Multilingual AI System
 * Supports Kannada, English, Hindi for search, translation, and retrieval
 */

export type SupportedLanguage = 'en' | 'kn' | 'hi';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  alternatives: Array<{ language: SupportedLanguage; confidence: number }>;
}

export interface TranslationResult {
  original: string;
  originalLanguage: SupportedLanguage;
  translated: string;
  targetLanguage: SupportedLanguage;
  confidence: number;
}

export interface CrossLanguageSearchResult {
  query: string;
  queryLanguage: SupportedLanguage;
  expandedQueries: Map<SupportedLanguage, string[]>;
  results: Array<{
    archiveId: string;
    title: string;
    language: SupportedLanguage;
    relevance: number;
  }>;
}

/**
 * Detect language of input text
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  // Simple detection using character ranges
  let kannadaScore = 0;
  let hindiScore = 0;
  let englishScore = 0;

  const kannadaRange = /[\u0C80-\u0CFF]/g;
  const hindiRange = /[\u0900-\u097F]/g;
  const englishRange = /[a-zA-Z]/g;

  kannadaScore = (text.match(kannadaRange) || []).length;
  hindiScore = (text.match(hindiRange) || []).length;
  englishScore = (text.match(englishRange) || []).length;

  const total = kannadaScore + hindiScore + englishScore || 1;
  const scores = {
    kn: kannadaScore / total,
    hi: hindiScore / total,
    en: englishScore / total,
  };

  // Determine primary language
  const [primaryLang, primaryScore] = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0] as [SupportedLanguage, number];

  // Get alternatives
  const alternatives = Object.entries(scores)
    .filter(([lang]) => lang !== primaryLang)
    .map(([lang, score]) => ({ language: lang as SupportedLanguage, confidence: score }))
    .filter(({ confidence }) => confidence > 0.1)
    .sort((a, b) => b.confidence - a.confidence);

  return {
    language: primaryLang || 'en',
    confidence: primaryScore,
    alternatives,
  };
}

/**
 * Transliterate between scripts
 * Kannada ↔ English, Hindi ↔ English, etc.
 */
export function transliterate(
  text: string,
  from: SupportedLanguage,
  to: SupportedLanguage
): string {
  // Simple transliteration mapping (in production, use proper library)
  const transliterationMap: Record<string, Record<string, string>> = {
    'kn-en': {
      'ಕ': 'ka',
      'ನ': 'na',
      'ಡ': 'da',
      'ಧ': 'dha',
      'ಹ': 'ha',
      'ಮ': 'ma',
      'ಯ': 'ya',
      'ರ': 'ra',
      'ಲ': 'la',
      'ವ': 'va',
      'ಸ': 'sa',
      'ಶ': 'sha',
    },
    'hi-en': {
      'क': 'ka',
      'न': 'na',
      'द': 'da',
      'ध': 'dha',
      'ह': 'ha',
      'म': 'ma',
      'य': 'ya',
      'र': 'ra',
      'ल': 'la',
      'व': 'va',
      'स': 'sa',
      'श': 'sha',
    },
    'en-kn': {
      'ka': 'ಕ',
      'na': 'ನ',
      'da': 'ಡ',
      'dha': 'ಧ',
      'ha': 'ಹ',
      'ma': 'ಮ',
      'ya': 'ಯ',
      'ra': 'ರ',
      'la': 'ಲ',
      'va': 'ವ',
      'sa': 'ಸ',
    },
  };

  const mapKey = `${from}-${to}`;
  const map = transliterationMap[mapKey] || {};

  let result = text;
  for (const [source, target] of Object.entries(map)) {
    result = result.replace(new RegExp(source, 'g'), target);
  }

  return result;
}

/**
 * Translate text between supported languages
 * Mock implementation - in production, use actual translation API
 */
export async function translate(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<TranslationResult> {
  // If same language, return as-is
  if (sourceLanguage === targetLanguage) {
    return {
      original: text,
      originalLanguage: sourceLanguage,
      translated: text,
      targetLanguage,
      confidence: 1,
    };
  }

  // In production, call real translation service (Google Translate, etc.)
  // For now, use transliteration as mock
  const translated = transliterate(text, sourceLanguage, targetLanguage);

  return {
    original: text,
    originalLanguage: sourceLanguage,
    translated,
    targetLanguage,
    confidence: 0.7, // Mock confidence
  };
}

/**
 * Expand search query across languages
 */
export async function expandQueryMultilingual(query: string): Promise<Map<SupportedLanguage, string[]>> {
  // Detect query language
  const detection = detectLanguage(query);
  const sourceLanguage = detection.language;

  const expanded = new Map<SupportedLanguage, string[]>();

  // Add original query
  expanded.set(sourceLanguage, [query]);

  // Translate to other languages
  const targetLanguages: SupportedLanguage[] = (['en', 'kn', 'hi'] as SupportedLanguage[]).filter(
    (lang) => lang !== sourceLanguage
  );

  for (const targetLang of targetLanguages) {
    try {
      const result = await translate(query, sourceLanguage, targetLang);
      expanded.set(targetLang, [result.translated]);

      // Add variations and synonyms
      const variations = generateQueryVariations(result.translated, targetLang);
      expanded.get(targetLang)!.push(...variations);
    } catch (error) {
      console.error(`Translation to ${targetLang} failed:`, error);
    }
  }

  return expanded;
}

/**
 * Generate query variations for a language
 */
function generateQueryVariations(query: string, language: SupportedLanguage): string[] {
  const variations: string[] = [];

  // Language-specific variations
  const variationMaps: Record<SupportedLanguage, Record<string, string[]>> = {
    en: {
      land: ['property', 'territory', 'estate'],
      court: ['judicial', 'legal', 'justice'],
      temple: ['shrine', 'sanctuary', 'religious site'],
    },
    kn: {
      'ನೆಲ': ['ಸ್ವತ್ತು', 'ಭೂಮಿ'],
      'ನ್ಯಾಯಾಲಯ': ['ವಿಚಾರಣೆ', 'ಶಾಸನ'],
    },
    hi: {
      'भूमि': ['जमीन', 'संपत्ति'],
      'अदालत': ['न्यायालय', 'कानूनी'],
    },
  };

  const maps = variationMaps[language] || {};
  for (const [key, values] of Object.entries(maps)) {
    if (query.includes(key)) {
      values.forEach((val) => {
        variations.push(query.replace(key, val));
      });
    }
  }

  return variations;
}

/**
 * Perform cross-language search
 */
export async function crossLanguageSearch(
  query: string,
  searchFunction: (query: string, language: SupportedLanguage) => Promise<any[]>
): Promise<CrossLanguageSearchResult> {
  // Detect source language
  const detection = detectLanguage(query);
  const sourceLanguage = detection.language;

  // Expand query across languages
  const expandedQueries = await expandQueryMultilingual(query);

  // Search in all languages
  const results: Array<{
    archiveId: string;
    title: string;
    language: SupportedLanguage;
    relevance: number;
  }> = [];

  for (const [language, queries] of expandedQueries) {
    for (const expandedQuery of queries) {
      try {
        const langResults = await searchFunction(expandedQuery, language);
        results.push(
          ...langResults.map((r) => ({
            archiveId: r.id,
            title: r.title,
            language,
            relevance: r.relevance || 0.5,
          }))
        );
      } catch (error) {
        console.error(`Search in ${language} failed:`, error);
      }
    }
  }

  // Deduplicate results by archive ID
  const dedupMap = results.reduce((map, result) => {
    const existing = map.get(result.archiveId);
    if (!existing || result.relevance > existing.relevance) {
      map.set(result.archiveId, result);
    }
    return map;
  }, new Map<string, typeof results[0]>());
  const deduped: typeof results = [];
  dedupMap.forEach((v) => deduped.push(v));

  return {
    query,
    queryLanguage: sourceLanguage,
    expandedQueries,
    results: deduped.sort((a, b) => b.relevance - a.relevance),
  };
}

/**
 * Language-specific ranking adjustment
 */
export function adjustRankingByLanguage(
  results: Array<{ language: SupportedLanguage; relevance: number }>,
  queryLanguage: SupportedLanguage
): number {
  // Give slight boost to results in query language
  const languageBoosts: Record<SupportedLanguage, number> = {
    en: 1,
    kn: 1,
    hi: 1,
  };

  return results.reduce(
    (score, result) =>
      score +
      result.relevance *
        (result.language === queryLanguage
          ? languageBoosts[result.language] * 1.1
          : languageBoosts[result.language]),
    0
  ) / results.length;
}

/**
 * Get language-specific UI labels
 */
export const languageLabels: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  hi: { name: 'Hindi', nativeName: 'हिंदी' },
};

/**
 * Format date in language-specific way
 */
export function formatDateMultilingual(date: Date | string, language: SupportedLanguage): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatters: Record<SupportedLanguage, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    kn: new Intl.DateTimeFormat('kn-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    hi: new Intl.DateTimeFormat('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  return formatters[language].format(dateObj);
}
