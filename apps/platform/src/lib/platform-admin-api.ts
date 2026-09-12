import { apiRequest } from './api';

export interface PlatformOverview {
  generatedAt: string;
  tenants: { total: number; active: number };
  users: { total: number; active: number };
  support: { open: number; urgent: number };
  payments: { paid: number; capturedPaise: number };
  database: { status: string; sizeBytes: number; connections: number; poolSize: number; poolIdle: number };
  server: { status: string; loadAverage1m: number | null; uptimeSeconds: number | null; memory: { totalBytes: number; usedBytes: number } | null; observedAt: string };
}

export interface PlatformTenant {
  id: string; slug: string; code: string; name: string; city: string; status: 'active' | 'suspended';
  createdAt: string; users: number; openSupport: number;
}

export interface PlatformUser {
  id: string; email: string; name: string; accountType: string; active: boolean; lastLoginAt: string | null;
  createdAt: string; memberships: Array<{ id: string; name: string; slug: string; roles: string[]; active: boolean }>;
}

export interface SupportTicket {
  id: string; subject: string; description: string; requesterName: string; requesterEmail: string;
  priority: 'low' | 'normal' | 'high' | 'urgent'; status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  tenantId: string | null; tenantName: string | null; createdAt: string; updatedAt: string;
}

export interface PlatformPayment {
  id: string; amountPaise: number; currency: string; status: string; studentNumber: string; guardianName: string;
  providerReference: string; tenantId: string; tenantName: string; createdAt: string; paidAt: string | null;
}

export interface AuditEvent {
  id: string; action: string; resourceType: string; resourceId: string | null; details: unknown;
  tenantName: string; actorName: string | null; occurredAt: string;
}

const data = <T>(path: string, init?: RequestInit) => apiRequest<{ data: T }>(path, init).then((response) => response.data);

export const getPlatformOverview = () => data<PlatformOverview>('/v1/platform-admin/overview');
export const getPlatformTenants = () => data<{ tenants: PlatformTenant[] }>('/v1/platform-admin/tenants');
export const getPlatformUsers = () => data<{ users: PlatformUser[] }>('/v1/platform-admin/users');
export const getSupportTickets = () => data<{ tickets: SupportTicket[] }>('/v1/platform-admin/support');
export const getPlatformPayments = () => data<{ payments: PlatformPayment[] }>('/v1/platform-admin/payments');
export const getAuditEvents = () => data<{ events: AuditEvent[] }>('/v1/platform-admin/audit');

export const createPlatformTenant = (payload: Record<string, string>) => data('/v1/platform-admin/tenants', { method: 'POST', body: JSON.stringify(payload) });
export const updatePlatformTenant = (id: string, status: string) => data(`/v1/platform-admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const updatePlatformUser = (id: string, active: boolean) => data(`/v1/platform-admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ active }) });
export const createPlatformTeamMember = (payload: Record<string, string>) => data('/v1/platform-admin/team', { method: 'POST', body: JSON.stringify(payload) });
export const updateSupportTicket = (id: string, status: string, priority: string) => data(`/v1/platform-admin/support/${id}`, { method: 'PUT', body: JSON.stringify({ status, priority }) });
