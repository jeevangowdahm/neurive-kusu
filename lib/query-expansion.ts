/**
 * Multilingual and Karnataka-specific query expansion dictionary
 */
export const QUERY_EXPANSION_DICTIONARY: Record<string, string[]> = {
  // Mysore / Mysuru variations
  'mysore': ['Mysuru', 'ಮೈಸೂರು', 'Mysore'],
  'mysuru': ['ಮೈಸೂರು', 'Mysore', 'Mysuru'],
  'ಮೈಸೂರು': ['Mysore', 'Mysuru', 'ಮೈಸೂರು'],

  // Bangalore / Bengaluru variations
  'bangalore': ['Bengaluru', 'ಬೆಂಗಳೂರು', 'Bangalore'],
  'bengaluru': ['ಬೆಂಗಳೂರು', 'Bangalore', 'Bengaluru'],
  'ಬೆಂಗಳೂರು': ['Bangalore', 'Bengaluru', 'ಬೆಂಗಳೂರು'],

  // Mangalore / Mangaluru variations
  'mangalore': ['Mangaluru', 'ಮಂಗಳೂರು', 'Mangalore'],
  'mangaluru': ['ಮಂಗಳೂರು', 'Mangalore', 'Mangaluru'],
  'ಮಂಗಳೂರು': ['Mangalore', 'Mangaluru', 'ಮಂಗಳೂರು'],

  // Belgaum / Belagavi variations
  'belgaum': ['Belagavi', 'ಬೆಳಗಾವಿ', 'Belgaum'],
  'belagavi': ['ಬೆಳಗಾವಿ', 'Belgaum', 'Belagavi'],
  'ಬೆಳಗಾವಿ': ['Belgaum', 'Belagavi', 'ಬೆಳಗಾವಿ'],

  // Tipu Sultan variations
  'tipu': ['Tipu Sultan', 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್', 'Tipu'],
  'sultan': ['Tipu Sultan', 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್', 'Sultan'],
  'ಟಿಪ್ಪು': ['Tipu Sultan', 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್', 'ಟಿಪ್ಪು'],
  'ಸುಲ್ತಾನ್': ['Tipu Sultan', 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್', 'ಸುಲ್ತಾನ್'],

  // Vijayanagara variations
  'vijayanagara': ['Vijayanagara', 'ವಿಜಯನಗರ', 'Vijayanagar'],
  'vijayanagar': ['ವಿಜಯನಗರ', 'Vijayanagara', 'Vijayanagar'],
  'ವಿಜಯನಗರ': ['Vijayanagara', 'ವಿಜಯನಗರ', 'Vijayanagar'],

  // Hampi variations
  'hampi': ['Hampi', 'ಹಂಪಿ'],
  'ಹಂಪಿ': ['Hampi', 'ಹಂಪಿ']
};

/**
 * Expands search terms to cover alternate spellings and Kannada names
 */
export function expandQuery(query: string): { expandedQuery: string; terms: string[] } {
  if (!query) return { expandedQuery: '', terms: [] };

  const words = query.toLowerCase().split(/\s+/);
  const terms: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z0-9\u0c80-\u0cff]/g, '');
    if (QUERY_EXPANSION_DICTIONARY[cleanWord]) {
      terms.push(...QUERY_EXPANSION_DICTIONARY[cleanWord]);
    } else {
      terms.push(word);
    }
  }

  // Deduplicate expanded terms
  const uniqueTerms = Array.from(new Set(terms));
  return {
    expandedQuery: uniqueTerms.join(' '),
    terms: uniqueTerms
  };
}
