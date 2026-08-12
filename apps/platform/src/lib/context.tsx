'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo, useState } from 'react';
import type { AppState, AuthStatus, AuthStudent, BackendStatus, LoginCredentials, NavId, PersistedAppState, TenantBrand } from '@/lib/types';
import { ApiRequestError, getAppState, getSession, login as loginRequest, logout as logoutRequest, saveAppState, toPersistedState } from '@/lib/api';

const initialState: AppState = {
  persona: 'dayscholar', active: 'home', notifOpen: false, toast: null, countdown: 0,
  gp: { status: 'none', type: null, early: false, step: 0 },
  paid: { tuition: false, hostel: false, transport: false, exam: false },
  pay: { comp: null, step: 0, plan: null, mode: null }, refunds: {}, condonation: 'none',
  examReg: 0, reval: {}, asg: { a3: 'none' }, changeNotice: false, mess: false, hostelLeave: 0,
  hostelTickets: [], tripStep: 0, breakdown: false, docReq: [],
  placeApp: 0, feedback: 0,
};

const defaultTenantBrand: TenantBrand = {
  logoDataUrl: null,
  primary: '#000000',
  secondary: '#000000',
  surface: '#ffffff',
};

function normalizeTenantBrand(brand: TenantBrand): TenantBrand {
  const wasLegacyDefault = brand.primary === '#0b3d2e'
    && brand.secondary === '#b9f43b'
    && brand.surface === '#eef7e8'
    && !brand.logoDataUrl;
  return wasLegacyDefault ? defaultTenantBrand : brand;
}

function readTenantBrand(): TenantBrand {
  if (typeof window === 'undefined') return defaultTenantBrand;
  try {
    const raw = window.localStorage.getItem('supercampus:tenant-brand');
    return raw ? normalizeTenantBrand({ ...defaultTenantBrand, ...JSON.parse(raw) }) : defaultTenantBrand;
  } catch {
    return defaultTenantBrand;
  }
}

type Action =
  | { type: 'SET_ACTIVE'; id: NavId } | { type: 'TOGGLE_NOTIF' } | { type: 'SET_TOAST'; msg: string | null }
  | { type: 'TICK' } | { type: 'TOGGLE_PERSONA' } | { type: 'GP_APPLY'; gpType: string; early: boolean }
  | { type: 'GP_ADVANCE' } | { type: 'GP_RESET' } | { type: 'PAY_START'; comp: string }
  | { type: 'PAY_SET'; key: string; value: string } | { type: 'PAY_CONFIRM_SUCCESS' } | { type: 'PAY_CLOSE' }
  | { type: 'REQ_REFUND'; id: string } | { type: 'SET_CONDONATION'; val: 'none' | 'pending' | 'approved' }
  | { type: 'SET_EXAM_REG'; val: number } | { type: 'SUBMIT_ASG' } | { type: 'REQ_REVAL'; subj: string }
  | { type: 'TOGGLE_MESS' } | { type: 'ADVANCE_LEAVE' } | { type: 'RESOLVE_TICKET' }
  | { type: 'ADVANCE_TRIP' } | { type: 'SET_BREAKDOWN'; val: boolean } | { type: 'REQUEST_DOC'; docType: string }
  | { type: 'APPLY_DRIVE' } | { type: 'SUBMIT_FEEDBACK' } | { type: 'SET_CHANGE_NOTICE'; val: boolean }
  | { type: 'HYDRATE'; state: PersistedAppState } | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET': return initialState;
    case 'HYDRATE': return { ...state, ...action.state };
    case 'SET_ACTIVE': return { ...state, active: action.id, notifOpen: false };
    case 'TOGGLE_NOTIF': return { ...state, notifOpen: !state.notifOpen };
    case 'SET_TOAST': return { ...state, toast: action.msg };
    case 'TICK': return { ...state, countdown: Math.max(0, state.countdown - 1) };
    case 'TOGGLE_PERSONA': return { ...state, persona: state.persona === 'hosteller' ? 'dayscholar' : 'hosteller' };
    case 'GP_APPLY': return { ...state, gp: { status: 'pending', type: action.gpType, early: action.early, step: 0 } };
    case 'GP_ADVANCE': {
      const steps = state.gp.early ? ['Student', 'Class Incharge', 'HOD', 'Security', 'Exit'] : ['Auto-approved', 'Exit QR ready'];
      const nextStep = Math.min(state.gp.step + 1, steps.length - 1);
      return { ...state, gp: { ...state.gp, step: nextStep, status: nextStep === steps.length - 1 ? 'approved' : 'pending' } };
    }
    case 'GP_RESET': return { ...state, gp: { status: 'none', type: null, early: false, step: 0 } };
    case 'PAY_START': return { ...state, pay: { comp: action.comp, step: 1, plan: null, mode: null } };
    case 'PAY_SET': return { ...state, pay: { ...state.pay, [action.key]: action.value, step: state.pay.step + 1 } };
    case 'PAY_CONFIRM_SUCCESS': return { ...state, pay: { ...state.pay, step: 5 }, paid: { ...state.paid, [state.pay.comp!]: true } };
    case 'PAY_CLOSE': return { ...state, pay: { comp: null, step: 0, plan: null, mode: null } };
    case 'REQ_REFUND': return { ...state, refunds: { ...state.refunds, [action.id]: 'Pending Review' } };
    case 'SET_CONDONATION': return { ...state, condonation: action.val };
    case 'SET_EXAM_REG': return { ...state, examReg: action.val };
    case 'SUBMIT_ASG': return { ...state, asg: { ...state.asg, a3: 'Submitted' } };
    case 'REQ_REVAL': return { ...state, reval: { ...state.reval, [action.subj]: 'Requested' } };
    case 'TOGGLE_MESS': return { ...state, mess: !state.mess };
    case 'ADVANCE_LEAVE': return { ...state, hostelLeave: Math.min(4, state.hostelLeave + 1) };
    case 'RESOLVE_TICKET': return { ...state, hostelTickets: state.hostelTickets.map((ticket) => ({ ...ticket, status: 'Resolved' })) };
    case 'ADVANCE_TRIP': return { ...state, tripStep: Math.min(3, state.tripStep + 1) };
    case 'SET_BREAKDOWN': return { ...state, breakdown: action.val };
    case 'REQUEST_DOC': {
      const id = `DOC-${4411 + state.docReq.length}`;
      return { ...state, docReq: [{ id, type: action.docType, on: '24 Jul', status: 'Requested' }, ...state.docReq] };
    }
    case 'APPLY_DRIVE': return { ...state, placeApp: Math.max(state.placeApp, 1) };
    case 'SUBMIT_FEEDBACK': return { ...state, feedback: Math.min(2, state.feedback + 1) };
    case 'SET_CHANGE_NOTICE': return { ...state, changeNotice: action.val };
    default: return state;
  }
}

