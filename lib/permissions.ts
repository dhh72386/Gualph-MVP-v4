import type { UserRole } from '@prisma/client';

export const permissions = [
  'course:read', 'course:update', 'dashboard:read', 'tee-time:read', 'tee-time:write',
  'reservation:read', 'reservation:write', 'player:read', 'player:write',
  'pricing:read', 'pricing:approve', 'optimization:read', 'report:read', 'report:export',
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(permissions),
  COURSE_ADMIN: new Set(permissions),
  STAFF: new Set([
    'course:read', 'dashboard:read', 'tee-time:read', 'tee-time:write',
    'reservation:read', 'reservation:write', 'player:read', 'player:write',
  ]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
