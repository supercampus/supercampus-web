export type StaffNavigationId =
  | 'dashboard'
  | 'crm'
  | 'pipeline'
  | 'admissions'
  | 'application-desk'
  | 'students'
  | 'academics'
  | 'fees'
  | 'erp'
  | 'reports'
  | 'users'
  | 'settings';

export type StaffSettingsId = 'account' | 'access' | 'forms' | 'workflows' | 'theme';

const NAVIGATION_ORDER: StaffNavigationId[] = [
  'dashboard',
  'crm',
  'pipeline',
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
    case 'admissions':
      return hasModulePermission(permissions, 'admissions')
        || hasPermission(permissions, 'crm.erp.handoff');
    case 'application-desk':
      return hasModulePermission(permissions, 'application-desk');
    case 'students':
      return hasModulePermission(permissions, 'students');
    case 'academics':
      return hasModulePermission(permissions, 'academics');
    case 'fees':
      return hasModulePermission(permissions, 'fees');
    case 'erp':
      return hasModulePermission(permissions, 'erp');
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
  return settings;
}

/**
 * Application Desk actions are permission-gated individually, so verification,
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

export function dashboardCapabilities(permissions: readonly string[]) {
  return {
    read: hasPermission(permissions, 'crm.dashboard.read'),
    leads: hasPermission(permissions, 'crm.leads.read'),
    team: hasPermission(permissions, 'crm.assignment.read'),
    reports: hasPermission(permissions, 'crm.reports.read'),
    erpHandoff: hasPermission(permissions, 'crm.erp.handoff'),
  };
}