interface AppContextValue {
  state: AppState;
  student: AuthStudent | null;
  tenantBrand: TenantBrand;
  authStatus: AuthStatus;
  backendStatus: BackendStatus;
  nav: (id: NavId) => void;
  toast: (msg: string) => void;
  setTenantBrand: (brand: TenantBrand) => void;
  dispatch: React.Dispatch<Action>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const [student, setStudent] = useState<AuthStudent | null>(null);
  const [tenantBrand, setTenantBrandState] = useState<TenantBrand>(defaultTenantBrand);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);
  const skipNextSave = useRef(false);
  const lastAction = useRef<string | undefined>(undefined);

  useEffect(() => {
    queueMicrotask(() => setTenantBrandState(readTenantBrand()));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', tenantBrand.primary);
    root.style.setProperty('--tenant-secondary', tenantBrand.secondary);
    root.style.setProperty('--tenant-surface', tenantBrand.surface);
    root.style.setProperty('--primary', tenantBrand.primary);
    root.style.setProperty('--primary-grad', `linear-gradient(135deg, ${tenantBrand.primary}, ${tenantBrand.secondary})`);
  }, [tenantBrand]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes transient fields
  const persistentState = useMemo(() => toPersistedState(state), [
    state.persona, state.gp, state.paid, state.pay, state.refunds, state.condonation, state.examReg,
    state.reval, state.asg, state.changeNotice, state.mess, state.hostelLeave, state.hostelTickets,
    state.tripStep, state.breakdown, state.docReq, state.placeApp, state.feedback,
  ]);

  const hydrateStudentState = useCallback(async () => {
    const { data } = await getAppState();
    skipNextSave.current = true;
    baseDispatch({ type: 'HYDRATE', state: data.state });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSession();
        if (cancelled) return;
        setStudent(data.student);
        await hydrateStudentState();
        if (cancelled) return;
        setAuthStatus('authenticated'); setBackendStatus('online');
      } catch (error) {
        if (cancelled) return;
        setStudent(null); setAuthStatus('unauthenticated');
        setBackendStatus(error instanceof ApiRequestError ? 'online' : 'offline');
      }
    })();
    return () => { cancelled = true; };
  }, [hydrateStudentState]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setBackendStatus('connecting');
    try {
      const { data } = await loginRequest(credentials);
      setStudent(data.student);
      await hydrateStudentState();
      setAuthStatus('authenticated');
      setBackendStatus('online');
    } catch (error) {
      hydrated.current = false;
      setStudent(null);
      setAuthStatus('unauthenticated');
      setBackendStatus(error instanceof ApiRequestError && error.status < 500 ? 'online' : 'offline');
      throw error;
    }
  }, [hydrateStudentState]);

  const logout = useCallback(async () => {
    try { await logoutRequest(); setBackendStatus('online'); }
    finally {
      hydrated.current = false; setStudent(null); setAuthStatus('unauthenticated');
      lastAction.current = undefined; baseDispatch({ type: 'RESET' });
    }
  }, []);

  const dispatch = useCallback<React.Dispatch<Action>>((action) => {
    if (!['SET_ACTIVE', 'TOGGLE_NOTIF', 'SET_TOAST', 'TICK', 'HYDRATE', 'RESET'].includes(action.type)) lastAction.current = action.type;
    baseDispatch(action);
  }, []);

  useEffect(() => {
    if (!hydrated.current || authStatus !== 'authenticated') return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setBackendStatus('saving');
      try { await saveAppState(persistentState, lastAction.current); lastAction.current = undefined; setBackendStatus('online'); }
      catch (error) {
        setBackendStatus('offline');
        if (error instanceof ApiRequestError && error.status === 401) { setStudent(null); setAuthStatus('unauthenticated'); }
      }
    }, 350);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [authStatus, persistentState]);

  useEffect(() => {
    const tick = setInterval(() => baseDispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(tick);
  }, []);

  const nav = useCallback((id: NavId) => baseDispatch({ type: 'SET_ACTIVE', id }), []);
  const setTenantBrand = useCallback((brand: TenantBrand) => {
    setTenantBrandState(brand);
    try { window.localStorage.setItem('supercampus:tenant-brand', JSON.stringify(brand)); } catch {}
  }, []);
  const showToast = useCallback((msg: string) => {
    baseDispatch({ type: 'SET_TOAST', msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => baseDispatch({ type: 'SET_TOAST', msg: null }), 2600);
  }, []);

  return <AppContext.Provider value={{ state, student, tenantBrand, authStatus, backendStatus, nav, toast: showToast, setTenantBrand, dispatch, login, logout }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
