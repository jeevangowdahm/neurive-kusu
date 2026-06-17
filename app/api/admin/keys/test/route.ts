import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorize admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || 'guest';
    const email = user.email || '';
    const isSuperAdmin = ['jeevangowdahm6@gmail.com', 'jeevangowda082007@gmail.com', 'user@neurive.karnataka.gov.in'].includes(email);
    const isAdmin = role === 'admin' || isSuperAdmin;

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    // 3. Parse payload
    const body = await req.json();
    const { apiKey, feature } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ success: false, error: 'API key is required' }, { status: 400 });
    }

    // 4. Test connection using a lightweight request to Gemini API
    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond with the word OK and nothing else." }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 5,
        },
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || `API error status ${response.status}`;
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: errMsg,
        latencyMs
      });
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (textResponse.toLowerCase().includes('ok') || textResponse.trim().length > 0) {
      return NextResponse.json({
        success: true,
        status: 'success',
        latencyMs,
        model: 'gemini-1.5-flash'
      });
    } else {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: 'Empty response returned from model',
        latencyMs
      });
    }

  } catch (error) {
    console.error('API Key Test Connection Error:', error);
    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Network/Server Error'
    }, { status: 500 });
  }
}
