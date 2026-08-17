import type { PermissionScope, PortalFamily } from './authorization-api';

export type AuthorityLevel = 'platform' | 'tenant' | 'department' | 'assigned' | 'self';

export type AuthorityRoleKey =
  | 'platform_super_admin'
  | 'tenant_admin'
  | 'management'
  | 'principal'
  | 'academic_administrator'
  | 'hod'
  | 'accountant'
  | 'admissions_officer'
  | 'faculty'
  | 'student'
  | 'parent';

export interface AuthorityRoleTemplate {
  key: AuthorityRoleKey;
  name: string;
  team: string;
  portalFamily: PortalFamily | 'platform-control';
  authorityLevel: AuthorityLevel;
  defaultScope: PermissionScope;
  recommendedModules: string[];
  tenantAssignable: boolean;
  description: string;
}

export type TenantAuthorityRoleTemplate = AuthorityRoleTemplate & {
  portalFamily: PortalFamily;
  tenantAssignable: true;
};

/**
 * A portal is a user experience, while a role is an authority bundle inside it.
 * Keep this catalogue free of permission keys: those remain tenant-configurable
 * and are resolved from the live permission catalogue.
 */
export const AUTHORITY_ROLE_TEMPLATES: readonly AuthorityRoleTemplate[] = [
  {
    key: 'platform_super_admin',
    name: 'Platform SuperAdmin',
    team: 'SuperCampus Platform',
    portalFamily: 'platform-control',
    authorityLevel: 'platform',
    defaultScope: 'all',
    recommendedModules: ['tenants', 'subscriptions', 'platform-health', 'support', 'audit'],
    tenantAssignable: false,
    description: 'Operates the SuperCampus platform across tenants without joining a college role.',
  },
  {
    key: 'tenant_admin',
    name: 'College Administrator',
    team: 'Administration',
    portalFamily: 'admin',
    authorityLevel: 'tenant',
    defaultScope: 'institution',
    recommendedModules: ['users', 'roles', 'settings', 'forms', 'workflows', 'audit'],
    tenantAssignable: true,
    description: 'Configures one college tenant, its users, branding, workflows and access.',
  },
  {
    key: 'management',
    name: 'Management',
    team: 'Management',
    portalFamily: 'staff',
    authorityLevel: 'tenant',
    defaultScope: 'institution',
    recommendedModules: ['dashboard', 'fees', 'reports', 'approvals', 'audit'],
    tenantAssignable: true,
    description: 'Handles institution-level management decisions, including final refund approval.',
  },
  {
    key: 'principal',
    name: 'Principal',
    team: 'Leadership',
    portalFamily: 'staff',
    authorityLevel: 'tenant',
    defaultScope: 'institution',
    recommendedModules: ['dashboard', 'students', 'academics', 'fees', 'erp', 'reports', 'approvals'],
    tenantAssignable: true,
    description: 'Institution-wide academic, fee and student-status oversight without admissions approval.',
  },
  {
    key: 'academic_administrator',
    name: 'Academic Administrator',
    team: 'Academics',
    portalFamily: 'staff',
    authorityLevel: 'tenant',
    defaultScope: 'institution',
    recommendedModules: ['academics', 'timetable', 'attendance', 'examinations'],
    tenantAssignable: true,
    description: 'Configures academic structures and assigns departments, classes and subjects.',
  },
  {
    key: 'hod',
    name: 'Head of Department',
    team: 'Academics',
    portalFamily: 'staff',
    authorityLevel: 'department',
    defaultScope: 'department',
    recommendedModules: ['dashboard', 'students', 'academics', 'attendance', 'examinations', 'reports'],
    tenantAssignable: true,
    description: 'Runs an assigned department and sees cross-department teaching assigned to its staff.',
  },
  {
    key: 'accountant',
    name: 'Accountant',
    team: 'Finance',
    portalFamily: 'staff',
    authorityLevel: 'tenant',
    defaultScope: 'institution',
    recommendedModules: ['fees', 'collections', 'reconciliation', 'refunds', 'finance-reports'],
    tenantAssignable: true,
    description: 'Prepares and reconciles finance activity but cannot approve refunds.',
  },
  {
    key: 'admissions_officer',
    name: 'Admissions Officer',
    team: 'Admissions',
    portalFamily: 'staff',
    authorityLevel: 'assigned',
    defaultScope: 'assigned',
    recommendedModules: ['crm', 'pipeline', 'application-desk', 'students'],
    tenantAssignable: true,
    description: 'Works assigned leads and applications through admission and onboarding.',
  },
  {
    key: 'faculty',
    name: 'Faculty',
    team: 'Academics',
    portalFamily: 'staff',
    authorityLevel: 'assigned',
    defaultScope: 'assigned',
    recommendedModules: ['timetable', 'attendance', 'academics', 'examinations'],
    tenantAssignable: true,
    description: 'Works with assigned classes, subjects and students.',
  },
  {
    key: 'student',
    name: 'Student',
    team: 'Students',
    portalFamily: 'student',
    authorityLevel: 'self',
    defaultScope: 'own',
    recommendedModules: ['home', 'academics', 'attendance', 'fees', 'campus-services', 'profile'],
    tenantAssignable: true,
    description: 'Uses personal academic and campus services only.',
  },
  {
    key: 'parent',
    name: 'Parent or Guardian',
    team: 'Guardians',
    portalFamily: 'parent',
    authorityLevel: 'self',
    defaultScope: 'own',
    recommendedModules: ['student-summary', 'attendance', 'fees', 'notices', 'approvals'],
    tenantAssignable: true,
    description: 'Views explicitly linked student information and guardian actions.',
  },
] as const;

export function authorityRoleTemplate(key: AuthorityRoleKey) {
  return AUTHORITY_ROLE_TEMPLATES.find((template) => template.key === key);
}

export function tenantAuthorityRoleTemplates(): TenantAuthorityRoleTemplate[] {
  return AUTHORITY_ROLE_TEMPLATES.filter(
    (template): template is TenantAuthorityRoleTemplate =>
      template.tenantAssignable && template.portalFamily !== 'platform-control',
  );
}

export function usesDedicatedApplication(template: AuthorityRoleTemplate) {
  return template.portalFamily === 'platform-control';
}
