import { NextResponse } from 'next/server';
import { ANALYTICS_DATA } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: ANALYTICS_DATA,
  });
}
