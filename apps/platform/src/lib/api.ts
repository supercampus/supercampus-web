import type { AppState, AuthStudent, LoginCredentials, PersistedAppState } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 12_000;
const UPLOAD_TIMEOUT_MS = 45_000;
let refreshPromise: Promise<void> | null = null;
const AUTH_REFRESH_LOCK = 'supercampus-auth-refresh';

type ApiRequestInit = RequestInit & { timeoutMs?: number };

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function errorMessage(body: unknown, status: number) {
  if (!body || typeof body !== 'object') return `API request failed (${status})`;
  const value = body as { error?: string | { message?: string }; message?: string };
  if (typeof value.error === 'string') return value.error;
  if (value.error && typeof value.error.message === 'string') return value.error.message;
  return value.message ?? `API request failed (${status})`;
}

function canRefresh(path: string) {
  return !['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh', '/auth/logout'].includes(path);
}

async function send(path: string, init?: ApiRequestInit) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...requestInit } = init ?? {};
  const headers = new Headers(init?.headers);
  // Browsers must generate the multipart boundary for FormData. Supplying an
  // application/json header here makes an otherwise valid media upload
  // impossible for the Rust multipart extractor to parse.
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(init?.signal?.reason);
  if (init?.signal?.aborted) abortFromCaller();
  else init?.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort('request-timeout'), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, { ...requestInit, headers, credentials: 'include', signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) {
      throw new ApiRequestError('The request took too long. Check the API connection and try again.', 408);
    }
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('The SuperCampus API is unavailable. Please try again later.', 503);
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * Recover an expired access cookie without letting multiple browser tabs
 * rotate the same refresh token concurrently. After acquiring the origin-wide
 * lock, retry the original request first: another tab may already have renewed
 * the shared cookies while this tab was waiting.
 */
async function refreshAndRetry(path: string, init?: ApiRequestInit): Promise<Response> {
  const recover = async () => {
    const afterWaiting = await send(path, init);
    if (afterWaiting.status !== 401) return afterWaiting;

    const refreshed = await send('/auth/refresh', { method: 'POST' });
    if (!refreshed.ok) {
      const body: unknown = await refreshed.json().catch(() => null);
      throw new ApiRequestError(errorMessage(body, refreshed.status), refreshed.status);
    }
    return send(path, init);
  };

  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(AUTH_REFRESH_LOCK, { mode: 'exclusive' }, recover);
  }

  // Server-side and older-browser fallback: still deduplicate within this
  // JavaScript context, then replay the original request with the new cookie.
  refreshPromise ??= apiRequest<unknown>('/auth/refresh', { method: 'POST' }, false)
    .then(() => undefined)
    .finally(() => { refreshPromise = null; });
  await refreshPromise;
  return send(path, init);
}

export async function apiRequest<T>(path: string, init?: ApiRequestInit, retryAuth = true): Promise<T> {
  let response = await send(path, init);
  if (response.status === 401 && retryAuth && canRefresh(path)) {
    try {
      response = await refreshAndRetry(path, init);
    } catch {
      // The original 401 is returned below with a stable authentication error.
    }
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiRequestError(errorMessage(body, response.status), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}


export function login(credentials: LoginCredentials) {
  return apiRequest<{ data: { student: AuthStudent; roles: string[]; expiresAt: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(credentials) },
    false,
  );
}

/** Starts a reset. Resolves the same way whether or not the address has an account. */
export function forgotPassword(email: string) {
  return apiRequest<{ data: { message: string } }>(
    '/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email }) },
    false,
  );
}

/** Completes a reset with the one-time token from the emailed link. */
export function resetPassword(token: string, password: string) {
  return apiRequest<{ data: { message: string } }>(
    '/auth/reset-password',
    { method: 'POST', body: JSON.stringify({ token, password }) },
    false,
  );
}

export function getSession() {
  return apiRequest<{ data: { student: AuthStudent; roles: string[]; sessionId: string } }>('/auth/me');
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' }, false);
}

export function getAppState() {
  return apiRequest<{ data: { state: PersistedAppState; version: number; updatedAt: string } }>('/state');
}

export function saveAppState(state: PersistedAppState, action?: string) {
  return apiRequest('/state', { method: 'PUT', body: JSON.stringify({ state, action }) });
}

export function getTenantBranding() {
  return apiRequest<{ data: { value: Record<string, unknown> } }>(
    `/v1/configuration/tenant-branding?_sync=${Date.now()}`,
    { headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' } },
  );
}

export function saveTenantBranding(value: Record<string, unknown>) {
  return apiRequest<{ data: { value: Record<string, unknown> } }>(
    '/v1/configuration/tenant-branding',
    { method: 'PUT', body: JSON.stringify({ value }) },
  );
}

export async function uploadMedia(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<{ data: { secureUrl: string; publicId: string; resourceType: string; bytes: number } }>(
    '/media/upload',
    { method: 'POST', body: form, timeoutMs: UPLOAD_TIMEOUT_MS },
  );
}

export async function uploadPublicApplicationMedia(tenant: string, token: string, verificationToken: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<{ data: { secureUrl: string; publicId: string; resourceType: string; bytes: number } }>(
    `/media/public-application/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      body: form,
      timeoutMs: UPLOAD_TIMEOUT_MS,
      headers: { 'x-tenant-id': tenant, 'x-application-verification': verificationToken },
    },
    false,
  );
}

export function toPersistedState(state: AppState): PersistedAppState {
  return {
    persona: state.persona,
    gp: state.gp,
    paid: state.paid,
    pay: state.pay,
    refunds: state.refunds,
    condonation: state.condonation,
    examReg: state.examReg,
    reval: state.reval,
    asg: state.asg,
    changeNotice: state.changeNotice,
    mess: state.mess,
    hostelLeave: state.hostelLeave,
    hostelTickets: state.hostelTickets,
    tripStep: state.tripStep,
    breakdown: state.breakdown,
    docReq: state.docReq,
    placeApp: state.placeApp,
    feedback: state.feedback,
  };
}
