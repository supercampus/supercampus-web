import { apiRequest } from './api';

/**
 * Platform-level operations: service and module catalogs, tenant configuration
 * namespaces, and the generic dynamic-record CRUD surface.
 *
 * The catalogs are static source data in the Rust binary rather than a live control
 * plane, so they describe what the platform *knows about*, not what is implemented.
 * Treat an entry here as a declaration, not a guarantee that an HTTP service exists.
 */

const V1 = '/v1';

/**
 * Liveness. Served outside the `/api` prefix, so it is reached through the proxy
 * root rather than the API client's usual base path.
 */
export function getHealth() {
  return fetch('/health').then((response) => response.json() as Promise<{
    status: string; service: string; version: string;
  }>);
}

/** Readiness, including whether storage is reachable. */
export function getReady() {
  return fetch('/ready').then((response) => response.json() as Promise<{
    status: string; checks: Record<string, string>;
  }>);
}

export interface ServiceDescriptor {
  key: string;
  name: string;
  [extra: string]: unknown;
}

export interface ModuleDescriptor {
  key: string;
  name: string;
  capabilities?: string[];
  [extra: string]: unknown;
}

export interface BootstrapDocument {
  tenantId: string;
  userId: string;
  roles: string[];
  portalFamilies: Array<'student' | 'parent' | 'staff' | 'admin'>;
  permissions: string[];
  permissionScopes: Record<string, string>;
  workflows: Array<{
    tenantId: string;
    module: string;
    feature: string;
    version: number;
    initialState: string;
    terminalStates: string[];
    states: Array<{ id: string; label: string; status: string }>;
    transitions: Array<{
      from: string;
      to: string;
      action: string;
      requiredPermission: string;
      requiredRole?: string | null;
      label: string;
    }>;
  }>;
  services: ServiceDescriptor[];
  modules: ModuleDescriptor[];
  navigation: Array<{ id: string; label: string; route: string; requiredPermission: string }>;
}

/**
 * API index: name, version and catalog sizes.
 *
 * Axum mounts this at `/api/v1` with no trailing slash; `/api/v1/` is a 404.
 */
export function getApiIndex() {
  return apiRequest<{ data: Record<string, unknown> }>(V1);
}

/**
 * Everything the shell needs in one call: identity, effective grants, catalogs and
 * permission-filtered navigation.
 */
export function getBootstrap() {
  return apiRequest<{ data: BootstrapDocument }>(`${V1}/bootstrap`);
}

export function getServices() {
  return apiRequest<{ data: ServiceDescriptor[] }>(`${V1}/services`);
}

export function getService(serviceKey: string) {
  return apiRequest<{ data: ServiceDescriptor }>(`${V1}/services/${encodeURIComponent(serviceKey)}`);
}

/** Modules the caller holds at least one permission for. */
export function getModules() {
  return apiRequest<{ data: ModuleDescriptor[] }>(`${V1}/modules`);
}

export function getModule(moduleKey: string) {
  return apiRequest<{ data: ModuleDescriptor }>(`${V1}/modules/${encodeURIComponent(moduleKey)}`);
}

/* --- Tenant configuration --- */

/** Reads a configuration namespace document. */
export function getConfiguration(namespace: string) {
  return apiRequest<{ data: { namespace: string; document: Record<string, unknown>; version: number } }>(
    `${V1}/configuration/${encodeURIComponent(namespace)}`,
  );
}

/** Replaces a configuration namespace document. */
export function putConfiguration(namespace: string, document: Record<string, unknown>) {
  return apiRequest<{ data: { namespace: string; document: Record<string, unknown>; version: number } }>(
    `${V1}/configuration/${encodeURIComponent(namespace)}`,
    { method: 'PUT', body: JSON.stringify({ document }) },
  );
}

/* --- Dynamic records --- */

export interface DynamicRecord {
  id: string;
  moduleKey: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  [extra: string]: unknown;
}

/**
 * Schema-less CRUD for any module key.
 *
 * These routes are not covered by the granular CRM-style permission checks, so treat
 * them as an admin surface until per-module authorization lands on them.
 */
export function listRecords(moduleKey: string) {
  return apiRequest<{ data: DynamicRecord[] }>(`${V1}/${encodeURIComponent(moduleKey)}/records`);
}

/** `recordType` is required; omitting it fails deserialization with a 422. */
export function createRecord(
  moduleKey: string,
  recordType: string,
  data: Record<string, unknown>,
) {
  return apiRequest<{ data: DynamicRecord }>(`${V1}/${encodeURIComponent(moduleKey)}/records`, {
    method: 'POST',
    body: JSON.stringify({ recordType, data }),
  });
}

export function getRecord(moduleKey: string, recordId: string) {
  return apiRequest<{ data: DynamicRecord }>(
    `${V1}/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(recordId)}`,
  );
}

export function updateRecord(moduleKey: string, recordId: string, data: Record<string, unknown>) {
  return apiRequest<{ data: DynamicRecord }>(
    `${V1}/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(recordId)}`,
    { method: 'PATCH', body: JSON.stringify({ data }) },
  );
}

export function deleteRecord(moduleKey: string, recordId: string) {
  return apiRequest<void>(
    `${V1}/${encodeURIComponent(moduleKey)}/records/${encodeURIComponent(recordId)}`,
    { method: 'DELETE' },
  );
}
