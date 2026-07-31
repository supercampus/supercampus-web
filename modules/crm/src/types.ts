// ============================================================
// SuperCampus CRM — Core Types
// ============================================================

export type LeadStatus =
  | 'enquiry'
  | 'contact-attempted'
  | 'contacted'
  | 'nurture'
  | 'qualified'
  | 'application'
  | 'application-status'
  | 'offer-status'
  | 'archived';

export type OfferDecision = 'accepted' | 'rejected' | 'on-hold' | 'pending';

export interface MoveLog {
  id: string;
  from: string;
  to: string;
  by: string;
  byName: string;
  timestamp: string;
  note: string;
}

export interface ActivityEntry {
  id: string;
  leadId: string;
  leadName: string;
  type: 'move' | 'call' | 'email' | 'note' | 'document' | 'archive';
  from?: string;
  to?: string;
  by: string;
  byName: string;
  byAvatar?: string;
  timestamp: string;
  note?: string;
}

export interface Communication {
  id: string;
  type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
  direction: 'inbound' | 'outbound';
  subject: string;
  summary: string;
  by: string;
  byName: string;
  timestamp: string;
  duration?: string;
}

export interface LeadDocument {
  name: string;
  verified: boolean;
  uploadedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  course: string;
  intake: string;
  source: string;
  city: string;
  assignedTo: { name: string; avatar?: string };
  status: LeadStatus;
  offerDecision?: OfferDecision;
  documents: { uploaded: number; required: number; items?: LeadDocument[] };
  communicationCount: number;
  nextFollowUp: string | null;
  lastContact: string;
  parent: { name: string; phone: string; relation: string };
  moveHistory: MoveLog[];
  communications?: Communication[];
  tags?: string[];
}

export interface Column {
  id: LeadStatus;
  title: string;
  accent: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'admission' | 'marketing' | 'counselor' | 'finance' | 'document-officer';
  department: string;
  permissions: string[];
  active: boolean;
}

export interface Widget {
  id: string;
  type: string;
  title: string;
  w: number;
  h: number;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: Record<string, string>;
  isDark: boolean;
}

export interface AppModule {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export type NavItemId = 'dashboard' | 'pipeline' | 'users' | 'settings';

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: string;
  badge?: number;
}
