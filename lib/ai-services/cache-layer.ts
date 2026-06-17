'use client';

/**
 * Advanced Caching & Performance Optimization Layer
 * Implements multi-level caching for AI operations
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * In-Memory Cache with TTL and LRU eviction
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number; // bytes
  private defaultTTL: number; // milliseconds
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSizeInMB: number = 100, defaultTTLInMs: number = 3600000) {
    this.maxSize = maxSizeInMB * 1024 * 1024;
    this.defaultTTL = defaultTTLInMs;
  }

  set(key: string, value: T, ttl?: number): boolean {
    try {
      const size = JSON.stringify(value).length;

      // Check if adding this would exceed max size
      if (this.getTotalSize() + size > this.maxSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
        hits: 0,
        size,
      };

      this.cache.set(key, entry);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  get(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update hit stats
      entry.hits++;
      this.stats.hits++;

      return entry.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find least recently used (least hits, oldest timestamp)
    let lruKey = '';
    let lruEntry: CacheEntry<T> | null = null;
    let lruScore = Infinity;

    this.cache.forEach((entry, key) => {
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000;
      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
        lruEntry = entry;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private getTotalSize(): number {
    let total = 0;
    this.cache.forEach((entry) => {
      total += entry.size;
    });
    return total;
  }

  getStats(): CacheStats {
    const totalHits = this.stats.hits;
    const totalMisses = this.stats.misses;
    const totalRequests = totalHits + totalMisses;

    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hits: totalHits,
      misses: totalMisses,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      evictions: this.stats.evictions,
    };
  }
}

/**
 * Search Result Cache
 */
export const searchCache = new MemoryCache<any>(50, 1800000); // 50MB, 30 min TTL

/**
 * Entity Graph Cache
 */
export const graphCache = new MemoryCache<any>(100, 3600000); // 100MB, 1 hour TTL

/**
 * RAG Context Cache
 */
export const ragCache = new MemoryCache<any>(75, 900000); // 75MB, 15 min TTL

/**
 * Cache invalidation helper
 */
export function invalidateSearchCache(pattern?: string): void {
  if (!pattern) {
    searchCache.clear();
  } else {
    // In production, would implement pattern-based invalidation
    searchCache.clear();
  }
}

/**
 * Cache invalidation for archive updates
 */
export function invalidateArchiveCache(archiveId: string): void {
  // Invalidate all caches related to this archive
  const searchKey = `search:${archiveId}`;
  const graphKey = `graph:${archiveId}`;
  const ragKey = `rag:${archiveId}`;

  searchCache.delete(searchKey);
  graphCache.delete(graphKey);
  ragCache.delete(ragKey);
}

/**
 * Query debouncing for search
 */
export function createSearchDebounce(delayMs: number = 300) {
  let timeout: NodeJS.Timeout | null = null;
  let lastQuery = '';

  return (query: string, callback: (q: string) => void) => {
    if (timeout) clearTimeout(timeout);

    lastQuery = query;
    timeout = setTimeout(() => {
      if (lastQuery === query) {
        callback(query);
      }
      timeout = null;
    }, delayMs);
  };
}

/**
 * Request batching for multiple queries
 */
export class QueryBatcher {
  private batch: Array<{ query: string; resolve: (result: any) => void }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize: number = 10;
  private batchTimeoutMs: number = 100;
  private executor: (queries: string[]) => Promise<any[]>;

  constructor(executor: (queries: string[]) => Promise<any[]>, batchSize: number = 10) {
    this.executor = executor;
    this.batchSize = batchSize;
  }

  add(query: string): Promise<any> {
    return new Promise((resolve) => {
      this.batch.push({ query, resolve });

      // Trigger batch if size reached
      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else if (!this.batchTimeout) {
        // Set timeout for first item
        this.batchTimeout = setTimeout(() => this.flush(), this.batchTimeoutMs);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batch.length === 0) return;

    const queries = this.batch.map((item) => item.query);
    const items = [...this.batch];
    this.batch = [];

    try {
      const results = await this.executor(queries);
      items.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      items.forEach((item) => {
        item.resolve(null);
      });
    }
  }
}

/**
 * Lazy loading helper for paginated results
 */
export class LazyLoader<T> {
  private pageSize: number;
  private currentPage: number = 0;
  private items: T[] = [];
  private hasMore: boolean = true;
  private loader: (page: number) => Promise<T[]>;

  constructor(loader: (page: number) => Promise<T[]>, pageSize: number = 20) {
    this.loader = loader;
    this.pageSize = pageSize;
  }

  async loadMore(): Promise<T[]> {
    if (!this.hasMore) return [];

    try {
      const newItems = await this.loader(this.currentPage);

      if (newItems.length < this.pageSize) {
        this.hasMore = false;
      }

      this.items.push(...newItems);
      this.currentPage++;

      return newItems;
    } catch (error) {
      console.error('Lazy load error:', error);
      return [];
    }
  }

  reset(): void {
    this.items = [];
    this.currentPage = 0;
    this.hasMore = true;
  }

  getItems(): T[] {
    return [...this.items];
  }

  hasMoreItems(): boolean {
    return this.hasMore;
  }
}

/**
 * Database query optimization - add composite indexes
 */
export const queryOptimizations = {
  // Archive search queries
  'archives_search': 'title, description, tags WHERE status = active',

  // Entity lookups
  'entities_by_type': 'entity_type, created_at',

  // Chunk retrieval
  'chunks_by_archive': 'archive_id, chunk_index',

  // Relationship traversal
  'relationships_from_entity': 'entity_id_from, relationship_type',

  // Job status
  'embedding_jobs_status': 'status, archive_id',

  // Queue processing
  'ingestion_queue_order': 'processing_status, priority, created_at',
};

/**
 * Monitor cache health
 */
export function getGlobalCacheStats() {
  return {
    search: searchCache.getStats(),
    graph: graphCache.getStats(),
    rag: ragCache.getStats(),
    timestamp: Date.now(),
  };
}

/**
 * Export all global caches for monitoring
 */
export const globalCaches = {
  search: searchCache,
  graph: graphCache,
  rag: ragCache,
};
