'use client';

import { supabase } from '@/lib/supabase';

/**
 * Multimodal Search Engine
 * Enables search across text, images, and metadata simultaneously
 */

export interface ImageEmbedding {
  archiveId: string;
  imageUrl: string;
  embedding: number[];
  visualFeatures: {
    colors: string[];
    objects: string[];
    text: string;
    confidence: number;
  };
}

export interface MultimodalSearchResult {
  archiveId: string;
  title: string;
  type: 'text' | 'image' | 'hybrid';
  textRelevance: number;
  visualRelevance: number;
  overallRelevance: number;
  matchedModalities: ('text' | 'image')[];
  preview: string;
  imageUrl?: string;
}

/**
 * Extract visual features from image URL
 */
export async function extractVisualFeatures(imageUrl: string): Promise<{
  colors: string[];
  objects: string[];
  text: string;
  confidence: number;
}> {
  // Mock implementation - in production, use CLIP or similar
  const mockColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  const mockObjects = ['map', 'document', 'photograph', 'manuscript'];

  return {
    colors: mockColors.slice(0, Math.floor(Math.random() * 3) + 1),
    objects: mockObjects.slice(0, Math.floor(Math.random() * 4)),
    text: 'Extracted text from image',
    confidence: 0.75 + Math.random() * 0.2,
  };
}

/**
 * Generate image embedding using CLIP-style approach
 */
export async function generateImageEmbedding(
  imageUrl: string
): Promise<number[]> {
  // Mock 512-dimensional CLIP embedding
  return new Array(512).fill(0).map(() => Math.random() - 0.5);
}

/**
 * Store image embedding
 */
