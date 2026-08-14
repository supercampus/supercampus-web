import { apiRequest } from './api';

export type PermissionScope = 'own' | 'assigned' | 'department' | 'institution' | 'all';
export type PortalFamily = 'student' | 'parent' | 'staff' | 'admin';

export interface AuthorizationPermission {
  key: string;
  moduleKey: string;
  featureKey: string;
  action: string;
  crudActions: Array<'create' | 'read' | 'update' | 'delete'>;
  name: string;
  description: string;
  active: boolean;
}

export interface AuthorizationGrant {
  key: string;
  scope: PermissionScope;
  mode?: 'allow' | 'deny';
  constraints: Record<string, unknown>;
}

export interface AuthorizationRole {
  id: string;
  key: string;
  name: string;
  team: string;
  scope: string;
  portalFamily: PortalFamily;
  protected: boolean;
  active: boolean;
  permissions: AuthorizationGrant[];
}

export interface TenantUserRole {
  id: string;
  key: string;
  name: string;
  team: string;
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  accountType: string;
  active: boolean;
  roles: TenantUserRole[];
}

const AUTHORIZATION_ROOT = '/v1/authorization';

export function getAuthorizationPermissions() {
  return apiRequest<{ data: AuthorizationPermission[] }>(`${AUTHORIZATION_ROOT}/permissions`);
}

export function getAuthorizationRoles() {
  return apiRequest<{ data: AuthorizationRole[] }>(`${AUTHORIZATION_ROOT}/roles`);
}

export function createAuthorizationRole(input: {
  key: string;
  name: string;
  team: string;
  scope: string;
  portalFamily: PortalFamily;
}) {
  return apiRequest<{ data: AuthorizationRole }>(`${AUTHORIZATION_ROOT}/roles`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setAuthorizationRolePermissions(
  roleId: string,
  permissions: AuthorizationGrant[],
) {
  return apiRequest<{ data: AuthorizationRole }>(
    `${AUTHORIZATION_ROOT}/roles/${roleId}/permissions`,
    {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    },
  );
}

export function getTenantUsers() {
  return apiRequest<{ data: TenantUser[] }>(`${AUTHORIZATION_ROOT}/users`);
}

export function createTenantUser(input: {
  name: string;
  email: string;
  roleIds: string[];
  password: string;
}) {
  return apiRequest<{
    data: {
      id: string;
      email: string;
      name: string;
      roleIds: string[];
      created: boolean;
    };
  }>(`${AUTHORIZATION_ROOT}/users`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function assignTenantUserRoles(userId: string, roleIds: string[]) {
  return apiRequest<{
    data: {
      userId: string;
      roleIds: string[];
    };
  }>(`${AUTHORIZATION_ROOT}/users/${userId}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roleIds }),
  });
}

export function getTenantUserAccess(userId: string, surface: 'app' | 'website' = 'app') {
  return apiRequest<{
    data: {
      surface: 'app' | 'website';
      userId: string;
      grants: AuthorizationGrant[];
    };
  }>(`${AUTHORIZATION_ROOT}/users/${userId}/access?surface=${surface}`);
}

export function setTenantUserAccess(
  userId: string,
  input: {
    surface: 'app' | 'website';
    grants: AuthorizationGrant[];
  },
) {
  return apiRequest<{
    data: {
      userId: string;
      surface: 'app' | 'website';
      grantCount: number;
    };
  }>(`${AUTHORIZATION_ROOT}/users/${userId}/access`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
