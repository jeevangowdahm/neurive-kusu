import { RetrievalResult } from './retrieval-service';

export interface RerankedResult extends RetrievalResult {
  matchedEntities: string[];
  matchedDistrictOrCategory: string;
}

export class RerankingService {
  /**
   * Reranks and sorts results using the hybrid formula
   */
  static rerank(
    results: RetrievalResult[],
    query: string,
    districtFilter?: string,
    categoryFilter?: string
  ): RerankedResult[] {
    const queryLower = query.toLowerCase();

    return results
      .map(item => {
        // 1. Semantic Score (pre-computed by retriever / DB)
        const sem = item.semanticScore;

        // 2. Keyword Score (re-assess based on title + snippet match density)
        const keywordTerms = queryLower.split(/\s+/);
        const titleMatchCount = keywordTerms.filter(term => item.title.toLowerCase().includes(term)).length;
        const snippetMatchCount = keywordTerms.filter(term => item.matchedSnippet.toLowerCase().includes(term)).length;
        const key = Math.min(1.0, (titleMatchCount * 0.4 + snippetMatchCount * 0.1));

        // 3. Metadata Score (assess alignment of filters)
        let meta = 0.0;
        if (districtFilter && item.district.toLowerCase() === districtFilter.toLowerCase()) {
          meta += 0.5;
        }
        if (categoryFilter && item.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
          meta += 0.5;
        }
        // If query mentions district/category, boost metadata score
        if (queryLower.includes(item.district.toLowerCase())) {
          meta = Math.min(1.0, meta + 0.3);
        }
        if (queryLower.includes(item.category.toLowerCase())) {
          meta = Math.min(1.0, meta + 0.3);
        }

        // 4. Entity Score (boost if query targets specific historical entity name)
        // Detect simple entities like Capitalized Words or numbers
        const potentialEntities = item.matchedSnippet.match(/\b([A-Z][a-z]+|\d+)\b/g) || [];
        const matchedEntities = potentialEntities.filter(ent => queryLower.includes(ent.toLowerCase()));
        const entityCount = matchedEntities.length;
        const ent = entityCount > 0 ? Math.min(1.0, entityCount * 0.25) : 0.0;

        // Apply Hybrid Ranking Formula:
        // Final Score = 0.40 * Semantic + 0.30 * Keyword + 0.20 * Metadata + 0.10 * Entity
        const finalScore = parseFloat((0.40 * sem + 0.30 * key + 0.20 * meta + 0.10 * ent).toFixed(4));

        // Build "Why this result?" explainability summary
        const explanation = `Document match score is ${Math.round(finalScore * 100)}%. ` +
          `Semantic alignment represents ${Math.round(sem * 100)}% relevance. ` +
          `Keyword matching represents ${Math.round(key * 100)}% density. ` +
          `District (${item.district}) and Category (${item.category}) alignment provides a metadata match. ` +
          (matchedEntities.length > 0 ? `Historical entities [${matchedEntities.slice(0, 3).join(', ')}] boosted this record.` : '');

        return {
          ...item,
          semanticScore: sem,
          keywordScore: key,
          metadataScore: meta,
          entityScore: ent,
          finalScore,
          whyThisResult: explanation,
          matchedEntities: Array.from(new Set(matchedEntities)),
          matchedDistrictOrCategory: `${item.district} / ${item.category}`,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }
}
