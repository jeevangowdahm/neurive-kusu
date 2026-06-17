import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const body = await req.json();
    const { message_id, feedback } = body as {
      message_id: string;
      feedback: 'helpful' | 'not_helpful';
    };

    if (!message_id) {
      return NextResponse.json({ success: false, error: 'Message ID is required' }, { status: 400 });
    }

    if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
      return NextResponse.json({ success: false, error: 'Valid feedback option is required' }, { status: 400 });
    }

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // If guest (not logged in), skip database updates (state resides in client localStorage)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Guest feedback processed locally'
      });
    }

    // 2. Securely update feedback for the user's OWN message
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ feedback })
      .eq('id', message_id)
      .eq('user_id', user.id) // security check: must be owner
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Message not found or you are not authorized to rate this message'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully',
      data
    });

  } catch (error) {
    console.error('Chat Feedback API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  }
}
