export type QueryNormalization = {
  normalizedQuery: string;
  terms: string[];
  corrections: string[];
  suggestedDistricts: string[];
};

const TERM_ALIASES: Record<string, string[]> = {
  bengaluru: ['bengaluru', 'bangalore', 'bengalore', 'benglore', 'banglore', 'bengalooru'],
  mysuru: ['mysuru', 'mysore'],
  belagavi: ['belagavi', 'belgaum'],
  ballari: ['ballari', 'bellary'],
  kalaburagi: ['kalaburagi', 'gulbarga'],
  mangaluru: ['mangaluru', 'mangalore'],
};

const DISTRICT_SUGGESTIONS: Record<string, string[]> = {
  bengaluru: ['Bengaluru Urban', 'Bengaluru Rural'],
  mysuru: ['Mysuru'],
  belagavi: ['Belagavi'],
  ballari: ['Ballari'],
  kalaburagi: ['Kalaburagi'],
  mangaluru: ['Dakshina Kannada'],
};

export function normalizeArchiveQuery(input: string): QueryNormalization {
  const rawTerms = input
    .toLowerCase()
    .trim()
    .split(/[\s,.]+/)
    .filter((term) => term.length > 1);

  const normalizedTerms = rawTerms.map((term) => {
    for (const [canonical, aliases] of Object.entries(TERM_ALIASES)) {
      if (aliases.includes(term)) return canonical;
    }
    return term;
  });

  const corrections = normalizedTerms
    .map((term, index) => (term !== rawTerms[index] ? `${rawTerms[index]} -> ${term}` : ''))
    .filter(Boolean);

  const suggestedDistricts = Array.from(
    new Set(normalizedTerms.flatMap((term) => DISTRICT_SUGGESTIONS[term] || []))
  );

  return {
    normalizedQuery: normalizedTerms.join(' '),
    terms: Array.from(new Set([...rawTerms, ...normalizedTerms])),
    corrections,
    suggestedDistricts,
  };
}

export function archiveSearchScore(
  archive: {
    title?: string;
    description?: string | null;
    author?: string;
    source?: string;
    taluk?: string;
    tags?: string[];
    district?: { name?: string; name_kannada?: string };
    category?: { name?: string; slug?: string };
    relevance_score?: number;
  },
  terms: string[]
) {
  const searchable = {
    title: archive.title?.toLowerCase() || '',
    description: archive.description?.toLowerCase() || '',
    author: archive.author?.toLowerCase() || '',
    source: archive.source?.toLowerCase() || '',
    taluk: archive.taluk?.toLowerCase() || '',
    district: archive.district?.name?.toLowerCase() || '',
    category: archive.category?.name?.toLowerCase() || '',
    categorySlug: archive.category?.slug?.toLowerCase() || '',
    tags: (archive.tags || []).map((tag) => tag.toLowerCase()),
  };

  let score = (archive.relevance_score || 0) * 2;

  for (const term of terms) {
    if (searchable.district.includes(term)) score += 20;
    if (searchable.taluk.includes(term)) score += 16;
    if (searchable.title.includes(term)) score += 12;
    if (searchable.category.includes(term) || searchable.categorySlug.includes(term)) score += 8;
    if (searchable.description.includes(term)) score += 5;
    if (searchable.author.includes(term)) score += 3;
    if (searchable.source.includes(term)) score += 2;
    if (searchable.tags.some((tag) => tag.includes(term))) score += 4;
  }

  return score;
}
