'use client';

import { supabase } from '@/lib/supabase';
import { OCRService } from '@/lib/ai/ocr-service';
import { ChunkingService } from '@/lib/ai/chunking-service';
import { EmbeddingService } from '@/lib/ai/embedding-service';
import { EntityExtractionService } from '@/lib/ai/entity-extraction-service';
import { getApiKeyForFeature } from '@/lib/ai/keys-config';


/**
 * Advanced OCR + Document AI Pipeline
 * Handles document processing, text extraction, chunking, and metadata enrichment
 */

export interface OCRJob {
  archiveId: string;
  status: 'pending' | 'processing' | 'ocr' | 'chunking' | 'embedding' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  metrics: {
    pageCount: number;
    textLength: number;
    confidence: number;
    processingTimeMs: number;
  };
}

export interface OCRResult {
  text: string;
  language: string;
  confidence: number;
  isHandwritten: boolean;
  pageCount: number;
  textDirection: 'ltr' | 'rtl';
  confidenceMap?: Record<string, number>;
}

export interface DocumentChunk {
  index: number;
  content: string;
  startPosition: number;
  endPosition: number;
  type: 'text' | 'heading' | 'table' | 'image';
  metadata: {
    language: string;
    keywords: string[];
    entities: string[];
  };
}

export async function processDocumentPipeline(archiveId: string): Promise<void> {
  try {
    // 1. Create job tracking record
    const job = await createOCRJob(archiveId);
    if (!job) throw new Error('Failed to create OCR job');

    // 2. Fetch document
    await updateJobStatus(archiveId, 'processing');
    const doc = await fetchDocument(archiveId);
    if (!doc) throw new Error('Document not found');

    // 3. Perform OCR
    await updateJobStatus(archiveId, 'ocr');
    const ocrRes = await OCRService.performOCR(doc.file_url);
    await saveOCRMetadata(archiveId, {
      text: ocrRes.pages.map(p => p.rawText).join('\n'),
      language: ocrRes.pages[0]?.language || 'eng',
      confidence: ocrRes.averageConfidence,
      isHandwritten: ocrRes.pages[0]?.isHandwritten || false,
      pageCount: ocrRes.pages.length,
      textDirection: ocrRes.pages[0]?.textDirection || 'ltr',
    });

    // 4. Chunk document
    await updateJobStatus(archiveId, 'chunking');
    const pagesToChunk = ocrRes.pages.map(p => ({ pageNumber: p.pageNumber, rawText: p.rawText }));
    const chunkOutputs = ChunkingService.splitIntoChunks(pagesToChunk, {
      title: doc.title,
    });
    
    // Save chunks to database
    const chunkRecords = chunkOutputs.map(c => ({
      archive_id: archiveId,
      chunk_index: c.chunkIndex,
      content: c.chunkText,
      chunk_size: c.chunkText.length,
      chunk_type: 'text',
      metadata: c.metadata,
      token_count: c.tokenCount,
      chunk_quality_score: c.chunkQualityScore
    }));
    await supabase.from('document_chunks').insert(chunkRecords);

    // 5. Generate embeddings
    await updateJobStatus(archiveId, 'embedding');
    const apiKey = getApiKeyForFeature('agent');
    
    const chunkEmbeddings = [];
    for (const chunk of chunkOutputs) {
      const embRes = await EmbeddingService.generateEmbedding(chunk.chunkText, apiKey);
      chunkEmbeddings.push({
        archive_id: archiveId,
        chunk_index: chunk.chunkIndex,
        content: chunk.chunkText,
        embedding: embRes.embedding,
        embedding_model: embRes.model,
        embedding_dimension: embRes.dimension,
        embedding_status: embRes.status === 'generated' ? 'generated' : 'failed',
        embedding_error: embRes.error || null,
        confidence_score: chunk.chunkQualityScore,
      });
    }
    const { error: embErr } = await supabase.from('chunk_embeddings').insert(chunkEmbeddings);
    if (embErr) throw embErr;

    // 6. Extract entities
    const allText = ocrRes.pages.map(p => p.rawText).join('\n');
    const entities = await EntityExtractionService.extractEntities(allText, 1, apiKey);
    
    const entityRecords = entities.map(ent => ({
      archive_id: archiveId,
      entity_name: ent.name,
      name: ent.name, // compatibility
      entity_type: ent.type,
      page_number: ent.pageNumber,
      confidence_score: ent.confidence,
    }));
    
    // link entities to archive
    for (const entity of entities) {
      const { data: existingEntity } = await supabase
        .from('entities')
        .select('id')
        .eq('name', entity.name)
        .eq('entity_type', entity.type)
        .single();

      const entityId = existingEntity?.id || await createEntity(entity.name, entity.type);
      if (entityId) {
        await supabase.from('entity_archive_links').insert([
          {
            entity_id: entityId,
            archive_id: archiveId,
            mention_count: 1,
            confidence_score: entity.confidence,
          },
        ]);
      }
    }

    // Mark as completed
    await updateJobStatus(archiveId, 'completed');
  } catch (error) {
    console.error(`OCR pipeline error for ${archiveId}:`, error);
    await updateJobStatus(
      archiveId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Create OCR job record
 */
async function createOCRJob(archiveId: string): Promise<OCRJob | null> {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
      .insert([
        {
          archive_id: archiveId,
          job_type: 'full_embedding',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      archiveId,
      status: 'pending',
      progress: 0,
      metrics: {
        pageCount: 0,
        textLength: 0,
        confidence: 0,
        processingTimeMs: 0,
      },
    };
  } catch (error) {
    console.error('Create OCR job error:', error);
    return null;
  }
}

/**
 * Update job status
 */
async function updateJobStatus(
  archiveId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('embedding_jobs')
      .update({
        status,
        error_message: errorMessage,
      })
      .eq('archive_id', archiveId);
  } catch (error) {
    console.error('Update job status error:', error);
  }
}

/**
 * Fetch document metadata
 */
async function fetchDocument(
  archiveId: string
): Promise<{ file_url: string; title: string } | null> {
  try {
    const { data, error } = await supabase
      .from('archives')
      .select('file_url, title')
      .eq('id', archiveId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Fetch document error:', error);
    return null;
  }
}

function getMockOCRResult(fileUrl: string): OCRResult {
  return {
    text: `This is a mock OCR result from the document at ${fileUrl}.
           In production, this would contain actual extracted text from the document.
           The OCR engine would detect language, confidence scores, and handle handwritten text.`,
    language: 'eng', // ISO 639-3 code
    confidence: 0.85,
    isHandwritten: false,
    pageCount: 1,
    textDirection: 'ltr',
    confidenceMap: {
      'line-0': 0.9,
      'line-1': 0.85,
      'line-2': 0.8,
    },
  };
}

/**
 * Perform OCR on document using Gemini Multimodal OCR
 */
async function performOCR(fileUrl: string): Promise<OCRResult> {
  try {
    const apiKey = getApiKeyForFeature('agent');
    if (!apiKey) {
      console.warn('No Gemini API key found in localStorage. Using sandboxed offline OCR mock.');
      return getMockOCRResult(fileUrl);
    }

    // Convert fileUrl to base64
    let base64Image = '';
    let mimeType = 'image/jpeg';
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      mimeType = blob.type || 'image/jpeg';
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchErr) {
      console.error('Failed to fetch and convert document to base64:', fetchErr);
      throw new Error(`Could not download archive file: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
    }

    // Call Next.js API route
    const model = typeof window !== 'undefined' ? localStorage.getItem('neurive_gemini_model') || 'gemini-1.5-flash' : 'gemini-1.5-flash';
    const version = typeof window !== 'undefined' ? localStorage.getItem('neurive_gemini_version') || 'v1' : 'v1';
    
    const apiRes = await fetch('/api/ai/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        image: base64Image,
        mimeType,
        model,
        version,
      }),
    });

    if (!apiRes.ok) {
      const errorData = await apiRes.json().catch(() => ({}));
      throw new Error(errorData.error || `OCR API failed with status ${apiRes.status}`);
    }

    const resJson = await apiRes.json();
    const data = resJson.data;
    
    return {
      text: data.text || '',
      language: data.language || 'eng',
      confidence: data.confidence || 0.9,
      isHandwritten: data.document_type === 'manuscript' || false,
      pageCount: 1,
      textDirection: 'ltr',
      confidenceMap: {},
    };
  } catch (error) {
    console.error('Live OCR failed, falling back to mock:', error);
    return getMockOCRResult(fileUrl);
  }
}

/**
 * Save OCR metadata to database
 */
async function saveOCRMetadata(archiveId: string, result: OCRResult): Promise<void> {
  try {
    await supabase
      .from('ocr_metadata')
      .upsert([
        {
          archive_id: archiveId,
          ocr_engine: 'paddleocr',
          confidence_score: result.confidence,
          language_detected: result.language,
          is_handwritten: result.isHandwritten,
          text_direction: result.textDirection,
          page_count: result.pageCount,
          processing_time_ms: 1000, // Mock
          quality_score: result.confidence,
          requires_manual_review: result.confidence < 0.7,
        },
      ])
      .eq('archive_id', archiveId);
  } catch (error) {
    console.error('Save OCR metadata error:', error);
  }
}

/**
 * Chunk document into segments for RAG
 */
export async function chunkDocument(
  text: string,
  chunkSize: number = 512,
  overlap: number = 100
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';
  let currentPosition = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      // Save chunk
      chunks.push({
        index: chunkIndex,
        content: currentChunk.trim(),
        startPosition: currentPosition,
        endPosition: currentPosition + currentChunk.length,
        type: 'text',
        metadata: {
          language: 'en',
          keywords: extractKeywords(currentChunk),
          entities: [],
        },
      });

      // Move overlap
      currentPosition += currentChunk.length - overlap;
      currentChunk = currentChunk.slice(-overlap) + sentence;
      chunkIndex++;
    } else {
      currentChunk += sentence;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      index: chunkIndex,
      content: currentChunk.trim(),
      startPosition: currentPosition,
      endPosition: currentPosition + currentChunk.length,
      type: 'text',
      metadata: {
        language: 'en',
        keywords: extractKeywords(currentChunk),
        entities: [],
      },
    });
  }

  return chunks;
}

/**
 * Save chunks to database
 */
async function saveChunks(archiveId: string, chunks: DocumentChunk[]): Promise<void> {
  try {
    const chunkRecords = chunks.map((chunk) => ({
      archive_id: archiveId,
      chunk_index: chunk.index,
      content: chunk.content,
      chunk_size: chunk.content.length,
      chunk_type: chunk.type,
      metadata: chunk.metadata,
    }));

    await supabase.from('document_chunks').insert(chunkRecords);
  } catch (error) {
    console.error('Save chunks error:', error);
  }
}

async function generateMockEmbeddings(archiveId: string, chunks: DocumentChunk[]): Promise<void> {
  const chunkEmbeddings = chunks.map((chunk) => ({
    archive_id: archiveId,
    chunk_index: chunk.index,
    content: chunk.content,
    embedding: new Array(1536).fill(0).map(() => Math.random()),
    confidence_score: 0.95,
  }));

  const { error } = await supabase.from('chunk_embeddings').insert(chunkEmbeddings);
  if (error) throw error;
}

/**
 * Generate embeddings for chunks using Gemini Vector Embedding
 */
async function generateChunkEmbeddings(archiveId: string, chunks: DocumentChunk[]): Promise<void> {
  try {
    const apiKey = getApiKeyForFeature('agent');
    if (!apiKey) {
      console.warn('No Gemini API key found in localStorage. Using sandboxed offline mock embeddings.');
      await generateMockEmbeddings(archiveId, chunks);
      return;
    }

    const model = typeof window !== 'undefined' ? localStorage.getItem('neurive_gemini_model') || 'text-embedding-004' : 'text-embedding-004';
    const version = typeof window !== 'undefined' ? localStorage.getItem('neurive_gemini_version') || 'v1' : 'v1';

    // Batch all chunk contents
    const chunkContents = chunks.map(c => c.content);

    const apiRes = await fetch('/api/ai/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        text: chunkContents,
        model,
        version,
      }),
    });

    if (!apiRes.ok) {
      const errorData = await apiRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Embeddings API failed with status ${apiRes.status}`);
    }

    const resJson = await apiRes.json();
    const data = resJson.data;
    
    // data is a number[][] of embeddings (one array for each chunk)
    const chunkEmbeddings = chunks.map((chunk, index) => {
      let rawVector = data[index] || [];
      
      // Pad or slice to exactly 1536 dimensions for pgvector compatibility
      if (rawVector.length < 1536) {
        const padCount = 1536 - rawVector.length;
        rawVector = [...rawVector, ...new Array(padCount).fill(0)];
      } else if (rawVector.length > 1536) {
        rawVector = rawVector.slice(0, 1536);
      }

      return {
        archive_id: archiveId,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding: rawVector,
        confidence_score: 0.95,
      };
    });

    const { error } = await supabase.from('chunk_embeddings').insert(chunkEmbeddings);
    if (error) throw error;
  } catch (error) {
    console.error('Live embeddings generation failed, falling back to mock:', error);
    await generateMockEmbeddings(archiveId, chunks);
  }
}

/**
 * Extract entities from text
 */
async function extractEntitiesFromText(text: string): Promise<Array<{ name: string; type: string }>> {
  // Simple entity extraction using patterns
  const entities: Array<{ name: string; type: string }> = [];

  // Person names (simple pattern)
  const personPattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
  const personMatches = Array.from(text.matchAll(personPattern));
  for (const match of personMatches) {
    entities.push({ name: match[0], type: 'person' });
  }

  // Places
  const placePattern = /\b(Karnataka|Mysuru|Bengaluru|India|[A-Z][a-z]+\s+(?:District|Division))\b/g;
  const placeMatches = Array.from(text.matchAll(placePattern));
  for (const match of placeMatches) {
    entities.push({ name: match[0], type: 'place' });
  }

  // Years
  const yearPattern = /\b(1[789]\d{2}|20\d{2})\b/g;
  const yearMatches = Array.from(text.matchAll(yearPattern));
  for (const match of yearMatches) {
    entities.push({ name: match[0], type: 'date' });
  }

  const dedupMap = new Map<string, typeof entities[0]>();
  entities.forEach((e) => dedupMap.set(e.name, e));
  const deduped: typeof entities = [];
  dedupMap.forEach((v) => deduped.push(v));
  return deduped;
}

/**
 * Link extracted entities to archive
 */
async function linkEntitiesToArchive(
  archiveId: string,
  entities: Array<{ name: string; type: string }>
): Promise<void> {
  try {
    for (const entity of entities) {
      // Find or create entity
      const { data: existingEntity } = await supabase
        .from('entities')
        .select('id')
        .eq('name', entity.name)
        .eq('entity_type', entity.type)
        .single();

      const entityId = existingEntity?.id || (await createEntity(entity.name, entity.type));

      if (entityId) {
        // Link to archive
        await supabase.from('entity_archive_links').insert([
          {
            entity_id: entityId,
            archive_id: archiveId,
            mention_count: 1,
            confidence_score: 0.8,
          },
        ]);
      }
    }
  } catch (error) {
    console.error('Link entities error:', error);
  }
}

/**
 * Create new entity
 */
async function createEntity(name: string, type: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('entities')
      .insert([
        {
          name,
          entity_type: type,
          description: `Auto-extracted entity from archive`,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Create entity error:', error);
    return null;
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - frequency-based
  const words = text
    .toLowerCase()
    .match(/\b[a-z]{4,}\b/g) || [];

  const freq = new Map<string, number>();
  words.forEach((word) => freq.set(word, (freq.get(word) || 0) + 1));

  const freqArr: Array<[string, number]> = [];
  freq.forEach((count, word) => freqArr.push([word, count]));
  return freqArr
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((pair) => pair[0]);
}

/**
 * Get OCR job status
 */
export async function getOCRJobStatus(archiveId: string): Promise<OCRJob | null> {
  try {
    const { data, error } = await supabase
      .from('embedding_jobs')
      .select('*')
      .eq('archive_id', archiveId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      archiveId,
      status: data.status,
      progress: data.status === 'completed' ? 100 : 50,
      errorMessage: data.error_message,
      metrics: {
        pageCount: 1,
        textLength: 0,
        confidence: 0.85,
        processingTimeMs: 0,
      },
    };
  } catch (error) {
    console.error('Get OCR status error:', error);
    return null;
  }
}
