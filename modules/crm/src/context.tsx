'use client';

import React, { createContext, useContext, useReducer, useMemo, useCallback, type ReactNode } from 'react';
import type { Lead, User, ThemeConfig, DashboardLayout, NavItemId, OfferDecision } from './types';
import { LEADS, COLUMNS, USERS, THEMES, DEFAULT_ADMIN_DASHBOARD, COLUMN_IDS, CORE_MODULES } from './data';

// ============================================================
// State
// ============================================================

interface CrmState {
  leads: Lead[];
  users: User[];
  currentUser: User;
  activeNav: NavItemId;
  theme: ThemeConfig;
  adminDashboard: DashboardLayout;
  studentDashboard: DashboardLayout;
  enabledModules: string[];
  searchQuery: string;
  filterSource: string | null;
  filterCourse: string | null;
  sidebarOpen: boolean;
  selectedLead: Lead | null;
  toastMessage: string | null;
}

const ADMIN_USER: User = {
  id: 'u-admin',
  name: 'Super Admin',
  email: 'admin@supercampus.edu',
  avatar: 'SA',
  role: 'admin',
  department: 'Management',
  permissions: ['*'],
  active: true,
};

const initialState: CrmState = {
  leads: LEADS,
  users: USERS,
  currentUser: ADMIN_USER,
  activeNav: 'pipeline',
  theme: THEMES[0],
  adminDashboard: DEFAULT_ADMIN_DASHBOARD,
  studentDashboard: {
    id: 'student-default',
    name: 'Student Dashboard',
    widgets: [
      { id: 'w-student-profile', type: 'profile', title: 'My Profile', w: 2, h: 2, x: 0, y: 0 },
      { id: 'w-application-status', type: 'app-status', title: 'Offer / Status', w: 2, h: 2, x: 2, y: 0 },
      { id: 'w-documents', type: 'documents', title: 'My Documents', w: 2, h: 1, x: 0, y: 2 },
      { id: 'w-notices', type: 'notices', title: 'Notices', w: 2, h: 1, x: 2, y: 2 },
    ],
  },
  enabledModules: CORE_MODULES.filter(m => m.enabled).map(m => m.id),
  searchQuery: '',
  filterSource: null,
  filterCourse: null,
  sidebarOpen: false,
  selectedLead: null,
  toastMessage: null,
};

// ============================================================
// Actions
// ============================================================

type CrmAction =
  | { type: 'SET_NAV'; payload: NavItemId }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'MOVE_LEAD'; payload: { leadId: string; toColumn: string; note?: string } }
  | { type: 'SET_OFFER_DECISION'; payload: { leadId: string; decision: OfferDecision } }
  | { type: 'SELECT_LEAD'; payload: Lead | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER_SOURCE'; payload: string | null }
  | { type: 'SET_FILTER_COURSE'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_TOAST'; payload: string | null }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'TOGGLE_USER_STATUS'; payload: string }
  | { type: 'SET_USER_PERMISSIONS'; payload: { userId: string; permissions: string[] } }
  | { type: 'TOGGLE_MODULE'; payload: string }
  | { type: 'SET_ADMIN_DASHBOARD'; payload: DashboardLayout }
  | { type: 'SET_STUDENT_DASHBOARD'; payload: DashboardLayout }
  | { type: 'UPDATE_WIDGETS'; payload: { target: 'admin' | 'student'; widgets: DashboardLayout['widgets'] } };

function crmReducer(state: CrmState, action: CrmAction): CrmState {
  switch (action.type) {
    case 'SET_NAV':
      return { ...state, activeNav: action.payload, selectedLead: null };

    case 'SET_THEME': {
      const theme = THEMES.find(t => t.id === action.payload) ?? state.theme;
      return { ...state, theme };
    }

    case 'MOVE_LEAD': {
      const { leadId, toColumn, note } = action.payload;
      const lead = state.leads.find(l => l.id === leadId);
      if (!lead) return state;
      const from = lead.status;
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === leadId
            ? {
                ...l,
                status: toColumn as Lead['status'],
                lastContact: 'just now',
                moveHistory: [
                  ...l.moveHistory,
                  {
                    id: `m-${Date.now()}`,
                    from,
                    to: toColumn,
                    by: state.currentUser.id,
                    byName: state.currentUser.name,
                    timestamp: new Date().toISOString(),
                    note: note ?? `Moved to ${toColumn}`,
                  },
                ],
              }
            : l
        ),
      };
    }

    case 'SET_OFFER_DECISION': {
      const { leadId, decision } = action.payload;
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === leadId ? { ...l, offerDecision: decision } : l
        ),
      };
    }

    case 'SELECT_LEAD':
      return { ...state, selectedLead: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'SET_FILTER_SOURCE':
      return { ...state, filterSource: action.payload };

    case 'SET_FILTER_COURSE':
      return { ...state, filterCourse: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_TOAST':
      return { ...state, toastMessage: action.payload };

    case 'SET_USERS':
      return { ...state, users: action.payload };

    case 'TOGGLE_USER_STATUS': {
      const userId = action.payload;
      return {
        ...state,
        users: state.users.map(u =>
          u.id === userId ? { ...u, active: !u.active } : u
        ),
      };
    }

    case 'SET_USER_PERMISSIONS': {
      const { userId, permissions } = action.payload;
      return {
        ...state,
        users: state.users.map(u =>
          u.id === userId ? { ...u, permissions } : u
        ),
      };
    }

    case 'TOGGLE_MODULE': {
      const moduleId = action.payload;
      const enabled = state.enabledModules.includes(moduleId)
        ? state.enabledModules.filter(m => m !== moduleId)
        : [...state.enabledModules, moduleId];
      return { ...state, enabledModules: enabled };
    }

    case 'SET_ADMIN_DASHBOARD':
      return { ...state, adminDashboard: action.payload };

    case 'SET_STUDENT_DASHBOARD':
      return { ...state, studentDashboard: action.payload };

    case 'UPDATE_WIDGETS': {
      const { target, widgets } = action.payload;
      if (target === 'admin') {
        return { ...state, adminDashboard: { ...state.adminDashboard, widgets } };
      }
      return { ...state, studentDashboard: { ...state.studentDashboard, widgets } };
    }

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface CrmContextValue {
  state: CrmState;
  dispatch: React.Dispatch<CrmAction>;
  leadsByColumn: Record<string, Lead[]>;
  showToast: (msg: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    COLUMN_IDS.forEach(id => { grouped[id] = []; });

    const query = state.searchQuery.toLowerCase();
    state.leads.forEach(lead => {
      if (state.searchQuery) {
        const matches =
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.course.toLowerCase().includes(query) ||
          lead.city.toLowerCase().includes(query);
        if (!matches) return;
      }
      if (state.filterSource && lead.source !== state.filterSource) return;
      if (state.filterCourse && lead.course !== state.filterCourse) return;

      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [state.leads, state.searchQuery, state.filterSource, state.filterCourse]);

  const showToast = useCallback((msg: string) => {
    dispatch({ type: 'SET_TOAST', payload: msg });
    setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3000);
  }, []);

  return (
    <CrmContext.Provider value={{ state, dispatch, leadsByColumn, showToast }}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
