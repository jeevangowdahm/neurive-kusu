'use client';

import { supabase } from '@/lib/supabase';
import { processDocumentPipeline } from './ocr-pipeline';

/**
 * Async Document Ingestion Queue System
 * Manages background processing of documents through the AI pipeline
 */

export interface IngestionJob {
  id: string;
  source: string;
  sourceUrl?: string;
  status: 'queued' | 'fetching' | 'parsing' | 'ocr' | 'embedding' | 'indexing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  metadata: Record<string, any>;
  errorLog: Array<{ timestamp: number; message: string }>;
  createdAt: number;
  completedAt?: number;
}

export interface IngestionMetrics {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  successRate: number;
}

/**
 * Queue document for ingestion
 */
export async function queueDocumentIngestion(
  source: string,
  metadata: Record<string, any> = {},
  priority: number = 0
): Promise<IngestionJob | null> {
  try {
    const { data, error } = await supabase
      .from('ingestion_queue')
      .insert([
        {
          document_source: source,
          document_metadata: metadata,
          processing_status: 'queued',
          priority,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return transformQueueJob(data);
  } catch (error) {
    console.error('Queue ingestion error:', error);
    return null;
  }
}

/**
 * Process next queued document
 */
export async function processNextInQueue(): Promise<IngestionJob | null> {
  try {
    // Fetch highest priority queued job
    const { data: jobs, error } = await supabase
      .from('ingestion_queue')
      .select('*')
      .eq('processing_status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return null;

    const job = jobs[0];

    // Update status to processing
    await updateJobStatus(job.id, 'fetching');

    try {
      // Process document
      await processDocumentPipeline(job.id);

      // Mark as completed
      await updateJobStatus(job.id, 'completed');

      return transformQueueJob({
        ...job,
        processing_status: 'completed',
      });
    } catch (error) {
      // Handle failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logJobError(job.id, errorMessage);

      // Retry logic
      if (job.retry_count < 3) {
        await updateJobRetry(job.id);
      } else {
        await updateJobStatus(job.id, 'failed');
      }

      throw error;
    }
  } catch (error) {
    console.error('Process queue error:', error);
    return null;
  }
}

/**
 * Start ingestion worker (continuous processing)
 */
export async function startIngestionWorker(intervalMs: number = 5000): Promise<() => void> {
  console.log('Starting ingestion worker...');

  const worker = setInterval(async () => {
    try {
      const job = await processNextInQueue();
      if (job) {
        console.log(`Processed ingestion job: ${job.id}`);
      }
    } catch (error) {
      console.error('Worker error:', error);
    }
  }, intervalMs);

  // Return handle for cleanup
  return () => clearInterval(worker);
}

/**
 * Update job status
 */
async function updateJobStatus(jobId: string, status: string): Promise<void> {
  try {
    await supabase
      .from('ingestion_queue')
      .update({
        processing_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Update job status error:', error);
  }
}

/**
 * Log job error
 */
async function logJobError(jobId: string, message: string): Promise<void> {
  try {
    const { data: job } = await supabase
      .from('ingestion_queue')
      .select('error_log')
      .eq('id', jobId)
      .single();

    const errorLog = job?.error_log || [];
    errorLog.push({
      timestamp: Date.now(),
      message,
    });

    await supabase
      .from('ingestion_queue')
      .update({
        error_log: errorLog,
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Log error error:', error);
  }
}

/**
 * Update retry count
 */
async function updateJobRetry(jobId: string): Promise<void> {
  try {
    const { data: job } = await supabase
      .from('ingestion_queue')
      .select('retry_count')
      .eq('id', jobId)
      .single();

    await supabase
      .from('ingestion_queue')
      .update({
        retry_count: (job?.retry_count || 0) + 1,
        processing_status: 'queued',
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Update retry error:', error);
  }
}

/**
 * Get ingestion metrics
 */
export async function getIngestionMetrics(): Promise<IngestionMetrics> {
  try {
    const { data: jobs } = await supabase.from('ingestion_queue').select('processing_status, created_at, updated_at');

    if (!jobs) {
      return {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0,
        successRate: 0,
      };
    }

    const metrics = {
      queued: jobs.filter((j: any) => j.processing_status === 'queued').length,
      processing: jobs.filter(
        (j: any) =>
          j.processing_status !== 'queued' &&
          j.processing_status !== 'completed' &&
          j.processing_status !== 'failed'
      ).length,
      completed: jobs.filter((j: any) => j.processing_status === 'completed').length,
      failed: jobs.filter((j: any) => j.processing_status === 'failed').length,
      averageProcessingTime: 0,
      successRate: 0,
    };

    // Calculate average processing time
    const completedJobs = jobs.filter((j: any) => j.processing_status === 'completed');
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum: number, j: any) => {
        const created = new Date(j.created_at).getTime();
        const updated = new Date(j.updated_at).getTime();
        return sum + (updated - created);
      }, 0);
      metrics.averageProcessingTime = totalTime / completedJobs.length;
    }

    // Calculate success rate
    const totalProcessed = metrics.completed + metrics.failed;
    if (totalProcessed > 0) {
      metrics.successRate = metrics.completed / totalProcessed;
    }

    return metrics;
  } catch (error) {
    console.error('Get metrics error:', error);
    return {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      averageProcessingTime: 0,
      successRate: 0,
    };
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<IngestionJob | null> {
  try {
    const { data, error } = await supabase
      .from('ingestion_queue')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return transformQueueJob(data);
  } catch (error) {
    console.error('Get job status error:', error);
    return null;
  }
}

/**
 * List jobs by status
 */
export async function listJobsByStatus(status: string, limit: number = 50): Promise<IngestionJob[]> {
  try {
    const { data, error } = await supabase
      .from('ingestion_queue')
      .select('*')
      .eq('processing_status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformQueueJob);
  } catch (error) {
    console.error('List jobs error:', error);
    return [];
  }
}

/**
 * Cancel job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ingestion_queue')
      .update({
        processing_status: 'failed',
        error_log: [{ timestamp: Date.now(), message: 'Job cancelled by user' }],
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Cancel job error:', error);
    return false;
  }
}

/**
 * Retry failed job
 */
export async function retryJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ingestion_queue')
      .update({
        processing_status: 'queued',
        retry_count: 0,
        error_log: [],
      })
      .eq('id', jobId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Retry job error:', error);
    return false;
  }
}

/**
 * Transform queue job from DB format to API format
 */
function transformQueueJob(data: any): IngestionJob {
  return {
    id: data.id,
    source: data.document_source,
    sourceUrl: data.source_url,
    status: data.processing_status,
    priority: data.priority,
    retryCount: data.retry_count,
    metadata: data.document_metadata || {},
    errorLog: data.error_log || [],
    createdAt: new Date(data.created_at).getTime(),
    completedAt:
      data.processing_status === 'completed' ? new Date(data.updated_at).getTime() : undefined,
  };
}

/**
 * Bulk queue documents
 */
export async function bulkQueueDocuments(
  documents: Array<{ source: string; metadata?: Record<string, any>; priority?: number }>
): Promise<IngestionJob[]> {
  const results: IngestionJob[] = [];

  for (const doc of documents) {
    const job = await queueDocumentIngestion(doc.source, doc.metadata, doc.priority);
    if (job) results.push(job);
  }

  return results;
}
