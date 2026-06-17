'use client';

import { supabase } from '@/lib/supabase';

/**
 * API Key Management
 * Create, validate, and manage API keys for programmatic access
 */

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: APIKeyPermissions;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface APIKeyPermissions {
  read: boolean;
  write: boolean;
  search: boolean;
  ai: boolean;
  admin: boolean;
}

export interface CreateAPIKeyParams {
  name: string;
  permissions: Partial<APIKeyPermissions>;
  rateLimit?: number;
  expiresAt?: string;
}

/**
 * Generate a new API key
 */
export async function createAPIKey(
  userId: string,
  params: CreateAPIKeyParams
): Promise<{ apiKey: APIKey; rawKey: string } | null> {
  try {
    const rawKey = generateRawKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 8);

    const permissions: APIKeyPermissions = {
      read: params.permissions.read ?? true,
      write: params.permissions.write ?? false,
      search: params.permissions.search ?? true,
      ai: params.permissions.ai ?? false,
      admin: params.permissions.admin ?? false,
    };

    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          user_id: userId,
          key_hash: keyHash,
          name: params.name,
          permissions,
          rate_limit: params.rateLimit || 100,
          is_active: true,
          expires_at: params.expiresAt || null,
        },
      ])
      .select('id, name, permissions, rate_limit, is_active, last_used_at, expires_at, created_at')
      .single();

    if (error) throw error;

    return {
      apiKey: {
        id: data.id,
        userId,
        name: data.name,
        keyPrefix,
        permissions: data.permissions,
        rateLimit: data.rate_limit,
        isActive: data.is_active,
        lastUsedAt: data.last_used_at,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
      rawKey,
    };
  } catch (error) {
    console.error('Create API key error:', error);
    return null;
  }
}

/**
 * List API keys for a user
 */
export async function listAPIKeys(userId: string): Promise<APIKey[]> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, permissions, rate_limit, is_active, last_used_at, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId,
      name: row.name,
      keyPrefix: 'nv_****',
      permissions: row.permissions,
      rateLimit: row.rate_limit,
      isActive: row.is_active,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('List API keys error:', error);
    return [];
  }
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Revoke API key error:', error);
    return false;
  }
}

/**
 * Validate an API key (for use in edge functions)
 */
export async function validateAPIKey(rawKey: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: APIKeyPermissions;
  rateLimit?: number;
}> {
  try {
    const keyHash = await hashKey(rawKey);

    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, permissions, rate_limit, is_active, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    if (!data.is_active) {
      return { valid: false };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    return {
      valid: true,
      userId: data.user_id,
      permissions: data.permissions,
      rateLimit: data.rate_limit,
    };
  } catch (error) {
    console.error('Validate API key error:', error);
    return { valid: false };
  }
}

/**
 * Generate raw API key string
 */
function generateRawKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const segments: string[] = [];

  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 8; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return `nv_${segments.join('_')}`;
}

/**
 * Hash API key for storage (simple hash - in production use bcrypt/argon2)
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
