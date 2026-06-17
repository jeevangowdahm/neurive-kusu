export interface DocumentMetadata {
  title: string;
  district?: string;
  category?: string;
  language?: string;
  year?: number;
  fileType?: string;
}

export interface ChunkOutput {
  pageNumber: number;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  chunkQualityScore: number;
  metadata: Record<string, any>;
}

export class ChunkingService {
  /**
   * Split a document's page-wise OCR text into clean chunks
   */
  static splitIntoChunks(
    pages: { pageNumber: number; rawText: string }[],
    docMetadata: DocumentMetadata,
    minSize: number = 500,
    maxSize: number = 800,
    overlap: number = 120
  ): ChunkOutput[] {
    const chunks: ChunkOutput[] = [];
    let globalChunkIndex = 0;

    for (const page of pages) {
      const text = page.rawText || '';
      if (!text.trim()) continue;

      // Section-aware split: try splitting by paragraph/double-newlines first
      const sections = text.split(/\n\n+/);
      let buffer = '';
      let pageOffset = 0;

      for (const section of sections) {
        const cleanSection = section.trim();
        if (!cleanSection) continue;

        // If adding this section exceeds max size, flush current buffer
        if ((buffer + ' ' + cleanSection).length > maxSize) {
          if (buffer.trim().length >= minSize) {
            chunks.push(this.createChunk(buffer, page.pageNumber, globalChunkIndex++, docMetadata));
            // Move window by overlap
            buffer = buffer.slice(-overlap) + ' ' + cleanSection;
          } else {
            // Buffer is too small, combine anyway but clip if too large
            buffer = (buffer + ' ' + cleanSection).substring(0, maxSize);
          }
        } else {
          buffer = buffer ? buffer + '\n\n' + cleanSection : cleanSection;
        }
      }

      // Flush remaining buffer
      if (buffer.trim().length > 0) {
        chunks.push(this.createChunk(buffer, page.pageNumber, globalChunkIndex++, docMetadata));
      }
    }

    // De-duplicate chunks (remove identical contents)
    const seenContents = new Set<string>();
    return chunks.filter(c => {
      const normalized = c.chunkText.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenContents.has(normalized)) return false;
      seenContents.add(normalized);
      return true;
    });
  }

  /**
   * Helper to structure and score a single chunk
   */
  private static createChunk(
    text: string,
    pageNumber: number,
    index: number,
    docMeta: DocumentMetadata
  ): ChunkOutput {
    const trimmedText = text.trim();
    const tokenCount = Math.ceil(trimmedText.length / 4.2); // Rough English + Kannada word length approximation
    const qualityScore = this.evaluateChunkQuality(trimmedText);

    return {
      pageNumber,
      chunkIndex: index,
      chunkText: trimmedText,
      tokenCount,
      chunkQualityScore: qualityScore,
      metadata: {
        document_title: docMeta.title,
        district: docMeta.district || 'Karnataka',
        category: docMeta.category || 'Archive',
        language: docMeta.language || 'english',
        year: docMeta.year || null,
        page_number: pageNumber,
        source_file_type: docMeta.fileType || 'pdf'
      }
    };
  }

  /**
   * Heuristic chunk quality scorer (assesses text richness, spelling coherence, density)
   */
  private static evaluateChunkQuality(text: string): number {
    if (text.length < 100) return 0.20; // too short
    
    let score = 0.85;

    // Check for bad characters or lots of garbled text (like excessive non-alphanumeric OCR artifacts)
    const specialChars = text.replace(/[a-zA-Z0-9\u0C80-\u0CFF\s]/g, ''); // Kannada range + English
    const specialRatio = specialChars.length / text.length;

    if (specialRatio > 0.15) {
      score -= 0.25; // likely garbled scan artifacts
    }

    // Check for presence of numbers (beneficial for historical records, dates, survey details)
    if (/\d+/.test(text)) {
      score += 0.05;
    }

    // Check for bilingual content
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    if (hasKannada && hasEnglish) {
      score += 0.05; // bilingual content is highly valuable in this specific platform
    }

    return parseFloat(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
  }
}
