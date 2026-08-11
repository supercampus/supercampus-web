import { apiRequest } from './api';

export type PermissionScope = 'all' | 'assigned' | 'own';

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
  constraints: Record<string, unknown>;
}

export interface AuthorizationRole {
  id: string;
  key: string;
  name: string;
  team: string;
  scope: string;
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
  password: string;
  roleIds: string[];
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
