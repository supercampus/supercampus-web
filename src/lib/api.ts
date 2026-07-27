import type { AppState, AuthStudent, LoginCredentials, PersistedAppState, Tenant } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.supercampus.ai/api').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiRequestError('Authentication service is unavailable. Please try again later.', 503);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiRequestError(body?.error ?? `API request failed (${response.status})`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getTenants() {
  return request<{ data: Tenant[] }>('/auth/tenants');
}
export function login(credentials: LoginCredentials) {
  return request<{ data: { student: AuthStudent } }>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}
export function getSession() {
  return request<{ data: { student: AuthStudent } }>('/auth/me');
}
export function logout() {
  return request<void>('/auth/logout', { method: 'POST' });
}
export function getAppState() {
  return request<{ data: { state: PersistedAppState; version: number; updatedAt: string } }>('/state');
}
export function saveAppState(state: PersistedAppState, action?: string) {
  return request('/state', { method: 'PUT', body: JSON.stringify({ state, action }) });
}

export function toPersistedState(state: AppState): PersistedAppState {
  return {
    persona: state.persona, gp: state.gp, paid: state.paid, pay: state.pay,
    refunds: state.refunds, condonation: state.condonation, examReg: state.examReg,
    reval: state.reval, asg: state.asg, changeNotice: state.changeNotice, mess: state.mess,
    hostelLeave: state.hostelLeave, hostelTickets: state.hostelTickets, tripStep: state.tripStep,
    breakdown: state.breakdown, docReq: state.docReq, placeApp: state.placeApp, feedback: state.feedback,
  };
}