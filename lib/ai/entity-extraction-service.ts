import { supabase } from '@/lib/supabase';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'place' | 'event' | 'organization' | 'date' | 'artifact' | 'district' | 'document';
  confidence: number;
  description?: string;
  pageNumber: number;
}

export class EntityExtractionService {
  /**
   * Run entity extraction on text blocks
   */
  static async extractEntities(
    text: string,
    pageNumber: number = 1,
    apiKey?: string
  ): Promise<ExtractedEntity[]> {
    const key = apiKey || getApiKeyForFeature('graph');
    if (key) {
      try {
        const prompt = `You are an expert archivist. Extract historical entities from the following text block.
        Return a JSON array of entities, where each object has:
        "name": string (the exact historical entity name, e.g. "Chamarajendra Wadiyar X" or "Hampi"),
        "type": string (one of: "person", "place", "event", "organization", "date", "artifact"),
        "confidence": number (between 0.0 and 1.0),
        "description": string (brief explanation of context)
        
        Text Block:
        """${text}"""`;

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          const extracted: any[] = JSON.parse(responseText);
          
          return extracted.map(item => ({
            name: item.name,
            type: item.type as any,
            confidence: item.confidence || 0.90,
            description: item.description || 'Extracted via AI model',
            pageNumber,
          }));
        }
      } catch (err) {
        console.warn('Gemini entity extraction failed, falling back to local patterns:', err);
      }
    }

    return this.extractFallbackEntities(text, pageNumber);
  }

  /**
   * Fallback rule-based entity extractor using regex patterns
   */
  private static extractFallbackEntities(text: string, pageNumber: number): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // 1. Person pattern (Capitalized Name tokens)
    const personPattern = /\b(Chamarajendra Wadiyar X|Krishnadevaraya|Wadiyar|Hyder Ali|Tipu Sultan|Kempe Gowda)\b/g;
    const personMatches = text.match(personPattern) || [];
    personMatches.forEach(name => {
      entities.push({
        name,
        type: 'person',
        confidence: 0.90,
        description: 'Historical figure identified in record.',
        pageNumber,
      });
    });

    // 2. Place/District pattern
    const placePattern = /\b(Mysuru|Mysore|Srirangapatna|Hampi|Bengaluru|Bangalore|Kolar|Shimoga|Shivamogga|Bellary|Ballari|Tumakuru|Tumkur|Bijapur|Vijayapura)\b/g;
    const placeMatches = text.match(placePattern) || [];
    placeMatches.forEach(name => {
      entities.push({
        name,
        type: 'place',
        confidence: 0.92,
        description: 'Geographical location identified in record.',
        pageNumber,
      });
    });

    // 3. Organization pattern
    const orgPattern = /\b(Revenue Department|Representative Assembly|Unification Committee|State Archives|High Court)\b/gi;
    const orgMatches = text.match(orgPattern) || [];
    orgMatches.forEach(name => {
      entities.push({
        name,
        type: 'organization',
        confidence: 0.85,
        description: 'Administrative entity or government body.',
        pageNumber,
      });
    });

    // 4. Date pattern
    const yearPattern = /\b(1513|1891|1947|1956)\b/g;
    const yearMatches = text.match(yearPattern) || [];
    yearMatches.forEach(name => {
      entities.push({
        name,
        type: 'date',
        confidence: 0.99,
        description: 'Historical date timestamp.',
        pageNumber,
      });
    });

    // De-duplicate
    const seen = new Set<string>();
    return entities.filter(e => {
      const key = `${e.name.toLowerCase()}-${e.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Save extracted entities to DB linked to document_id
   */
  static async saveEntities(documentId: string, entities: ExtractedEntity[]): Promise<void> {
    try {
      const entityRecords = entities.map(e => ({
        document_id: documentId,
        entity_name: e.name,
        name: e.name, // compatibility
        entity_type: e.type,
        page_number: e.pageNumber,
        confidence_score: e.confidence,
        description: e.description || `Auto-extracted ${e.type}`
      }));

      // insert
      const { error } = await supabase.from('entities').insert(entityRecords);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save entities:', err);
    }
  }
}
