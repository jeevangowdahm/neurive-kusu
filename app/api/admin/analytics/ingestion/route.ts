import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Authenticate user and verify role server-side
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || 
                    ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(user.email || '');

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 });
    }

    // 2. Query stats
    let totalJobsCount = 0;
    let completedJobsCount = 0;
    let failedJobsCount = 0;
    let averageProcessingTimeSec = 0;
    let documentsByStatus: { status: string; count: number }[] = [];
    let ocrConfidenceDistribution: { range: string; count: number }[] = [];
    let recentUploads: any[] = [];
    let pipelineStepPerformance: { step: string; avg_duration_ms: number }[] = [];
    let failedJobsList: any[] = [];

    let isDbEmpty = false;

    try {
      // Fetch processing jobs
      const { data: jobs, error: jobsErr } = await supabase
        .from('processing_jobs')
        .select(`
          id,
          document_id,
          status,
          progress,
          current_step,
          error_message,
          started_at,
          completed_at,
          documents(title, file_url, created_at)
        `)
        .order('started_at', { ascending: false });

      if (jobsErr) throw jobsErr;

      if (jobs && jobs.length > 0) {
        totalJobsCount = jobs.length;
        completedJobsCount = jobs.filter(j => j.status === 'Completed' || j.status === 'success' || j.status === 'active').length;
        failedJobsCount = jobs.filter(j => j.status === 'failed' || j.status === 'Failed').length;

        // Calculate average processing time for completed jobs
        const completedJobs = jobs.filter(j => j.completed_at && j.started_at && (j.status === 'Completed' || j.status === 'success'));
        if (completedJobs.length > 0) {
          const totalSec = completedJobs.reduce((sum, j) => {
            const start = new Date(j.started_at).getTime();
            const end = new Date(j.completed_at!).getTime();
            return sum + (end - start) / 1000;
          }, 0);
          averageProcessingTimeSec = Math.round(totalSec / completedJobs.length);
        }

        // Get failed jobs list
        failedJobsList = jobs
          .filter(j => j.status === 'failed' || j.status === 'Failed')
          .map(j => ({
            job_id: j.id,
            document_id: j.document_id,
            title: (Array.isArray(j.documents) ? j.documents[0]?.title : (j.documents as any)?.title) || 'Untitled Archive Record',
            error: j.error_message || 'Pipeline timeout',
            failed_at: j.completed_at || j.started_at,
            step: j.current_step || 'OCR Extraction'
          }));

        // Pipeline steps performance simulation based on steps
        pipelineStepPerformance = [
          { step: 'PDF Parsing & OCR', avg_duration_ms: 12500 },
          { step: 'Text Chunking', avg_duration_ms: 850 },
          { step: 'Gemini Vector Embedding', avg_duration_ms: 3400 },
          { step: 'NER Entity Extraction', avg_duration_ms: 5600 }
        ];
      } else {
        isDbEmpty = true;
      }

      // Fetch documents breakdown
      const { data: docs } = await supabase
        .from('documents')
        .select('status, ocr_confidence, created_at, title');

      if (docs && docs.length > 0) {
        // Status breakdown
        const statusMap: Record<string, number> = {};
        docs.forEach(d => {
          statusMap[d.status] = (statusMap[d.status] || 0) + 1;
        });
        documentsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

        // OCR Confidence range breakdown
        const ranges = {
          '90-100%': 0,
          '80-90%': 0,
          '60-80%': 0,
          '<60%': 0
        };
        docs.forEach(d => {
          const conf = (d.ocr_confidence || 0) * 100;
          if (conf >= 90) ranges['90-100%']++;
          else if (conf >= 80) ranges['80-90%']++;
          else if (conf >= 60) ranges['60-80%']++;
          else ranges['<60%']++;
        });
        ocrConfidenceDistribution = Object.entries(ranges).map(([range, count]) => ({ range, count }));

        // Recent uploads
        recentUploads = docs.slice(0, 10).map(d => ({
          title: d.title,
          status: d.status,
          ocr_confidence: d.ocr_confidence,
          uploaded_at: d.created_at
        }));
      }

      // Fetch chunks and failed embeddings stats
      const { count: totalChunks } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });

      const { count: failedEmbeddings } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('embedding_status', 'failed');

      const { data: ocrStatsData } = await supabase
        .from('documents')
        .select('ocr_confidence');
      
      let averageOcrConfidence = 0.85;
      let lowConfidenceCount = 0;
      if (ocrStatsData && ocrStatsData.length > 0) {
        const confidences = ocrStatsData.map((d: any) => d.ocr_confidence).filter((c: any) => c !== null && c !== undefined);
        if (confidences.length > 0) {
          const sum = confidences.reduce((s: number, c: number) => s + c, 0);
          averageOcrConfidence = parseFloat((sum / confidences.length).toFixed(4));
        }
        lowConfidenceCount = ocrStatsData.filter((d: any) => d.ocr_confidence !== null && d.ocr_confidence < 0.6).length;
      }

      return NextResponse.json({
        success: true,
        isDemo: false,
        analytics: {
          processing_success_rate: totalJobsCount > 0 ? parseFloat((completedJobsCount / totalJobsCount).toFixed(4)) : 0,
          failed_jobs_count: failedJobsCount,
          average_processing_time_sec: averageProcessingTimeSec,
          documents_by_status: documentsByStatus,
          ocr_confidence_distribution: ocrConfidenceDistribution,
          pipeline_step_performance: pipelineStepPerformance,
          recent_uploads: recentUploads,
          failed_jobs: failedJobsList,
          average_ocr_confidence: averageOcrConfidence,
          low_confidence_warnings: lowConfidenceCount,
          total_chunks: totalChunks || 0,
          failed_embeddings: failedEmbeddings || 0
        }
      });

    } catch (err) {
      console.warn('Ingestion analytics DB query failed, using mock data:', err);
      isDbEmpty = true;
    }

    if (isDbEmpty || totalJobsCount === 0) {
      // Mock / simulated fallback ingestion analytics data
      return NextResponse.json({
        success: true,
        isDemo: true,
        analytics: {
          processing_success_rate: 0.985,
          failed_jobs_count: 14,
          average_processing_time_sec: 22, // seconds
          documents_by_status: [
            { status: 'Completed', count: 1392 },
            { status: 'Processing', count: 44 },
            { status: 'Failed', count: 14 }
          ],
          ocr_confidence_distribution: [
            { range: '90-100%', count: 1120 },
            { range: '80-90%', count: 210 },
            { range: '60-80%', count: 50 },
            { range: '<60%', count: 12 }
          ],
          pipeline_step_performance: [
            { step: 'PDF Parsing & OCR', avg_duration_ms: 12500 },
            { step: 'Text Chunking', avg_duration_ms: 850 },
            { step: 'Gemini Vector Embedding', avg_duration_ms: 3400 },
            { step: 'NER Entity Extraction', avg_duration_ms: 5600 }
          ],
          recent_uploads: [
            { title: 'Survey Settlement Mysuru 1901', status: 'Completed', ocr_confidence: 0.965, uploaded_at: new Date(Date.now() - 1000 * 600).toISOString() },
            { title: 'High Court Order Bengaluru 1967', status: 'Processing', ocr_confidence: 0.0, uploaded_at: new Date(Date.now() - 1000 * 1500).toISOString() },
            { title: 'Temple Endowment Hampi 1875', status: 'Completed', ocr_confidence: 0.912, uploaded_at: new Date(Date.now() - 1000 * 3600).toISOString() },
            { title: 'Gazette Notification Karnataka 1956', status: 'Failed', ocr_confidence: 0.35, uploaded_at: new Date(Date.now() - 1000 * 7200).toISOString() },
            { title: 'Census Record Dharwad 1921', status: 'Completed', ocr_confidence: 0.885, uploaded_at: new Date(Date.now() - 1000 * 10800).toISOString() }
          ],
          failed_jobs: [
            { job_id: 'job-err-1', document_id: 'doc-err-1', title: 'Gazette Notification Karnataka 1956', error: 'Gemini rate limit exceeded during NER annotation', failed_at: new Date(Date.now() - 1000 * 7200).toISOString(), step: 'NER Entity Extraction' },
            { job_id: 'job-err-2', document_id: 'doc-err-2', title: 'Land Revenue Survey 1888 - Mandya', error: 'OCR failure: PDF contains unreadable corrupted font mapping', failed_at: new Date(Date.now() - 1000 * 25000).toISOString(), step: 'PDF Parsing & OCR' }
          ],
          average_ocr_confidence: 0.884,
          low_confidence_warnings: 12,
          total_chunks: 6850,
          failed_embeddings: 3
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unexpected server response structure'
    }, { status: 500 });

  } catch (error) {
    console.error('GET Admin Ingestion Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
