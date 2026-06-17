import { NextRequest, NextResponse } from 'next/server';
import { runIngestionPipeline, retryProcessingJob } from '@/lib/upload-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/security/rate-limit';

/**
 * API route to trigger document ingestion processing on the server
 */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // Rate limit check
    const rateCheck = await checkRateLimit(req, { limit: 5, refillRate: 0.05 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Ingestion API rate limit exceeded.' }, { status: 429 });
    }

    const { documentId, jobId, isRetry } = await req.json();

    if (!documentId || !jobId) {
      return NextResponse.json(
        { error: 'Missing documentId or jobId parameters' },
        { status: 400 }
      );
    }

    // Server-side check: Only admin or authorized archivist should trigger ingestion/retry
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAuthorized = profile?.role === 'admin' || profile?.role === 'archivist' ||
                         ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(user.email || '');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden. Admin or archivist credentials required.' }, { status: 403 });
    }

    if (isRetry) {
      // Reuse the existing safe retry function to delete old chunks and prevent duplication
      retryProcessingJob(jobId, documentId).catch((err) => {
        console.error(`Error in server background worker for retrying doc ${documentId}:`, err);
      });
    } else {
      // Run the pipeline asynchronously in the background.
      runIngestionPipeline(documentId, jobId).catch((err) => {
        console.error(`Error in server background worker for doc ${documentId}:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      message: isRetry ? 'Ingestion pipeline retry successfully triggered on the server' : 'Ingestion pipeline successfully triggered on the server'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
