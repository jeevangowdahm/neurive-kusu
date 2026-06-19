import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getHomepageData } from '@/lib/homepage-data';

export async function GET(req: NextRequest) {
  try {
    const data = await getHomepageData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
