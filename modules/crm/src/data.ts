// ============================================================
// SuperCampus CRM — Data Layer
// ============================================================

import type { Lead, Column, User, ThemeConfig, DashboardLayout, NavItem } from './types';

// --- Columns ---
export const COLUMNS: Column[] = [
  { id: 'enquiry', title: 'Enquiry', accent: '#776cf5' },
  { id: 'contact-attempted', title: 'Contact Attempted', accent: '#de6cf5' },
  { id: 'contacted', title: 'Contacted', accent: '#f59e0b' },
  { id: 'nurture', title: 'Nurture', accent: '#10b981' },
  { id: 'qualified', title: 'Qualified', accent: '#06b6d4' },
  { id: 'application', title: 'Application', accent: '#3b82f6' },
  { id: 'application-status', title: 'Application Status', accent: '#8b5cf6' },
  { id: 'offer-status', title: 'Offer / Status', accent: '#ec4899' },
  { id: 'archived', title: 'Archived', accent: '#64748b' },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);

// --- Column display helpers ---
export const COLUMN_TITLES: Record<string, string> = {
  enquiry: 'Enquiry',
  'contact-attempted': 'Contact Attempted',
  contacted: 'Contacted',
  nurture: 'Nurture',
  qualified: 'Qualified',
  application: 'Application',
  'application-status': 'Application Status',
  'offer-status': 'Offer / Status',
  archived: 'Archived',
};

export function getColumnTitle(id: string): string {
  return COLUMN_TITLES[id] ?? id;
}

