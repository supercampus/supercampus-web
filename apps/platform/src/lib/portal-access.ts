import type { AuthStudent } from './types';

export type PortalDestination = 'student' | 'staff' | 'parent' | 'platform-control';

const LEGACY_STUDENT_ROLES = new Set(['student', 'prospective_student']);

export function portalDestination(
  identity: Pick<AuthStudent, 'portalFamilies' | 'role'>,
): PortalDestination {
  const families = identity.portalFamilies ?? [];
  if (families.includes('student')) return 'student';
  if (families.includes('staff') || families.includes('admin')) return 'staff';
  if (families.includes('parent')) return 'parent';

  return LEGACY_STUDENT_ROLES.has(identity.role.toLowerCase()) ? 'student' : 'staff';
}

export function canOpenStaffWorkspace(
  identity: Pick<AuthStudent, 'portalFamilies' | 'role'>,
) {
  return portalDestination(identity) === 'staff';
}

/**
 * Returns the public, human-readable campus slug supplied by the authenticated
 * tenant record. The database tenant UUID remains private to the API/session.
 */
export function tenantSlug(identity: Pick<AuthStudent, 'tenant'>) {
  const slug = identity.tenant.code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'campus';
}

export function tenantPortalPath(
  identity: Pick<AuthStudent, 'tenant'>,
  destination = '',
) {
  const suffix = destination ? `/${destination.replace(/^\/+/, '')}` : '';
  return `/${tenantSlug(identity)}${suffix}`;
}
