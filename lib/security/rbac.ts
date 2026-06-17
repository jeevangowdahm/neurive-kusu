'use client';

import { supabase } from '@/lib/supabase';

/**
 * Role-Based Access Control (RBAC) System
 * Manages user permissions and role hierarchy
 */

export type UserRole = 'viewer' | 'contributor' | 'curator' | 'admin' | 'superadmin';

export type Permission =
  | 'archives:read'
  | 'archives:write'
  | 'archives:delete'
  | 'archives:download'
  | 'archives:upload'
  | 'collections:read'
  | 'collections:write'
  | 'collections:delete'
  | 'search:basic'
  | 'search:advanced'
  | 'search:ai'
  | 'users:read'
  | 'users:manage'
  | 'audit:read'
  | 'api_keys:manage'
  | 'system:admin'
  | 'system:config';

const rolePermissions: Record<UserRole, Permission[]> = {
  viewer: [
    'archives:read',
    'collections:read',
    'search:basic',
  ],
  contributor: [
    'archives:read',
    'archives:download',
    'archives:upload',
    'collections:read',
    'collections:write',
    'search:basic',
    'search:advanced',
  ],
  curator: [
    'archives:read',
    'archives:write',
    'archives:download',
    'archives:upload',
    'collections:read',
    'collections:write',
    'collections:delete',
    'search:basic',
    'search:advanced',
    'search:ai',
  ],
  admin: [
    'archives:read',
    'archives:write',
    'archives:delete',
    'archives:download',
    'archives:upload',
    'collections:read',
    'collections:write',
    'collections:delete',
    'search:basic',
    'search:advanced',
    'search:ai',
    'users:read',
    'users:manage',
    'audit:read',
    'api_keys:manage',
  ],
  superadmin: [
    'archives:read',
    'archives:write',
    'archives:delete',
    'archives:download',
    'archives:upload',
    'collections:read',
    'collections:write',
    'collections:delete',
    'search:basic',
    'search:advanced',
    'search:ai',
    'users:read',
    'users:manage',
    'audit:read',
    'api_keys:manage',
    'system:admin',
    'system:config',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get the user's role from their profile
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return 'viewer';

    return (data.role as UserRole) || 'viewer';
  } catch (error) {
    console.error('Get user role error:', error);
    return 'viewer';
  }
}

/**
 * Check if current user can perform an action
 */
export async function canPerformAction(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId);
  return hasPermission(role, permission);
}

/**
 * Get role display info
 */
export function getRoleInfo(role: UserRole): {
  label: string;
  description: string;
  color: string;
} {
  const info: Record<UserRole, { label: string; description: string; color: string }> = {
    viewer: {
      label: 'Viewer',
      description: 'Can browse and search archives',
      color: '#6B7280',
    },
    contributor: {
      label: 'Contributor',
      description: 'Can upload and download archives',
      color: '#3B82F6',
    },
    curator: {
      label: 'Curator',
      description: 'Can manage collections and use AI search',
      color: '#10B981',
    },
    admin: {
      label: 'Admin',
      description: 'Full management access with audit logs',
      color: '#F59E0B',
    },
    superadmin: {
      label: 'Super Admin',
      description: 'Complete system control',
      color: '#EF4444',
    },
  };

  return info[role] || info.viewer;
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return ['viewer', 'contributor', 'curator', 'admin', 'superadmin'];
}