// --- Navigation Items ---
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'pipeline', label: 'Pipeline', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
  { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

// --- Mock Users ---
export const USERS: User[] = [
  { id: 'u1', name: 'Arjun Mehta', email: 'arjun@supercampus.edu', avatar: 'AM', role: 'admin', department: 'Management', permissions: ['*'], active: true },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@supercampus.edu', avatar: 'PS', role: 'admission', department: 'Admissions', permissions: ['admissions.read', 'admissions.write'], active: true },
  { id: 'u3', name: 'Rahul Verma', email: 'rahul@supercampus.edu', avatar: 'RV', role: 'counselor', department: 'Admissions', permissions: ['admissions.read'], active: true },
  { id: 'u4', name: 'Divya Krishnan', email: 'divya@supercampus.edu', avatar: 'DK', role: 'marketing', department: 'Marketing', permissions: ['crm.read', 'crm.create'], active: true },
  { id: 'u5', name: 'Karthik Nair', email: 'karthik@supercampus.edu', avatar: 'KN', role: 'finance', department: 'Finance', permissions: ['finance.read'], active: true },
  { id: 'u6', name: 'Sneha Reddy', email: 'sneha@supercampus.edu', avatar: 'SR', role: 'document-officer', department: 'Admissions', permissions: ['documents.read', 'documents.write'], active: false },
];

// --- Core Modules / Apps ---
export const CORE_MODULES = [
  { id: 'crm', name: 'CRM', icon: 'users', enabled: true },
  { id: 'fee-management', name: 'Fee Management', icon: 'dollar-sign', enabled: true },
  { id: 'erp', name: 'ERP', icon: 'layers', enabled: true },
  { id: 'academics', name: 'Academics', icon: 'book-open', enabled: false },
  { id: 'attendance', name: 'Attendance', icon: 'check-square', enabled: false },
  { id: 'examinations', name: 'Examinations', icon: 'file-text', enabled: false },
  { id: 'library', name: 'Library', icon: 'book', enabled: false },
  { id: 'transport', name: 'Transport', icon: 'truck', enabled: false },
  { id: 'hostel', name: 'Hostel', icon: 'home', enabled: false },
  { id: 'placement', name: 'Placement', icon: 'briefcase', enabled: false },
];

// --- Themes ---
export const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    isDark: false,
    colors: {
      '--crm-bg': '#f7f4ef',
      '--crm-surface': '#fffaf4',
      '--crm-panel': '#f1ece7',
      '--crm-card': '#ffffff',
      '--crm-text': '#161318',
      '--crm-muted': '#6f6875',
      '--crm-border': '#e7ded8',
      '--crm-danger': '#ff005c',
      '--crm-success': '#10b981',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    isDark: false,
    colors: {
      '--crm-bg': '#f0f5ff',
      '--crm-surface': '#fafcff',
      '--crm-panel': '#e8effa',
      '--crm-card': '#ffffff',
      '--crm-text': '#0f172a',
      '--crm-muted': '#64748b',
      '--crm-border': '#cbd5e1',
      '--crm-danger': '#ef4444',
      '--crm-success': '#22c55e',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    isDark: false,
    colors: {
      '--crm-bg': '#f0fdf4',
      '--crm-surface': '#fafefa',
      '--crm-panel': '#dcfce7',
      '--crm-card': '#ffffff',
      '--crm-text': '#052e16',
      '--crm-muted': '#4b8b6f',
      '--crm-border': '#bbf7d0',
      '--crm-danger': '#dc2626',
      '--crm-success': '#16a34a',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    isDark: true,
    colors: {
      '--crm-bg': '#090914',
      '--crm-surface': '#111122',
      '--crm-panel': '#18182c',
      '--crm-card': '#1f1f35',
      '--crm-text': '#f7f3ff',
      '--crm-muted': '#b9b2ce',
      '--crm-border': 'rgba(255,255,255,0.1)',
      '--crm-danger': '#ff6b8a',
      '--crm-success': '#4ade80',
    },
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    isDark: true,
    colors: {
      '--crm-bg': '#0f0a1f',
      '--crm-surface': '#1a122e',
      '--crm-panel': '#241a3a',
      '--crm-card': '#2d2247',
      '--crm-text': '#f0eaff',
      '--crm-muted': '#b8a8e0',
      '--crm-border': 'rgba(160,120,255,0.15)',
      '--crm-danger': '#ff6b8a',
      '--crm-success': '#4ade80',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    isDark: false,
    colors: {
      '--crm-bg': '#fef8f4',
      '--crm-surface': '#fffcf7',
      '--crm-panel': '#fef0e6',
      '--crm-card': '#ffffff',
      '--crm-text': '#1c0f0a',
      '--crm-muted': '#8a6f60',
      '--crm-border': '#f5dccf',
      '--crm-danger': '#e53e3e',
      '--crm-success': '#38a169',
    },
  },
];

// --- Mock Leads ---
const now = new Date();
const ts = (daysAgo: number, hoursAgo = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const LEADS: Lead[] = [
  { id: 'L-1001', name: 'Rahul Kumar', initials: 'RK', phone: '+91-98765 43210', email: 'rahul.k@gmail.com', course: 'B.Tech CSE', intake: '2026', source: 'Facebook Ad', city: 'Chennai', assignedTo: { name: 'Priya' }, status: 'enquiry', documents: { uploaded: 0, required: 5 }, communicationCount: 1, nextFollowUp: '2026-07-30T10:00:00Z', lastContact: '2h ago', parent: { name: 'Suresh Kumar', phone: '+91-98765 43211', relation: 'Father' }, moveHistory: [{ id: 'm1', from: '', to: 'enquiry', by: 'system', byName: 'Lead Form', timestamp: ts(3), note: 'Lead created via Facebook Ad' }], tags: ['Scholarship Opt'] },
  { id: 'L-1002', name: 'Priya Sharma', initials: 'PS', phone: '+91-98765 43212', email: 'priya.sharma@email.com', course: 'MBA Marketing', intake: '2024', source: 'Walk-in', city: 'Chennai', assignedTo: { name: 'Priya' }, status: 'enquiry', documents: { uploaded: 0, required: 4 }, communicationCount: 0, nextFollowUp: null, lastContact: '1d ago', parent: { name: 'Rajesh Sharma', phone: '+91-98765 43213', relation: 'Father' }, moveHistory: [{ id: 'm2', from: '', to: 'enquiry', by: 'system', byName: 'Walk-in Form', timestamp: ts(5), note: 'Walk-in at reception' }] },
  { id: 'L-1003', name: 'Arjun Menon', initials: 'AM', phone: '+91-98765 43214', email: 'arjun.m@email.com', course: 'B.Tech ECE', intake: '2026', source: 'Google Ads', city: 'Bangalore', assignedTo: { name: 'Arun' }, status: 'contact-attempted', documents: { uploaded: 0, required: 5 }, communicationCount: 2, nextFollowUp: '2026-07-29T15:00:00Z', lastContact: '1d ago', parent: { name: 'Sreedhar Menon', phone: '+91-98765 43215', relation: 'Father' }, moveHistory: [{ id: 'm3', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(4), note: 'Lead from Google campaign' }, { id: 'm4', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(2), note: 'Attempted call, no response' }] },
  { id: 'L-1004', name: 'Sneha Reddy', initials: 'SR', phone: '+91-98765 43216', email: 'sneha.r@email.com', course: 'B.Sc Physics', intake: '2025', source: 'Referral', city: 'Hyderabad', assignedTo: { name: 'Divya' }, status: 'contact-attempted', documents: { uploaded: 0, required: 4 }, communicationCount: 1, nextFollowUp: '2026-07-30T11:00:00Z', lastContact: '12h ago', parent: { name: 'Venkat Reddy', phone: '+91-98765 43217', relation: 'Father' }, moveHistory: [{ id: 'm5', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(6), note: 'Referred by alumni' }, { id: 'm6', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(1), note: 'Left voicemail' }] },
  { id: 'L-1005', name: 'Vikram Iyer', initials: 'VI', phone: '+91-98765 43218', email: 'vikram.iyer@email.com', course: 'BCA', intake: '2025', source: 'Education Fair', city: 'Coimbatore', assignedTo: { name: 'Karthik' }, status: 'contacted', documents: { uploaded: 0, required: 4 }, communicationCount: 1, nextFollowUp: null, lastContact: '3d ago', parent: { name: 'Narayanan Iyer', phone: '+91-98765 43219', relation: 'Father' }, moveHistory: [{ id: 'm7', from: '', to: 'enquiry', by: 'system', byName: 'Education Fair', timestamp: ts(10), note: 'Met at Coimbatore fair' }, { id: 'm8', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(7), note: 'Called, no answer' }, { id: 'm9', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(3), note: 'Discussed courses briefly' }] },
  { id: 'L-1006', name: 'Ananya Gupta', initials: 'AG', phone: '+91-98765 43220', email: 'ananya.g@email.com', course: 'BBA', intake: '2025', source: 'Facebook Ad', city: 'Madurai', assignedTo: { name: 'Priya' }, status: 'contacted', documents: { uploaded: 0, required: 4 }, communicationCount: 3, nextFollowUp: '2026-08-01T09:00:00Z', lastContact: '1d ago', parent: { name: 'Amit Gupta', phone: '+91-98765 43221', relation: 'Father' }, moveHistory: [{ id: 'm10', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(8), note: 'Facebook lead gen' }, { id: 'm11', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(5), note: 'Sent WhatsApp message' }, { id: 'm12', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(1), note: 'Interested in campus tour' }] },
  { id: 'L-1007', name: 'Karthik Nair', initials: 'KN', phone: '+91-98765 43222', email: 'karthik.nair@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Referral', city: 'Chennai', assignedTo: { name: 'Arun' }, status: 'nurture', documents: { uploaded: 0, required: 5 }, communicationCount: 4, nextFollowUp: '2026-07-31T14:00:00Z', lastContact: '4h ago', parent: { name: 'Mohan Nair', phone: '+91-98765 43223', relation: 'Father' }, moveHistory: [{ id: 'm13', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(14), note: 'Referred by alumni' }, { id: 'm14', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(11), note: 'Called and left message' }, { id: 'm15', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(9), note: 'Very interested in CSE program' }, { id: 'm16', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(5), note: 'Shared brochure, asked about scholarships' }], tags: ['Scholarship Opt'] },
  { id: 'L-1008', name: 'Divya Krishnan', initials: 'DK', phone: '+91-98765 43224', email: 'divya.k@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Google Ads', city: 'Bangalore', assignedTo: { name: 'Divya' }, status: 'nurture', documents: { uploaded: 0, required: 5 }, communicationCount: 4, nextFollowUp: '2026-07-30T16:00:00Z', lastContact: '1d ago', parent: { name: 'Krishnan', phone: '+91-98765 43225', relation: 'Father' }, moveHistory: [{ id: 'm17', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(12), note: 'Google campaign lead' }, { id: 'm18', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(9), note: 'Sent email with info' }, { id: 'm19', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(6), note: 'Positive conversation, wants to visit campus' }, { id: 'm20', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(2), note: 'Scheduled campus visit for next week' }] },
  { id: 'L-1009', name: 'Rohit Sharma', initials: 'RS', phone: '+91-98765 43226', email: 'rohit.s@email.com', course: 'BBA', intake: '2025', source: 'Walk-in', city: 'Chennai', assignedTo: { name: 'Karthik' }, status: 'qualified', documents: { uploaded: 0, required: 4 }, communicationCount: 7, nextFollowUp: null, lastContact: '2d ago', parent: { name: 'Ramesh Sharma', phone: '+91-98765 43227', relation: 'Father' }, moveHistory: [{ id: 'm21', from: '', to: 'enquiry', by: 'system', byName: 'Walk-in', timestamp: ts(20), note: 'Walk-in at campus' }, { id: 'm22', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(17), note: 'Initial contact made' }, { id: 'm23', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(14), note: 'Had detailed discussion' }, { id: 'm24', from: 'contacted', to: 'nurture', by: 'user3', byName: 'Karthik', timestamp: ts(10), note: 'Shared fee structure' }, { id: 'm25', from: 'nurture', to: 'qualified', by: 'user3', byName: 'Karthik', timestamp: ts(4), note: 'Confirmed interest, shortlisted college' }] },
  { id: 'L-1010', name: 'Meera Patel', initials: 'MP', phone: '+91-98765 43228', email: 'meera.p@email.com', course: 'B.Tech ECE', intake: '2026', source: 'School Visit', city: 'Hyderabad', assignedTo: { name: 'Priya' }, status: 'qualified', documents: { uploaded: 0, required: 5 }, communicationCount: 6, nextFollowUp: '2026-08-02T10:00:00Z', lastContact: '6h ago', parent: { name: 'Sunil Patel', phone: '+91-98765 43229', relation: 'Father' }, moveHistory: [{ id: 'm26', from: '', to: 'enquiry', by: 'system', byName: 'School Visit', timestamp: ts(15), note: 'School outreach program' }, { id: 'm27', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(12), note: 'Called parents' }, { id: 'm28', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(10), note: 'Both parents and student interested' }, { id: 'm29', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Priya', timestamp: ts(7), note: 'Sent detailed ECE brochure' }, { id: 'm30', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Priya', timestamp: ts(1), note: 'Selected as top choice, ready to apply' }], tags: ['Top Choice'] },
  { id: 'L-1011', name: 'Aditya Singh', initials: 'AS', phone: '+91-98765 43230', email: 'aditya.s@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Facebook Ad', city: 'Lucknow', assignedTo: { name: 'Arun' }, status: 'application', documents: { uploaded: 0, required: 5 }, communicationCount: 8, nextFollowUp: '2026-07-30T09:00:00Z', lastContact: '1d ago', parent: { name: 'Raj Singh', phone: '+91-98765 43231', relation: 'Father' }, moveHistory: [{ id: 'm31', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(25), note: 'Facebook campaign' }, { id: 'm32', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(22), note: 'Initial call' }, { id: 'm33', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(19), note: 'Interested in hostel facilities' }, { id: 'm34', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(15), note: 'Shared hostel details' }, { id: 'm35', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Arun', timestamp: ts(10), note: 'Confirmed application intent' }, { id: 'm36', from: 'qualified', to: 'application', by: 'user1', byName: 'Arun', timestamp: ts(3), note: 'Application submitted online' }] },
  { id: 'L-1012', name: 'Neha Joshi', initials: 'NJ', phone: '+91-98765 43232', email: 'neha.j@email.com', course: 'MBA Finance', intake: '2024', source: 'Referral', city: 'Pune', assignedTo: { name: 'Divya' }, status: 'application', documents: { uploaded: 0, required: 4 }, communicationCount: 9, nextFollowUp: null, lastContact: '3d ago', parent: { name: 'Anil Joshi', phone: '+91-98765 43233', relation: 'Father' }, moveHistory: [{ id: 'm37', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(30), note: 'Alumni referral' }, { id: 'm38', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(27), note: 'Called' }, { id: 'm39', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(24), note: 'Interested in MBA Finance' }, { id: 'm40', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(20), note: 'Sent MBA brochure' }, { id: 'm41', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(14), note: 'Shortlisted' }, { id: 'm42', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(5), note: 'Application in review' }] },
  { id: 'L-1013', name: 'Amit Verma', initials: 'AV', phone: '+91-98765 43234', email: 'amit.v@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Google Ads', city: 'Delhi', assignedTo: { name: 'Karthik' }, status: 'application-status', documents: { uploaded: 0, required: 5 }, communicationCount: 10, nextFollowUp: '2026-08-03T11:00:00Z', lastContact: '2d ago', parent: { name: 'Pradeep Verma', phone: '+91-98765 43235', relation: 'Father' }, moveHistory: [{ id: 'm43', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(18), note: 'FB lead' }, { id: 'm44', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(15), note: 'Attempted contact' }, { id: 'm45', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(12), note: 'Connected' }, { id: 'm46', from: 'contacted', to: 'nurture', by: 'user3', byName: 'Karthik', timestamp: ts(8), note: 'Nurturing' }, { id: 'm47', from: 'nurture', to: 'qualified', by: 'user3', byName: 'Karthik', timestamp: ts(4), note: 'Qualified' }, { id: 'm48', from: 'qualified', to: 'application', by: 'user3', byName: 'Karthik', timestamp: ts(2), note: 'Applied' }, { id: 'm49', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(0, 6), note: 'Documents under verification' }] },
  { id: 'L-1014', name: 'Pooja Desai', initials: 'PD', phone: '+91-98765 43236', email: 'pooja.d@email.com', course: 'B.Sc Physics', intake: '2025', source: 'Education Fair', city: 'Surat', assignedTo: { name: 'Priya' }, status: 'offer-status', offerDecision: 'accepted', documents: { uploaded: 0, required: 4 }, communicationCount: 12, nextFollowUp: null, lastContact: '5h ago', parent: { name: 'Kiran Desai', phone: '+91-98765 43237', relation: 'Mother' }, moveHistory: [{ id: 'm50', from: '', to: 'enquiry', by: 'system', byName: 'Education Fair', timestamp: ts(35), note: 'Education fair lead' }, { id: 'm51', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(32), note: 'Called' }, { id: 'm52', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(29), note: 'Interested' }, { id: 'm53', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Priya', timestamp: ts(25), note: 'Nurtured' }, { id: 'm54', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Priya', timestamp: ts(18), note: 'Qualified' }, { id: 'm55', from: 'qualified', to: 'application', by: 'user1', byName: 'Priya', timestamp: ts(10), note: 'Applied' }, { id: 'm56', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(5), note: 'All docs verified' }] },
  { id: 'L-1015', name: 'Varun Chakraborty', initials: 'VC', phone: '+91-98765 43238', email: 'varun.c@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Google Ads', city: 'Kolkata', assignedTo: { name: 'Divya' }, status: 'offer-status', offerDecision: 'on-hold', documents: { uploaded: 0, required: 5 }, communicationCount: 11, nextFollowUp: '2026-07-30T10:30:00Z', lastContact: '3h ago', parent: { name: 'Sajal Chakraborty', phone: '+91-98765 43239', relation: 'Father' }, moveHistory: [{ id: 'm58', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(40), note: 'Google campaign' }, { id: 'm59', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(37), note: 'Called' }, { id: 'm60', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(34), note: 'Interested in CSE with AI specialization' }, { id: 'm61', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(30), note: 'Shared AI brochure' }, { id: 'm62', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(22), note: 'Top choice' }, { id: 'm63', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(12), note: 'Applied' }, { id: 'm64', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(6), note: 'All docs verified' }], tags: ['AI Specialization'] },
  { id: 'L-1016', name: 'Kavya Nambiar', initials: 'KN', phone: '+91-98765 43242', email: 'kavya.n@email.com', course: 'B.Tech CSE', intake: '2026', source: 'Referral', city: 'Kochi', assignedTo: { name: 'Divya' }, status: 'offer-status', offerDecision: 'accepted', documents: { uploaded: 0, required: 5 }, communicationCount: 14, nextFollowUp: null, lastContact: '2d ago', parent: { name: 'Nambiar', phone: '+91-98765 43243', relation: 'Father' }, moveHistory: [{ id: 'm74', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(50), note: 'Referred' }, { id: 'm75', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(47), note: 'Contacted' }, { id: 'm76', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(44), note: 'Discussed' }, { id: 'm77', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(40), note: 'Nurtured' }, { id: 'm78', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(32), note: 'Qualified' }, { id: 'm79', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(22), note: 'Application submitted' }, { id: 'm80', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(14), note: 'All docs cleared' }] },
  { id: 'L-1017', name: 'Swathi Pillai', initials: 'SP', phone: '+91-98765 43258', email: 'swathi.p@email.com', course: 'MBA HR', intake: '2024', source: 'Referral', city: 'Thiruvananthapuram', assignedTo: { name: 'Divya' }, status: 'offer-status', offerDecision: 'rejected', documents: { uploaded: 0, required: 4 }, communicationCount: 12, nextFollowUp: null, lastContact: '5d ago', parent: { name: 'Pillai', phone: '+91-98765 43259', relation: 'Father' }, moveHistory: [{ id: 'm108', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(55), note: 'Referred' }, { id: 'm109', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(52), note: 'Contacted' }, { id: 'm110', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(49), note: 'Discussed' }, { id: 'm111', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(44), note: 'Nurtured' }, { id: 'm112', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(35), note: 'Qualified' }, { id: 'm113', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(25), note: 'Applied' }, { id: 'm114', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(16), note: 'Cleared documents' }] },
];

// --- Default Dashboard Layouts ---
export const DEFAULT_ADMIN_DASHBOARD: DashboardLayout = {
  id: 'admin-default',
  name: 'Admin Dashboard',
  widgets: [
    { id: 'w-stats', type: 'stats', title: 'Pipeline Overview', w: 4, h: 1, x: 0, y: 0 },
    { id: 'w-leads-chart', type: 'chart', title: 'Leads by Source', w: 2, h: 2, x: 0, y: 1 },
    { id: 'w-recent-activity', type: 'activity', title: 'Recent Activity', w: 2, h: 2, x: 2, y: 1 },
    { id: 'w-team-performance', type: 'team', title: 'Team Performance', w: 4, h: 1, x: 0, y: 3 },
    { id: 'w-conversion', type: 'funnel', title: 'Conversion Funnel', w: 2, h: 2, x: 0, y: 4 },
    { id: 'w-upcoming', type: 'upcoming', title: 'Upcoming Follow-ups', w: 2, h: 2, x: 2, y: 4 },
  ],
};

export const DEFAULT_STUDENT_DASHBOARD: DashboardLayout = {
  id: 'student-default',
  name: 'Student Dashboard',
  widgets: [
    { id: 'w-student-profile', type: 'profile', title: 'My Profile', w: 2, h: 2, x: 0, y: 0 },
    { id: 'w-application-status', type: 'app-status', title: 'Offer / Status', w: 2, h: 2, x: 2, y: 0 },
    { id: 'w-documents', type: 'documents', title: 'My Documents', w: 2, h: 1, x: 0, y: 2 },
    { id: 'w-notices', type: 'notices', title: 'Notices', w: 2, h: 1, x: 2, y: 2 },
  ],
};

// --- Available Widget Types ---
export const WIDGET_CATALOG = [
  { type: 'stats', title: 'Pipeline Overview', defaultW: 4, defaultH: 1 },
  { type: 'chart', title: 'Chart', defaultW: 2, defaultH: 2 },
  { type: 'activity', title: 'Activity Feed', defaultW: 2, defaultH: 2 },
  { type: 'team', title: 'Team Performance', defaultW: 4, defaultH: 1 },
  { type: 'funnel', title: 'Conversion Funnel', defaultW: 2, defaultH: 2 },
  { type: 'upcoming', title: 'Upcoming Follow-ups', defaultW: 2, defaultH: 2 },
  { type: 'profile', title: 'Student Profile', defaultW: 2, defaultH: 2 },
  { type: 'app-status', title: 'Offer / Status', defaultW: 2, defaultH: 2 },
  { type: 'documents', title: 'Documents', defaultW: 2, defaultH: 1 },
  { type: 'notices', title: 'Notices', defaultW: 2, defaultH: 1 },
];


