'use client';

import { supabase } from '@/lib/supabase';

/**
 * Audit Log System
 * Tracks all user actions for compliance and security monitoring
 */

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'view_archive'
  | 'download_archive'
  | 'search'
  | 'bookmark'
  | 'unbookmark'
  | 'create_collection'
  | 'update_collection'
  | 'delete_collection'
  | 'upload_document'
  | 'annotate'
  | 'api_key_create'
  | 'api_key_revoke'
  | 'admin_action'
  | 'export_data';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: AuditAction | string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: entry.userId,
        action: entry.action,
        resource_type: entry.resourceType || null,
        resource_id: entry.resourceId || null,
        details: entry.details || {},
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      },
    ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Audit log error:', error);
    return false;
  }
}

/**
 * Get audit logs for current user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    action?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.action) {
      query = query.eq('action', options.action);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(mapAuditLogEntry);
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(mapAuditLogEntry);
  } catch (error) {
    console.error('Get resource audit logs error:', error);
    return [];
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(userId: string): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  recentActivity: AuditLogEntry[];
}> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action')
      .eq('user_id', userId);

    if (error) throw error;

    const actionsByType: Record<string, number> = {};
    for (const row of data || []) {
      actionsByType[row.action] = (actionsByType[row.action] || 0) + 1;
    }

    const recent = await getUserAuditLogs(userId, { limit: 10 });

    return {
      totalActions: (data || []).length,
      actionsByType,
      recentActivity: recent,
    };
  } catch (error) {
    console.error('Get audit stats error:', error);
    return { totalActions: 0, actionsByType: {}, recentActivity: [] };
  }
}

function mapAuditLogEntry(row: any): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}
