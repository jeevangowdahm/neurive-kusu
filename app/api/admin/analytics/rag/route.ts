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

    // 2. Query chat session statistics
    let totalSessions = 0;
    let totalQuestions = 0;
    let averageConfidence = 0.0;
    let lowConfidenceAnswersCount = 0;
    let refusedAnswersCount = 0;
    let helpfulFeedbackCount = 0;
    let notHelpfulFeedbackCount = 0;
    let mostCitedDocuments: { id: string; title: string; count: number }[] = [];
    let mostAskedTopics: { topic: string; count: number }[] = [];

    let isDbEmpty = false;

    try {
      // Sessions
      const { count: sessionCount, error: sessErr } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });

      if (sessErr) throw sessErr;
      totalSessions = sessionCount || 0;

      // Messages
      const { data: messages, error: msgErr } = await supabase
        .from('chat_messages')
        .select('role, content, confidence_score, feedback, citations');

      if (msgErr) throw msgErr;

      if (messages && messages.length > 0) {
        const userMsgs = messages.filter(m => m.role === 'user');
        const assistantMsgs = messages.filter(m => m.role === 'assistant');

        totalQuestions = userMsgs.length;

        // Confidence stats
        const confidences = assistantMsgs
          .map(m => Number(m.confidence_score))
          .filter(c => c > 0);
        averageConfidence = confidences.length > 0 
          ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length 
          : 0.0;

        lowConfidenceAnswersCount = assistantMsgs.filter(m => Number(m.confidence_score) < 0.5 && Number(m.confidence_score) > 0).length;

        // Refused answers (grounding checks failed)
        refusedAnswersCount = assistantMsgs.filter(m => 
          m.content?.includes('I could not find enough archival evidence')
        ).length;

        // Feedback
        helpfulFeedbackCount = assistantMsgs.filter(m => m.feedback === 'helpful').length;
        notHelpfulFeedbackCount = assistantMsgs.filter(m => m.feedback === 'not_helpful').length;

        // Citations ranking
        const citationDocIds: Record<string, { title: string; count: number }> = {};
        assistantMsgs.forEach(m => {
          const citations = (m.citations || []) as any[];
          citations.forEach(c => {
            const docId = c.document_id || c.archive_id;
            if (!docId) return;
            const title = c.title || 'Archival Document';
            if (!citationDocIds[docId]) {
              citationDocIds[docId] = { title, count: 0 };
            }
            citationDocIds[docId].count++;
          });
        });

        mostCitedDocuments = Object.entries(citationDocIds)
          .map(([id, info]) => ({ id, title: info.title, count: info.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Topics modeling from queries
        const topicMap: Record<string, number> = {};
        const stopWords = ['what', 'show', 'me', 'find', 'about', 'in', 'the', 'of', 'and', 'for', 'is', 'are', 'to'];
        userMsgs.forEach(m => {
          if (!m.content) return;
          const words = m.content.toLowerCase().replace(/[^a-zA-Z\s]/g, '').split(/\s+/);
          words.forEach((w: string) => {
            if (w.length > 3 && !stopWords.includes(w)) {
              topicMap[w] = (topicMap[w] || 0) + 1;
            }
          });
        });

        mostAskedTopics = Object.entries(topicMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([topic, count]) => ({ topic, count }));
      } else {
        isDbEmpty = true;
      }
    } catch (err) {
      console.warn('RAG analytics DB query failed, using mock data:', err);
      isDbEmpty = true;
    }

    if (isDbEmpty || totalSessions === 0) {
      // Mock simulated fallback RAG chat analytics data
      return NextResponse.json({
        success: true,
        isDemo: true,
        analytics: {
          total_chat_sessions: 245,
          total_user_questions: 1420,
          average_confidence_score: 0.864,
          low_confidence_answers: 32,
          refused_answers: 14,
          helpful_feedback_count: 245,
          not_helpful_feedback_count: 18,
          most_cited_documents: [
            { id: 'doc-1', title: 'Survey Settlement Mysuru 1901', count: 96 },
            { id: 'doc-2', title: 'Wodeyar Royal Grant Charter', count: 68 },
            { id: 'doc-3', title: 'Bengaluru District Boundary Ledger', count: 54 },
            { id: 'doc-4', title: 'Belagavi Land Dispute judgment', count: 42 },
            { id: 'doc-5', title: 'Tipu Sultan Military Dispatch 1792', count: 35 }
          ],
          most_asked_topics: [
            { topic: 'Mysuru', count: 480 },
            { topic: 'Inscriptions', count: 320 },
            { topic: 'Land Revenue', count: 215 },
            { topic: 'Belagavi', count: 184 },
            { topic: 'Boundaries', count: 124 },
            { topic: 'Sultan', count: 85 },
            { topic: 'Temple Grants', count: 72 }
          ]
        }
      });
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      analytics: {
        total_chat_sessions: totalSessions,
        total_user_questions: totalQuestions,
        average_confidence_score: parseFloat(averageConfidence.toFixed(4)),
        low_confidence_answers: lowConfidenceAnswersCount,
        refused_answers: refusedAnswersCount,
        helpful_feedback_count: helpfulFeedbackCount,
        not_helpful_feedback_count: notHelpfulFeedbackCount,
        most_cited_documents: mostCitedDocuments,
        most_asked_topics: mostAskedTopics
      }
    });

  } catch (error) {
    console.error('GET Admin RAG Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
