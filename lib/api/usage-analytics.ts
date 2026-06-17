'use client';

import { supabase } from '@/lib/supabase';

/**
 * API Usage Analytics
 * Track and report API usage metrics
 */

export interface UsageMetrics {
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
  averageResponseTime: number;
  errorRate: number;
  topUsers: Array<{ userId: string; requestCount: number }>;
}

export interface UsageReport {
  period: { start: string; end: string };
  metrics: UsageMetrics;
  generatedAt: string;
}

/**
 * Get usage metrics for a user
 */
export async function getUserUsageMetrics(
  userId: string,
  days: number = 30
): Promise<UsageMetrics> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, created_at, details')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const logs = data || [];
    const requestsByEndpoint: Record<string, number> = {};
    const requestsByDayMap: Record<string, number> = {};
    let totalResponseTime = 0;
    let errorCount = 0;

    for (const log of logs) {
      const action = log.action;
      requestsByEndpoint[action] = (requestsByEndpoint[action] || 0) + 1;

      const day = log.created_at.split('T')[0];
      requestsByDayMap[day] = (requestsByDayMap[day] || 0) + 1;

      const details = log.details as Record<string, any> | null;
      if (details?.responseTimeMs) {
        totalResponseTime += details.responseTimeMs;
      }
      if (details?.error) {
        errorCount++;
      }
    }

    const requestsByDay = Object.entries(requestsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests: logs.length,
      requestsByEndpoint,
      requestsByDay,
      averageResponseTime: logs.length > 0 ? totalResponseTime / logs.length : 0,
      errorRate: logs.length > 0 ? errorCount / logs.length : 0,
      topUsers: [{ userId, requestCount: logs.length }],
    };
  } catch (error) {
    console.error('Get usage metrics error:', error);
    return {
      totalRequests: 0,
      requestsByEndpoint: {},
      requestsByDay: [],
      averageResponseTime: 0,
      errorRate: 0,
      topUsers: [],
    };
  }
}

/**
 * Generate usage report
 */
export async function generateUsageReport(
  userId: string,
  days: number = 30
): Promise<UsageReport> {
  const metrics = await getUserUsageMetrics(userId, days);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    metrics,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Track API request (call from edge functions)
 */
export async function trackAPIRequest(params: {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  responseTimeMs?: number;
  error?: string;
}): Promise<void> {
  try {
    await supabase.from('audit_logs').insert([
      {
        user_id: params.userId,
        action: `api:${params.action}`,
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
        details: {
          responseTimeMs: params.responseTimeMs,
          error: params.error,
        },
      },
    ]);
  } catch (error) {
    console.error('Track API request error:', error);
  }
}

/**
 * Get API endpoint documentation
 */
export function getAPIDocumentation(): Array<{
  method: string;
  path: string;
  description: string;
  auth: string;
  rateLimit: string;
}> {
  return [
    {
      method: 'GET',
      path: '/api/archives',
      description: 'List archives with optional filters',
      auth: 'API Key or Bearer Token',
      rateLimit: '100 req/min',
    },
    {
      method: 'GET',
      path: '/api/archives/:id',
      description: 'Get single archive by ID',
      auth: 'API Key or Bearer Token',
      rateLimit: '100 req/min',
    },
    {
      method: 'POST',
      path: '/api/search',
      description: 'AI-powered archive search',
      auth: 'API Key or Bearer Token',
      rateLimit: '30 req/min',
    },
    {
      method: 'POST',
      path: '/api/analytics',
      description: 'Get analytics data',
      auth: 'API Key (admin)',
      rateLimit: '10 req/min',
    },
    {
      method: 'GET',
      path: '/api/districts',
      description: 'List all districts',
      auth: 'API Key or Bearer Token',
      rateLimit: '60 req/min',
    },
    {
      method: 'GET',
      path: '/api/categories',
      description: 'List all categories',
      auth: 'API Key or Bearer Token',
      rateLimit: '60 req/min',
    },
  ];
}