export async function storeImageEmbedding(
  archiveId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    const embedding = await generateImageEmbedding(imageUrl);
    const visualFeatures = await extractVisualFeatures(imageUrl);

    const { error } = await supabase.from('image_embeddings').insert([
      {
        archive_id: archiveId,
        image_url: imageUrl,
        embedding,
        image_type: 'photograph',
        visual_features: visualFeatures,
      },
    ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Store image embedding error:', error);
    return false;
  }
}

/**
 * Search by image similarity
 */
export async function imageSearch(
  queryImageUrl: string,
  limit: number = 10
): Promise<MultimodalSearchResult[]> {
  try {
    // Generate embedding for query image
    const queryEmbedding = await generateImageEmbedding(queryImageUrl);

    // Fetch all image embeddings
    const { data: images, error } = await supabase
      .from('image_embeddings')
      .select(
        `
        id,
        archive_id,
        image_url,
        embedding,
        visual_features,
        archives (
          id,
          title,
          description
        )
      `
      )
      .limit(limit * 2);

    if (error) throw error;

    // Calculate similarity scores
    const results = (images || [])
      .map((img: any) => ({
        archiveId: img.archive_id,
        title: img.archives?.title || 'Unknown',
        type: 'image' as const,
        textRelevance: 0,
        visualRelevance: cosineSimilarity(queryEmbedding, img.embedding),
        overallRelevance: 0,
        matchedModalities: ['image'] as ('text' | 'image')[],
        preview: img.archives?.description || 'No description',
        imageUrl: img.image_url,
      }))
      .sort((a, b) => b.visualRelevance - a.visualRelevance)
      .slice(0, limit)
      .map((r) => ({
        ...r,
        overallRelevance: r.visualRelevance,
      }));

    return results;
  } catch (error) {
    console.error('Image search error:', error);
    return [];
  }
}

/**
 * Hybrid multimodal search combining text and image
 */
export async function multimodalSearch(
  queryText: string,
  queryImageUrl?: string,
  limit: number = 10
): Promise<MultimodalSearchResult[]> {
  const results = new Map<string, MultimodalSearchResult>();

  // Text search
  const textResults = await textModSearch(queryText, limit);
  textResults.forEach((r) => results.set(r.archiveId, r));

  // Image search (if provided)
  if (queryImageUrl) {
    const imageResults = await imageSearch(queryImageUrl, limit);
    imageResults.forEach((ir) => {
      const existing = results.get(ir.archiveId);
      if (existing) {
        // Combine scores
        existing.visualRelevance = ir.visualRelevance;
        existing.matchedModalities.push('image');
        existing.overallRelevance = (existing.textRelevance + ir.visualRelevance) / 2;
        existing.type = 'hybrid';
      } else {
        results.set(ir.archiveId, ir);
      }
    });
  }

  // Sort by overall relevance
  const resultArr: MultimodalSearchResult[] = [];
  results.forEach((v) => resultArr.push(v));
  return resultArr
    .sort((a, b) => b.overallRelevance - a.overallRelevance)
    .slice(0, limit);
}

/**
 * Text modality search
 */
async function textModSearch(query: string, limit: number): Promise<MultimodalSearchResult[]> {
  try {
    const { data, error } = await supabase
      .from('archives')
      .select(
        `
        id,
        title,
        description,
        thumbnail_url
      `
      )
      .ilike('title', `%${query}%`)
      .or(`description.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    return (data || []).map((archive: any) => ({
      archiveId: archive.id,
      title: archive.title,
      type: 'text' as const,
      textRelevance: archive.title?.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.6,
      visualRelevance: 0,
      overallRelevance: archive.title?.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0.6,
      matchedModalities: ['text'] as ('text' | 'image')[],
      preview: archive.description || 'No description',
      imageUrl: archive.thumbnail_url,
    }));
  } catch (error) {
    console.error('Text search error:', error);
    return [];
  }
}

/**
 * Image clustering for related archive discovery
 */
export async function clusterSimilarImages(
  archiveId: string,
  limit: number = 5
): Promise<MultimodalSearchResult[]> {
  try {
    // Get embedding for archive image
    const { data: sourceImage, error: fetchError } = await supabase
      .from('image_embeddings')
      .select('embedding')
      .eq('archive_id', archiveId)
      .single();

    if (fetchError || !sourceImage) return [];

    // Find similar images
    const { data: images } = await supabase
      .from('image_embeddings')
      .select(
        `
        archive_id,
        image_url,
        embedding,
        archives (
          id,
          title,
          description
        )
      `
      )
      .neq('archive_id', archiveId)
      .limit(limit * 3);

    const results = (images || [])
      .map((img: any) => ({
        archiveId: img.archive_id,
        title: img.archives?.title || 'Unknown',
        similarity: cosineSimilarity(sourceImage.embedding, img.embedding),
        imageUrl: img.image_url,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((r) => ({
        archiveId: r.archiveId,
        title: r.title,
        type: 'image' as const,
        textRelevance: 0,
        visualRelevance: r.similarity,
        overallRelevance: r.similarity,
        matchedModalities: ['image'] as ('text' | 'image')[],
        preview: 'Similar image',
        imageUrl: r.imageUrl,
      }));

    return results;
  } catch (error) {
    console.error('Image clustering error:', error);
    return [];
  }
}

/**
 * Map similarity search
 * Specialized search for geographic/map documents
 */
export async function mapSearch(
  query: string,
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<MultimodalSearchResult[]> {
  try {
    let q = supabase
      .from('archives')
      .select(
        `
        id,
        title,
        description,
        thumbnail_url,
        metadata
      `
      )
      .eq('file_type', 'image')
      .ilike('tags', '%map%');

    const { data, error } = await q.limit(20);

    if (error) throw error;

    return (data || []).map((archive: any) => ({
      archiveId: archive.id,
      title: archive.title,
      type: 'image' as const,
      textRelevance: archive.title?.toLowerCase().includes(query.toLowerCase()) ? 0.8 : 0.4,
      visualRelevance: 0.7,
      overallRelevance: 0.75,
      matchedModalities: ['image'] as ('text' | 'image')[],
      preview: 'Historical map',
      imageUrl: archive.thumbnail_url,
    }));
  } catch (error) {
    console.error('Map search error:', error);
    return [];
  }
}

/**
 * OCR + Image combined retrieval
 * Searches for text that appears in images
 */
export async function ocrImageSearch(
  query: string,
  limit: number = 10
): Promise<MultimodalSearchResult[]> {
  try {
    // Search OCR metadata for text
    const { data: ocrMatches } = await supabase
      .from('ocr_metadata')
      .select(
        `
        archive_id,
        archives (
          id,
          title,
          description,
          thumbnail_url,
          file_type
        )
      `
      )
      .ilike('text_direction', `%${query}%`)
      .limit(limit);

    return (ocrMatches || [])
      .filter((m: any) => m.archives?.file_type === 'image')
      .map((m: any) => ({
        archiveId: m.archive_id,
        title: m.archives?.title || 'Unknown',
        type: 'hybrid' as const,
        textRelevance: 0.8,
        visualRelevance: 0.7,
        overallRelevance: 0.75,
        matchedModalities: ['text', 'image'] as ('text' | 'image')[],
        preview: 'Image with extracted text',
        imageUrl: m.archives?.thumbnail_url,
      }));
  } catch (error) {
    console.error('OCR image search error:', error);
    return [];
  }
}

/**
 * Cosine similarity between vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}
