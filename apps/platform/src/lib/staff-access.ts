export type StaffNavigationId =
  | 'dashboard'
  | 'crm'
  | 'pipeline'
  | 'ai-assistant'
  | 'admissions'
  | 'application-desk'
  | 'students'
  | 'academics'
  | 'fees'
  | 'erp'
  | 'reports'
  | 'users'
  | 'settings';

export type StaffSettingsId = 'account' | 'access' | 'forms' | 'workflows' | 'theme' | 'campus';

/**
 * Sections this build knows how to render.
 *
 * Visibility is decided by the API from tenant configuration and effective grants;
 * this list only narrows the response to keys the client has a view for.
 */
export const NAVIGATION_ORDER: StaffNavigationId[] = [
  'dashboard',
  'crm',
  'pipeline',
  'ai-assistant',
  'admissions',
  'application-desk',
  'students',
  'academics',
  'fees',
  'erp',
  'reports',
  'users',
  'settings',
];

export const SETTINGS_ORDER: StaffSettingsId[] = ['account', 'access', 'forms', 'workflows', 'theme', 'campus'];

export function hasPermission(permissions: readonly string[], permission: string) {
  return permissions.includes('*') || permissions.includes(permission);
}

export function hasAnyPermission(permissions: readonly string[], required: readonly string[]) {
  return permissions.includes('*') || required.some((permission) => permissions.includes(permission));
}

export function hasModulePermission(permissions: readonly string[], moduleKey: string) {
  return permissions.includes('*') || permissions.some((permission) => permission.startsWith(`${moduleKey}.`));
}

export function canOpenStaffNavigation(
  permissions: readonly string[],
  navigation: StaffNavigationId,
) {
  switch (navigation) {
    case 'dashboard':
    case 'crm':
      return hasPermission(permissions, 'crm.dashboard.read');
    case 'pipeline':
      return hasPermission(permissions, 'crm.leads.read');
    case 'ai-assistant':
      return hasAnyPermission(permissions, [
        'crm.leads.read',
        'crm.dashboard.read',
        'admissions.read',
        'admissions.records.read',
      ]);
    case 'admissions':
      return hasModulePermission(permissions, 'admissions')
        || hasPermission(permissions, 'crm.erp.handoff');
    case 'application-desk':
      return hasPermission(permissions, 'application-desk.view');
    case 'students':
      return hasModulePermission(permissions, 'students');
    case 'academics':
      return hasAnyPermission(permissions, [
        'academics.timetable.manage',
        'timetable.configuration.read',
        'timetable.configuration.update',
      ])
        || hasModulePermission(permissions, 'academics')
        || hasModulePermission(permissions, 'timetable');
    case 'fees':
      return hasModulePermission(permissions, 'fees')
        || hasAnyPermission(permissions, [
          'students.directory.read',
          'canteen.wallet.top_up',
          'fees.refunds.prepare',
          'fees.refunds.approve',
        ]);
    case 'erp':
      return hasModulePermission(permissions, 'erp')
        || hasModulePermission(permissions, 'gatepass');
    case 'reports':
      return hasPermission(permissions, 'crm.reports.read')
        || permissions.some((permission) => permission.endsWith('.reports.read'));
    case 'users':
      return hasAnyPermission(permissions, [
        'authorization.users.read',
        'authorization.roles.read',
        'authorization.permissions.read',
      ]);
    case 'settings':
      return availableStaffSettings(permissions).length > 0;
  }
}

export function availableErpWorkspaceTabs(permissions: readonly string[]) {
  if (permissions.includes('*') || hasModulePermission(permissions, 'erp')) {
    return ['Service desk', 'Shops', 'Gatepass', 'Catalogue', 'SLA monitor'];
  }

  return hasModulePermission(permissions, 'gatepass') ? ['Gatepass'] : [];
}

export function availableStaffNavigation(permissions: readonly string[]) {
  return NAVIGATION_ORDER.filter((navigation) => canOpenStaffNavigation(permissions, navigation));
}

export function availableStaffSettings(permissions: readonly string[]): StaffSettingsId[] {
  const settings: StaffSettingsId[] = ['account'];
  if (hasAnyPermission(permissions, [
    'authorization.permissions.read',
    'authorization.roles.read',
    'authorization.users.read',
  ])) settings.push('access');
  if (hasPermission(permissions, 'crm.forms.read')) settings.push('forms');
  if (hasPermission(permissions, 'crm.configuration.read')) settings.push('workflows');
  if (permissions.includes('*') || hasPermission(permissions, 'platform.configuration.update')) {
    settings.push('theme');
  }
  // Read is enough to open it: the panel renders the fence read-only without
  // the update grant, which is worth showing to anyone who needs to know where
  // the boundary is without being able to move it.
  if (hasAnyPermission(permissions, [
    'platform.configuration.read',
    'timetable.config.read',
  ])) {
    settings.push('campus');
  }
  return settings;
}

/**
 * Admission Desk actions are permission-gated individually, so verification,
 * approval and activation can sit with different teams.
 */
export function applicationDeskCapabilities(permissions: readonly string[]) {
  return {
    view: hasPermission(permissions, 'application-desk.view'),
    edit: hasPermission(permissions, 'application-desk.edit'),
    verify: hasPermission(permissions, 'application-desk.verify'),
    assign: hasPermission(permissions, 'application-desk.assign'),
    approve: hasPermission(permissions, 'application-desk.approve'),
    reject: hasPermission(permissions, 'application-desk.reject'),
    hold: hasPermission(permissions, 'application-desk.hold'),
    resume: hasPermission(permissions, 'application-desk.resume'),
    activate: hasPermission(permissions, 'application-desk.activate'),
    configure: hasPermission(permissions, 'application-desk.manage_settings'),
  };
}

/**
 * Which permission advancing *out of* a given stage requires.
 *
 * `.verify` used to authorise every forward move, so anyone who could verify a
 * document could also sign off the approval stage and activate the student —
 * which defeats the point of having `.approve` and `.activate` at all. The
 * permission follows the work the stage represents.
 */
export function permissionForAdvance(stage: string): string {
  switch (stage) {
    case 'APPROVAL':
      return 'application-desk.approve';
    case 'STUDENT_CREATION':
    case 'ACCOUNT_PROVISIONING':
    case 'ACCESS_PROVISIONING':
    case 'ACTIVATION':
      return 'application-desk.activate';
    default:
      return 'application-desk.verify';
  }
}

/** Casework actions are gated by the kind of record they touch. */
export function permissionForCasework(action: string): string {
  switch (action) {
    case 'approve':
      return 'application-desk.approve';
    case 'allocate_section':
      return 'application-desk.assign';
    case 'map_academics':
    case 'record_application':
      return 'application-desk.edit';
    default:
      return 'application-desk.verify';
  }
}

export function dashboardCapabilities(permissions: readonly string[]) {
  return {
    read: hasPermission(permissions, 'crm.dashboard.read'),
    leads: hasPermission(permissions, 'crm.leads.read'),
    team: hasPermission(permissions, 'crm.assignment.read'),
    reports: hasPermission(permissions, 'crm.reports.read'),
    erpHandoff: hasPermission(permissions, 'crm.erp.handoff'),
  };
}
