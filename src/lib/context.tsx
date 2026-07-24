'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { AppState, NavId, Persona } from '@/lib/types';

const initialState: AppState = {
  persona: 'hosteller',
  active: 'home',
  notifOpen: false,
  toast: null,
  countdown: 5048,
  gp: { status: 'pending', type: 'Weekend Leave', early: true, step: 2 },
  paid: { tuition: true, hostel: false, transport: true, exam: false },
  pay: { comp: null, step: 0, plan: null, mode: null },
  refunds: {},
  condonation: 'none',
  examReg: 0,
  reval: {},
  asg: { a3: 'none' },
  changeNotice: true,
  mess: true,
  hostelLeave: 0,
  hostelTickets: [{ id: 'HST-2291', cat: 'Electrical', text: 'Tube light not working in Room B-214', status: 'In Progress' }],
  tripStep: 1,
  breakdown: true,
  docReq: [{ id: 'DOC-4410', type: 'Bonafide Certificate', on: '18 Jul', status: 'Ready' }],
  placeApp: 0,
  feedback: 0,
};

type Action =
  | { type: 'SET_ACTIVE'; id: NavId }
  | { type: 'TOGGLE_NOTIF' }
  | { type: 'SET_TOAST'; msg: string | null }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PERSONA' }
  | { type: 'GP_APPLY'; gpType: string; early: boolean }
  | { type: 'GP_ADVANCE' }
  | { type: 'GP_RESET' }
  | { type: 'PAY_START'; comp: string }
  | { type: 'PAY_SET'; key: string; value: string }
  | { type: 'PAY_CONFIRM_SUCCESS' }
  | { type: 'PAY_CLOSE' }
  | { type: 'REQ_REFUND'; id: string }
  | { type: 'SET_CONDONATION'; val: 'none' | 'pending' | 'approved' }
  | { type: 'SET_EXAM_REG'; val: number }
  | { type: 'SUBMIT_ASG' }
  | { type: 'REQ_REVAL'; subj: string }
  | { type: 'TOGGLE_MESS' }
  | { type: 'ADVANCE_LEAVE' }
  | { type: 'RESOLVE_TICKET' }
  | { type: 'ADVANCE_TRIP' }
  | { type: 'SET_BREAKDOWN'; val: boolean }
  | { type: 'REQUEST_DOC'; docType: string }
  | { type: 'APPLY_DRIVE' }
  | { type: 'SUBMIT_FEEDBACK' }
  | { type: 'SET_CHANGE_NOTICE'; val: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE': return { ...state, active: action.id, notifOpen: false };
    case 'TOGGLE_NOTIF': return { ...state, notifOpen: !state.notifOpen };
    case 'SET_TOAST': return { ...state, toast: action.msg };
    case 'TICK': return { ...state, countdown: state.countdown > 0 ? state.countdown - 1 : 5048 };
    case 'TOGGLE_PERSONA': return { ...state, persona: state.persona === 'hosteller' ? 'dayscholar' : 'hosteller' };
    case 'GP_APPLY': return { ...state, gp: { status: 'pending', type: action.gpType, early: action.early, step: 0 } };
    case 'GP_ADVANCE': {
      const steps = state.gp.early ? ['Student', 'Class Incharge', 'HOD', 'Security', 'Exit'] : ['Auto-approved', 'Exit QR ready'];
      const nextStep = Math.min(state.gp.step + 1, steps.length - 1);
      const approved = nextStep === steps.length - 1;
      return { ...state, gp: { ...state.gp, step: nextStep, status: approved ? 'approved' : 'pending' } };
    }
    case 'GP_RESET': return { ...state, gp: { status: 'none', type: null, early: false, step: 0 } };
    case 'PAY_START': return { ...state, pay: { comp: action.comp, step: 1, plan: null, mode: null } };
    case 'PAY_SET': return { ...state, pay: { ...state.pay, [action.key]: action.value, step: state.pay.step + 1 } };
    case 'PAY_CONFIRM_SUCCESS': {
      const comp = state.pay.comp!;
      return { ...state, pay: { ...state.pay, step: 5 }, paid: { ...state.paid, [comp]: true } };
    }
    case 'PAY_CLOSE': return { ...state, pay: { comp: null, step: 0, plan: null, mode: null } };
    case 'REQ_REFUND': return { ...state, refunds: { ...state.refunds, [action.id]: 'Pending Review' } };
    case 'SET_CONDONATION': return { ...state, condonation: action.val };
    case 'SET_EXAM_REG': return { ...state, examReg: action.val };
    case 'SUBMIT_ASG': return { ...state, asg: { ...state.asg, a3: 'Submitted' } };
    case 'REQ_REVAL': return { ...state, reval: { ...state.reval, [action.subj]: 'Requested' } };
    case 'TOGGLE_MESS': return { ...state, mess: !state.mess };
    case 'ADVANCE_LEAVE': return { ...state, hostelLeave: Math.min(4, state.hostelLeave + 1) };
    case 'RESOLVE_TICKET': return { ...state, hostelTickets: state.hostelTickets.map(t => ({ ...t, status: 'Resolved' })) };
    case 'ADVANCE_TRIP': return { ...state, tripStep: Math.min(3, state.tripStep + 1) };
    case 'SET_BREAKDOWN': return { ...state, breakdown: action.val };
    case 'REQUEST_DOC': {
      const id = 'DOC-' + (4411 + state.docReq.length);
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
  nav: (id: NavId) => void;
  toast: (msg: string) => void;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tick = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(tick);
  }, []);

  const nav = useCallback((id: NavId) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  const showToast = useCallback((msg: string) => {
    dispatch({ type: 'SET_TOAST', msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'SET_TOAST', msg: null }), 2600);
  }, []);

  return (
    <AppContext.Provider value={{ state, nav, toast: showToast, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
