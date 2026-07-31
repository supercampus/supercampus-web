'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS, LEADS } from '@/lib/kanban/kanban-data';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import ActivityFeed from '@/components/kanban/ActivityFeed';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, ClipboardList, Clock, Database, FileText, Grip, Info, Kanban, LayoutDashboard, Layers, ListChecks, LogOut, Mail, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Pencil, PhoneCall, PlusCircle, Save, Search, Settings, ShieldCheck, SlidersHorizontal, Smartphone, Sun, Target, TrendingUp, Trash2, UserCog, Users, X } from 'lucide-react';

type NavSection = 'dashboard' | 'crm' | 'pipeline' | 'admissions' | 'students' | 'academics' | 'fees' | 'erp' | 'reports' | 'users' | 'settings';
type ThemeId = 'classic' | 'ocean' | 'emerald' | 'midnight';
type SettingsSection = 'access' | 'forms' | 'workflows' | 'widgets' | 'integrations' | 'theme';
type PreviewMode = 'desktop' | 'mobile';
type CollegeRole = { id: string; name: string; team: string; scope: string; moduleIds: string[] };
type OperationModule = { id: string; name: string; features: string[] };
type StaffUser = { id: string; name: string; email: string; initials: string; role: string; roleId: string; team: string; access: string[] };
type TenantBrand = { logoDataUrl: string | null; primary: string; secondary: string; surface: string };
type FormBuilder = { id: string; name: string; module: string; fields: number; status: string; owner: string; usage: string };
type FormField = { label: string; type: string; required?: boolean; width?: 'half' | 'full' };
type FormSchemaSection = { section: string; fields: FormField[] };
type FormDraft = Pick<FormBuilder, 'id' | 'name' | 'module' | 'status' | 'owner' | 'usage'>;
type FieldDraft = { key: string; field: FormField };
type FieldPaletteItem = { id: string; label: string; type: string; icon: LucideIcon };
type AccessModal = 'role' | 'module' | 'crud' | 'users' | null;
type OperationModal = { title: string; context: string; fields: string[]; confirmLabel?: string } | null;
type RequirementGroup = { title: string; description: string; items: string[] };
type RequirementPage = { eyebrow: string; title: string; description: string; stats: string[]; groups: RequirementGroup[] };
type AdminFlowStep = { title: string; owner: string; status: string };
type AdminQueueItem = { title: string; meta: string; status: string; priority: string };
type AdminWorkArea = {
  primaryAction: string;
  flowTitle: string;
  flowSteps: AdminFlowStep[];
  queueTitle: string;
  queueItems: AdminQueueItem[];
  panels: RequirementGroup[];
};
type AdminScreenSpec = {
  id: string;
  label: string;
  path: string;
  purpose: string;
  operations: string[];
  columns?: string[];
  filters?: string[];
  special?: string[];
};
type AdminRecord = Record<string, string>;

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-item';
const initialsFromName = (value: string) => value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
const cloneFormSchemas = () => JSON.parse(JSON.stringify(FORM_SCHEMAS)) as Record<string, FormSchemaSection[]>;
const countSchemaFields = (schema: FormSchemaSection[]) => schema.reduce((total, section) => total + section.fields.length, 0);
const DEFAULT_TENANT_BRAND: TenantBrand = { logoDataUrl: null, primary: '#0b3d2e', secondary: '#b9f43b', surface: '#eef7e8' };

const brandGradient = 'linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))';

function readTenantBrand(): TenantBrand {
  if (typeof window === 'undefined') return DEFAULT_TENANT_BRAND;
  try {
    const raw = window.localStorage.getItem('supercampus:tenant-brand');
    return raw ? { ...DEFAULT_TENANT_BRAND, ...JSON.parse(raw) } : DEFAULT_TENANT_BRAND;
  } catch {
    return DEFAULT_TENANT_BRAND;
  }
}

function applyTenantBrand(brand: TenantBrand) {
  const root = document.documentElement;
  root.style.setProperty('--tenant-primary', brand.primary);
  root.style.setProperty('--tenant-secondary', brand.secondary);
  root.style.setProperty('--tenant-surface', brand.surface);
  root.style.setProperty('--primary-grad', `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`);
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function mixWithWhite(hex: string, amount = 0.9) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return rgbToHex(Math.round(r + (255 - r) * amount), Math.round(g + (255 - g) * amount), Math.round(b + (255 - b) * amount));
}

async function extractLogoPalette(dataUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return DEFAULT_TENANT_BRAND;
  context.drawImage(image, 0, 0, 96, 96);
  const pixels = context.getImageData(0, 0, 96, 96).data;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();
  for (let i = 0; i < pixels.length; i += 16) {
    if (pixels[i + 3] < 160) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturation = max - min;
    const brightness = (r + g + b) / 3;
    if (brightness > 235 || brightness < 24 || saturation < 22) continue;
    const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, score: 0 };
    bucket.r += r; bucket.g += g; bucket.b += b; bucket.count += 1; bucket.score += saturation + (brightness < 180 ? 30 : 0);
    buckets.set(key, bucket);
  }
  const colors = Array.from(buckets.values()).map((bucket) => ({
    hex: rgbToHex(Math.round(bucket.r / bucket.count), Math.round(bucket.g / bucket.count), Math.round(bucket.b / bucket.count)),
    score: bucket.score * Math.sqrt(bucket.count),
  })).sort((a, b) => b.score - a.score);
  const primary = colors[0]?.hex ?? DEFAULT_TENANT_BRAND.primary;
  const secondary = colors.find((color) => color.hex !== primary)?.hex ?? DEFAULT_TENANT_BRAND.secondary;
  return { primary, secondary, surface: mixWithWhite(primary) };
}

const STAFF_USERS: StaffUser[] = [
  { id: 'u1', name: 'Arjun Mehta', email: 'arjun@supercampus.edu', initials: 'AM', role: 'Admin', roleId: 'super-admin', team: 'Operations', access: ['CRM', 'Fee Management', 'ERP'] },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@supercampus.edu', initials: 'PS', role: 'Admission Counselor', roleId: 'admission-counselor', team: 'Admissions', access: ['CRM', 'ERP'] },
  { id: 'u3', name: 'Rahul Verma', email: 'rahul@supercampus.edu', initials: 'RV', role: 'Admission Counselor', roleId: 'admission-counselor', team: 'Admissions', access: ['CRM'] },
  { id: 'u4', name: 'Divya Krishnan', email: 'divya@supercampus.edu', initials: 'DK', role: 'Marketing Executive', roleId: 'marketing-executive', team: 'Marketing', access: ['CRM'] },
  { id: 'u5', name: 'Karthik Nair', email: 'karthik@supercampus.edu', initials: 'KN', role: 'Marketing Manager', roleId: 'marketing-manager', team: 'Marketing', access: ['CRM', 'ERP'] },
  { id: 'u6', name: 'Meera Iyer', email: 'meera@supercampus.edu', initials: 'MI', role: 'Finance Manager', roleId: 'finance-manager', team: 'Finance', access: ['Fee Management', 'Reports', 'Form Builders'] },
  { id: 'u7', name: 'Sanjay Rao', email: 'sanjay@supercampus.edu', initials: 'SR', role: 'Accountant', roleId: 'accountant', team: 'Finance', access: ['Fee Management', 'Communication Center'] },
  { id: 'u8', name: 'Nisha Menon', email: 'nisha@supercampus.edu', initials: 'NM', role: 'Academic Admin / HOD', roleId: 'academic-admin', team: 'Academics', access: ['Academics / ERP', 'Exams', 'Communication Center'] },
  { id: 'u9', name: 'Vikram Sethi', email: 'vikram@supercampus.edu', initials: 'VS', role: 'Document Officer', roleId: 'document-officer', team: 'Admissions', access: ['Documents', 'CRM'] },
  { id: 'u10', name: 'Asha Pillai', email: 'asha@supercampus.edu', initials: 'AP', role: 'Hostel Warden', roleId: 'hostel-warden', team: 'Hostel', access: ['Hostel', 'Student App'] },
  { id: 'u11', name: 'Farhan Ali', email: 'farhan@supercampus.edu', initials: 'FA', role: 'Transport Manager', roleId: 'transport-manager', team: 'Transport', access: ['Transport', 'Student App'] },
  { id: 'u12', name: 'Leela Thomas', email: 'leela@supercampus.edu', initials: 'LT', role: 'Librarian', roleId: 'librarian', team: 'Library', access: ['Library', 'Student App'] },
  { id: 'u13', name: 'Rohit Das', email: 'rohit@supercampus.edu', initials: 'RD', role: 'Exam Cell', roleId: 'exam-cell', team: 'Exams', access: ['Exams', 'Student App', 'Communication Center'] },
  { id: 'u14', name: 'Ananya Bose', email: 'ananya@supercampus.edu', initials: 'AB', role: 'HR / Staff Admin', roleId: 'hr-admin', team: 'Administration', access: ['Staff / HR', 'Form Builders', 'ERP'] },
  { id: 'u15', name: 'Student Portal', email: 'student.portal@supercampus.edu', initials: 'ST', role: 'Student', roleId: 'student', team: 'Student Portal', access: ['Student App'] },
  { id: 'u16', name: 'Parent Portal', email: 'parent.portal@supercampus.edu', initials: 'PT', role: 'Parent / Guardian', roleId: 'parent', team: 'Parent Portal', access: ['Parent Portal'] },
];

const COLLEGE_ROLES: CollegeRole[] = [
  { id: 'super-admin', name: 'Super Admin', team: 'Ownership', scope: 'Full college control', moduleIds: ['*'] },
  { id: 'principal', name: 'Principal / Director', team: 'Leadership', scope: 'Approvals, dashboards, reports', moduleIds: ['crm', 'fees', 'academics', 'erp', 'reports'] },
  { id: 'admissions-manager', name: 'Admissions Manager', team: 'Admissions', scope: 'CRM pipeline and counselor control', moduleIds: ['crm', 'forms', 'communications', 'reports'] },
  { id: 'admission-counselor', name: 'Admission Counselor', team: 'Admissions', scope: 'Lead follow-up and applications', moduleIds: ['crm', 'communications', 'documents'] },
  { id: 'marketing-manager', name: 'Marketing Manager', team: 'Marketing', scope: 'Campaigns, sources, lead capture', moduleIds: ['crm', 'marketing', 'forms', 'reports'] },
  { id: 'marketing-executive', name: 'Marketing Executive', team: 'Marketing', scope: 'Lead creation and campaign follow-up', moduleIds: ['marketing', 'crm', 'communications'] },
  { id: 'document-officer', name: 'Document Officer', team: 'Admissions', scope: 'Document verification and application status', moduleIds: ['documents', 'crm'] },
  { id: 'finance-manager', name: 'Finance Manager', team: 'Finance', scope: 'Fees, concessions, refunds, reports', moduleIds: ['fees', 'reports', 'forms'] },
  { id: 'accountant', name: 'Accountant', team: 'Finance', scope: 'Receipts, dues, payment follow-up', moduleIds: ['fees', 'communications'] },
  { id: 'academic-admin', name: 'Academic Admin / HOD', team: 'Academics', scope: 'Attendance, timetable, exams, approvals', moduleIds: ['academics', 'exams', 'communications'] },
  { id: 'hostel-warden', name: 'Hostel Warden', team: 'Hostel', scope: 'Hostel, gate pass, leave approvals', moduleIds: ['hostel', 'student-app', 'communications'] },
  { id: 'transport-manager', name: 'Transport Manager', team: 'Transport', scope: 'Routes, vehicle, student transport requests', moduleIds: ['transport', 'student-app'] },
  { id: 'librarian', name: 'Librarian', team: 'Library', scope: 'Books, dues, library access', moduleIds: ['library', 'student-app'] },
  { id: 'exam-cell', name: 'Exam Cell', team: 'Exams', scope: 'Exam registration, hall tickets, results', moduleIds: ['exams', 'student-app', 'communications'] },
  { id: 'hr-admin', name: 'HR / Staff Admin', team: 'Administration', scope: 'Staff onboarding and internal users', moduleIds: ['staff', 'forms', 'erp'] },
  { id: 'student', name: 'Student', team: 'Student Portal', scope: 'Own app, fees, documents, requests', moduleIds: ['student-app'] },
  { id: 'parent', name: 'Parent / Guardian', team: 'Parent Portal', scope: 'Student progress, fees, notices', moduleIds: ['parent-app'] },
] ;

const OPERATION_MODULES: OperationModule[] = [
  {
    id: 'crm',
    name: 'CRM / Admissions',
    features: ['Dashboard', 'Lead pipeline', 'Lead create/edit', 'Forward stage move', 'Application status', 'Offer status', 'Archive leads', 'Lead assignment', 'Activity history'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    features: ['Campaigns', 'Lead sources', 'Landing forms', 'WhatsApp campaigns', 'Source ROI', 'Bulk import', 'UTM tracking'],
  },
  {
    id: 'communications',
    name: 'Communication Center',
    features: ['Direct calls', 'Email', 'SMS', 'WhatsApp', 'Templates', 'Communication logs', 'Follow-up scheduler'],
  },
  {
    id: 'forms',
    name: 'Form Builders',
    features: ['Create forms', 'Edit fields', 'Publish forms', 'Approval routing', 'Payment fields', 'Document fields', 'ERP sync mapping'],
  },
  {
    id: 'documents',
    name: 'Documents',
    features: ['Upload', 'Verify', 'Reject', 'Request resubmission', 'Document checklist', 'Generate letters'],
  },
  {
    id: 'fees',
    name: 'Fee Management',
    features: ['Fee dashboard', 'Dues', 'Receipts', 'Concessions', 'Installments', 'Refunds', 'Payment links', 'Defaulter follow-up'],
  },
  {
    id: 'academics',
    name: 'Academics / ERP',
    features: ['Students', 'Courses', 'Batches', 'Attendance', 'Timetable', 'Assignments', 'Academic approvals'],
  },
  {
    id: 'exams',
    name: 'Exams',
    features: ['Exam registration', 'Hall tickets', 'Results', 'Arrears', 'Revaluation', 'Exam fee status'],
  },
  {
    id: 'hostel',
    name: 'Hostel',
    features: ['Room allocation', 'Leave requests', 'Gate pass approvals', 'Mess settings', 'Hostel tickets', 'Occupancy reports'],
  },
  {
    id: 'transport',
    name: 'Transport',
    features: ['Routes', 'Bus allocation', 'Transport fee status', 'Breakdown alerts', 'Trip approvals'],
  },
  {
    id: 'library',
    name: 'Library',
    features: ['Catalog', 'Book issue', 'Returns', 'Fines', 'Digital resources', 'Library reports'],
  },
  {
    id: 'staff',
    name: 'Staff / HR',
    features: ['Staff profiles', 'Onboarding', 'Access packages', 'Departments', 'Asset issue', 'Staff documents'],
  },
  {
    id: 'student-app',
    name: 'Student App',
    features: ['Dashboard widgets', 'Attendance view', 'Fees view/pay', 'Gate pass request', 'Documents request', 'Timetable', 'Notifications'],
  },
  {
    id: 'parent-app',
    name: 'Parent Portal',
    features: ['Student profile view', 'Fee status', 'Attendance summary', 'Notices', 'Communication with college'],
  },
  {
    id: 'reports',
    name: 'Reports / Analytics',
    features: ['Admission reports', 'Fee reports', 'ERP reports', 'Export data', 'Custom dashboards', 'Widget analytics'],
  },
];

const NAV_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  pipeline: 'Admissions Pipeline',
  admissions: 'Admissions',
  students: 'Students',
  academics: 'Academics',
  fees: 'Fees & Finance',
  erp: 'ERP Services',
  reports: 'Reports & BI',
  users: 'Users & Roles',
  settings: 'Settings',
};

const ADMIN_REQUIREMENTS: Partial<Record<NavSection, RequirementPage>> = {
  crm: {
    eyebrow: 'CRM command center',
    title: 'Lead capture, follow-up, and counselor control',
    description: 'Everything before an applicant becomes an admitted student: enquiries, lead quality, campaign sources, activities, and counselor ownership.',
    stats: ['Lead intake', 'Follow-ups due', 'Campaign ROI', 'Counselor SLA'],
    groups: [
      { title: 'Lead Management', description: 'Create, import, assign, update, and archive leads.', items: ['Lead list and profile', 'Bulk import', 'Source and campaign tracking', 'Counselor assignment', 'Lead duplicate check'] },
      { title: 'Engagement', description: 'All communication and activity around a lead.', items: ['Calls, email, SMS, WhatsApp logs', 'Follow-up scheduler', 'Activity timeline', 'Templates', 'Missed follow-up alerts'] },
      { title: 'CRM Controls', description: 'Admin-side rules for lead operations.', items: ['Pipeline stages', 'Lead scoring', 'Auto assignment rules', 'Source quality rules', 'CRM permission rules'] },
    ],
  },
  admissions: {
    eyebrow: 'Admissions operations',
    title: 'Application to ERP handoff',
    description: 'Controls the complete admission journey from submitted application to confirmed student onboarding.',
    stats: ['Applications', 'Pending verification', 'Offers sent', 'ERP handoffs'],
    groups: [
      { title: 'Applications', description: 'Process application records coming from CRM and public forms.', items: ['Application review', 'Eligibility check', 'Program/course preference', 'Seat allocation', 'Admission status'] },
      { title: 'Verification', description: 'Document and profile validation before confirmation.', items: ['Document checklist', 'Approve/reject/resubmit', 'Counselor remarks', 'Manager approval', 'Audit trail'] },
      { title: 'Confirmation', description: 'Move confirmed applicants into fee and ERP workflows.', items: ['Offer letter', 'Admission confirmation', 'Fee trigger', 'Student onboarding handoff', 'Student app activation'] },
    ],
  },
  students: {
    eyebrow: 'Student registry',
    title: 'One student profile across CRM, Fees, ERP, and app',
    description: 'After admission, this becomes the master operational view for every student and linked parent.',
    stats: ['Active students', 'Parents linked', 'Documents pending', 'App users'],
    groups: [
      { title: 'Student Master', description: 'Core academic and personal profile.', items: ['Student profile', 'Parent/guardian details', 'Emergency contacts', 'Program/batch/section', 'Status lifecycle'] },
      { title: 'Student App Data', description: 'What the mobile app reads and updates.', items: ['Digital ID', 'Requests', 'Notifications', 'Uploaded documents', 'Profile corrections'] },
      { title: 'Cross-Module View', description: 'Joined status from major ERP modules.', items: ['Fees ledger', 'Attendance summary', 'Exam results', 'Hostel/transport allocation', 'No due status'] },
    ],
  },
  academics: {
    eyebrow: 'Academic ERP',
    title: 'Courses, batches, timetable, attendance, and exams',
    description: 'Academic setup and daily academic operations used by staff, students, parents, and reports.',
    stats: ['Programs', 'Batches', 'Attendance risk', 'Exam cycles'],
    groups: [
      { title: 'Academic Structure', description: 'Base setup for the college ERP.', items: ['Departments', 'Programs/courses', 'Batches and sections', 'Subjects', 'Curriculum and credits'] },
      { title: 'Daily Academics', description: 'Operational academic workflows.', items: ['Timetable', 'Attendance', 'Assignments', 'Lesson plan', 'Faculty allocation'] },
      { title: 'Examinations', description: 'Exam lifecycle and student result publishing.', items: ['Exam registration', 'Hall ticket', 'Marks entry', 'Results', 'Revaluation'] },
    ],
  },
  fees: {
    eyebrow: 'Finance desk',
    title: 'Fee structure, payments, concessions, and clearance',
    description: 'Finance admin functions with strict approval and audit requirements.',
    stats: ['Collected', 'Outstanding', 'Concessions', 'Refunds'],
    groups: [
      { title: 'Fee Setup', description: 'Configuration before billing students.', items: ['Fee structure', 'Fee/fine heads', 'Student fee assignment', 'Installment plans', 'Payment gateway setup'] },
      { title: 'Collections', description: 'Daily fee operation and student/parent payment flows.', items: ['Invoices', 'Online/offline payments', 'Receipts', 'Payment history', 'Due reminders'] },
      { title: 'Approvals', description: 'Finance-sensitive workflows.', items: ['Scholarships', 'Concessions', 'Refunds', 'No due clearance', 'Finance audit log'] },
    ],
  },
  erp: {
    eyebrow: 'ERP services',
    title: 'Campus operations and student services',
    description: 'Grouped services that should not clutter the main sidebar but must be available to admins and module owners.',
    stats: ['Service modules', 'Open requests', 'Approvals', 'Alerts'],
    groups: [
      { title: 'Student Services', description: 'Services used directly from the student/parent app.', items: ['Hostel', 'Transport', 'Library', 'Gate Pass', 'No Due'] },
      { title: 'Campus Operations', description: 'Institution operations and support modules.', items: ['Documents', 'Medical / Sick Room', 'Counselling', 'Repairs & Maintenance', 'Visitor Management'] },
      { title: 'External & Career', description: 'Modules connected to external users and post-study lifecycle.', items: ['Vendor Management', 'Placement', 'Alumni', 'Feedback & Grievance', 'Communication handoffs'] },
    ],
  },
  reports: {
    eyebrow: 'Reports and BI',
    title: 'Analytics for CRM, Fee Management, and ERP',
    description: 'A unified reporting layer for operational decisions, exports, compliance, and management review.',
    stats: ['CRM reports', 'Finance reports', 'ERP reports', 'Exports'],
    groups: [
      { title: 'CRM Analytics', description: 'Lead and admissions performance.', items: ['Lead source report', 'Counselor performance', 'Stage conversion', 'Campaign ROI', 'Follow-up SLA'] },
      { title: 'Finance Analytics', description: 'Fee and revenue performance.', items: ['Collection report', 'Outstanding dues', 'Concession report', 'Refund report', 'Defaulter list'] },
      { title: 'ERP Analytics', description: 'Academic and operations reporting.', items: ['Attendance risk', 'Exam results', 'Hostel occupancy', 'Transport usage', 'Document compliance'] },
    ],
  },
};

const ADMIN_WORK_AREAS: Partial<Record<NavSection, AdminWorkArea>> = {
  admissions: {
    primaryAction: 'New application',
    flowTitle: 'Admission Processing Flow',
    flowSteps: [
      { title: 'Application received', owner: 'Counselor', status: 'Live' },
      { title: 'Eligibility and documents', owner: 'Admissions team', status: 'Review' },
      { title: 'Offer and seat allocation', owner: 'Admissions manager', status: 'Approval' },
      { title: 'Fee trigger', owner: 'Finance', status: 'Waiting' },
      { title: 'ERP onboarding', owner: 'Registrar', status: 'Handoff' },
    ],
    queueTitle: 'Application Queue',
    queueItems: [
      { title: 'Rahul Kumar', meta: 'B.Tech CSE / documents pending', status: 'Verification', priority: 'High' },
      { title: 'Priya Sharma', meta: 'MBA Marketing / offer ready', status: 'Offer', priority: 'Medium' },
      { title: 'Vikram Iyer', meta: 'BCA / fee confirmation needed', status: 'Finance', priority: 'High' },
      { title: 'Sara Khan', meta: 'BBA / ERP handoff pending', status: 'Onboarding', priority: 'Low' },
    ],
    panels: [
      { title: 'Application Workspace', description: 'The admin needs one place to process applications.', items: ['Application profile', 'Program preference', 'Eligibility result', 'Counselor notes', 'Offer status'] },
      { title: 'Document Desk', description: 'Admissions cannot move forward until documents are clean.', items: ['Checklist', 'Preview file', 'Approve/reject', 'Ask resubmission', 'Verification audit'] },
      { title: 'Handoff Controls', description: 'Confirmed admissions should move to Fees and ERP without duplicate entry.', items: ['Create fee demand', 'Confirm payment', 'Create student profile', 'Assign batch/section', 'Activate student app'] },
    ],
  },
  students: {
    primaryAction: 'Add student',
    flowTitle: 'Student Lifecycle Flow',
    flowSteps: [
      { title: 'Admitted profile created', owner: 'Registrar', status: 'Active' },
      { title: 'Parent and app linked', owner: 'Admin', status: 'Setup' },
      { title: 'Academics assigned', owner: 'Academic admin', status: 'Mapped' },
      { title: 'Services enabled', owner: 'ERP owners', status: 'Optional' },
      { title: 'Graduation / alumni handoff', owner: 'Placement & alumni', status: 'Later' },
    ],
    queueTitle: 'Student Master Queue',
    queueItems: [
      { title: 'Aarav Patel', meta: 'Parent not linked / CSE 2026', status: 'Profile', priority: 'Medium' },
      { title: 'Meera Nair', meta: 'Hostel requested / ECE 2025', status: 'Service', priority: 'High' },
      { title: 'Kavin Raj', meta: 'Document resubmission pending', status: 'Documents', priority: 'High' },
      { title: 'Nila George', meta: 'Batch transfer requested', status: 'Academics', priority: 'Low' },
    ],
    panels: [
      { title: 'Student Master', description: 'Single source of truth for every student.', items: ['Personal profile', 'Academic identity', 'Parent link', 'Emergency contact', 'Status history'] },
      { title: 'App Controls', description: 'Admin should control what the mobile app shows.', items: ['Digital ID', 'Student app access', 'Parent app access', 'Notifications', 'Profile correction requests'] },
      { title: 'Module Snapshot', description: 'Admin needs one view of student status across modules.', items: ['Fee ledger', 'Attendance', 'Documents', 'Hostel/transport', 'No due'] },
    ],
  },
  academics: {
    primaryAction: 'Create academic setup',
    flowTitle: 'Academic ERP Flow',
    flowSteps: [
      { title: 'Configure departments', owner: 'Academic admin', status: 'Setup' },
      { title: 'Create programs and batches', owner: 'Registrar', status: 'Setup' },
      { title: 'Map subjects and faculty', owner: 'HOD', status: 'Mapping' },
      { title: 'Publish timetable and attendance', owner: 'Faculty', status: 'Live' },
      { title: 'Run exams and publish results', owner: 'Exam cell', status: 'Cycle' },
    ],
    queueTitle: 'Academic Operations',
    queueItems: [
      { title: 'CSE Semester 3 timetable', meta: '2 room conflicts found', status: 'Conflict', priority: 'High' },
      { title: 'ECE attendance correction', meta: 'HOD approval required', status: 'Approval', priority: 'Medium' },
      { title: 'MBA exam registration', meta: 'Fee status check required', status: 'Exam', priority: 'High' },
      { title: 'BCA curriculum update', meta: 'Credits need review', status: 'Draft', priority: 'Low' },
    ],
    panels: [
      { title: 'Academic Structure', description: 'Foundation data for the ERP.', items: ['Departments', 'Programs', 'Courses', 'Batches/sections', 'Curriculum'] },
      { title: 'Class Operations', description: 'Daily academic work.', items: ['Timetable', 'Faculty allocation', 'Attendance', 'Assignments', 'Lesson plans'] },
      { title: 'Exam Operations', description: 'Exam lifecycle connected to fees and reports.', items: ['Exam registration', 'Hall ticket', 'Marks entry', 'Result publish', 'Revaluation'] },
    ],
  },
  fees: {
    primaryAction: 'Create fee rule',
    flowTitle: 'Fees & Finance Flow',
    flowSteps: [
      { title: 'Configure fee structure', owner: 'Finance admin', status: 'Setup' },
      { title: 'Assign fees to students', owner: 'Finance', status: 'Billing' },
      { title: 'Collect online/offline payments', owner: 'Student / cashier', status: 'Live' },
      { title: 'Approve concessions/refunds', owner: 'Finance manager', status: 'Approval' },
      { title: 'Clear dues for ERP services', owner: 'Finance', status: 'Handoff' },
    ],
    queueTitle: 'Finance Queue',
    queueItems: [
      { title: 'Fee concession request', meta: 'Rahul Kumar / 20% scholarship', status: 'Review', priority: 'High' },
      { title: 'Payment reconciliation', meta: 'UPI webhook mismatch', status: 'Gateway', priority: 'High' },
      { title: 'Refund request', meta: 'Hostel fee refund / partial', status: 'Approval', priority: 'Medium' },
      { title: 'No due clearance', meta: 'Final year CSE / finance pending', status: 'Clearance', priority: 'Medium' },
    ],
    panels: [
      { title: 'Fee Configuration', description: 'Admin controls billing rules.', items: ['Fee heads', 'Program fee structure', 'Installments', 'Fine rules', 'Scholarship rules'] },
      { title: 'Collection Desk', description: 'Daily finance operations.', items: ['Invoices', 'Payment links', 'Receipts', 'Counter payments', 'Ledger updates'] },
      { title: 'Finance Approvals', description: 'Sensitive actions must be approved and logged.', items: ['Concessions', 'Refunds', 'Write-offs', 'No due', 'Audit export'] },
    ],
  },
  erp: {
    primaryAction: 'Open service request',
    flowTitle: 'ERP Services Flow',
    flowSteps: [
      { title: 'Student/staff raises request', owner: 'Mobile app / portal', status: 'Live' },
      { title: 'Module owner reviews', owner: 'Hostel / transport / library', status: 'Review' },
      { title: 'Fee or document check', owner: 'Finance / documents', status: 'Dependency' },
      { title: 'Approval or service completion', owner: 'Module admin', status: 'Action' },
      { title: 'Notification and audit', owner: 'System', status: 'Done' },
    ],
    queueTitle: 'ERP Service Queue',
    queueItems: [
      { title: 'Gate pass approval', meta: 'Student leave / parent approved', status: 'Warden', priority: 'High' },
      { title: 'Hostel room transfer', meta: 'Block B to Block C', status: 'Hostel', priority: 'Medium' },
      { title: 'Transport route request', meta: 'New pickup point requested', status: 'Transport', priority: 'Low' },
      { title: 'Library due clearance', meta: 'No due dependency', status: 'Library', priority: 'High' },
    ],
    panels: [
      { title: 'Student Services', description: 'Modules students and parents use often.', items: ['Hostel', 'Transport', 'Library', 'Gate pass', 'No due'] },
      { title: 'Campus Operations', description: 'Internal admin operations.', items: ['Documents', 'Visitor management', 'Repairs', 'Medical records', 'Counselling'] },
      { title: 'External Services', description: 'Outside users and lifecycle modules.', items: ['Vendor', 'Placement', 'Alumni', 'Feedback', 'Public forms'] },
    ],
  },
  reports: {
    primaryAction: 'Create report',
    flowTitle: 'Reports & BI Flow',
    flowSteps: [
      { title: 'Choose domain', owner: 'Admin', status: 'CRM/Fee/ERP' },
      { title: 'Apply scope and role filters', owner: 'Access engine', status: 'Security' },
      { title: 'Generate dashboard/report', owner: 'BI engine', status: 'Processing' },
      { title: 'Export or schedule', owner: 'Admin', status: 'Output' },
      { title: 'Management review', owner: 'Principal / Management', status: 'Review' },
    ],
    queueTitle: 'Report Queue',
    queueItems: [
      { title: 'Admission conversion report', meta: 'Source to enrollment', status: 'Ready', priority: 'Medium' },
      { title: 'Fee outstanding report', meta: 'Department and batch wise', status: 'Scheduled', priority: 'High' },
      { title: 'Attendance risk report', meta: 'Below 75%', status: 'Live', priority: 'High' },
      { title: 'ERP service SLA', meta: 'Open vs closed requests', status: 'Draft', priority: 'Low' },
    ],
    panels: [
      { title: 'CRM Reports', description: 'Admissions and marketing performance.', items: ['Lead sources', 'Campaign ROI', 'Counselor performance', 'Stage conversion', 'Follow-up SLA'] },
      { title: 'Finance Reports', description: 'College revenue and dues.', items: ['Collections', 'Outstanding', 'Concessions', 'Refunds', 'Payment reconciliation'] },
      { title: 'ERP Reports', description: 'Academic and operations intelligence.', items: ['Attendance', 'Exams', 'Hostel', 'Transport', 'Documents'] },
    ],
  },
};

const ADMIN_SCREEN_SPECS: Partial<Record<NavSection, AdminScreenSpec[]>> = {
  crm: [
    {
      id: 'leads',
      label: 'Leads',
      path: '/admin/crm/leads',
      purpose: 'Manage all pre-admission leads from enquiry sources, campaigns, walk-ins, and referrals.',
      operations: ['Create lead', 'Edit lead', 'Soft delete to trash', 'Bulk import CSV/Excel', 'Bulk assign/status/message/export/archive', 'Merge duplicates', 'Reassign counselor with reason', 'Convert to application'],
      columns: ['Select', 'Name', 'Phone', 'Course', 'Source', 'Status', 'Priority', 'Assigned To', 'Last Contact', 'Next Follow-up', 'Actions'],
      filters: ['Enquiry date', 'Last contact date', 'Source', 'Course', 'Status', 'Priority', 'Assigned counselor', 'City/state', 'Lead age'],
      special: ['Click-to-call', 'WhatsApp prefilled message', 'Email quick action', 'Hot/warm/cold color coding', 'Stale lead alert after 7 days'],
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      path: '/admin/crm/enquiries',
      purpose: 'Fast front-desk capture and source tracking before a record becomes a lead.',
      operations: ['Capture walk-in enquiry', 'Convert enquiry to lead', 'Track UTM/referrer/campaign source', 'Real-time duplicate check'],
      columns: ['Enquiry ID', 'Name', 'Phone', 'Course', 'Source', 'Enquiry Date', 'Status', 'Assigned To', 'Actions'],
      filters: ['Source', 'Course', 'Status', 'Assigned counselor', 'Date range'],
      special: ['Brochure given flag', 'Campus tour schedule', 'Auto-convert after first contact'],
    },
    {
      id: 'communications',
      label: 'Communications',
      path: '/admin/crm/communications',
      purpose: 'All calls, SMS, WhatsApp, email, templates, and follow-up reminders for CRM.',
      operations: ['Log call', 'Send SMS/WhatsApp', 'Send email with merge fields', 'Schedule follow-up', 'Bulk communication', 'Create/edit templates'],
      columns: ['Date/Time', 'Direction', 'Channel', 'User', 'Lead Name', 'Content/Notes', 'Duration', 'Status'],
      filters: ['Channel', 'Counselor', 'Delivery status', 'Date range', 'Lead status'],
      special: ['Template selector', 'Delivery tracking', 'Missed follow-up escalation', 'Rich email editor'],
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      path: '/admin/crm/campaigns',
      purpose: 'Plan campaigns, attribute leads, and measure spend-to-enrollment performance.',
      operations: ['Create campaign', 'Edit budget/date/status', 'Pause/resume', 'Soft delete', 'Track campaign performance'],
      columns: ['Campaign', 'Type', 'Budget', 'Spent', 'Leads', 'CPL', 'Applications', 'Enrollments', 'ROI', 'Status'],
      filters: ['Campaign type', 'Date range', 'Status', 'Source', 'Target audience'],
      special: ['Auto UTM generation', 'Landing page URL', 'Daily lead trend chart', 'Source breakdown chart'],
    },
    {
      id: 'counselor-performance',
      label: 'Counselor Performance',
      path: '/admin/crm/counselor-performance',
      purpose: 'Manager dashboard for counselor productivity, targets, revenue, and review notes.',
      operations: ['View dashboard', 'Set monthly/quarterly targets', 'Add performance review notes'],
      columns: ['Counselor', 'Leads', 'Contacted', 'Qualified', 'Applications', 'Enrolled', 'Conversion %', 'Target', 'Achievement %', 'Rating'],
      filters: ['Counselor', 'Team', 'Date range', 'Program', 'Source'],
      special: ['Target vs achievement', 'Revenue generated', 'Calls made', 'Follow-ups completed'],
    },
  ],
  admissions: [
    {
      id: 'applications',
      label: 'Applications',
      path: '/admin/admissions/applications',
      purpose: 'Master application processing from draft/submitted to offered/enrolled.',
      operations: ['View applications', 'Filter by stage', 'Export PDF/Excel', 'Bulk status update', 'Build program-specific application forms'],
      columns: ['App ID', 'Applicant Name', 'Program', 'Submission Date', 'Status', 'Documents', 'Fee Status', 'Assigned Reviewer', 'Actions'],
      filters: ['Draft', 'Submitted', 'Under Review', 'Verified', 'Offered', 'Enrolled', 'Program', 'Reviewer'],
      special: ['Conditional fields', 'Required/optional fields', 'Program-specific forms', 'Drag-and-drop form builder'],
    },
    {
      id: 'documents',
      label: 'Document Verification',
      path: '/admin/admissions/documents',
      purpose: 'Review, approve, reject, and request re-upload for admission documents.',
      operations: ['Open verification queue', 'View document in drawer', 'Approve/reject with reason', 'Request re-upload', 'Bulk verify'],
      columns: ['Applicant', 'Document', 'Program', 'Uploaded On', 'Status', 'Reviewer', 'Actions'],
      filters: ['Document type', 'Program', 'Status', 'Reviewer', 'Upload date'],
      special: ['Side-by-side document viewer', 'Name/marks/photo checkboxes', 'OCR placeholder'],
    },
    {
      id: 'exams-interviews',
      label: 'Exams & Interviews',
      path: '/admin/admissions/exams-interviews',
      purpose: 'Entrance exam, interview scheduling, score entry, and rank list generation.',
      operations: ['Create exam schedule', 'Assign candidates', 'Generate hall tickets', 'Mark attendance', 'Enter scores', 'Create interview schedule', 'Generate merit list'],
      columns: ['Candidate', 'Program', 'Exam Score', 'Interview Score', 'Total', 'Rank', 'Status'],
      filters: ['Program', 'Exam slot', 'Interview panel', 'Qualification status'],
      special: ['QR hall ticket', 'Excel score upload', 'Weighted scorecard', 'Rank list'],
    },
    {
      id: 'seats',
      label: 'Seats & Quota',
      path: '/admin/admissions/seats',
      purpose: 'Program-wise seat matrix, category quota, waitlist, and seat transfer control.',
      operations: ['Create seat matrix', 'Set sanctioned intake', 'Track filled vs available', 'Manage management quota', 'Auto-rank waitlist', 'Seat transfer with approval'],
      columns: ['Program', 'Total', 'General', 'SC', 'ST', 'OBC', 'Management', 'Waitlist'],
      filters: ['Program', 'Category', 'Availability', 'Waitlist active'],
      special: ['Green available', 'Red full', 'Yellow waitlist', 'Category transfer audit'],
    },
    {
      id: 'scholarships',
      label: 'Scholarships',
      path: '/admin/admissions/scholarships',
      purpose: 'Scholarship and concession scheme approval before fee deduction.',
      operations: ['Create scheme', 'View applications', 'Verify eligibility', 'Approve/reject', 'Finance budget confirmation', 'Principal approval above threshold', 'Auto-apply to fee ledger'],
      columns: ['Student', 'Program', 'Scholarship Type', 'Requested Amount', 'Eligible Amount', 'Status', 'Approved By', 'Actions'],
      filters: ['Program', 'Scheme', 'Status', 'Amount range', 'Approver'],
      special: ['Income/category/merit checks', 'Multi-level approval', 'Fee ledger deduction'],
    },
    {
      id: 'enrollment',
      label: 'Enrollment',
      path: '/admin/admissions/enrollment',
      purpose: 'Convert paid and verified applicants into real students.',
      operations: ['View conversion queue', 'Convert to student', 'Bulk conversion', 'Defer admission', 'Cancel enrollment with refund workflow'],
      columns: ['Applicant', 'Program', 'Documents', 'Fee Paid', 'Offer', 'Seat', 'Duplicate Check', 'Actions'],
      filters: ['Program', 'Fee status', 'Offer status', 'Checklist complete'],
      special: ['Roll number generation', 'Student login creation', 'Parent portal creation', 'Class/section assignment', 'Welcome notifications'],
    },
  ],
  students: [
    {
      id: 'directory',
      label: 'Directory',
      path: '/admin/students/directory',
      purpose: 'Post-admission student master with profile, academics, fees, app access, and service status.',
      operations: ['Add student', 'Edit student', 'Activate/deactivate', 'Bulk import', 'Export profiles', 'Promote student', 'Generate ID card', 'Generate bonafide certificate'],
      columns: ['Roll No', 'Photo', 'Name', 'Program', 'Section', 'Batch', 'Phone', 'Parent Phone', 'Status', 'Actions'],
      filters: ['Program', 'Section', 'Batch', 'Status', 'Category', 'Gender', 'City', 'Fee due', 'Attendance shortage'],
      special: ['Full profile drawer', 'Student 360 tabs', 'QR ID card', 'Bonafide certificate'],
    },
    {
      id: 'documents',
      label: 'Documents',
      path: '/admin/students/documents',
      purpose: 'Student document repository after enrollment.',
      operations: ['Upload document', 'Verify document', 'Download all as ZIP', 'Track expiry alerts'],
      columns: ['Student', 'Document Type', 'Uploaded On', 'Expiry', 'Verification Status', 'Actions'],
      filters: ['Program', 'Document type', 'Status', 'Expiry soon'],
      special: ['Student-wise document vault', 'Expiry alerts', 'Bulk download'],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      path: '/admin/students/attendance',
      purpose: 'Student/class attendance viewing, marking, correction, and parent alerts.',
      operations: ['View attendance', 'Mark class attendance', 'Edit with reason', 'Generate shortage reports', 'Send absence alert', 'Process correction request'],
      columns: ['Student', 'Program', 'Section', 'Present %', 'Absent', 'Late', 'Shortage', 'Actions'],
      filters: ['Class', 'Date', 'Subject', 'Shortage below 75%', 'Status'],
      special: ['Daily grid', 'Monthly color calendar', 'Parent SMS alert', 'Correction approval flow'],
    },
    {
      id: 'disciplinary',
      label: 'Disciplinary',
      path: '/admin/students/disciplinary',
      purpose: 'Incident logging, warnings, suspension, and student discipline history.',
      operations: ['Log incident', 'Issue warning', 'Suspend student', 'Revoke suspension', 'View history'],
      columns: ['Student', 'Date', 'Type', 'Reported By', 'Severity', 'Status', 'Actions'],
      filters: ['Incident type', 'Program', 'Severity', 'Date range', 'Status'],
      special: ['Evidence upload', 'Auto-block gate pass during suspension', 'Complete history'],
    },
    {
      id: 'promotion',
      label: 'Promotion & Alumni',
      path: '/admin/students/promotion',
      purpose: 'Academic promotion, year gap, transfer out, and alumni conversion.',
      operations: ['Batch promotion', 'Mark year gap', 'Transfer out', 'Generate transfer certificate', 'Convert to alumni'],
      columns: ['Student/Batch', 'Current Year', 'Next Status', 'Backlogs', 'Approval', 'Actions'],
      filters: ['Batch', 'Program', 'Backlogs', 'Promotion status'],
      special: ['Bulk promote class', 'Backlog handling', 'Alumni handoff'],
    },
  ],
  academics: [
    {
      id: 'programs',
      label: 'Programs & Courses',
      path: '/admin/academics/programs',
      purpose: 'Academic structure, programs, courses, subjects, syllabus, and outcome mapping.',
      operations: ['Create program', 'Create course/subject', 'Edit with dependency check', 'Upload syllabus', 'Map CO/PO/PSO'],
      columns: ['Code', 'Name', 'Department', 'Credits', 'Faculty', 'Syllabus', 'Status', 'Actions'],
      filters: ['Department', 'Level', 'Semester', 'Faculty', 'Status'],
      special: ['Versioned syllabus', 'Cannot delete enrolled course', 'NBA/NAAC outcome mapping'],
    },
    {
      id: 'timetable',
      label: 'Timetable',
      path: '/admin/academics/timetable',
      purpose: 'Drag-and-drop timetable with conflict detection and publishing.',
      operations: ['Create timetable', 'Drag course to slot', 'Check faculty/room/batch conflicts', 'View workload', 'Publish timetable', 'Assign substitution'],
      columns: ['Day', 'Period', 'Batch', 'Subject', 'Faculty', 'Room', 'Conflict'],
      filters: ['Program', 'Batch', 'Faculty', 'Room', 'Day'],
      special: ['Faculty conflict alerts', 'Room availability', 'Freeze after publish', 'Substitution notifications'],
    },
    {
      id: 'faculty',
      label: 'Faculty',
      path: '/admin/academics/faculty',
      purpose: 'Faculty profile, course assignment, workload, leave, and attendance.',
      operations: ['Add faculty', 'Assign courses', 'View workload calendar', 'Approve leave', 'Assign substitute', 'Faculty attendance report'],
      columns: ['Faculty', 'Department', 'Designation', 'Courses', 'Hours', 'Leave', 'Status'],
      filters: ['Department', 'Designation', 'Workload', 'Leave status'],
      special: ['Overload indicator', 'Schedule calendar', 'Substitute assignment'],
    },
    {
      id: 'examinations',
      label: 'Examinations',
      path: '/admin/academics/examinations',
      purpose: 'Exam schedule, invigilation, seating, marks entry, result publishing, and marksheet generation.',
      operations: ['Create exam schedule', 'Assign invigilators', 'Generate seating plan', 'Generate hall ticket', 'Marks entry', 'Process results', 'Handle revaluation', 'Publish results'],
      columns: ['Exam', 'Subject', 'Date', 'Invigilator', 'Marks Status', 'Result Status', 'Actions'],
      filters: ['Program', 'Semester', 'Subject', 'Result status'],
      special: ['QR hall ticket', 'Deadline lock', 'GPA/CGPA calculation', 'Marksheet PDF'],
    },
    {
      id: 'calendar',
      label: 'Academic Calendar',
      path: '/admin/academics/calendar',
      purpose: 'Academic year, working days, events, holidays, exams, and published calendar.',
      operations: ['Create event', 'Set academic year', 'Calculate working days', 'Publish calendar'],
      columns: ['Date', 'Event', 'Type', 'Audience', 'Published', 'Actions'],
      filters: ['Event type', 'Audience', 'Month', 'Published status'],
      special: ['Holiday exclusion', 'Student/faculty visibility', 'Fee due date links'],
    },
  ],
  fees: [
    {
      id: 'structure',
      label: 'Fee Structure',
      path: '/admin/fees/structure',
      purpose: 'Fee heads, amounts, installments, fine rules, concessions, and yearly cloning.',
      operations: ['Create fee head', 'Set fee amount', 'Create installment plan', 'Configure scholarship deduction', 'Set fine rules', 'Clone previous year'],
      columns: ['Program', 'Year', 'Tuition', 'Lab', 'Library', 'Transport', 'Hostel', 'Total', 'Actions'],
      filters: ['Program', 'Year', 'Fee head', 'Installment plan'],
      special: ['Expandable installment breakdown', 'Late fine rules', 'Previous year clone'],
    },
    {
      id: 'invoices',
      label: 'Invoices',
      path: '/admin/fees/invoices',
      purpose: 'Generate, send, cancel, and track student invoices.',
      operations: ['Generate invoice', 'Bulk generate for batch', 'Edit before payment', 'Cancel with reversal', 'Send invoice', 'Manage invoice templates'],
      columns: ['Invoice #', 'Student Name', 'Roll No', 'Amount', 'Due Date', 'Status', 'Actions'],
      filters: ['Program', 'Batch', 'Paid/unpaid/overdue', 'Due date'],
      special: ['College logo template', 'GSTIN/address header', 'Credit note after payment'],
    },
    {
      id: 'payments',
      label: 'Payments',
      path: '/admin/fees/payments',
      purpose: 'Record payments, reconcile online gateway, generate receipts, and produce daily collection reports.',
      operations: ['Record payment', 'Razorpay webhook update', 'Allow partial payment', 'Request late fee waiver', 'Generate receipt', 'Re-print duplicate receipt', 'Daily collection report'],
      columns: ['Receipt #', 'Student', 'Invoice', 'Amount', 'Mode', 'Transaction ID', 'Date', 'Received By'],
      filters: ['Payment mode', 'Date', 'Program', 'Receipt status'],
      special: ['Pending invoice auto-load', 'GST breakup', 'Duplicate receipt marking', 'EOD report'],
    },
    {
      id: 'refunds',
      label: 'Refunds',
      path: '/admin/fees/refunds',
      purpose: 'Refund request, approval chain, policy calculation, and processing.',
      operations: ['Initiate refund', 'Configure refund policy', 'Approve through chain', 'Process refund with UTR'],
      columns: ['Student', 'Reason', 'Eligible Amount', 'Requested', 'Status', 'UTR', 'Actions'],
      filters: ['Status', 'Reason', 'Program', 'Date range'],
      special: ['Policy percentage by date', 'Principal approval', 'Bank details'],
    },
    {
      id: 'gstin',
      label: 'GSTIN',
      path: '/admin/fees/gstin',
      purpose: 'GST setup, tax invoices, and GST-ready reports.',
      operations: ['Configure GSTIN', 'Set CGST/SGST/IGST per fee head', 'Generate GST reports', 'Generate tax invoice'],
      columns: ['Fee Head', 'HSN', 'CGST', 'SGST', 'IGST', 'Tax Collected'],
      filters: ['Fee head', 'Tax type', 'Date range'],
      special: ['GSTR-1', 'GSTR-3B', 'Tax breakup invoice'],
    },
    {
      id: 'wallets',
      label: 'Wallets',
      path: '/admin/fees/wallets',
      purpose: 'Student wallet credits, deductions, canteen/library fines, and bank refund.',
      operations: ['Top-up wallet', 'Deduct wallet', 'View transaction history', 'Refund wallet balance to bank'],
      columns: ['Student', 'Wallet Balance', 'Last Transaction', 'Credits', 'Debits', 'Actions'],
      filters: ['Program', 'Balance range', 'Transaction type'],
      special: ['Canteen deduction', 'Library fine deduction', 'Bank refund'],
    },
  ],
  erp: [
    { id: 'hostel', label: 'Hostel', path: '/admin/erp/hostel', purpose: 'Rooms, allocation, mess, visitors, complaints, curfew, and hostel fees.', operations: ['Create blocks/floors/rooms', 'Allocate room', 'Transfer room', 'Vacate room', 'Manage mess plan', 'Visitor log', 'Resolve complaints', 'Curfew settings'], columns: ['Block', 'Room', 'Capacity', 'Occupied', 'Student', 'Status', 'Actions'], filters: ['Block', 'Floor', 'Gender', 'Occupancy'], special: ['Occupancy grid', 'Damage inspection', 'Deposit refund', 'Curfew alert'] },
    { id: 'transport', label: 'Transport', path: '/admin/erp/transport', purpose: 'Routes, buses, drivers, allocation, transport fees, and boarding attendance.', operations: ['Create routes/stops', 'Manage buses', 'Assign students', 'Set route fee', 'Manage drivers', 'Track GPS placeholder', 'Boarding attendance'], columns: ['Route', 'Stop', 'Bus', 'Capacity', 'Driver', 'Allocated', 'Actions'], filters: ['Route', 'Stop', 'Capacity', 'Driver'], special: ['Capacity check', 'Fee auto-add', 'License/insurance expiry', 'QR boarding'] },
    { id: 'canteen', label: 'Canteen', path: '/admin/erp/canteen', purpose: 'Menu, orders, QR redemption, inventory, vendors, and sales reports.', operations: ['Manage menu', 'View orders', 'QR redemption', 'Track inventory', 'Vendor details', 'Sales report'], columns: ['Item', 'Price', 'Type', 'Orders', 'Stock', 'Status'], filters: ['Date', 'Veg/non-veg', 'Order status'], special: ['Wallet deduction', 'Peak hour report', 'Raw material tracking'] },
    { id: 'library', label: 'Library', path: '/admin/erp/library', purpose: 'Book catalog, issue, return, renewal, reservation, fines, and reports.', operations: ['Add books', 'Issue book', 'Return book', 'Renew due date', 'Reserve book', 'Fine rules', 'Mark lost book'], columns: ['ISBN', 'Title', 'Author', 'Rack', 'Copies', 'Available', 'Actions'], filters: ['Category', 'Rack', 'Availability', 'Defaulters'], special: ['Barcode scan', 'Overdue fine', 'Auto-notify reservation', 'Most borrowed report'] },
    { id: 'gate-pass', label: 'Gate Pass', path: '/admin/erp/gate-pass', purpose: 'Student out/home/visitor pass request, approval, QR generation, and gate verification.', operations: ['Configure pass types', 'Approve request', 'Generate QR', 'Scan at gate', 'Mark entry/exit', 'Curfew violation alert'], columns: ['Pass ID', 'Student/Visitor', 'Type', 'Expiry', 'Approver', 'Status', 'Actions'], filters: ['Pass type', 'Status', 'Date', 'Hostel'], special: ['Student photo at scan', 'Real-time movement log', 'Parent/warden/security flow'] },
    { id: 'events', label: 'Events', path: '/admin/erp/events', purpose: 'Event request, approval, registration, QR attendance, certificate, and budget tracking.', operations: ['Create event', 'Approval workflow', 'Open registration', 'QR attendance', 'Generate certificates', 'Track budget'], columns: ['Event', 'Date', 'Venue', 'Organizer', 'Budget', 'Registrations', 'Status'], filters: ['Date', 'Venue', 'Status', 'Organizer'], special: ['Student/club workflow', 'Certificate template', 'Estimated vs actual budget'] },
    { id: 'facilities', label: 'Facilities', path: '/admin/erp/facilities', purpose: 'Auditorium, hall, lab, sports ground, and room booking calendar.', operations: ['Book facility', 'Approve request', 'Conflict check', 'View/cancel bookings'], columns: ['Facility', 'Date', 'Slot', 'Requester', 'Purpose', 'Status'], filters: ['Facility', 'Date', 'Status'], special: ['Availability calendar', 'No double booking'] },
    { id: 'maintenance', label: 'Maintenance', path: '/admin/erp/maintenance', purpose: 'Maintenance tickets, technician assignment, SLA, resolution, and feedback.', operations: ['Raise ticket', 'Assign technician', 'Track status', 'SLA escalation', 'Collect feedback'], columns: ['Ticket', 'Category', 'Location', 'Assigned To', 'SLA', 'Status', 'Actions'], filters: ['Category', 'Location', 'Technician', 'Overdue'], special: ['Photo upload', 'Open to closed status flow', 'Requester rating'] },
  ],
  reports: [
    { id: 'admission-reports', label: 'Admission Reports', path: '/admin/reports/admissions', purpose: 'Funnel, source, counselor, enrollment, and seat occupancy analytics.', operations: ['Funnel analysis', 'Source-wise analysis', 'Counselor performance', 'Daily/monthly enrollment report', 'Seat occupancy report'], columns: ['Report', 'Date Range', 'Domain', 'Generated By', 'Status', 'Actions'], filters: ['Program', 'Source', 'Counselor', 'Date range'], special: ['Enquiry to admitted funnel', 'Cost per enrollment', 'Target vs actual'] },
    { id: 'academic-reports', label: 'Academic Reports', path: '/admin/reports/academics', purpose: 'Attendance, result, grade distribution, topper list, and faculty workload reports.', operations: ['Attendance report', 'Result analysis', 'Faculty workload', 'Substitution count'], columns: ['Report', 'Program', 'Batch', 'Generated On', 'Status'], filters: ['Program', 'Batch', 'Subject', 'Date range'], special: ['Pass percentage', 'Grade distribution', 'Shortage list'] },
    { id: 'financial-reports', label: 'Financial Reports', path: '/admin/reports/finance', purpose: 'Fee collection, outstanding, scholarships, GST, and payment reports.', operations: ['Fee collection report', 'Outstanding aging', 'Scholarship utilization', 'GST report'], columns: ['Report', 'Amount', 'Mode', 'Period', 'Status'], filters: ['Mode', 'Program', 'Aging', 'Date range'], special: ['0-30/31-60/60+ aging', 'GSTR-ready export'] },
    { id: 'custom-builder', label: 'Custom Builder', path: '/admin/reports/custom', purpose: 'Build custom reports from any source with filters, grouping, chart type, schedule, and export.', operations: ['Select data source', 'Select fields', 'Add filters', 'Add grouping', 'Choose table/chart/both', 'Schedule email', 'Export PDF/Excel/CSV'], columns: ['Field', 'Data Source', 'Filter', 'Grouping', 'Format'], filters: ['Data source', 'Date range', 'Program', 'Status'], special: ['Scheduled reports', 'Chart builder', 'Multi-format export'] },
  ],
};

const samplePeople = ['Rahul Kumar', 'Priya Sharma', 'Vikram Iyer', 'Sara Khan', 'Deepak Raja', 'Ananya Gupta'];
const samplePrograms = ['B.Tech CSE', 'B.Tech ECE', 'BCA', 'MBA', 'BBA', 'MCA'];
const sampleStatuses = ['New', 'Review', 'Approved', 'Pending', 'Live', 'Escalated'];

function sampleCellValue(column: string, index: number, section: NavSection, screen: AdminScreenSpec): string {
  const key = column.toLowerCase();
  if (key.includes('name') || key.includes('student') || key.includes('applicant') || key.includes('candidate')) return samplePeople[index % samplePeople.length];
  if (key.includes('phone')) return `+91-98765 43${210 + index}`;
  if (key.includes('program') || key.includes('course')) return samplePrograms[index % samplePrograms.length];
  if (key.includes('status')) return sampleStatuses[(index + screen.id.length) % sampleStatuses.length];
  if (key.includes('date')) return `${12 + index} Aug 2026`;
  if (key.includes('amount') || key.includes('budget') || key.includes('spent')) return `Rs. ${[24500, 82000, 15000, 5400, 120000, 36000][index % 6].toLocaleString('en-IN')}`;
  if (key.includes('source')) return ['Google', 'Facebook', 'Walk-in', 'Referral', 'Website', 'Event'][index % 6];
  if (key.includes('assigned') || key.includes('reviewer') || key.includes('counselor')) return ['Priya', 'Arjun', 'Divya', 'Rahul'][index % 4];
  if (key.includes('priority')) return ['Hot', 'Warm', 'Cold'][index % 3];
  if (key.includes('actions')) return 'Open';
  if (key.includes('select')) return `${index + 1}`;
  if (key.includes('id') || key.includes('#')) return `${section.toUpperCase().slice(0, 3)}-${screen.id.slice(0, 3).toUpperCase()}-${1000 + index}`;
  return [`${column} ${index + 1}`, 'Verified', 'Assigned', 'Scheduled', 'Generated', 'Ready'][index % 6];
}

function buildAdminRecords(section: NavSection, screen: AdminScreenSpec): AdminRecord[] {
  const columns = (screen.columns?.length ? screen.columns : ['Record', 'Status', 'Owner', 'Actions']).slice(0, 7);
  return Array.from({ length: 6 }).map((_, index) => Object.fromEntries(columns.map((column) => [column, sampleCellValue(column, index, section, screen)])));
}

const CRUD_ACTIONS = [
  { id: 'create', label: 'C' },
  { id: 'read', label: 'R' },
  { id: 'update', label: 'U' },
  { id: 'delete', label: 'D' },
] as const;
type CrudAction = (typeof CRUD_ACTIONS)[number]['id'];
const permissionKeyFor = (moduleId: string, feature: string, action: CrudAction) => `${moduleId}:${feature}:${action}`;
const featurePermissionKeys = (moduleId: string, feature: string) => CRUD_ACTIONS.map((action) => permissionKeyFor(moduleId, feature, action.id));
const modulePermissionKeys = (module: OperationModule) => module.features.flatMap((feature) => featurePermissionKeys(module.id, feature));
const ALL_PERMISSION_KEYS = OPERATION_MODULES.flatMap(modulePermissionKeys);
const DEFAULT_ROLE_ACCESS: Record<string, string[]> = Object.fromEntries(
  COLLEGE_ROLES.map((role) => {
    const moduleIds = role.moduleIds as readonly string[];
    return [
      role.id,
      moduleIds.includes('*')
        ? ALL_PERMISSION_KEYS
        : OPERATION_MODULES.flatMap((module) => moduleIds.includes(module.id) ? modulePermissionKeys(module) : []),
    ];
  })
);
const EMPTY_PERMISSION_KEYS: string[] = [];

const FORM_BUILDERS: FormBuilder[] = [
  { id: 'lead-capture', name: 'Lead Capture Form', module: 'CRM', fields: 14, status: 'Live', owner: 'Marketing', usage: 'Website, walk-in desk, campaign landing pages' },
  { id: 'application', name: 'Application Form', module: 'Admissions', fields: 32, status: 'Draft', owner: 'Admissions', usage: 'Student admission applications and document intake' },
  { id: 'fee-concession', name: 'Fee Concession Request', module: 'Fee Management', fields: 12, status: 'Review', owner: 'Finance', usage: 'Scholarships, discounts, installment approvals' },
  { id: 'hostel-leave', name: 'Hostel Leave Form', module: 'ERP', fields: 9, status: 'Live', owner: 'Student Affairs', usage: 'Student app leave and gate pass approvals' },
  { id: 'staff-onboarding', name: 'Staff Onboarding Form', module: 'ERP', fields: 18, status: 'Draft', owner: 'Admin', usage: 'HR profile, access, documents, device issue' },
];

const FIELD_PALETTE: FieldPaletteItem[] = [
  { id: 'short-text', label: 'Short text', type: 'Short text', icon: FileText },
  { id: 'long-text', label: 'Long text', type: 'Paragraph', icon: FileText },
  { id: 'email', label: 'Email', type: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', type: 'Phone', icon: Smartphone },
  { id: 'number', label: 'Number', type: 'Number', icon: Database },
  { id: 'currency', label: 'Currency', type: 'Currency', icon: Database },
  { id: 'date', label: 'Date', type: 'Date', icon: CalendarDays },
  { id: 'date-time', label: 'Date time', type: 'Date time', icon: Clock },
  { id: 'dropdown', label: 'Dropdown', type: 'Dropdown', icon: ListChecks },
  { id: 'multi-select', label: 'Multi select', type: 'Multi select', icon: ListChecks },
  { id: 'checkbox', label: 'Checkbox', type: 'Checkbox', icon: CheckCircle2 },
  { id: 'radio', label: 'Radio group', type: 'Radio group', icon: Target },
  { id: 'file-upload', label: 'File upload', type: 'Upload', icon: ClipboardList },
  { id: 'photo-upload', label: 'Photo upload', type: 'Image upload', icon: ClipboardList },
  { id: 'signature', label: 'Signature', type: 'Signature', icon: Pencil },
  { id: 'payment', label: 'Payment', type: 'Payment', icon: Database },
  { id: 'approval', label: 'Approval', type: 'Approval', icon: ShieldCheck },
  { id: 'lookup', label: 'Student lookup', type: 'Lookup', icon: Search },
  { id: 'staff-lookup', label: 'Staff lookup', type: 'Lookup', icon: Users },
  { id: 'course-picker', label: 'Course picker', type: 'Dropdown', icon: Layers },
  { id: 'campus-picker', label: 'Campus picker', type: 'Dropdown', icon: LayoutDashboard },
  { id: 'address', label: 'Address block', type: 'Address', icon: FileText },
  { id: 'guardian', label: 'Guardian block', type: 'Guardian details', icon: UserCog },
  { id: 'education', label: 'Education block', type: 'Education details', icon: ClipboardList },
  { id: 'marks', label: 'Marks table', type: 'Table', icon: BarChart3 },
  { id: 'hidden', label: 'Hidden field', type: 'Hidden field', icon: Database },
  { id: 'automation', label: 'Automation', type: 'Automation', icon: SlidersHorizontal },
  { id: 'consent', label: 'Consent', type: 'Consent', icon: ShieldCheck },
  { id: 'section', label: 'Section heading', type: 'Section heading', icon: Layers },
  { id: 'divider', label: 'Divider', type: 'Divider', icon: Layers },
];

const FORM_SCHEMAS: Record<string, FormSchemaSection[]> = {
  'lead-capture': [
    { section: 'Student profile', fields: [
      { label: 'Student name', type: 'Short text', required: true, width: 'half' },
      { label: 'Mobile number', type: 'Phone', required: true, width: 'half' },
      { label: 'Email address', type: 'Email', required: true, width: 'half' },
      { label: 'City', type: 'Short text', width: 'half' },
    ] },
    { section: 'Admission interest', fields: [
      { label: 'Course interested', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Preferred intake', type: 'Dropdown', width: 'half' },
      { label: 'Lead source', type: 'Hidden field', width: 'half' },
      { label: 'Counselor assignment rule', type: 'Automation', width: 'half' },
    ] },
  ],
  application: [
    { section: 'Application details', fields: [
      { label: 'Applicant full name', type: 'Short text', required: true, width: 'half' },
      { label: 'Date of birth', type: 'Date', required: true, width: 'half' },
      { label: 'Program choice', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Board / university', type: 'Short text', width: 'half' },
    ] },
    { section: 'Documents', fields: [
      { label: '10th marksheet', type: 'Upload', required: true, width: 'half' },
      { label: '12th marksheet', type: 'Upload', required: true, width: 'half' },
      { label: 'Identity proof', type: 'Upload', required: true, width: 'half' },
      { label: 'Application fee', type: 'Payment', width: 'half' },
    ] },
  ],
  'fee-concession': [
    { section: 'Request', fields: [
      { label: 'Student ID', type: 'Lookup', required: true, width: 'half' },
      { label: 'Concession category', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Requested amount', type: 'Currency', required: true, width: 'half' },
      { label: 'Supporting document', type: 'Upload', width: 'half' },
    ] },
    { section: 'Approval chain', fields: [
      { label: 'Finance review', type: 'Approval', required: true, width: 'full' },
      { label: 'Principal approval', type: 'Approval', required: true, width: 'full' },
    ] },
  ],
  'hostel-leave': [
    { section: 'Leave request', fields: [
      { label: 'Student lookup', type: 'Lookup', required: true, width: 'half' },
      { label: 'Leave type', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Exit date and time', type: 'Date time', required: true, width: 'half' },
      { label: 'Return date and time', type: 'Date time', required: true, width: 'half' },
      { label: 'Parent consent', type: 'Checkbox', width: 'full' },
    ] },
  ],
  'staff-onboarding': [
    { section: 'Staff profile', fields: [
      { label: 'Staff name', type: 'Short text', required: true, width: 'half' },
      { label: 'Department', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Role', type: 'Dropdown', required: true, width: 'half' },
      { label: 'Access package', type: 'Permission set', required: true, width: 'half' },
    ] },
    { section: 'Assets and documents', fields: [
      { label: 'ID proof', type: 'Upload', width: 'half' },
      { label: 'Device issue checklist', type: 'Checklist', width: 'half' },
    ] },
  ],
};

const WIDGET_LIBRARY = [
  { id: 'admission-funnel', title: 'Admissions Funnel', type: 'Chart', target: 'Admin dashboard', size: 'Large' },
  { id: 'fee-health', title: 'Fee Health', type: 'Counter', target: 'Finance dashboard', size: 'Small' },
  { id: 'approval-queue', title: 'Approval Queue', type: 'Queue', target: 'Admin dashboard', size: 'Medium' },
  { id: 'student-attendance', title: 'Attendance Risk', type: 'Alert', target: 'Student dashboard', size: 'Small' },
  { id: 'doc-verification', title: 'Document Verification', type: 'Checklist', target: 'CRM pipeline', size: 'Medium' },
  { id: 'erp-sync', title: 'ERP Sync Monitor', type: 'Status', target: 'Operations', size: 'Small' },
];

const WIDGET_LAYOUT = [
  { id: 'admission-funnel', title: 'Admissions Funnel', value: '68%', detail: 'Lead to application conversion', x: 0, y: 0, w: 430, h: 160 },
  { id: 'approval-queue', title: 'Pending Approvals', value: '24', detail: 'Across fees, leave, documents', x: 450, y: 0, w: 210, h: 160 },
  { id: 'fee-health', title: 'Fee Health', value: '91%', detail: 'Collection this month', x: 680, y: 0, w: 210, h: 160 },
  { id: 'doc-verification', title: 'Document Queue', value: '37', detail: 'Waiting for verification', x: 0, y: 180, w: 430, h: 160 },
];

type CanvasWidget = (typeof WIDGET_LAYOUT)[number] & { instanceId: string };
type WidgetInteraction = {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  widget: CanvasWidget;
  canvasWidth: number;
  canvasHeight: number;
};

const WIDGET_GAP = 20;
const WIDGET_MIN_WIDTH = 180;
const WIDGET_MIN_HEIGHT = 120;

const widgetsOverlap = (first: CanvasWidget, second: CanvasWidget) => (
  first.x < second.x + second.w + WIDGET_GAP
  && first.x + first.w + WIDGET_GAP > second.x
  && first.y < second.y + second.h + WIDGET_GAP
  && first.y + first.h + WIDGET_GAP > second.y
);

const rangesOverlap = (firstStart: number, firstSize: number, secondStart: number, secondSize: number) => (
  firstStart < secondStart + secondSize + WIDGET_GAP
  && firstStart + firstSize + WIDGET_GAP > secondStart
);

const constrainWidget = (widget: CanvasWidget, canvasWidth: number): CanvasWidget => ({
  ...widget,
  x: Math.max(0, Math.min(Math.max(0, canvasWidth - widget.w), widget.x)),
  y: Math.max(0, widget.y),
  w: Math.max(WIDGET_MIN_WIDTH, Math.min(canvasWidth, widget.w)),
  h: Math.max(WIDGET_MIN_HEIGHT, widget.h),
});

const packCanvasWidgets = (widgets: CanvasWidget[], canvasWidth: number, priorityId?: string) => {
  const priority = priorityId ? widgets.find((widget) => widget.instanceId === priorityId) : null;
  const ordered = [
    ...(priority ? [priority] : []),
    ...widgets
      .filter((widget) => widget.instanceId !== priorityId)
      .sort((first, second) => first.y - second.y || first.x - second.x),
  ];
  const placed: CanvasWidget[] = [];

  ordered.forEach((rawWidget) => {
    let widget = constrainWidget(rawWidget, canvasWidth);
    let guard = 0;
    while (placed.some((placedWidget) => widgetsOverlap(widget, placedWidget)) && guard < 80) {
      const blockingWidget = placed.find((placedWidget) => widgetsOverlap(widget, placedWidget));
      widget = { ...widget, y: (blockingWidget?.y ?? widget.y) + (blockingWidget?.h ?? 0) + WIDGET_GAP };
      guard += 1;
    }
    placed.push(widget);
  });

  return widgets.map((widget) => placed.find((placedWidget) => placedWidget.instanceId === widget.instanceId) ?? widget);
};

const resolveWidgetMove = (
  currentWidget: CanvasWidget,
  targetWidget: CanvasWidget,
  blockers: CanvasWidget[],
  canvasWidth: number,
) => {
  let next = constrainWidget(targetWidget, canvasWidth);
  const movingRight = next.x > currentWidget.x;
  const movingLeft = next.x < currentWidget.x;

  if (movingRight || movingLeft) {
    blockers.forEach((blocker) => {
      if (!rangesOverlap(currentWidget.y, currentWidget.h, blocker.y, blocker.h)) return;
      if (movingRight && currentWidget.x + currentWidget.w + WIDGET_GAP <= blocker.x && next.x + next.w + WIDGET_GAP > blocker.x) {
        next = { ...next, x: Math.min(next.x, blocker.x - currentWidget.w - WIDGET_GAP) };
      }
      if (movingLeft && currentWidget.x >= blocker.x + blocker.w + WIDGET_GAP && next.x < blocker.x + blocker.w + WIDGET_GAP) {
        next = { ...next, x: Math.max(next.x, blocker.x + blocker.w + WIDGET_GAP) };
      }
    });
  }

  next = constrainWidget(next, canvasWidth);
  const movingDown = next.y > currentWidget.y;
  const movingUp = next.y < currentWidget.y;

  if (movingDown || movingUp) {
    blockers.forEach((blocker) => {
      if (!rangesOverlap(next.x, next.w, blocker.x, blocker.w)) return;
      if (movingDown && currentWidget.y + currentWidget.h + WIDGET_GAP <= blocker.y && next.y + next.h + WIDGET_GAP > blocker.y) {
        next = { ...next, y: Math.min(next.y, blocker.y - currentWidget.h - WIDGET_GAP) };
      }
      if (movingUp && currentWidget.y >= blocker.y + blocker.h + WIDGET_GAP && next.y < blocker.y + blocker.h + WIDGET_GAP) {
        next = { ...next, y: Math.max(next.y, blocker.y + blocker.h + WIDGET_GAP) };
      }
    });
  }

  next = constrainWidget(next, canvasWidth);
  return blockers.some((blocker) => widgetsOverlap(next, blocker)) ? currentWidget : next;
};

const THEMES: Record<ThemeId, Record<string, string>> = {
  classic: {
    '--crm-bg': '#f7f4ef',
    '--crm-surface': '#fffaf4',
    '--crm-panel': '#f1ece7',
    '--crm-card': '#ffffff',
    '--crm-text': '#161318',
    '--crm-muted': '#6f6875',
    '--crm-border': '#e7ded8',
  },
  ocean: {
    '--crm-bg': '#eef6ff',
    '--crm-surface': '#f8fbff',
    '--crm-panel': '#e4eefb',
    '--crm-card': '#ffffff',
    '--crm-text': '#102033',
    '--crm-muted': '#5f7086',
    '--crm-border': '#cfdeef',
  },
  emerald: {
    '--crm-bg': '#effaf5',
    '--crm-surface': '#fbfffd',
    '--crm-panel': '#def5e9',
    '--crm-card': '#ffffff',
    '--crm-text': '#0f2b1e',
    '--crm-muted': '#5b7669',
    '--crm-border': '#c6ead7',
  },
  midnight: {
    '--crm-bg': '#090914',
    '--crm-surface': '#111122',
    '--crm-panel': '#18182c',
    '--crm-card': '#1f1f35',
    '--crm-text': '#f7f3ff',
    '--crm-muted': '#b9b2ce',
    '--crm-border': 'rgba(255,255,255,0.1)',
  },
};

export default function AdmissionsPage() {
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [roleId] = useState('principal');
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [theme, setTheme] = useState<ThemeId>('classic');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('access');
  const [formBuilders, setFormBuilders] = useState<FormBuilder[]>(() => FORM_BUILDERS);
  const [formSchemas, setFormSchemas] = useState<Record<string, FormSchemaSection[]>>(() => cloneFormSchemas());
  const [selectedFormId, setSelectedFormId] = useState(FORM_BUILDERS[0].id);
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FieldDraft | null>(null);
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [collegeRoles, setCollegeRoles] = useState<CollegeRole[]>(() => COLLEGE_ROLES.map((role) => ({ ...role, moduleIds: [...role.moduleIds] })));
  const [operationModules, setOperationModules] = useState<OperationModule[]>(() => OPERATION_MODULES.map((module) => ({ ...module, features: [...module.features] })));
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => STAFF_USERS);
  const [selectedAccessRoleId, setSelectedAccessRoleId] = useState<string>(COLLEGE_ROLES[0].id);
  const [selectedAccessModuleId, setSelectedAccessModuleId] = useState<string>(OPERATION_MODULES[0].id);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleAccess, setRoleAccess] = useState<Record<string, string[]>>(() => DEFAULT_ROLE_ACCESS);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleTeam, setNewRoleTeam] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [featureModuleId, setFeatureModuleId] = useState(OPERATION_MODULES[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tenantBrand, setTenantBrand] = useState<TenantBrand>(DEFAULT_TENANT_BRAND);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accessModal, setAccessModal] = useState<AccessModal>(null);
  const [activeScreenByNav, setActiveScreenByNav] = useState<Record<string, string>>({});
  const [selectedRecordByScreen, setSelectedRecordByScreen] = useState<Record<string, number>>({});
  const [completedActions, setCompletedActions] = useState<Record<string, string[]>>({});
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [operationModal, setOperationModal] = useState<OperationModal>(null);
  const [userAccess] = useState(() => Object.fromEntries(STAFF_USERS.map((user) => [user.id, user.access])));
  const customRoleCounter = useRef(1);
  const customUserCounter = useRef(1);
  const customModuleCounter = useRef(1);
  const widgetCanvasRef = useRef<HTMLDivElement | null>(null);
  const widgetInteraction = useRef<WidgetInteraction | null>(null);
  const [canvasWidgets, setCanvasWidgets] = useState<CanvasWidget[]>(() => WIDGET_LAYOUT.map((widget) => ({ ...widget, instanceId: widget.id })));
  const [activeCanvasWidgetId, setActiveCanvasWidgetId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const brand = readTenantBrand();
      setTenantBrand(brand);
      applyTenantBrand(brand);
    });
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const applyTheme = useCallback((nextTheme: ThemeId) => {
    setTheme(nextTheme);
    const root = document.documentElement;
    Object.entries(THEMES[nextTheme]).forEach(([key, value]) => root.style.setProperty(key, value));
  }, []);

  const toggleDarkTheme = useCallback(() => {
    applyTheme(theme === 'midnight' ? 'classic' : 'midnight');
  }, [applyTheme, theme]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const saveTenantBrand = useCallback((brand: TenantBrand) => {
    setTenantBrand(brand);
    applyTenantBrand(brand);
    try { window.localStorage.setItem('supercampus:tenant-brand', JSON.stringify(brand)); } catch {}
    showToast('Tenant dashboard colors synced from logo');
  }, [showToast]);

  const handleTenantLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Upload an image logo');
      return;
    }
    const logoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const palette = await extractLogoPalette(logoDataUrl);
    saveTenantBrand({ logoDataUrl, ...palette });
  }, [saveTenantBrand, showToast]);

  const resetTenantBrand = useCallback(() => {
    saveTenantBrand(DEFAULT_TENANT_BRAND);
  }, [saveTenantBrand]);

  const updateSelectedFormSchema = useCallback((updater: (schema: FormSchemaSection[]) => FormSchemaSection[]) => {
    setFormSchemas((current) => {
      const currentSchema = current[selectedFormId] ?? [{ section: 'New section', fields: [] }];
      const nextSchema = updater(currentSchema);
      setFormBuilders((builders) => builders.map((form) => (
        form.id === selectedFormId ? { ...form, fields: countSchemaFields(nextSchema) } : form
      )));
      return { ...current, [selectedFormId]: nextSchema };
    });
  }, [selectedFormId]);

  const openCreateForm = useCallback(() => {
    const id = `custom-form-${Date.now()}`;
    setSelectedFormId(id);
    setSelectedFieldKey(null);
    setFormSchemas((current) => ({ ...current, [id]: [{ section: 'Primary details', fields: [] }] }));
    setFormDraft({
      id,
      name: 'Untitled Form',
      module: 'Admissions',
      status: 'Draft',
      owner: 'Admin',
      usage: 'Describe where this form will be used',
    });
  }, []);

  const openEditForm = useCallback((form: FormBuilder) => {
    setSelectedFormId(form.id);
    setSelectedFieldKey(null);
    setFormDraft({
      id: form.id,
      name: form.name,
      module: form.module,
      status: form.status,
      owner: form.owner,
      usage: form.usage,
    });
  }, []);

  const saveFormDraft = useCallback(() => {
    if (!formDraft) return;
    const cleanName = formDraft.name.trim() || 'Untitled Form';
    const cleanId = formBuilders.some((form) => form.id === formDraft.id) ? formDraft.id : slugify(cleanName);
    const schema = formSchemas[formDraft.id] ?? [{ section: 'Primary details', fields: [] }];
    const nextForm: FormBuilder = {
      ...formDraft,
      id: cleanId,
      name: cleanName,
      module: formDraft.module.trim() || 'Admissions',
      status: formDraft.status.trim() || 'Draft',
      owner: formDraft.owner.trim() || 'Admin',
      usage: formDraft.usage.trim() || 'Internal college workflow',
      fields: countSchemaFields(schema),
    };
    setFormBuilders((current) => {
      const exists = current.some((form) => form.id === formDraft.id);
      return exists ? current.map((form) => (form.id === formDraft.id ? nextForm : form)) : [nextForm, ...current];
    });
    setFormSchemas((current) => {
      const next = { ...current, [cleanId]: current[formDraft.id] ?? schema };
      if (cleanId !== formDraft.id) delete next[formDraft.id];
      return next;
    });
    setSelectedFormId(cleanId);
    setSelectedFieldKey(null);
    setFormDraft(null);
    showToast('Form builder saved');
  }, [formBuilders, formDraft, formSchemas, showToast]);

  const addFieldToSelectedForm = useCallback((field: FieldPaletteItem, targetFormId = formDraft?.id ?? selectedFormId) => {
    setFormSchemas((current) => {
      const currentSchema = current[targetFormId] ?? [{ section: 'Primary details', fields: [] }];
      const next = currentSchema.length ? currentSchema.map((section) => ({ ...section, fields: [...section.fields] })) : [{ section: 'Primary details', fields: [] }];
      const targetSectionIndex = next.length - 1;
      const nextField: FormField = {
        label: field.label,
        type: field.type,
        required: false,
        width: field.type.includes('block') || field.type === 'Table' || field.type === 'Approval' ? 'full' : 'half',
      };
      next[targetSectionIndex] = {
        ...next[targetSectionIndex],
        fields: [...next[targetSectionIndex].fields, nextField],
      };
      setSelectedFieldKey(`${targetSectionIndex}:${next[targetSectionIndex].fields.length - 1}`);
      setFormBuilders((builders) => builders.map((form) => (
        form.id === targetFormId ? { ...form, fields: countSchemaFields(next) } : form
      )));
      return { ...current, [targetFormId]: next };
    });
    setSelectedFormId(targetFormId);
    showToast('Field added');
  }, [formDraft?.id, selectedFormId, showToast]);

  const openFieldEditor = useCallback((fieldKey: string, field: FormField) => {
    setSelectedFieldKey(fieldKey);
    setFieldDraft({ key: fieldKey, field: { ...field } });
  }, []);

  const saveFieldDraft = useCallback(() => {
    if (!fieldDraft) return;
    const [sectionIndex, fieldIndex] = fieldDraft.key.split(':').map(Number);
    updateSelectedFormSchema((schema) => schema.map((section, currentSectionIndex) => (
      currentSectionIndex !== sectionIndex
        ? section
        : {
            ...section,
            fields: section.fields.map((field, currentFieldIndex) => (
              currentFieldIndex === fieldIndex ? fieldDraft.field : field
            )),
          }
    )));
    setSelectedFieldKey(fieldDraft.key);
    setFieldDraft(null);
    showToast('Field settings saved');
  }, [fieldDraft, showToast, updateSelectedFormSchema]);

  const removeSelectedField = useCallback(() => {
    if (!selectedFieldKey) return;
    const [sectionIndex, fieldIndex] = selectedFieldKey.split(':').map(Number);
    updateSelectedFormSchema((schema) => schema.map((section, currentSectionIndex) => (
      currentSectionIndex !== sectionIndex
        ? section
        : { ...section, fields: section.fields.filter((_, currentFieldIndex) => currentFieldIndex !== fieldIndex) }
    )));
    setSelectedFieldKey(null);
    setFieldDraft(null);
  }, [selectedFieldKey, updateSelectedFormSchema]);

  const handlePaletteFieldDragStart = useCallback((event: React.DragEvent, fieldId: string) => {
    event.dataTransfer.setData('application/x-supercampus-form-field', fieldId);
    event.dataTransfer.setData('text/plain', fieldId);
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFormPreviewDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const fieldId = event.dataTransfer.getData('application/x-supercampus-form-field') || event.dataTransfer.getData('text/plain');
    const field = FIELD_PALETTE.find((item) => item.id === fieldId);
    if (field) addFieldToSelectedForm(field, formDraft?.id ?? selectedFormId);
  }, [addFieldToSelectedForm, formDraft?.id, selectedFormId]);

  const addWidgetToCanvas = useCallback((libraryId: string, dropX?: number, dropY?: number) => {
    const source = WIDGET_LIBRARY.find((widget) => widget.id === libraryId);
    if (!source) return;
    const defaultValues: Record<string, { value: string; detail: string; w: number; h: number }> = {
      'admission-funnel': { value: '68%', detail: 'Lead to application conversion', w: 340, h: 170 },
      'fee-health': { value: '91%', detail: 'Collection this month', w: 230, h: 160 },
      'approval-queue': { value: '24', detail: 'Across fees, leave, documents', w: 240, h: 170 },
      'student-attendance': { value: '63%', detail: 'Students under attendance threshold', w: 240, h: 170 },
      'doc-verification': { value: '37', detail: 'Waiting for verification', w: 340, h: 170 },
      'erp-sync': { value: 'Live', detail: 'ERP sync monitor', w: 220, h: 130 },
    };
    const values = defaultValues[source.id] ?? { value: source.type, detail: source.target, w: 240, h: 150 };
    const canvasRect = widgetCanvasRef.current?.getBoundingClientRect();
    const x = Math.max(0, Math.min((canvasRect?.width ?? 900) - values.w, dropX ?? 24));
    const y = Math.max(0, Math.min((canvasRect?.height ?? 540) - values.h, dropY ?? 360));
    const next: CanvasWidget = {
      id: source.id,
      instanceId: `${source.id}-${Date.now()}`,
      title: source.title,
      value: values.value,
      detail: values.detail,
      x,
      y,
      w: values.w,
      h: values.h,
    };
    setCanvasWidgets((current) => packCanvasWidgets([...current, next], canvasRect?.width ?? 900, next.instanceId));
    setActiveCanvasWidgetId(next.instanceId);
  }, []);

  const handleWidgetCanvasDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const widgetId = event.dataTransfer.getData('application/x-supercampus-widget');
    if (!widgetId || !widgetCanvasRef.current) return;
    const rect = widgetCanvasRef.current.getBoundingClientRect();
    const x = Math.max(0, event.clientX - rect.left - 80);
    const y = Math.max(0, event.clientY - rect.top - 34);
    addWidgetToCanvas(widgetId, x, y);
  }, [addWidgetToCanvas]);

  const beginWidgetInteraction = useCallback((event: React.PointerEvent, widget: CanvasWidget, mode: 'move' | 'resize') => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = widgetCanvasRef.current?.getBoundingClientRect();
    widgetInteraction.current = {
      id: widget.instanceId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      widget,
      canvasWidth: rect?.width ?? 900,
      canvasHeight: rect?.height ?? 540,
    };
    setActiveCanvasWidgetId(widget.instanceId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' || !selectedFieldKey || fieldDraft || formDraft) return;
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable;
      if (isTyping) return;
      event.preventDefault();
      removeSelectedField();
      showToast('Field deleted');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fieldDraft, formDraft, removeSelectedField, selectedFieldKey, showToast]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = widgetInteraction.current;
      if (!interaction || !widgetCanvasRef.current) return;
      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;
      setCanvasWidgets((current) => {
        const activeWidget = current.find((widget) => widget.instanceId === interaction.id);
        if (!activeWidget) return current;
        if (interaction.mode === 'resize') {
          const w = Math.max(WIDGET_MIN_WIDTH, Math.min(interaction.canvasWidth - activeWidget.x, interaction.widget.w + dx));
          const h = Math.max(WIDGET_MIN_HEIGHT, interaction.widget.h + dy);
          return packCanvasWidgets(current.map((widget) => (
            widget.instanceId === interaction.id ? { ...widget, w, h } : widget
          )), interaction.canvasWidth, interaction.id);
        }
        const candidate = {
          ...activeWidget,
          x: Math.max(0, Math.min(interaction.canvasWidth - activeWidget.w, interaction.widget.x + dx)),
          y: Math.max(0, interaction.widget.y + dy),
        };
        const blockers = current.filter((widget) => widget.instanceId !== interaction.id);
        const resolved = resolveWidgetMove(activeWidget, candidate, blockers, interaction.canvasWidth);
        return current.map((widget) => (widget.instanceId === interaction.id ? resolved : widget));
      });
    };
    const handlePointerUp = () => {
      widgetInteraction.current = null;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.assign('/');
    }
  }, []);

  const toggleRolePermission = (roleId: string, permissionKey: string) => {
    setRoleAccess((prev) => {
      const current = prev[roleId] ?? [];
      const next = current.includes(permissionKey)
        ? current.filter((item) => item !== permissionKey)
        : [...current, permissionKey];
      return { ...prev, [roleId]: next };
    });
  };

  const toggleRoleModule = (roleId: string, moduleId: string) => {
    const moduleConfig = operationModules.find((module) => module.id === moduleId);
    if (!moduleConfig) return;
    const moduleKeys = modulePermissionKeys(moduleConfig);
    setRoleAccess((prev) => {
      const current = prev[roleId] ?? [];
      const moduleFullyEnabled = moduleKeys.every((key) => current.includes(key));
      const next = moduleFullyEnabled
        ? current.filter((key) => !moduleKeys.includes(key))
        : Array.from(new Set([...current, ...moduleKeys]));
      return { ...prev, [roleId]: next };
    });
  };

  const addCollegeRole = () => {
    const name = newRoleName.trim();
    if (!name) return;
    const idBase = slugify(name);
    const id = collegeRoles.some((role) => role.id === idBase) ? `${idBase}-${customRoleCounter.current++}` : idBase;
    const role: CollegeRole = {
      id,
      name,
      team: newRoleTeam.trim() || 'Custom',
      scope: 'Custom role managed by admin',
      moduleIds: [],
    };
    setCollegeRoles((prev) => [...prev, role]);
    setRoleAccess((prev) => ({ ...prev, [id]: [] }));
    setSelectedAccessRoleId(id);
    setNewRoleName('');
    setNewRoleTeam('');
    showToast(`Role added: ${name}`);
  };

  const addUserUnderRole = () => {
    const name = newUserName.trim();
    const email = newUserEmail.trim();
    if (!name || !email) return;
    const user: StaffUser = {
      id: `u-custom-${customUserCounter.current++}`,
      name,
      email,
      initials: initialsFromName(name),
      role: selectedAccessRole.name,
      roleId: selectedAccessRole.id,
      team: selectedAccessRole.team,
      access: [],
    };
    setStaffUsers((prev) => [user, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    showToast(`${name} added under ${selectedAccessRole.name}`);
  };

  const addOperationModule = () => {
    const name = newModuleName.trim();
    if (!name) return;
    const idBase = slugify(name);
    const id = operationModules.some((module) => module.id === idBase) ? `${idBase}-${customModuleCounter.current++}` : idBase;
    setOperationModules((prev) => [...prev, { id, name, features: [] }]);
    setFeatureModuleId(id);
    setSelectedAccessModuleId(id);
    setNewModuleName('');
    showToast(`Module added: ${name}`);
  };

  const addFeatureToModule = () => {
    const feature = newFeatureName.trim();
    if (!feature) return;
    setOperationModules((prev) =>
      prev.map((module) =>
        module.id === featureModuleId && !module.features.includes(feature)
          ? { ...module, features: [...module.features, feature] }
          : module
      )
    );
    setNewFeatureName('');
    showToast(`Feature added: ${feature}`);
  };

  const totalOfferAccepted = leads.filter((lead) => lead.offerDecision === 'accepted').length;
  const activeApplications = leads.filter((lead) => lead.status === 'application' || lead.status === 'application-status').length;
  const dashboardStats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: 'Total Leads', value: leads.length, icon: BarChart3 },
    { label: 'Applications', value: activeApplications, icon: FileText },
    { label: 'Offer Accepted', value: totalOfferAccepted, icon: ShieldCheck },
    { label: 'Team Users', value: staffUsers.length, icon: UserCog },
  ];
  const pipelineSummary = COLUMNS.filter((column) => column.id !== 'archived').map((column) => {
    const count = leads.filter((lead) => lead.status === column.id).length;
    const percent = leads.length ? Math.round((count / leads.length) * 100) : 0;
    return { ...column, count, percent };
  });
  const maxStageCount = Math.max(...pipelineSummary.map((stage) => stage.count), 1);
  const sourceSummary = Object.entries(
    leads.reduce<Record<string, number>>((summary, lead) => {
      summary[lead.source] = (summary[lead.source] ?? 0) + 1;
      return summary;
    }, {})
  )
    .map(([source, count]) => ({ source, count, percent: leads.length ? Math.round((count / leads.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const counselorSummary = Object.entries(
    leads.reduce<Record<string, { total: number; hot: number; documents: number }>>((summary, lead) => {
      const owner = lead.assignedTo.name;
      const current = summary[owner] ?? { total: 0, hot: 0, documents: 0 };
      current.total += 1;
      if (lead.status === 'qualified' || lead.status === 'application' || lead.status === 'offer-status') current.hot += 1;
      current.documents += lead.documents.uploaded;
      summary[owner] = current;
      return summary;
    }, {})
  )
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
  const upcomingFollowUps = leads
    .filter((lead) => lead.nextFollowUp)
    .sort((a, b) => new Date(a.nextFollowUp ?? '').getTime() - new Date(b.nextFollowUp ?? '').getTime())
    .slice(0, 4);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crm' as const, label: 'CRM', icon: Target },
    { id: 'pipeline' as const, label: 'Pipeline', icon: Kanban },
    { id: 'admissions' as const, label: 'Admissions', icon: ClipboardList },
    { id: 'students' as const, label: 'Students', icon: Users },
    { id: 'academics' as const, label: 'Academics', icon: ListChecks },
    { id: 'fees' as const, label: 'Fees & Finance', icon: Database },
    { id: 'erp' as const, label: 'ERP Services', icon: Layers },
    { id: 'reports' as const, label: 'Reports & BI', icon: BarChart3 },
    { id: 'users' as const, label: 'Users & Roles', icon: UserCog },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];
  const settingsTabs = [
    { id: 'access' as const, label: 'Access Control', icon: ShieldCheck },
    { id: 'forms' as const, label: 'Form Builders', icon: ClipboardList },
    { id: 'workflows' as const, label: 'Workflow Studio', icon: ListChecks },
    { id: 'widgets' as const, label: 'Widget Studio', icon: Layers },
    { id: 'integrations' as const, label: 'Integrations', icon: Database },
    { id: 'theme' as const, label: 'Theme', icon: Sun },
  ];
  const selectedForm = formBuilders.find((form) => form.id === selectedFormId) ?? formBuilders[0] ?? FORM_BUILDERS[0];
  const selectedFormSchema = formSchemas[selectedForm.id] ?? [];
  const formDraftSchema = formDraft ? (formSchemas[formDraft.id] ?? []) : [];
  const allPermissionKeys = operationModules.flatMap(modulePermissionKeys);
  const selectedAccessRole = collegeRoles.find((role) => role.id === selectedAccessRoleId) ?? collegeRoles[0];
  const selectedRolePermissions = roleAccess[selectedAccessRole.id] ?? EMPTY_PERMISSION_KEYS;
  const selectedRolePermissionSet = useMemo(() => new Set(selectedRolePermissions), [selectedRolePermissions]);
  const selectedAccessModule = operationModules.find((module) => module.id === selectedAccessModuleId) ?? operationModules[0];
  const selectedModuleKeys = modulePermissionKeys(selectedAccessModule);
  const selectedModuleEnabledCount = selectedModuleKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
  const selectedModuleFullyEnabled = selectedModuleKeys.length > 0 && selectedModuleEnabledCount === selectedModuleKeys.length;
  const selectedModulePartiallyEnabled = selectedModuleEnabledCount > 0 && !selectedModuleFullyEnabled;
  const selectedRoleUsers = staffUsers.filter((user) => user.roleId === selectedAccessRole.id);
  const teamSummary = Object.entries(staffUsers.reduce<Record<string, number>>((summary, user) => {
    summary[user.team] = (summary[user.team] ?? 0) + 1;
    return summary;
  }, {})).sort((a, b) => b[1] - a[1]);
  const moduleUserCoverage = operationModules.map((module) => {
    const users = staffUsers.filter((user) => {
      const role = collegeRoles.find((item) => item.id === user.roleId);
      return role?.moduleIds.includes('*') || role?.moduleIds.includes(module.id) || user.access.some((access) => module.name.toLowerCase().includes(access.toLowerCase()) || access.toLowerCase().includes(module.name.split('/')[0].trim().toLowerCase()));
    });
    return { ...module, users };
  });
  const coreModuleCoverage = moduleUserCoverage.filter((module) => ['crm', 'fees', 'academics', 'forms', 'documents', 'student-app', 'staff'].includes(module.id));
  const roleSearchValue = roleSearch.trim().toLowerCase();
  const filteredCollegeRoles = collegeRoles.filter((role) =>
    !roleSearchValue ||
    role.name.toLowerCase().includes(roleSearchValue) ||
    role.team.toLowerCase().includes(roleSearchValue) ||
    role.scope.toLowerCase().includes(roleSearchValue)
  );
  const accessCoverage = allPermissionKeys.length ? Math.round((selectedRolePermissions.length / allPermissionKeys.length) * 100) : 0;
  const enabledModuleCount = operationModules.filter((module) =>
    modulePermissionKeys(module).some((key) => selectedRolePermissionSet.has(key))
  ).length;
  const requirementPage = ADMIN_REQUIREMENTS[activeNav];
  const workArea = ADMIN_WORK_AREAS[activeNav];
  const adminScreens = ADMIN_SCREEN_SPECS[activeNav] ?? [];
  const activeAdminScreen = adminScreens.find((screen) => screen.id === activeScreenByNav[activeNav]) ?? adminScreens[0];
  const activeScreenKey = activeAdminScreen ? `${activeNav}:${activeAdminScreen.id}` : '';
  const activeAdminRecords = activeAdminScreen ? buildAdminRecords(activeNav, activeAdminScreen) : [];
  const selectedRecordIndex = selectedRecordByScreen[activeScreenKey] ?? 0;
  const selectedAdminRecord = activeAdminRecords[selectedRecordIndex] ?? activeAdminRecords[0];
  const activeCompletedActions = completedActions[activeScreenKey] ?? [];
  const customRequirementLayout = ['crm', 'admissions', 'academics', 'fees', 'erp', 'reports'].includes(activeNav);
  const operationContext = operationModal?.context ?? '';
  const operationTitle = operationModal?.title ?? '';
  const operationContextLower = operationContext.toLowerCase();
  const operationTitleLower = operationTitle.toLowerCase();
  const crmOperationKind = !operationModal ? null
    : operationTitleLower.includes('filter') || ['enquiry date', 'last contact date', 'source', 'course', 'status', 'priority', 'assigned counselor', 'city/state', 'lead age'].some((item) => operationTitleLower.includes(item)) ? 'filter'
    : operationTitleLower.includes('list') || operationContextLower.includes('board settings') ? 'board'
    : operationTitleLower.includes('export') ? 'export'
    : operationTitleLower.includes('archive') || operationTitleLower.includes('hold') || operationTitleLower.includes('defer') || operationTitleLower.includes('prospect') ? 'status'
    : operationTitleLower.includes('assign') || operationTitleLower.includes('reassign') ? 'assignment'
    : operationTitleLower.includes('whatsapp') || operationTitleLower.includes('email') || operationTitleLower.includes('call') || operationTitleLower.includes('follow') || operationContextLower.includes('communication') ? 'communication'
    : operationTitleLower.includes('new') || operationTitleLower.includes('create') || operationTitleLower.includes('lead') || operationContextLower.includes('lead') || operationContextLower.includes('crm') ? 'lead'
    : null;
  const operationHasFeatureWorkspace = Boolean(operationModal && (
    crmOperationKind ||
    (operationContext === 'Dashboard' && ['Add lead', 'Current intake'].includes(operationTitle)) ||
    operationContext.includes('Admission') ||
    operationTitle.includes('Admissions') ||
    ['Review documents', 'Schedule exam', 'Issue offer', 'Convert to student', 'Send to finance', 'Process next applicant'].includes(operationTitle) ||
    operationContext.includes('Student') ||
    operationContext.includes('Academics') ||
    operationContext.includes('Timetable') ||
    operationContext.includes('Finance') ||
    operationContext.includes('Reconciliation') ||
    operationContext.includes('ERP') ||
    operationContext.includes('Service Desk') ||
    operationContext.includes('Report') ||
    operationContext.includes('BI') ||
    operationContext.includes('Integration') ||
    operationContext.includes('Workflow')
  ));
  const openOperation = useCallback((title: string, context: string, fields: string[] = ['Owner', 'Due date', 'Notes'], confirmLabel = 'Save action') => {
    setOperationModal({ title, context, fields, confirmLabel });
  }, []);
  const completeOperation = useCallback(() => {
    if (!operationModal) return;
    showToast(`${operationModal.title} saved`);
    setOperationModal(null);
  }, [operationModal, showToast]);
  const completeAdminAction = (action: string) => {
    if (!activeScreenKey) return;
    setCompletedActions((current) => {
      const actions = current[activeScreenKey] ?? [];
      return { ...current, [activeScreenKey]: actions.includes(action) ? actions : [...actions, action] };
    });
    showToast(`${action} completed`);
  };

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--crm-bg)]">
        <p className="text-sm text-[var(--crm-muted)] font-medium">Loading admissions portal...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[var(--crm-bg)] text-[var(--crm-text)] overflow-hidden">
      <aside className={`${sidebarCollapsed ? 'w-[76px]' : 'w-[232px]'} shrink-0 bg-[var(--crm-surface)] border-r border-[var(--crm-border)] flex flex-col transition-[width] duration-200`}>
        <div className={`${sidebarCollapsed ? 'px-3 justify-center' : 'px-5'} h-16 flex items-center gap-3 border-b border-[var(--crm-border)]`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden text-xs font-bold text-white" style={{ background: brandGradient }}>
            {tenantBrand.logoDataUrl ? <img src={tenantBrand.logoDataUrl} alt="Tenant logo" className="h-full w-full object-contain p-1 bg-white" /> : 'SC'}
          </div>
          {!sidebarCollapsed && <div>
            <p className="text-sm font-extrabold leading-none">SuperCampus</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)] font-bold mt-1">Admin Suite</p>
          </div>}
        </div>

        <nav className="flex-1 overflow-y-auto kanban-scroll-hidden p-3 space-y-1">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className={`${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'} mb-3 flex w-full items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] py-2.5 text-xs text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]`}
            aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {!sidebarCollapsed && <span>Collapse</span>}
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                title={item.label}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  activeNav === item.id
                    ? 'text-white shadow-md'
                    : 'text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]'
                }`}
                style={activeNav === item.id ? { background: brandGradient } : undefined}
              >
                <Icon size={17} />
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </nav>

        <div className={`${sidebarCollapsed ? 'p-3' : 'p-4'} border-t border-[var(--crm-border)]`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: brandGradient }}>AM</div>
            {!sidebarCollapsed && <div className="min-w-0">
              <p className="text-xs font-extrabold truncate">Arjun Mehta</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--crm-muted)] font-bold">One Admin Login</p>
            </div>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] text-[11px] font-extrabold text-[var(--crm-muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            {!sidebarCollapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[var(--crm-surface)] border-b border-[var(--crm-border)]">
          <div>
            <h1 className="text-lg font-extrabold">{NAV_TITLES[activeNav]}</h1>
            <p className="text-[11px] text-[var(--crm-muted)] font-semibold">CRM, Fee Management, ERP, and student app access controlled by admin.</p>
          </div>
          <div className="flex items-center gap-3">
            <ActivityFeed leads={leads} />
            <button onClick={toggleDarkTheme} className="p-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] transition-colors">
              {theme === 'midnight' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] text-xs font-bold text-[var(--crm-muted)] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </header>

        {activeNav === 'pipeline' && (
          <section className="flex-1 overflow-hidden p-5 flex flex-col">
            <KanbanBoard leads={leads} setLeads={setLeads} roleId={roleId} onShowToast={showToast} />
          </section>
        )}

        {activeNav === 'dashboard' && (
          <section className="flex-1 overflow-y-auto kanban-scroll-hidden bg-[var(--crm-panel)] p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[var(--crm-muted)]">Portal / Dashboard</p>
                <h2 className="mt-2 text-3xl tracking-tight">Good morning, Arjun</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { setActiveNav('settings'); setSettingsSection('widgets'); }} className="inline-flex items-center gap-2 rounded-full border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-2 text-xs text-[var(--crm-muted)]">
                  <PlusCircle size={15} />
                  Add widget
                </button>
                <button type="button" onClick={() => openOperation('Current intake', 'Dashboard', ['Intake', 'Start date', 'End date'], 'Apply')} className="inline-flex items-center gap-2 rounded-full border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-2 text-xs text-[var(--crm-muted)]">
                  <CalendarDays size={15} />
                  Current intake
                </button>
                <button type="button" onClick={() => openOperation('Add lead', 'Dashboard', ['Name', 'Phone', 'Course interest', 'Source', 'Assigned counselor'], 'Add lead')} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                  <PlusCircle size={15} />
                  Add lead
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[260px_minmax(0,1fr)_300px] gap-4">
              <div className="space-y-4">
                <div className="relative min-h-[315px] overflow-hidden rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(0deg, color-mix(in srgb, var(--tenant-primary) 18%, transparent), transparent)' }} />
                  <div className="relative mx-auto mt-4 grid h-36 w-36 place-items-center rounded-full" style={{ background: 'linear-gradient(135deg, var(--tenant-surface), var(--crm-card))' }}>
                    <span className="grid h-28 w-28 place-items-center rounded-full text-4xl text-white" style={{ background: brandGradient }}>AM</span>
                  </div>
                  <div className="relative mt-8 rounded-2xl bg-black/75 p-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm">Arjun Mehta</p>
                        <p className="mt-1 text-[11px] text-white/65">Admin login</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[var(--tenant-primary)]"><PhoneCall size={14} /></span>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15"><Mail size={14} /></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--crm-muted)]">Average response time</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">+0.5%</span>
                  </div>
                  <p className="mt-3 text-3xl">46 min</p>
                  <div className="mt-5 flex h-20 items-end gap-2">
                    {[24, 38, 42, 58, 36, 45, 54].map((height, index) => (
                      <span key={index} className="flex-1 rounded-full bg-[var(--tenant-primary)]/20" style={{ height }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-4">
                  <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[var(--crm-muted)]">Admission velocity</p>
                        <div className="mt-3 flex items-end gap-3">
                          <p className="text-5xl leading-none">{dashboardStats[0]?.value ?? 0}</p>
                          <span className="mb-2 rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">+12%</span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--crm-muted)]">leads in active movement</p>
                      </div>
                      <div className="grid h-28 flex-1 grid-cols-12 items-end gap-1">
                        {[40, 62, 48, 72, 52, 80, 56, 44, 68, 76, 50, 66].map((height, index) => (
                          <span key={index} className="rounded-full bg-[var(--tenant-primary)]/75" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[28px] border border-[var(--crm-border)] bg-[var(--tenant-primary)] p-4 text-white shadow-sm">
                    <div className="rounded-2xl bg-white/92 p-4 text-[var(--crm-text)]">
                      <p className="text-3xl">80%</p>
                      <p className="mt-1 text-[11px] text-[var(--crm-muted)]">Counselor SLA</p>
                    </div>
                    <div className="mt-3 rounded-2xl bg-white/14 p-4">
                      <p className="text-3xl">20%</p>
                      <p className="mt-1 text-[11px] text-white/70">Needs escalation</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--crm-muted)]">Track your team</p>
                      <ArrowUpRight size={16} className="text-[var(--crm-muted)]" />
                    </div>
                    <div className="mt-5 grid place-items-center">
                      <div className="relative h-36 w-36 rounded-full" style={{ background: `conic-gradient(var(--tenant-primary) 0 46%, var(--tenant-secondary) 46% 76%, var(--crm-panel) 76% 100%)` }}>
                        <div className="absolute inset-6 grid place-items-center rounded-full bg-[var(--crm-card)]">
                          <p className="text-4xl">{staffUsers.length * 24}</p>
                          <p className="text-[10px] text-[var(--crm-muted)]">team score</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-[var(--crm-muted)]">
                      {counselorSummary.slice(0, 3).map((owner) => (
                        <div key={owner.name} className="flex items-center justify-between">
                          <span>{owner.name}</span>
                          <span>{owner.total} leads</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[var(--crm-muted)]">Talent recruitment</p>
                      <ArrowUpRight size={16} className="text-[var(--crm-muted)]" />
                    </div>
                    <p className="mt-4 text-2xl">Admissions funnel</p>
                    <div className="mt-5 flex items-center gap-2">
                      {counselorSummary.slice(0, 2).map((owner) => (
                        <span key={owner.name} className="grid h-12 w-12 place-items-center rounded-2xl text-xs text-white" style={{ background: brandGradient }}>{owner.name.slice(0, 2).toUpperCase()}</span>
                      ))}
                      <span className="ml-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--tenant-primary)] text-white"><PhoneCall size={18} /></span>
                    </div>
                    <div className="mt-6 grid grid-cols-14 gap-1">
                      {Array.from({ length: 14 }).map((_, index) => (
                        <span key={index} className={`h-16 rounded-full ${index < 9 ? 'bg-[var(--tenant-secondary)]' : 'bg-[var(--crm-panel)]'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--crm-muted)]">Pipeline spread</p>
                      <h3 className="mt-1 text-xl">Lead movement by stage</h3>
                    </div>
                    <TrendingUp size={17} className="text-[var(--tenant-primary)]" />
                  </div>
                  <div className="mt-6 flex h-36 items-end gap-3">
                    {pipelineSummary.map((stage, index) => (
                      <div key={stage.id} className="flex flex-1 flex-col items-center gap-2">
                        <span
                          className={`w-full max-w-10 rounded-full ${index > 3 ? 'bg-[var(--tenant-primary)]' : 'bg-[var(--tenant-primary)]/15'}`}
                          style={{ height: `${42 + Math.round((stage.count / maxStageCount) * 78)}px` }}
                        />
                        <span className="max-w-16 truncate text-[10px] text-[var(--crm-muted)]">{stage.title.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--crm-muted)]">Admissions desk</p>
                      <h3 className="mt-1 text-xl">Follow-ups</h3>
                    </div>
                    <Search size={17} className="text-[var(--crm-muted)]" />
                  </div>
                  <div className="space-y-3">
                    {upcomingFollowUps.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="grid grid-cols-[38px_1fr_auto] items-center gap-3 rounded-2xl bg-[var(--crm-surface)] p-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--crm-card)] text-xs">{lead.name.slice(0, 1)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs">{lead.name}</p>
                          <p className="truncate text-[10px] text-[var(--crm-muted)]">{lead.course}</p>
                        </div>
                        <span className="rounded-full bg-[var(--tenant-surface)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">
                          {new Date(lead.nextFollowUp ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] p-5 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 72%, #000))' }}>
                  <p className="text-xs text-white/70">Fee readiness</p>
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-white/20 p-3">
                      <div className="flex justify-between text-xs"><span>Confirmed applications</span><span>{dashboardStats[1]?.value ?? 0}</span></div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-[var(--crm-text)]">
                      <div className="flex justify-between text-xs"><span>Offer accepted</span><span>{dashboardStats[2]?.value ?? 0}</span></div>
                    </div>
                    <div className="rounded-2xl bg-white/12 p-3">
                      <div className="flex justify-between text-xs"><span>Team users</span><span>{dashboardStats[3]?.value ?? 0}</span></div>
                    </div>
                  </div>
                  <p className="mt-6 text-4xl">41%</p>
                  <p className="mt-1 text-xs text-white/70">conversion target</p>
                </div>

                <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <p className="text-xs text-[var(--crm-muted)]">Source quality</p>
                  <div className="mt-4 space-y-3">
                    {sourceSummary.slice(0, 4).map((source) => (
                      <div key={source.source}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{source.source}</span>
                          <span className="text-[var(--crm-muted)]">{source.percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--crm-panel)]">
                          <span className="block h-full rounded-full bg-[var(--tenant-primary)]" style={{ width: `${source.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {requirementPage && (
          <section className="flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">{requirementPage.eyebrow}</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl">{requirementPage.title}</h2>
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(true)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--tenant-primary)]"
                    aria-label="How this page works"
                  >
                    <Info size={15} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openOperation(workArea?.primaryAction ?? 'New record', requirementPage.title, ['Name', 'Owner', 'Priority', 'Notes'], 'Create')}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm"
                style={{ background: brandGradient }}
              >
                <PlusCircle size={15} />
                {workArea?.primaryAction ?? 'New record'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {requirementPage.stats.map((stat, index) => {
                const Icon = [Target, Clock, CheckCircle2, BarChart3][index] ?? BarChart3;
                return (
                  <div key={stat} className={`rounded-2xl border p-5 shadow-sm ${index === 0 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${index === 0 ? 'text-white/75' : 'text-[var(--crm-muted)]'}`}>{stat}</p>
                      <Icon size={17} />
                    </div>
                    <p className="mt-4 text-4xl">{[128, 24, 12, 91][index]}{index === 3 ? '%' : ''}</p>
                  </div>
                );
              })}
            </div>

            {activeAdminScreen && !customRequirementLayout && (
              <div className={`mt-4 grid gap-4 ${activeNav === 'admissions' || activeNav === 'students' ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_340px]'}`}>
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 shadow-sm">
                  <p className="mb-3 text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Workspaces</p>
                  <div className="space-y-2">
                    {adminScreens.map((screen) => (
                      <button
                        key={screen.id}
                        type="button"
                        onClick={() => {
                          setActiveScreenByNav((current) => ({ ...current, [activeNav]: screen.id }));
                          setSelectedRecordByScreen((current) => ({ ...current, [`${activeNav}:${screen.id}`]: 0 }));
                        }}
                        className={`w-full rounded-xl px-3 py-3 text-left text-xs transition-colors ${
                          activeAdminScreen.id === screen.id
                            ? 'text-white shadow-sm'
                            : 'bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                        }`}
                        style={activeAdminScreen.id === screen.id ? { background: brandGradient } : undefined}
                      >
                        <span className="block">{screen.label}</span>
                        <span className={`mt-1 block truncate text-[10px] ${activeAdminScreen.id === screen.id ? 'text-white/70' : 'text-[var(--crm-muted)]'}`}>{screen.purpose}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="mt-1 text-xl">{activeNav === 'admissions' ? `${activeAdminScreen.label} Workspace` : activeAdminScreen.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {(activeAdminScreen.filters ?? []).slice(0, 3).map((filter) => (
                        <button key={filter} type="button" onClick={() => openOperation(filter, activeAdminScreen.label, ['Condition', 'Value'], 'Apply filter')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-[10px] text-[var(--crm-muted)]">{filter}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-2">
                    <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">
                      <Search size={14} />
                      <input placeholder={`Search ${activeAdminScreen.label.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent outline-none" />
                    </label>
                    <button type="button" onClick={() => openOperation('Export records', activeAdminScreen.label, ['Format', 'Date range', 'Columns'], 'Export')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">Export</button>
                    <button type="button" onClick={() => openOperation(activeAdminScreen.operations[0] ?? 'New', activeAdminScreen.label, ['Name', 'Status', 'Owner', 'Notes'], 'Save')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>
                      {activeAdminScreen.operations[0] ?? 'New'}
                    </button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--crm-border)]">
                    <div className="grid bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]" style={{ gridTemplateColumns: `repeat(${Math.min(activeAdminScreen.columns?.length || 4, 5)}, minmax(0, 1fr)) 76px` }}>
                      {(activeAdminScreen.columns ?? ['Record', 'Status', 'Owner', 'Actions']).slice(0, 5).map((column) => <span key={column} className="truncate">{column}</span>)}
                      <span>Open</span>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto kanban-scroll-hidden">
                      {activeAdminRecords.map((record, recordIndex) => (
                        <button
                          key={`${activeScreenKey}-${recordIndex}`}
                          type="button"
                          onClick={() => {
                            setSelectedRecordByScreen((current) => ({ ...current, [activeScreenKey]: recordIndex }));
                            openOperation(`Open ${Object.values(record)[0]}`, activeAdminScreen.label, Object.keys(record).slice(0, 5), 'Update');
                          }}
                          className={`grid w-full items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs ${selectedRecordIndex === recordIndex ? 'bg-[var(--tenant-surface)]' : 'bg-[var(--crm-card)] hover:bg-[var(--crm-surface)]'}`}
                          style={{ gridTemplateColumns: `repeat(${Math.min(activeAdminScreen.columns?.length || 4, 5)}, minmax(0, 1fr)) 76px` }}
                        >
                          {Object.entries(record).slice(0, 5).map(([column, value]) => (
                            <span key={column} className="truncate pr-3">
                              {value}
                            </span>
                          ))}
                          <span className="rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-center text-[10px] text-[var(--crm-muted)]">Open</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {(activeAdminScreen.filters ?? []).slice(3, 7).map((filter) => (
                      <button key={filter} type="button" onClick={() => openOperation(filter, activeAdminScreen.label, ['Condition', 'Value'], 'Apply filter')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-[10px] text-[var(--crm-muted)]">{filter}</button>
                    ))}
                  </div>
                </div>

                {activeNav !== 'admissions' && activeNav !== 'students' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Selected record</p>
                        <h3 className="mt-1 text-base">{selectedAdminRecord ? Object.values(selectedAdminRecord)[0] : 'No record'}</h3>
                      </div>
                      <span className="rounded-full bg-[var(--crm-panel)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">{activeAdminScreen.label}</span>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {selectedAdminRecord && Object.entries(selectedAdminRecord).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] text-[var(--crm-muted)]">{key}</p>
                          <p className="mt-1 truncate text-xs">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Action Drawer</h3>
                    <div className="mt-4 grid gap-2">
                      {activeAdminScreen.operations.slice(0, 6).map((operation) => {
                        const complete = activeCompletedActions.includes(operation);
                        return (
                          <button
                            key={operation}
                            type="button"
                            onClick={() => completeAdminAction(operation)}
                            className={`flex items-center justify-between rounded-xl px-3 py-3 text-left text-xs ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--crm-surface)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)]'}`}
                          >
                            <span>{operation}</span>
                            {complete ? <CheckCircle2 size={14} /> : <ArrowUpRight size={13} className="text-[var(--crm-muted)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Flow Status</h3>
                    <div className="mt-4 space-y-2">
                      {(activeAdminScreen.special ?? ['Audit log', 'Notification', 'Export']).slice(0, 4).map((feature, index) => (
                        <div key={feature} className="flex items-center gap-3 rounded-xl bg-[var(--crm-surface)] p-3 text-xs">
                          <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] text-white" style={{ background: index < activeCompletedActions.length ? 'var(--tenant-primary)' : 'var(--crm-muted)' }}>{index + 1}</span>
                          <span className="text-[var(--crm-muted)]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {false && activeNav === 'admissions' && (
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base">Application Processing Board</h3>
                    <span className="rounded-full bg-[var(--crm-panel)] px-3 py-1 text-[10px] text-[var(--crm-muted)]">Live intake</span>
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    {['Applied', 'Documents', 'Eligible', 'Offer', 'ERP Handoff'].map((stage, stageIndex) => (
                      <div key={stage} className="min-h-[280px] rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs">{stage}</p>
                          <span className="rounded-full bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{stageIndex + 2}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {['Rahul Kumar', 'Priya Sharma', 'Vikram Iyer'].slice(0, stageIndex < 2 ? 3 : 2).map((name, index) => (
                            <div key={`${stage}-${name}`} className="rounded-xl bg-[var(--crm-card)] p-3 shadow-sm">
                              <p className="text-xs">{name}</p>
                              <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{['B.Tech CSE', 'MBA', 'BCA'][index]} / 2026</p>
                              <button type="button" className="mt-3 rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">Open file</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Today’s Decisions</h3>
                    <div className="mt-4 space-y-3">
                      {['Verify documents', 'Release offer letter', 'Confirm seat', 'Send to finance'].map((item, index) => (
                        <button key={item} type="button" className="flex w-full items-center justify-between rounded-xl bg-[var(--crm-surface)] px-3 py-3 text-left text-xs">
                          <span>{item}</span>
                          <span className="rounded-full bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{[8, 4, 6, 3][index]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'crm' && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_340px] gap-4">
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">CRM command center</p>
                        <h3 className="mt-1 text-2xl">Lead operations board</h3>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openOperation('Bulk import CSV/Excel', 'Lead Capture', ['Upload CSV/Excel', 'Column mapping', 'Duplicate handling'], 'Preview import')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]">Import</button>
                        <button type="button" onClick={() => openOperation('Create lead', 'Lead Capture', ['Student name', 'Phone', 'WhatsApp', 'Course', 'Source', 'City'], 'Create lead')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Create lead</button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-5 gap-3">
                      {[
                        ['New leads', leads.filter((lead) => lead.status === 'enquiry').length, Target],
                        ['Contact due', upcomingFollowUps.length, Clock],
                        ['Qualified', leads.filter((lead) => lead.status === 'qualified').length, CheckCircle2],
                        ['Applications', activeApplications, FileText],
                        ['Accepted', totalOfferAccepted, ShieldCheck],
                      ].map(([label, value, Icon], index) => (
                        <button key={label as string} type="button" onClick={() => openOperation(label as string, 'CRM Analytics', ['Date range', 'Owner', 'Source'], 'Drill down')} className={`rounded-2xl border p-4 text-left ${index === 0 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>
                          {React.createElement(Icon as LucideIcon, { size: 16 })}
                          <p className="mt-4 text-3xl">{value as number}</p>
                          <p className={`mt-1 text-[10px] ${index === 0 ? 'text-white/70' : 'text-[var(--crm-muted)]'}`}>{label as string}</p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_220px] gap-4">
                      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm">Priority lead queue</h4>
                          <button type="button" onClick={() => openOperation('Filter leads', 'Leads', ['Source', 'Stage', 'Assignee', 'Priority'], 'Apply filter')} className="rounded-lg bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">Filter</button>
                        </div>
                        <div className="space-y-2">
                          {leads.slice(0, 6).map((lead, index) => (
                            <button key={lead.id} type="button" onClick={() => openOperation(`Open ${lead.name}`, 'Leads', ['Details', 'Timeline', 'Documents', 'Forms'], 'Update lead')} className="grid w-full grid-cols-[1fr_110px_90px_auto] items-center gap-3 rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs hover:bg-[var(--tenant-surface)]">
                              <span className="min-w-0">
                                <span className="block truncate">{lead.name}</span>
                                <span className="mt-1 block truncate text-[10px] text-[var(--crm-muted)]">{lead.course} / {lead.city}</span>
                              </span>
                              <span className="truncate text-[var(--crm-muted)]">{lead.source}</span>
                              <span className="truncate text-[var(--crm-muted)]">{lead.assignedTo.name}</span>
                              <span className={`rounded-full px-2 py-1 text-[10px] ${index < 2 ? 'bg-red-50 text-red-600' : index < 4 ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>{index < 2 ? 'Hot' : index < 4 ? 'Warm' : 'Cold'}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                        <h4 className="text-sm">Stage automation</h4>
                        <div className="mt-4 space-y-2">
                          {['Auto assign digital leads', 'Follow-up reminder', 'WhatsApp after Qualified', 'ERP handoff on Accepted'].map((rule, index) => (
                            <button key={rule} type="button" onClick={() => openOperation(rule, 'CRM Settings', ['Trigger', 'Condition', 'Template', 'Enabled'], 'Save rule')} className="flex w-full items-center justify-between rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs">
                              <span>{rule}</span>
                              <span className={`h-5 w-9 rounded-full p-0.5 ${index === 0 || index === 2 ? 'bg-[var(--tenant-primary)]' : 'bg-[var(--crm-panel)]'}`}>
                                <span className={`block h-4 w-4 rounded-full bg-white ${index === 0 || index === 2 ? 'ml-4' : ''}`} />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Campaign ledger</p>
                          <h3 className="mt-1 text-lg">Source ROI</h3>
                        </div>
                        <button type="button" onClick={() => openOperation('Create campaign', 'Campaign Management', ['Campaign name', 'Budget', 'Audience', 'UTM'], 'Create campaign')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>New campaign</button>
                      </div>
                      <div className="mt-5 grid grid-cols-[1.1fr_.7fr_.7fr_.7fr_.8fr] rounded-xl bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                        <span>Source</span>
                        <span>Leads</span>
                        <span>Apps</span>
                        <span>CPL</span>
                        <span>ROI</span>
                      </div>
                      <div className="overflow-hidden rounded-b-xl border-x border-b border-[var(--crm-border)]">
                        {sourceSummary.slice(0, 5).map((source, index) => (
                          <button key={source.source} type="button" onClick={() => openOperation(`${source.source} campaign`, 'Campaign Management', ['Spend', 'Leads', 'Applications', 'ROI'], 'Open campaign')} className="grid w-full grid-cols-[1.1fr_.7fr_.7fr_.7fr_.8fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs first:border-t-0 hover:bg-[var(--crm-surface)]">
                            <span className="truncate">{source.source}</span>
                            <span>{source.count}</span>
                            <span>{Math.max(1, Math.round(source.count * 0.42))}</span>
                            <span>Rs. {[420, 510, 390, 680, 460][index] ?? 520}</span>
                            <span>
                              <span className="inline-flex min-w-14 justify-center rounded-full bg-[var(--tenant-surface)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{[3.4, 2.8, 4.1, 1.9, 3.1][index] ?? 2.6}x</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {['Budget used', 'Landing pages', 'Active UTM'].map((metric, index) => (
                          <button key={metric} type="button" onClick={() => openOperation(metric, 'Campaign Management', ['Date range', 'Source', 'Budget'], 'View metric')} className="rounded-xl bg-[var(--crm-surface)] p-3 text-left">
                            <p className="text-[10px] text-[var(--crm-muted)]">{metric}</p>
                            <p className="mt-2 text-xl">{['64%', '7', '12'][index]}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] p-5 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 72%, #000))' }}>
                    <p className="text-xs text-white/70">CRM health</p>
                    <p className="mt-4 text-5xl">91%</p>
                    <p className="mt-2 text-xs text-white/70">lead records with owner, follow-up, and source attribution</p>
                    <div className="mt-6 space-y-3">
                      {['Duplicate detection', 'Source attribution', 'Post-qualified WhatsApp'].map((item, index) => (
                        <button key={item} type="button" onClick={() => openOperation(item, 'CRM Settings', ['Rule', 'Owner', 'Status'], 'Configure')} className="w-full rounded-2xl bg-white/12 p-3 text-left text-xs">
                          <div className="flex justify-between"><span>{item}</span><span>{[98, 87, 100][index]}%</span></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Case control</p>
                        <h3 className="mt-1 text-lg">Archive and hold</h3>
                      </div>
                      <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] text-red-600">11 open</span>
                    </div>
                    <div className="mt-5 grid grid-cols-4 gap-2">
                      {[
                        ['Prospect', 6, 'Future'],
                        ['Deferred', 3, 'Intake'],
                        ['On Hold', 8, 'Paused'],
                        ['Archive', 11, 'Review'],
                      ].map(([status, count, helper], index) => (
                        <button
                          key={status as string}
                          type="button"
                          onClick={() => openOperation(status as string, 'Archive & Hold', ['Lead', 'Reason', 'Reminder date', 'Approval'], 'Apply status')}
                          className={`min-h-[86px] rounded-2xl px-2.5 py-3 text-left transition hover:-translate-y-0.5 ${
                            index === 3
                              ? 'bg-red-50 text-red-600'
                              : 'bg-[var(--crm-surface)] text-[var(--crm-text)] hover:bg-[var(--tenant-surface)]'
                          }`}
                        >
                          <span className="block text-2xl leading-none">{count as number}</span>
                          <span className={`mt-2 block text-xs leading-tight ${index === 3 ? 'text-red-600' : 'text-[var(--crm-text)]'}`}>{status as string}</span>
                          <span className={`mt-1 block text-[10px] ${index === 3 ? 'text-red-400' : 'text-[var(--crm-muted)]'}`}>{helper as string}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-xs text-[var(--crm-muted)]">Active cases</p>
                      <button type="button" onClick={() => openOperation('Archive review queue', 'Archive & Hold', ['Status', 'Owner', 'Reason'], 'Open queue')} className="text-[10px] text-[var(--tenant-primary)]">View all</button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {[
                        ['Rahul Kumar', 'On Hold', 'Health issue', '15 Aug', 'bg-amber-50 text-amber-700'],
                        ['Sneha Reddy', 'Archive review', 'Not reachable', 'Today', 'bg-red-50 text-red-600'],
                        ['Varun Chakraborty', 'Deferred', 'Next intake', '01 Sep', 'bg-sky-50 text-sky-700'],
                      ].map(([name, status, reason, due, tone]) => (
                        <button key={name} type="button" onClick={() => openOperation(`${status}: ${name}`, 'Archive & Hold', ['Lead', 'Reason', 'Reminder date', 'Approval'], 'Review case')} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-[var(--crm-surface)] p-3.5 text-left text-xs transition hover:bg-[var(--tenant-surface)]">
                          <span className="min-w-0">
                            <span className="block truncate text-sm">{name}</span>
                            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[var(--crm-muted)]">
                              <span className="truncate">{status}</span>
                              <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--crm-muted)]/50" />
                              <span className="truncate">{reason}</span>
                            </span>
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] ${tone}`}>{due}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'admissions' && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      ['Applications', 'Submitted files waiting for review', '42', FileText],
                      ['Documents', 'Certificates to verify today', '18', ShieldCheck],
                      ['Seat Matrix', 'Program seats available', '126', LayoutDashboard],
                    ].map(([label, meta, value, Icon], index) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => {
                          const target = ['applications', 'documents', 'seats'][index];
                          setActiveScreenByNav((current) => ({ ...current, admissions: target }));
                          openOperation(label as string, 'Admissions workspace', ['Assigned reviewer', 'Stage', 'Decision note'], 'Open workspace');
                        }}
                        className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: brandGradient }}>
                            {React.createElement(Icon as LucideIcon, { size: 16 })}
                          </span>
                          <span className="text-3xl">{value as string}</span>
                        </div>
                        <h3 className="mt-4 text-sm">{label as string}</h3>
                        <p className="mt-1 text-xs text-[var(--crm-muted)]">{meta as string}</p>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base">Admission Desk</h3>
                      <button type="button" onClick={() => openOperation('Process next applicant', 'Admission Desk', ['Applicant', 'Decision', 'Reviewer note'], 'Process')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Process next</button>
                    </div>
                    <div className="mt-5 grid grid-cols-[1fr_.8fr_.8fr_.8fr_auto] gap-2 rounded-xl bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                      <span>Applicant</span><span>Program</span><span>Document</span><span>Fee</span><span>Status</span>
                    </div>
                    {[
                      ['Rahul Kumar', 'B.Tech CSE', 'Verified', 'Paid', 'Ready'],
                      ['Priya Sharma', 'MBA', 'Pending', 'Partial', 'Review'],
                      ['Vikram Iyer', 'BCA', 'Rejected', 'Unpaid', 'Reupload'],
                      ['Ananya Gupta', 'BBA', 'Verified', 'Paid', 'Offer'],
                    ].map((row) => (
                      <div key={row[0]} className="grid grid-cols-[1fr_.8fr_.8fr_.8fr_auto] items-center gap-2 border-b border-[var(--crm-border)] px-4 py-4 text-xs last:border-b-0">
                        <span>{row[0]}</span>
                        <span className="text-[var(--crm-muted)]">{row[1]}</span>
                        <span className={row[2] === 'Rejected' ? 'text-red-500' : row[2] === 'Pending' ? 'text-amber-600' : 'text-emerald-600'}>{row[2]}</span>
                        <span className="text-[var(--crm-muted)]">{row[3]}</span>
                        <button type="button" onClick={() => openOperation(`${row[4]}: ${row[0]}`, 'Admission Desk', ['Applicant', 'Program', 'Document status', 'Fee status', 'Decision note'], 'Save decision')} className="rounded-lg bg-[var(--crm-panel)] px-3 py-1.5 text-[10px] text-[var(--tenant-primary)]">{row[4]}</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <h3 className="text-base">Admission Actions</h3>
                  <div className="mt-4 grid gap-3">
                    {['Review documents', 'Schedule exam', 'Issue offer', 'Convert to student', 'Send to finance'].map((action, index) => (
                      <button key={action} type="button" onClick={() => openOperation(action, 'Admission Actions', ['Applicant', 'Assigned user', 'Due date', 'Internal note'], 'Save action')} className="flex items-center gap-3 rounded-xl bg-[var(--crm-surface)] p-3 text-left text-xs">
                        <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: index === 0 ? brandGradient : 'var(--crm-muted)' }}>{index + 1}</span>
                        <span>{action}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'students' && (
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base">Student Master Registry</h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openOperation('Import students', 'Student Master Registry', ['Upload file', 'Duplicate rule', 'Batch'], 'Import')} className="rounded-xl border border-[var(--crm-border)] px-3 py-2 text-xs text-[var(--crm-muted)]">Import</button>
                      <button type="button" onClick={() => openOperation('Add student', 'Student Master Registry', ['Student name', 'Program', 'Section', 'Parent phone', 'Admission source'], 'Add student')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Add student</button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[var(--crm-border)]">
                    <div className="grid grid-cols-[1fr_.8fr_.8fr_.8fr_.8fr] bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                      <span>Student</span><span>Program</span><span>Fees</span><span>App</span><span>Services</span>
                    </div>
                    {['Aarav Patel', 'Meera Nair', 'Kavin Raj', 'Nila George', 'Sara Khan'].map((name, index) => (
                      <button key={name} type="button" onClick={() => openOperation(`Open ${name}`, 'Student profile', ['Program', 'Fees', 'App status', 'Services', 'Profile note'], 'Update profile')} className="grid w-full grid-cols-[1fr_.8fr_.8fr_.8fr_.8fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs hover:bg-[var(--crm-surface)]">
                        <span>{name}<small className="block text-[10px] text-[var(--crm-muted)]">SC{202600 + index}</small></span>
                        <span>{['CSE', 'ECE', 'BCA', 'MBA', 'BBA'][index]}</span>
                        <span className={index === 2 ? 'text-red-500' : 'text-emerald-600'}>{index === 2 ? 'Due' : 'Clear'}</span>
                        <span>{index === 1 ? 'Pending' : 'Active'}</span>
                        <span>{['Hostel', 'Transport', 'Docs', 'None', 'Library'][index]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'academics' && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    ['Programs', '24 courses', Database],
                    ['Timetable', '6 conflicts', CalendarDays],
                    ['Faculty', '96 profiles', Users],
                    ['Exams', '3 active', ClipboardList],
                    ['Calendar', '182 days', Clock],
                  ].map(([label, meta, Icon], index) => (
                    <button key={label as string} type="button" onClick={() => openOperation(label as string, 'Academics', ['Academic year', 'Department', 'Owner', 'Notes'], 'Open')} className={`rounded-2xl border p-4 text-left shadow-sm ${index === 1 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)]'}`} style={index === 1 ? { background: brandGradient } : undefined}>
                      {React.createElement(Icon as LucideIcon, { size: 17 })}
                      <p className="mt-4 text-sm">{label as string}</p>
                      <p className={`mt-1 text-xs ${index === 1 ? 'text-white/70' : 'text-[var(--crm-muted)]'}`}>{meta as string}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base">Timetable Command Board</h3>
                      <button type="button" onClick={() => openOperation('Publish timetable', 'Timetable Command Board', ['Academic year', 'Effective date', 'Notify students', 'Publish note'], 'Publish')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Publish timetable</button>
                    </div>
                    <div className="mt-5 grid grid-cols-6 gap-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                        <div key={day} className="min-h-[340px] rounded-2xl bg-[var(--crm-surface)] p-3">
                          <p className="text-xs text-[var(--crm-muted)]">{day}</p>
                          {['CSE Sem 3', 'ECE Lab', 'MBA Finance'].slice(0, dayIndex % 3 + 1).map((item, itemIndex) => (
                            <div key={`${day}-${item}`} className={`mt-3 rounded-xl p-3 text-xs shadow-sm ${itemIndex === 0 && dayIndex === 2 ? 'bg-red-50 text-red-600' : 'bg-[var(--crm-card)]'}`}>
                              <p>{item}</p>
                              <p className="mt-1 text-[10px] text-[var(--crm-muted)]">Room {dayIndex + 201} / P{itemIndex + 1}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                      <h3 className="text-base">Academic Setup</h3>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {['Departments', 'Batches', 'Subjects', 'Faculty'].map((item, index) => (
                          <div key={item} className="rounded-xl bg-[var(--crm-surface)] p-3">
                            <p className="text-xl">{[8, 42, 180, 96][index]}</p>
                            <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                      <h3 className="text-base">Conflict Alerts</h3>
                      <div className="mt-4 space-y-2 text-xs">
                        <p className="rounded-xl bg-red-50 p-3 text-red-600">Prof. Sharma double-booked</p>
                        <p className="rounded-xl bg-amber-50 p-3 text-amber-700">Room 301 capacity warning</p>
                        <p className="rounded-xl bg-[var(--crm-surface)] p-3 text-[var(--crm-muted)]">4 attendance corrections</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'fees' && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base">Finance Ledger</h3>
                    <button type="button" onClick={() => openOperation('Generate invoice', 'Finance Ledger', ['Student or batch', 'Fee structure', 'Due date', 'Installment plan'], 'Generate')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Generate invoice</button>
                  </div>
                  <div className="mt-5 grid grid-cols-4 gap-3">
                    {['Collected', 'Outstanding', 'Concessions', 'Refunds'].map((item, index) => (
                      <div key={item} className="rounded-2xl bg-[var(--crm-surface)] p-4">
                        <p className="text-xs text-[var(--crm-muted)]">{item}</p>
                        <p className="mt-3 text-2xl">{['Rs. 82L', 'Rs. 14L', 'Rs. 3.2L', 'Rs. 84K'][index]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 overflow-hidden rounded-xl border border-[var(--crm-border)]">
                    {['Rahul Kumar - concession approval', 'Priya Sharma - receipt pending', 'Vikram Iyer - payment failed', 'Deepak Raja - refund request'].map((row, index) => (
                      <div key={row} className="grid grid-cols-[1fr_auto_auto] items-center border-t border-[var(--crm-border)] px-4 py-3 text-xs first:border-t-0">
                        <span>{row}</span>
                        <span className="mr-3 text-[var(--crm-muted)]">{['Review', 'Receipt', 'Gateway', 'Refund'][index]}</span>
                        <button type="button" onClick={() => openOperation(row, 'Finance Ledger', ['Amount', 'Payment mode', 'Approval owner', 'Finance note'], 'Save finance action')} className="rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-[10px]">Open</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-5 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 72%, #000))' }}>
                  <h3 className="text-base">Payment Reconciliation</h3>
                  <p className="mt-5 text-5xl">94%</p>
                  <p className="mt-2 text-xs text-white/70">gateway records matched</p>
                  <div className="mt-6 space-y-3">
                    {['UPI webhook', 'Bank settlement', 'Counter cash'].map((item, index) => (
                      <button key={item} type="button" onClick={() => openOperation(item, 'Payment Reconciliation', ['Gateway total', 'Bank total', 'Mismatch note'], 'Reconcile')} className="w-full rounded-2xl bg-white/12 p-3 text-left text-xs hover:bg-white/20">
                        <div className="flex justify-between"><span>{item}</span><span>{[98, 91, 100][index]}%</span></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'erp' && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="grid grid-cols-3 gap-4">
                  {['Hostel', 'Transport', 'Library', 'Gate Pass', 'No Due', 'Documents', 'Medical', 'Counselling', 'Repairs'].map((module, index) => (
                    <button key={module} type="button" onClick={() => openOperation(module, 'ERP Services', ['Request type', 'Owner', 'SLA', 'Notes'], 'Open service')} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: brandGradient }}><Layers size={16} /></span>
                        <span className="rounded-full bg-[var(--crm-panel)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">{[12, 6, 4, 18, 9, 22, 3, 5, 7][index]} open</span>
                      </div>
                      <h3 className="mt-4 text-sm">{module}</h3>
                      <p className="mt-2 text-xs leading-5 text-[var(--crm-muted)]">Requests, approvals, alerts, and reports.</p>
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <h3 className="text-base">Service Desk</h3>
                  <div className="mt-4 space-y-3">
                    {workArea?.queueItems.map((item) => (
                      <button key={item.title} type="button" onClick={() => openOperation(item.title, 'Service Desk', ['Assignee', 'Priority', 'SLA note'], 'Update ticket')} className="w-full rounded-xl bg-[var(--crm-surface)] p-3 text-left hover:bg-[var(--crm-panel)]">
                        <p className="text-xs">{item.title}</p>
                        <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{item.meta}</p>
                        <span className="mt-3 inline-flex rounded-full bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{item.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'reports' && (
              <div className="mt-4 grid grid-cols-[320px_minmax(0,1fr)] gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <h3 className="text-base">Report Builder</h3>
                  <div className="mt-4 space-y-3">
                    {['Domain', 'Date range', 'Department', 'Role scope', 'Export format'].map((item, index) => (
                      <button key={item} type="button" onClick={() => openOperation(item, 'Report Builder', ['Selection', 'Filter rule'], 'Apply')} className="flex w-full items-center justify-between rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-3 text-xs">
                        <span>{item}</span><span className="text-[var(--crm-muted)]">{['CRM', 'This month', 'All', 'Principal', 'PDF/XLS'][index]}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => openOperation('Generate report', 'Report Builder', ['Report name', 'Recipients', 'Schedule', 'Export format'], 'Generate')} className="mt-5 w-full rounded-xl px-3 py-3 text-xs text-white" style={{ background: brandGradient }}>Generate report</button>
                </div>
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base">BI Dashboard Preview</h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] text-emerald-700">Auto refreshed</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    {['Admissions', 'Finance', 'ERP'].map((domain, index) => (
                      <button key={domain} type="button" onClick={() => openOperation(`${domain} dashboard`, 'BI Dashboard Preview', ['Metric', 'Date range', 'Drilldown'], 'Open dashboard')} className="rounded-2xl bg-[var(--crm-surface)] p-4 text-left hover:bg-[var(--crm-panel)]">
                        <p className="text-xs text-[var(--crm-muted)]">{domain}</p>
                        <p className="mt-3 text-3xl">{[68, 82, 74][index]}%</p>
                        <div className="mt-4 flex h-24 items-end gap-1">
                          {[44, 72, 58, 84, 62, 91].map((height, bar) => (
                            <span key={bar} className="flex-1 rounded-full bg-[var(--tenant-primary)]/70" style={{ height: `${height}%` }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {workArea?.queueItems.map((item) => (
                      <button key={item.title} type="button" onClick={() => openOperation(item.title, 'Reports queue', ['Owner', 'Schedule', 'Export format'], 'Update report')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 text-left hover:bg-[var(--crm-panel)]">
                        <p className="text-xs">{item.title}</p>
                        <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{item.meta}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </section>
        )}

        {activeNav === 'users' && (
          <section className="flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Access directory</p>
                <h2 className="mt-1 text-2xl">Users, roles, and module coverage</h2>
                <p className="mt-1 text-xs text-[var(--crm-muted)]">One directory for CRM, Fee Management, ERP, staff portals, student app, and parent portal access.</p>
              </div>
              <button type="button" onClick={() => setAccessModal('users')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                <PlusCircle size={15} />
                Add user
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                ['Total users', staffUsers.length, Users],
                ['Roles covered', collegeRoles.length, ShieldCheck],
                ['Modules', operationModules.length, Layers],
                ['Permission keys', allPermissionKeys.length, Database],
              ].map(([label, value, Icon], index) => (
                <div key={label as string} className={`rounded-2xl border p-5 shadow-sm ${index === 0 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${index === 0 ? 'text-white/75' : 'text-[var(--crm-muted)]'}`}>{label as string}</p>
                    {React.createElement(Icon as LucideIcon, { size: 17 })}
                  </div>
                  <p className="mt-4 text-4xl">{value as number}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base">All role users</h3>
                    <p className="mt-1 text-xs text-[var(--crm-muted)]">Every operational role is represented, not only admissions CRM users.</p>
                  </div>
                  <span className="rounded-full bg-[var(--crm-panel)] px-3 py-1.5 text-[11px] text-[var(--crm-muted)]">{staffUsers.length} accounts</span>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-[var(--crm-border)]">
                  <div className="grid grid-cols-[1.1fr_.9fr_.9fr_1.4fr] bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                    <span>User</span>
                    <span>Role</span>
                    <span>Team</span>
                    <span>Access</span>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto kanban-scroll-hidden">
                    {staffUsers.map((user) => (
                      <div key={user.id} className="grid grid-cols-[1.1fr_.9fr_.9fr_1.4fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-xs">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs text-white" style={{ background: brandGradient }}>{user.initials}</span>
                          <div className="min-w-0">
                            <p className="truncate">{user.name}</p>
                            <p className="mt-1 truncate text-[10px] text-[var(--crm-muted)]">{user.email}</p>
                          </div>
                        </div>
                        <span className="min-w-0 truncate text-[var(--crm-muted)]">{user.role}</span>
                        <span className="min-w-0 truncate text-[var(--crm-muted)]">{user.team}</span>
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                          {(userAccess[user.id] ?? user.access).map((item) => (
                            <span key={item} className="rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <h3 className="text-base">Team coverage</h3>
                  <div className="mt-4 space-y-3">
                    {teamSummary.map(([team, count]) => (
                      <div key={team}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{team}</span>
                          <span className="text-[var(--crm-muted)]">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--crm-panel)]">
                          <span className="block h-full rounded-full bg-[var(--tenant-primary)]" style={{ width: `${Math.max(12, Math.round((count / staffUsers.length) * 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <h3 className="text-base">Core modules</h3>
                  <div className="mt-4 grid gap-3">
                    {coreModuleCoverage.map((module) => (
                      <div key={module.id} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs">{module.name}</p>
                          <span className="rounded-full bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{module.users.length} users</span>
                        </div>
                        <p className="mt-2 line-clamp-1 text-[10px] text-[var(--crm-muted)]">{module.features.slice(0, 4).join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {false && (
          <section className="flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="grid grid-cols-2 gap-4">
              {staffUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white" style={{ background: brandGradient }}>{user.initials}</div>
                    <div>
                      <h2 className="text-sm font-extrabold">{user.name}</h2>
                      <p className="text-xs text-[var(--crm-muted)]">{user.role} • {user.team}</p>
                      <p className="text-[11px] text-[var(--crm-muted)] mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(userAccess[user.id] ?? []).map((item) => (
                      <span key={item} className="px-2 py-1 rounded-lg bg-[var(--crm-panel)] text-[11px] font-bold text-[var(--crm-muted)]">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeNav === 'settings' && (
          <section className="flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Admin Settings</h2>
                <p className="text-xs text-[var(--crm-muted)] font-semibold mt-1">Control forms, widgets, access, and themes from one place.</p>
              </div>
              {settingsSection === 'forms' && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm transition-transform hover:-translate-y-0.5"
                  style={{ background: brandGradient }}
                >
                  <PlusCircle size={15} />
                  New builder
                </button>
              )}
            </div>

            <div className="flex gap-2 mb-5 overflow-x-auto kanban-scroll-hidden">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsSection(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold transition-colors ${
                      settingsSection === tab.id
                        ? 'text-white border-transparent shadow-md'
                        : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]'
                    }`}
                    style={settingsSection === tab.id ? { background: brandGradient } : undefined}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {settingsSection === 'forms' && (
              <div className="grid grid-cols-[260px_1fr] gap-4 min-h-[680px]">
                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-3 overflow-hidden flex flex-col">
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold">Form Builders</h3>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowFormHelp((value) => !value)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                          aria-label="How form builders work"
                        >
                          <Info size={14} />
                        </button>
                        {showFormHelp && (
                          <div className="absolute right-0 top-9 z-20 w-64 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-3 text-[11px] leading-relaxed text-[var(--crm-muted)] shadow-lg">
                            Add fields from the palette, edit labels and validation from Field Settings, then publish the same form to CRM, ERP, fees, staff portals, or the student app.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 overflow-y-auto kanban-scroll-hidden pr-1">
                    {formBuilders.map((form) => (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => {
                          setSelectedFormId(form.id);
                          setSelectedFieldKey(null);
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${
                          selectedForm.id === form.id
                            ? 'border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_10%,var(--crm-surface))]'
                            : 'border-[var(--crm-border)] bg-[var(--crm-surface)] hover:bg-[var(--crm-panel)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-extrabold leading-snug">{form.name}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                              form.status === 'Live' ? 'bg-emerald-50 text-emerald-700' : form.status === 'Review' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                            }`}>{form.status}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditForm(form);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openEditForm(form);
                                }
                              }}
                              className="grid h-6 w-6 place-items-center rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]"
                              aria-label={`Edit ${form.name}`}
                            >
                              <Pencil size={12} />
                            </span>
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-[var(--crm-muted)] font-bold">{form.module} | {form.owner}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[var(--crm-muted)]">
                          <span>{form.fields} fields</span>
                          <span>{form.usage.split(',')[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] overflow-hidden flex flex-col">
                  <div className="h-14 px-4 border-b border-[var(--crm-border)] flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold truncate">{selectedForm.name}</h3>
                      <p className="text-[11px] text-[var(--crm-muted)] font-semibold">{selectedForm.module} process | {countSchemaFields(selectedFormSchema)} configured fields</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg border ${previewMode === 'desktop' ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}><Monitor size={15} /></button>
                      <button type="button" onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg border ${previewMode === 'mobile' ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}><Smartphone size={15} /></button>
                      <button type="button" onClick={() => showToast('Form layout saved')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold text-white" style={{ background: brandGradient }}><Save size={14} /> Save</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto kanban-scroll-hidden p-5 bg-[var(--crm-panel)]">
                      <div className={`mx-auto rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-sm ${previewMode === 'mobile' ? 'max-w-[360px]' : 'max-w-[760px]'}`}>
                        <div className="px-5 py-4 border-b border-[var(--crm-border)]">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--tenant-primary)]">{selectedForm.module}</p>
                          <h4 className="mt-1 text-lg font-extrabold">{selectedForm.name}</h4>
                          <p className="mt-1 text-xs text-[var(--crm-muted)]">{selectedForm.usage}</p>
                        </div>
                        <div className="p-5 space-y-5">
                          {selectedFormSchema.map((section, sectionIndex) => (
                            <div key={section.section} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xs font-extrabold">{section.section}</h5>
                                <Grip size={14} className="text-[var(--crm-muted)]" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {section.fields.map((field, fieldIndex) => {
                                  const fieldKey = `${sectionIndex}:${fieldIndex}`;
                                  return (
                                  <div key={`${section.section}-${field.label}-${fieldIndex}`} className={field.width === 'full' || previewMode === 'mobile' ? 'col-span-2' : ''}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedFieldKey(fieldKey)}
                                      className={`block w-full text-left rounded-lg border bg-[var(--crm-card)] p-3 transition-colors ${
                                        selectedFieldKey === fieldKey
                                          ? 'border-[var(--tenant-primary)] ring-2 ring-[color-mix(in_srgb,var(--tenant-primary)_16%,transparent)]'
                                          : 'border-[var(--crm-border)] hover:border-[var(--tenant-primary)]'
                                      }`}
                                    >
                                      <span className="flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--crm-muted)]">
                                        <span className="min-w-0 truncate">{field.label}</span>
                                        <span className="flex shrink-0 items-center gap-1">
                                          {field.required && <span className="text-[#ef4444]">Required</span>}
                                          <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openFieldEditor(fieldKey, field);
                                            }}
                                            onKeyDown={(event) => {
                                              if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                openFieldEditor(fieldKey, field);
                                              }
                                            }}
                                            className="grid h-6 w-6 place-items-center rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--tenant-primary)]"
                                            aria-label={`Edit ${field.label}`}
                                          >
                                            <Pencil size={12} />
                                          </span>
                                        </span>
                                      </span>
                                      <div className="mt-2 h-9 rounded-lg bg-[var(--crm-panel)] border border-[var(--crm-border)] flex items-center px-3 text-[10px] text-[var(--crm-muted)]">{field.type}</div>
                                    </button>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'widgets' && (
              <div className="grid grid-cols-[280px_1fr] gap-4 min-h-[680px] widget-studio-shell">
                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-[var(--tenant-primary)]" />
                    <h3 className="text-sm font-extrabold">Widget Library</h3>
                  </div>
                  <p className="text-[11px] text-[var(--crm-muted)] leading-relaxed mb-4">Drag a block into the canvas. Placed widgets can be moved and resized from their edges.</p>
                  <div className="space-y-2">
                    {WIDGET_LIBRARY.map((widget) => (
                      <button
                        key={widget.id}
                        type="button"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('application/x-supercampus-widget', widget.id)}
                        onDoubleClick={() => addWidgetToCanvas(widget.id)}
                        className="widget-library-card w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 text-left hover:bg-[var(--crm-panel)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-extrabold">{widget.title}</span>
                          <Grip size={14} className="text-[var(--crm-muted)]" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-[var(--crm-muted)]">
                          <span>{widget.type}</span>
                          <span>{widget.size}</span>
                        </div>
                        <p className="mt-2 text-[10px] text-[var(--crm-muted)]">{widget.target}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] overflow-hidden">
                  <div className="h-14 px-4 border-b border-[var(--crm-border)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold">Admin Dashboard Canvas</h3>
                      <p className="text-[11px] text-[var(--crm-muted)] font-semibold">Design once, assign different widget layouts to admins, staff, managers, and students.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => showToast('Widget layout saved')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold text-white" style={{ background: brandGradient }}><Save size={14} /> Save layout</button>
                    </div>
                  </div>

                  <div className="min-h-[620px]">
                    <div className="p-5 bg-[var(--crm-panel)] overflow-y-auto kanban-scroll-hidden">
                      <div
                        className="widget-canvas rounded-xl border border-dashed bg-[var(--crm-card)] p-4"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleWidgetCanvasDrop}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--tenant-primary)]">Live Preview</p>
                            <h4 className="text-lg font-extrabold mt-1">Operations Command Center</h4>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700"><CheckCircle2 size={12} /> Auto saved</span>
                        </div>

                        <div ref={widgetCanvasRef} className="widget-canvas__grid">
                          {canvasWidgets.map((widget) => {
                            const isMedium = widget.w >= 280 || widget.h >= 190;
                            const isLarge = widget.w >= 360 && widget.h >= 230;
                            return (
                              <div
                                key={widget.instanceId}
                                className={`widget-canvas-card ${activeCanvasWidgetId === widget.instanceId ? 'widget-canvas-card--active' : ''}`}
                                style={{
                                  '--widget-x': widget.x,
                                  '--widget-y': widget.y,
                                  '--widget-w': widget.w,
                                  '--widget-h': widget.h,
                                } as React.CSSProperties}
                                onPointerDown={(event) => beginWidgetInteraction(event, widget, 'move')}
                              >
                                <div className="widget-canvas-card__top">
                                  <span>{widget.title}</span>
                                  <Grip size={14} className="text-[var(--crm-muted)]" />
                                </div>
                                <div className="widget-canvas-card__body">
                                  <div>
                                    <p className="widget-canvas-card__value">{widget.value}</p>
                                    <p className="widget-canvas-card__detail">{widget.detail}</p>
                                  </div>
                                  {isMedium && (
                                    <div className="widget-canvas-card__mini-chart" aria-hidden="true">
                                      {[42, 66, 54, 78, 60, 84].map((height, index) => (
                                        <span key={index} style={{ height: `${height}%` }} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {isLarge && (
                                  <div className="widget-canvas-card__expanded">
                                    {[
                                      ['Current', widget.value],
                                      ['Trend', '+8.4%'],
                                      ['Owner', widget.id.includes('fee') ? 'Finance' : 'Admissions'],
                                    ].map(([label, value]) => (
                                      <div key={label}>
                                        <span>{label}</span>
                                        <strong>{value}</strong>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {isLarge && (
                                  <div className="widget-canvas-card__feed">
                                    <span>Last sync: 2 min ago</span>
                                    <span>{widget.id.includes('approval') ? '3 escalations' : 'Healthy data flow'}</span>
                                  </div>
                                )}
                                <div className="widget-canvas-card__bar">
                                  <span />
                                </div>
                                <button
                                  type="button"
                                  className="widget-canvas-card__resize"
                                  aria-label={`Resize ${widget.title}`}
                                  onPointerDown={(event) => {
                                    event.stopPropagation();
                                    beginWidgetInteraction(event, widget, 'resize');
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'workflows' && (
              <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Workflow Studio</p>
                      <h3 className="mt-1 text-2xl">Approval routes and module handoffs</h3>
                      <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--crm-muted)]">Define how CRM, Fees, ERP, staff portals, and mobile app flows move from one owner to the next.</p>
                    </div>
                    <button type="button" onClick={() => openOperation('New flow', 'Workflow Studio', ['Flow name', 'Trigger module', 'Approval owner', 'SLA'], 'Create flow')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                      <PlusCircle size={15} />
                      New flow
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      ['CRM to ERP handoff', 'Lead qualified -> application verified -> fee confirmed -> student onboarding'],
                      ['Fee confirmation', 'Invoice generated -> payment received -> receipt issued -> finance approval'],
                      ['Student onboarding', 'Admission confirmed -> student profile -> app activation -> academics assignment'],
                      ['No Due clearance', 'Finance -> Hostel -> Library -> Admin certificate generation'],
                      ['Gate Pass approval', 'Student request -> parent approval -> warden approval -> security verification'],
                      ['Document verification', 'Upload -> checklist validation -> approve/reject -> resubmission alert'],
                    ].map(([title, detail], index) => (
                      <div key={title} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm">{title}</h4>
                          <span className="rounded-full bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{index + 1}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--crm-muted)]">{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Route Builder Needs</h3>
                    <div className="mt-4 space-y-2">
                      {['Step owner', 'Role approval', 'SLA timer', 'Auto escalation', 'Notification template', 'Audit log'].map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-xl bg-[var(--crm-surface)] px-3 py-2.5 text-xs">
                          <CheckCircle2 size={14} className="text-[var(--tenant-primary)]" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Flow Scope</h3>
                    <p className="mt-2 text-xs leading-6 text-[var(--crm-muted)]">Every workflow must resolve user role, module, feature, allowed action, and tenant scope before allowing the next step.</p>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'integrations' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Integrations</p>
                  <h3 className="mt-1 text-2xl">External systems and automation sync</h3>
                  <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--crm-muted)]">Connect the admin app to payment, messaging, ERP sync, document storage, public forms, and mobile notification services.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    ['Payment Gateway', 'UPI, card, net banking, receipts, webhook reconciliation'],
                    ['WhatsApp / Email / SMS', 'Templates, campaign delivery, follow-up reminders, alerts'],
                    ['ERP Sync', 'Student master, fees ledger, academics, attendance, exam records'],
                    ['Document Storage', 'Uploads, verification files, certificates, receipts'],
                    ['Public Forms', 'Lead capture, applications, feedback, event registrations'],
                    ['Mobile Push', 'Student app, parent portal, staff approval notifications'],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm">{title}</h4>
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--crm-surface)] text-[var(--tenant-primary)]"><Database size={15} /></span>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-[var(--crm-muted)]">{detail}</p>
                      <button type="button" onClick={() => openOperation(`Configure ${title}`, 'Integrations', ['Provider', 'API key', 'Webhook URL', 'Sync notes'], 'Save integration')} className="mt-4 rounded-xl border border-[var(--crm-border)] px-3 py-2 text-xs text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]">Configure</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsSection === 'access' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Guided access control</p>
                      <h3 className="mt-1 text-2xl">Role &gt; Module &gt; Feature &gt; CRUD &gt; Users</h3>
                      <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--crm-muted)]">Configure access one step at a time. Pick the role, choose the module, decide CRUD for each feature, then assign users to the role.</p>
                    </div>
                    <div className="rounded-xl bg-[var(--crm-surface)] px-4 py-3 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">Current role</p>
                      <p className="mt-1 text-sm">{selectedAccessRole.name}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[
                    ['1', 'Select role', selectedAccessRole.name, ShieldCheck, () => setAccessModal('role')],
                    ['2', 'Select module', selectedAccessModule.name, Layers, () => setAccessModal('module')],
                    ['3', 'Set feature CRUD', `${selectedModuleEnabledCount}/${selectedModuleKeys.length} actions`, ListChecks, () => setAccessModal('crud')],
                    ['4', 'Assign users', `${selectedRoleUsers.length} users`, Users, () => setAccessModal('users')],
                  ].map(([step, title, value, Icon, onClick]) => (
                    <button
                      key={title as string}
                      type="button"
                      onClick={onClick as () => void}
                      className="group rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 text-left shadow-sm transition-colors hover:border-[var(--tenant-primary)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl text-xs text-white" style={{ background: brandGradient }}>{step as string}</span>
                        {React.createElement(Icon as LucideIcon, { size: 18, className: 'text-[var(--crm-muted)] group-hover:text-[var(--tenant-primary)]' })}
                      </div>
                      <p className="mt-5 text-sm">{title as string}</p>
                      <p className="mt-1 truncate text-xs text-[var(--crm-muted)]">{value as string}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base">Access summary</h3>
                        <p className="mt-1 text-xs text-[var(--crm-muted)]">The selected role currently has CRUD access across these modules.</p>
                      </div>
                      <span className="rounded-full bg-[var(--crm-panel)] px-3 py-1.5 text-[11px] text-[var(--crm-muted)]">{accessCoverage}% coverage</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {operationModules.map((module) => {
                        const moduleKeys = modulePermissionKeys(module);
                        const enabledCount = moduleKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                        const progress = moduleKeys.length ? Math.round((enabledCount / moduleKeys.length) * 100) : 0;
                        return (
                          <div key={module.id} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span>{module.name}</span>
                              <span className="text-[var(--crm-muted)]">{enabledCount}/{moduleKeys.length}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--crm-card)]">
                              <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--tenant-primary), var(--tenant-secondary))' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <h3 className="text-base">Selected context</h3>
                    <div className="mt-4 space-y-3 text-xs">
                      <div className="rounded-xl bg-[var(--crm-surface)] p-3">
                        <p className="text-[var(--crm-muted)]">Role</p>
                        <p className="mt-1">{selectedAccessRole.name}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--crm-surface)] p-3">
                        <p className="text-[var(--crm-muted)]">Module</p>
                        <p className="mt-1">{selectedAccessModule.name}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--crm-surface)] p-3">
                        <p className="text-[var(--crm-muted)]">CRUD actions</p>
                        <p className="mt-1">{selectedRolePermissions.length}/{allPermissionKeys.length}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--crm-surface)] p-3">
                        <p className="text-[var(--crm-muted)]">Users assigned</p>
                        <p className="mt-1">{selectedRoleUsers.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {false && (
              <div className="grid grid-cols-[300px_minmax(0,1fr)_320px] gap-4 min-h-[680px]">
                <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-[var(--crm-border)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold">Role Directory</h3>
                        <p className="text-[11px] text-[var(--crm-muted)] mt-1">Choose a role, then assign modules and users.</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-[10px] font-extrabold text-[var(--crm-muted)]">{collegeRoles.length}</span>
                    </div>
                    <label className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2">
                      <Search size={14} className="text-[var(--crm-muted)]" />
                      <input
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                        placeholder="Search roles or teams"
                        className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-[var(--crm-muted)]"
                      />
                    </label>
                  </div>

                  <div className="p-4 border-b border-[var(--crm-border)] bg-[var(--crm-surface)]">
                    <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)] mb-2">New role</p>
                    <div className="grid gap-2">
                      <input
                        value={newRoleName}
                        onChange={(event) => setNewRoleName(event.target.value)}
                        placeholder="Role name"
                        className="w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none"
                      />
                      <input
                        value={newRoleTeam}
                        onChange={(event) => setNewRoleTeam(event.target.value)}
                        placeholder="Department / team"
                        className="w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none"
                      />
                      <button type="button" onClick={addCollegeRole} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold text-white" style={{ background: brandGradient }}>
                        <PlusCircle size={14} />
                        Add role
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto kanban-scroll-hidden p-3 space-y-2">
                    {filteredCollegeRoles.map((role) => {
                      const rolePermissions = roleAccess[role.id] ?? [];
                      const roleUsers = staffUsers.filter((user) => user.roleId === role.id);
                      const roleCoverage = allPermissionKeys.length ? Math.round((rolePermissions.length / allPermissionKeys.length) * 100) : 0;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedAccessRoleId(role.id)}
                          className={`w-full text-left rounded-lg border p-3 transition-colors ${
                            selectedAccessRole.id === role.id
                              ? 'border-[#776cf5] bg-[#776cf5]/10'
                              : 'border-[var(--crm-border)] bg-[var(--crm-surface)] hover:bg-[var(--crm-panel)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold truncate">{role.name}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase text-[var(--crm-muted)]">{role.team}</p>
                            </div>
                            <span className="shrink-0 rounded-md bg-[var(--crm-card)] border border-[var(--crm-border)] px-2 py-0.5 text-[9px] font-extrabold text-[var(--crm-muted)]">{roleCoverage}%</span>
                          </div>
                          <p className="mt-2 text-[10px] leading-relaxed text-[var(--crm-muted)]">{role.scope}</p>
                          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[var(--crm-muted)]">
                            <span>{rolePermissions.length} permissions</span>
                            <span>{roleUsers.length} users</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-[var(--crm-border)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase text-[#776cf5]">Selected role</p>
                        <h3 className="mt-1 text-xl font-extrabold truncate">{selectedAccessRole.name}</h3>
                        <p className="mt-1 text-xs text-[var(--crm-muted)] font-semibold">{selectedAccessRole.scope}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRoleAccess((prev) => ({ ...prev, [selectedAccessRole.id]: allPermissionKeys }))}
                          className="px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs font-bold text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoleAccess((prev) => ({ ...prev, [selectedAccessRole.id]: [] }))}
                          className="px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs font-bold text-[var(--crm-muted)] hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-3">
                      {[
                        ['Coverage', `${accessCoverage}%`],
                        ['Permissions', `${selectedRolePermissions.length}/${allPermissionKeys.length}`],
                        ['Modules', `${enabledModuleCount}/${operationModules.length}`],
                        ['Users', `${selectedRoleUsers.length}`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)]">{label}</p>
                          <p className="mt-2 text-lg font-extrabold">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2">
                      {['Role', 'Modules', 'Features', 'CRUD'].map((step, index) => (
                        <React.Fragment key={step}>
                          <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2">
                            <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)]">Step {index + 1}</p>
                            <p className="mt-1 text-xs font-extrabold">{step}</p>
                          </div>
                          {index < 3 && <span className="h-px w-7 bg-[var(--crm-border)]" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-[240px_1fr] min-h-0 flex-1">
                    <div className="border-r border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 overflow-y-auto kanban-scroll-hidden">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h4 className="text-sm font-extrabold">Modules</h4>
                        <span className="rounded-md bg-[var(--crm-card)] border border-[var(--crm-border)] px-2 py-0.5 text-[9px] font-extrabold text-[var(--crm-muted)]">{operationModules.length}</span>
                      </div>
                      <div className="space-y-2">
                        {operationModules.map((module) => {
                          const moduleKeys = modulePermissionKeys(module);
                          const enabledCount = moduleKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                          const progress = moduleKeys.length ? Math.round((enabledCount / moduleKeys.length) * 100) : 0;
                          return (
                            <button
                              key={module.id}
                              type="button"
                              onClick={() => {
                                setSelectedAccessModuleId(module.id);
                                setFeatureModuleId(module.id);
                              }}
                              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                selectedAccessModule.id === module.id
                                  ? 'border-[#776cf5] bg-[#776cf5]/10'
                                  : 'border-[var(--crm-border)] bg-[var(--crm-card)] hover:bg-[var(--crm-panel)]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate text-xs font-extrabold">{module.name}</span>
                                <span className="text-[10px] font-extrabold text-[var(--crm-muted)]">{progress}%</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--crm-panel)]">
                                <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--tenant-primary), var(--tenant-secondary))' }} />
                              </div>
                              <p className="mt-2 text-[10px] font-bold text-[var(--crm-muted)]">{enabledCount}/{moduleKeys.length} enabled</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-5 overflow-y-auto kanban-scroll-hidden">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-extrabold">{selectedAccessModule.name}</h4>
                          <p className="mt-1 text-xs text-[var(--crm-muted)] font-semibold">Turn the full module on, or choose individual capabilities.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-xs font-extrabold text-[var(--crm-muted)]">
                          <input
                            type="checkbox"
                            checked={selectedModuleFullyEnabled}
                            ref={(input) => {
                              if (input) input.indeterminate = selectedModulePartiallyEnabled;
                            }}
                            onChange={() => toggleRoleModule(selectedAccessRole.id, selectedAccessModule.id)}
                          />
                          Enable module
                        </label>
                      </div>

                      <div className="grid gap-2">
                        {selectedAccessModule.features.map((feature) => {
                          const crudKeys = featurePermissionKeys(selectedAccessModule.id, feature);
                          const enabledCount = crudKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                          const featureFullyEnabled = enabledCount === CRUD_ACTIONS.length;
                          return (
                            <div
                              key={`${selectedAccessModule.id}:${feature}`}
                              className={`rounded-lg border p-3 transition-colors ${
                                enabledCount
                                  ? 'border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_8%,var(--crm-surface))] text-[var(--crm-text)]'
                                  : 'border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-xs">{feature}</p>
                                  <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{enabledCount}/4 CRUD actions enabled</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoleAccess((prev) => {
                                      const current = prev[selectedAccessRole.id] ?? [];
                                      const next = featureFullyEnabled
                                        ? current.filter((key) => !crudKeys.includes(key))
                                        : Array.from(new Set([...current, ...crudKeys]));
                                      return { ...prev, [selectedAccessRole.id]: next };
                                    });
                                  }}
                                  className="shrink-0 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--crm-muted)]"
                                >
                                  {featureFullyEnabled ? 'Clear' : 'All'}
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-4 gap-2">
                                {CRUD_ACTIONS.map((action) => {
                                  const permissionKey = permissionKeyFor(selectedAccessModule.id, feature, action.id);
                                  const enabled = selectedRolePermissionSet.has(permissionKey);
                                  return (
                                    <button
                                      key={permissionKey}
                                      type="button"
                                      onClick={() => toggleRolePermission(selectedAccessRole.id, permissionKey)}
                                      className={`rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                                        enabled
                                          ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white'
                                          : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                                      }`}
                                      aria-label={`${action.id} ${feature}`}
                                      title={action.id}
                                    >
                                      {action.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-extrabold">Assigned Users</h3>
                        <p className="text-[11px] text-[var(--crm-muted)] mt-1">{selectedAccessRole.name}</p>
                      </div>
                      <span className="rounded-lg bg-[var(--crm-panel)] px-2 py-1 text-[10px] font-extrabold text-[var(--crm-muted)]">{selectedRoleUsers.length}</span>
                    </div>

                    <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 mb-3">
                      <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)] mb-2">Add user</p>
                      <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="User name" className="w-full mb-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none" />
                      <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="Email" className="w-full mb-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none" />
                      <button type="button" onClick={addUserUnderRole} className="w-full rounded-lg border border-[var(--crm-border)] px-3 py-2 text-xs font-extrabold text-[var(--crm-text)] hover:bg-[var(--crm-panel)]">Add to role</button>
                    </div>

                    <div className="max-h-[230px] overflow-y-auto kanban-scroll-hidden space-y-2">
                      {selectedRoleUsers.length ? selectedRoleUsers.map((user) => (
                        <div key={user.id} className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-lg text-xs font-extrabold text-white" style={{ background: brandGradient }}>{user.initials}</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-extrabold">{user.name}</p>
                              <p className="truncate text-[10px] font-bold text-[var(--crm-muted)]">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-lg border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 text-xs font-bold text-[var(--crm-muted)]">No users assigned to this role yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SlidersHorizontal size={15} className="text-[#776cf5]" />
                      <h3 className="text-sm font-extrabold">Module Maintenance</h3>
                    </div>
                    <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 mb-3">
                      <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)] mb-2">Add module</p>
                      <input value={newModuleName} onChange={(event) => setNewModuleName(event.target.value)} placeholder="Module name" className="w-full mb-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none" />
                      <button type="button" onClick={addOperationModule} className="w-full rounded-lg border border-[var(--crm-border)] px-3 py-2 text-xs font-extrabold text-[var(--crm-text)] hover:bg-[var(--crm-panel)]">Add module</button>
                    </div>
                    <div className="rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                      <p className="text-[10px] font-extrabold uppercase text-[var(--crm-muted)] mb-2">Add feature</p>
                      <select value={featureModuleId} onChange={(event) => setFeatureModuleId(event.target.value)} className="w-full mb-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none">
                        {operationModules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
                      </select>
                      <input value={newFeatureName} onChange={(event) => setNewFeatureName(event.target.value)} placeholder="Feature name" className="w-full mb-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none" />
                      <button type="button" onClick={addFeatureToModule} className="w-full rounded-lg border border-[var(--crm-border)] px-3 py-2 text-xs font-extrabold text-[var(--crm-text)] hover:bg-[var(--crm-panel)]">Add feature</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'theme' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Tenant brand</p>
                      <h3 className="mt-1 text-xl">Upload college logo</h3>
                      <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--crm-muted)]">The dashboard samples the logo and applies its colors to navigation, charts, buttons, highlights, and cards.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-[var(--crm-border)]" style={{ background: 'var(--tenant-surface)' }}>
                        {tenantBrand.logoDataUrl ? <img src={tenantBrand.logoDataUrl} alt="Tenant logo preview" className="h-full w-full object-contain p-2 bg-white" /> : <span className="text-2xl">SC</span>}
                      </div>
                      <div className="grid gap-2">
                        <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white" style={{ background: brandGradient }}>
                          Upload logo
                          <input type="file" accept="image/*" onChange={handleTenantLogoUpload} className="hidden" />
                        </label>
                        <button type="button" onClick={resetTenantBrand} className="min-h-9 rounded-full bg-[var(--crm-panel)] px-4 text-xs text-[var(--crm-muted)]">Reset</button>
                        <div className="flex justify-center gap-2">
                          {[tenantBrand.primary, tenantBrand.secondary, tenantBrand.surface].map((color) => <span key={color} className="h-5 w-5 rounded-full border border-[var(--crm-border)]" style={{ background: color }} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
                <h3 className="text-sm font-extrabold mb-1">Theme</h3>
                <p className="text-xs text-[var(--crm-muted)] mb-4">Change the CRM theme and column color system.</p>
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(THEMES) as ThemeId[]).map((themeId) => (
                    <button
                      key={themeId}
                      type="button"
                      onClick={() => applyTheme(themeId)}
                      className={`px-3 py-4 rounded-xl border text-xs font-bold capitalize ${theme === themeId ? 'border-[#776cf5] text-[#776cf5]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}
                    >
                      {themeId}
                    </button>
                  ))}
                </div>
              </div>
              </div>
            )}
          </section>
        )}
      </main>

      {operationModal && (
        <div className="fixed inset-0 z-[270] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">{operationModal.context}</p>
                <h3 className="mt-1 text-lg">{operationModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setOperationModal(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                aria-label="Close operation"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5">
              {operationModal.context === 'Dashboard' && operationModal.title === 'Add lead' && (
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Lead Capture</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Student name', 'Phone', 'WhatsApp', 'Email', 'Course interest', 'City'].map((field) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {['Hot', 'Warm', 'Cold'].map((priority, index) => (
                        <button key={priority} type="button" className={`rounded-xl px-3 py-2 text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>{priority}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">After Save</h4>
                    <div className="mt-4 space-y-2 text-xs">
                      {['Duplicate check by phone/email', 'Assign counselor', 'Create first follow-up', 'Send WhatsApp template'].map((item) => (
                        <div key={item} className="rounded-xl bg-[var(--crm-surface)] p-3">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operationModal.context === 'Dashboard' && operationModal.title === 'Current intake' && (
                <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                  <div className="rounded-2xl text-white p-5" style={{ background: brandGradient }}>
                    <p className="text-xs text-white/70">Active intake</p>
                    <p className="mt-4 text-4xl">2026</p>
                    <p className="mt-2 text-xs text-white/75">April 10 - May 11</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Applications open', 'Offer acceptance', 'Enrollment close'].map((item, index) => (
                      <button key={item} type="button" className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 text-left">
                        <p className="text-xs">{item}</p>
                        <p className="mt-3 text-2xl">{['Live', '12 days', '31 May'][index]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {crmOperationKind === 'filter' && (
                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">CRM Board Filters</h4>
                    <div className="mt-4 space-y-2">
                      {['Lead Source', 'Assigned To', 'Stage Duration', 'Date Range', 'Program', 'Priority', 'Global Status'].map((filter) => (
                        <button key={filter} type="button" className={`w-full rounded-xl px-3 py-2.5 text-left text-xs ${operationTitleLower.includes(filter.toLowerCase().split(' ')[0]) ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={operationTitleLower.includes(filter.toLowerCase().split(' ')[0]) ? { background: brandGradient } : undefined}>
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm">{operationModal.title}</h4>
                      <button type="button" onClick={() => showToast('Filters cleared')} className="rounded-xl bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]">Clear all</button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Google Ads', 'Walk-In', 'Referral', 'Facebook', 'B.Tech CSE', 'MBA', 'Hot', 'On Hold'].map((option, index) => (
                        <label key={option} className="flex items-center gap-3 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 text-xs">
                          <input type="checkbox" defaultChecked={index < 2} />
                          {option}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-[var(--tenant-surface)] p-3 text-xs text-[var(--tenant-primary)]">Applying this updates the Kanban board in real time without leaving the CRM screen.</div>
                  </div>
                </div>
              )}

              {crmOperationKind === 'board' && (
                <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Pipeline Stage</h4>
                    <div className="mt-4 grid gap-3">
                      {['Stage name', 'Column width', 'Accent color', 'Position'].map((field, index) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input defaultValue={index === 0 ? 'New CRM Stage' : ''} className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Stage Rules</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Allowed roles', 'Required fields on entry', 'WhatsApp automation', 'Archive permission', 'Manager approval', 'Audit required'].map((rule, index) => (
                        <label key={rule} className="flex items-center gap-3 rounded-xl bg-[var(--crm-surface)] p-3 text-xs">
                          <input type="checkbox" defaultChecked={index < 3} />
                          {rule}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-[var(--tenant-surface)] p-3 text-xs text-[var(--tenant-primary)]">Managers can add or rename columns. Counselors can only move leads within permitted stages.</div>
                  </div>
                </div>
              )}

              {crmOperationKind === 'lead' && operationContext !== 'Dashboard' && (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">{operationTitleLower.includes('open') ? 'Lead Detail' : 'Lead Capture'}</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Student name', 'Phone', 'WhatsApp', 'Email', 'Parent name', 'Parent phone', 'Course interest', 'City'].map((field) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input defaultValue={field === 'Student name' && operationTitleLower.includes('open') ? operationModal.title.replace('Open ', '') : ''} className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {['Hot', 'Warm', 'Cold'].map((priority, index) => (
                        <button key={priority} type="button" className={`rounded-xl px-3 py-2 text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>{priority}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Lead Workflow</h4>
                    <div className="mt-4 space-y-2">
                      {['Duplicate detection', 'Auto/manual assignment', 'First follow-up', 'Communication timeline', 'Audit log'].map((item, index) => (
                        <div key={item} className="rounded-xl bg-[var(--crm-surface)] p-3 text-xs">
                          <span className="mr-2 text-[var(--tenant-primary)]">{index + 1}</span>{item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {['Call', 'WhatsApp', 'Move stage', 'On Hold'].map((action) => (
                        <button key={action} type="button" onClick={() => showToast(`${action} opened`)} className="rounded-xl bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]">{action}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {crmOperationKind === 'assignment' && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Lead Assignment Engine</h4>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {['Workload', 'Source match', 'Program match', 'Response score'].map((metric, index) => (
                        <div key={metric} className="rounded-xl bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] text-[var(--crm-muted)]">{metric}</p>
                          <p className="mt-2 text-xl">{[72, 88, 64, 91][index]}%</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--crm-border)]">
                      {['Priya Sharma - 18 active leads', 'Arun Menon - 11 active leads', 'Divya Krishnan - 22 active leads'].map((row) => (
                        <button key={row} type="button" className="flex w-full justify-between border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs first:border-t-0 hover:bg-[var(--crm-surface)]"><span>{row}</span><span>Assign</span></button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Routing Rules</h4>
                    {['Digital sources auto-assign', 'Walk-In waits for manager', 'Referral assigned manually', 'Reassignment requires reason'].map((rule) => (
                      <div key={rule} className="mt-2 rounded-xl bg-[var(--crm-card)] p-3 text-xs">{rule}</div>
                    ))}
                  </div>
                </div>
              )}

              {crmOperationKind === 'communication' && (
                <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Communication Center</h4>
                    {['WhatsApp template', 'Email', 'Call log', 'Schedule follow-up'].map((channel, index) => (
                      <button key={channel} type="button" className={`mt-2 w-full rounded-xl px-3 py-2 text-left text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>{channel}</button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Message Composer</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Lead', 'Template', 'Channel', 'Schedule time'].map((field) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                    <textarea defaultValue="Hi {{student_name}}, this is a quick update from SuperCampus admissions." className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 text-xs outline-none" />
                  </div>
                </div>
              )}

              {crmOperationKind === 'status' && (
                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Global Status</h4>
                    {['Prospect', 'Deferred', 'On Hold', 'Archive'].map((status, index) => (
                      <button key={status} type="button" className={`mt-2 w-full rounded-xl px-3 py-2 text-left text-xs ${operationTitleLower.includes(status.toLowerCase()) ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={operationTitleLower.includes(status.toLowerCase()) ? { background: brandGradient } : undefined}>{status}</button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">{operationModal.title}</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Reason', 'Reminder date', 'Intake year', 'Manager approval'].map((field) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">Archive requires one of the 31 configured reasons. On Hold freezes progression but keeps the lead in its current stage.</div>
                  </div>
                </div>
              )}

              {crmOperationKind === 'export' && (
                <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Export Scope</h4>
                    {['Current board', 'Filtered leads', 'Counselor performance', 'Source ROI'].map((item, index) => (
                      <label key={item} className="mt-2 flex items-center gap-3 rounded-xl bg-[var(--crm-card)] p-3 text-xs">
                        <input type="radio" name="export-scope" defaultChecked={index === 0} />
                        {item}
                      </label>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Export Preview</h4>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                      {['Name', 'Masked phone', 'Source', 'Stage', 'Owner', 'Next follow-up', 'Priority', 'Audit id'].map((field) => (
                        <span key={field} className="rounded-xl bg-[var(--crm-surface)] p-3">{field}</span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-[var(--crm-muted)]">Manager-level exports include full phone/email. View-only marketing exports keep sensitive fields masked.</p>
                  </div>
                </div>
              )}

              {(operationModal.context.includes('Admission') || operationModal.title.includes('Admissions') || ['Review documents', 'Schedule exam', 'Issue offer', 'Convert to student', 'Send to finance', 'Process next applicant'].includes(operationModal.title)) && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Application Review Queue</h4>
                    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)]">
                      {['Rahul Kumar | B.Tech CSE | Documents verified | Fee paid', 'Priya Sharma | MBA | Income certificate pending | Partial fee', 'Vikram Iyer | BCA | Marksheet rejected | Unpaid'].map((row, index) => (
                        <button key={row} type="button" className="grid w-full grid-cols-[1fr_auto] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs first:border-t-0 hover:bg-[var(--crm-surface)]">
                          <span>{row}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] ${index === 0 ? 'bg-emerald-50 text-emerald-700' : index === 1 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{['Ready', 'Pending', 'Reupload'][index]}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {['Approve', 'Reject', 'Request document', 'Schedule interview'].map((action) => (
                        <button key={action} type="button" onClick={() => showToast(`${action} queued`)} className="rounded-xl bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">{action}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Conversion Checklist</h4>
                    <div className="mt-4 space-y-2">
                      {['Documents verified', 'Fee paid', 'Offer accepted', 'Seat available', 'No duplicate found'].map((item, index) => (
                        <label key={item} className="flex items-center gap-2 rounded-xl bg-[var(--crm-surface)] p-3 text-xs">
                          <input type="checkbox" defaultChecked={index < 3} />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operationModal.context.includes('Student') && (
                <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl text-white" style={{ background: brandGradient }}>ST</div>
                    <h4 className="mt-4 text-sm">{operationModal.title.replace('Open ', '')}</h4>
                    <p className="mt-1 text-xs text-[var(--crm-muted)]">B.Tech CSE / 2026</p>
                    <div className="mt-4 grid gap-2 text-xs">
                      {['Active app login', 'Fees clear', 'Hostel assigned', 'Documents verified'].map((item, index) => (
                        <span key={item} className={`rounded-xl p-3 ${index === 1 ? 'bg-amber-50 text-amber-700' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <div className="grid grid-cols-5 gap-2">
                      {['Profile', 'Parents', 'Attendance', 'Fees', 'Documents'].map((tab, index) => (
                        <button key={tab} type="button" className={`rounded-xl px-3 py-2 text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>{tab}</button>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Roll number', 'Program', 'Section', 'Parent phone', 'Attendance %', 'Outstanding fee'].map((item, index) => (
                        <div key={item} className="rounded-xl bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] text-[var(--crm-muted)]">{item}</p>
                          <p className="mt-1 text-sm">{['SC202601', 'B.Tech CSE', 'A', '+91-98765 43210', '86%', 'Rs. 0'][index]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operationModal.context.includes('Academics') || operationModal.context.includes('Timetable') ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Timetable / Academic Workspace</h4>
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {['P1', 'P2', 'P3', 'P4', 'P5'].map((period, periodIndex) => (
                        <div key={period} className="rounded-xl bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] text-[var(--crm-muted)]">{period}</p>
                          <p className="mt-3 text-xs">{['CSE Math', 'ECE Lab', 'MBA Finance', 'BCA Java', 'Free'][periodIndex]}</p>
                          <p className="mt-1 text-[10px] text-[var(--crm-muted)]">Room {301 + periodIndex}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">Conflict: Prof. Sharma already assigned in P2.</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Publish Controls</h4>
                    {['Check conflicts', 'Assign substitute', 'Notify students', 'Freeze editing'].map((item) => (
                      <button key={item} type="button" onClick={() => showToast(`${item} completed`)} className="mt-2 w-full rounded-xl bg-[var(--crm-card)] px-3 py-2 text-left text-xs">{item}</button>
                    ))}
                  </div>
                </div>
              ) : null}

              {(operationModal.context.includes('Finance') || operationModal.context.includes('Reconciliation')) && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Fee Ledger</h4>
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {['Tuition', 'Lab', 'Library', 'Transport'].map((head, index) => (
                        <div key={head} className="rounded-xl bg-[var(--crm-surface)] p-3">
                          <p className="text-[10px] text-[var(--crm-muted)]">{head}</p>
                          <p className="mt-2 text-lg">Rs. {[45000, 8000, 2500, 12000][index]}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--crm-border)] text-xs">
                      {['Invoice generated', 'Payment link sent', 'Partial payment received', 'Receipt pending'].map((item) => (
                        <button key={item} type="button" className="flex w-full justify-between border-t border-[var(--crm-border)] px-4 py-3 text-left first:border-t-0 hover:bg-[var(--crm-surface)]"><span>{item}</span><span>Open</span></button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl text-white p-5" style={{ background: brandGradient }}>
                    <p className="text-xs text-white/70">Amount due</p>
                    <p className="mt-4 text-4xl">Rs. 67,500</p>
                    <button type="button" onClick={() => showToast('Receipt generated')} className="mt-5 w-full rounded-xl bg-white px-3 py-2 text-xs text-[var(--tenant-primary)]">Generate receipt</button>
                  </div>
                </div>
              )}

              {(operationModal.context.includes('ERP') || operationModal.context.includes('Service Desk')) && (
                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">{operationModal.title}</h4>
                    <div className="mt-4 space-y-2">
                      {['New request', 'Assigned', 'In progress', 'Resolved'].map((stage, index) => (
                        <div key={stage} className="rounded-xl bg-[var(--crm-surface)] p-3 text-xs">
                          <div className="flex justify-between"><span>{stage}</span><span>{[12, 8, 5, 21][index]}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Room allocation', 'Route assignment', 'Book issue', 'Gate QR', 'Maintenance ticket', 'No due'].map((item) => (
                      <button key={item} type="button" onClick={() => showToast(`${item} opened`)} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4 text-left text-xs hover:bg-[var(--crm-panel)]">
                        <Layers size={16} className="text-[var(--tenant-primary)]" />
                        <p className="mt-4">{item}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(operationModal.context.includes('Report') || operationModal.context.includes('BI')) && (
                <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">Report Builder</h4>
                    {['Data source', 'Fields', 'Filters', 'Grouping', 'Export'].map((item, index) => (
                      <button key={item} type="button" className={`mt-2 w-full rounded-xl px-3 py-2 text-left text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>{item}</button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Dashboard Preview</h4>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {['Admissions', 'Finance', 'ERP'].map((item, index) => (
                        <div key={item} className="rounded-xl bg-[var(--crm-card)] p-4">
                          <p className="text-xs text-[var(--crm-muted)]">{item}</p>
                          <p className="mt-2 text-2xl">{[68, 82, 74][index]}%</p>
                          <div className="mt-3 h-2 rounded-full bg-[var(--crm-panel)]"><span className="block h-full rounded-full bg-[var(--tenant-primary)]" style={{ width: `${[68, 82, 74][index]}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operationModal.context.includes('Integration') && (
                <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Connection Status</h4>
                    {['Credentials', 'Webhook', 'Test sync', 'Go live'].map((item, index) => (
                      <div key={item} className="mt-2 rounded-xl bg-[var(--crm-card)] p-3 text-xs">
                        <span className="mr-2 text-[var(--tenant-primary)]">{index + 1}</span>{item}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">{operationModal.title}</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {['Provider', 'API key', 'Webhook URL', 'Sync direction'].map((field) => (
                        <label key={field} className="text-[11px] text-[var(--crm-muted)]">
                          {field}
                          <input className="mt-1 h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs outline-none" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operationModal.context.includes('Workflow') && (
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                  <h4 className="text-sm">Route Builder</h4>
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    {['Trigger', 'Counselor', 'Manager', 'Finance', 'ERP Sync'].map((step, index) => (
                      <button key={step} type="button" className="rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs">
                        <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: brandGradient }}>{index + 1}</span>
                        <p className="mt-3">{step}</p>
                        <p className="mt-1 text-[10px] text-[var(--crm-muted)]">SLA {index + 1} day</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!operationHasFeatureWorkspace && (
                <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">{operationModal.context}</h4>
                    <div className="mt-4 space-y-2">
                      {(activeAdminScreen?.operations ?? ['Create', 'Review', 'Assign', 'Export']).slice(0, 5).map((action, index) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => showToast(`${action} selected`)}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs ${index === 0 ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`}
                          style={index === 0 ? { background: brandGradient } : undefined}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
                    <h4 className="text-sm">{operationModal.title}</h4>
                    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--crm-border)]">
                      {(activeAdminRecords.length ? activeAdminRecords : [
                        { Name: 'Rahul Kumar', Status: 'Hot', Owner: 'Priya', Next: 'Today' },
                        { Name: 'Ananya Gupta', Status: 'Warm', Owner: 'Arun', Next: 'Tomorrow' },
                        { Name: 'Deepak Raja', Status: 'Cold', Owner: 'Divya', Next: 'Friday' },
                      ]).slice(0, 5).map((record, index) => (
                        <button key={index} type="button" className="grid w-full grid-cols-[1fr_auto] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs first:border-t-0 hover:bg-[var(--crm-surface)]">
                          <span>{Object.values(record)[0]}</span>
                          <span className="rounded-full bg-[var(--crm-panel)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{Object.values(record)[2] ?? 'Open'}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {['Call', 'WhatsApp', 'Follow-up'].map((action) => (
                        <button key={action} type="button" onClick={() => showToast(`${action} action opened`)} className="rounded-xl bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]">{action}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setOperationModal(null)} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-2.5 text-xs text-[var(--crm-muted)]">Close</button>
                <button type="button" onClick={completeOperation} className="rounded-xl px-4 py-2.5 text-xs text-white" style={{ background: brandGradient }}>{operationModal.confirmLabel ?? 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {infoModalOpen && requirementPage && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">How this page works</p>
                <h3 className="mt-1 text-lg">{NAV_TITLES[activeNav]}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                aria-label="Close page information"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              <p className="text-sm leading-6 text-[var(--crm-muted)]">{requirementPage.description}</p>

              {workArea && (
                <div className="mt-5 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                  <h4 className="text-sm">{workArea.flowTitle}</h4>
                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    {workArea.flowSteps.map((step, index) => (
                      <div key={step.title} className="rounded-xl bg-[var(--crm-card)] p-3">
                        <span className="grid h-7 w-7 place-items-center rounded-lg text-[10px] text-white" style={{ background: index === 0 ? brandGradient : 'var(--tenant-primary)' }}>{index + 1}</span>
                        <p className="mt-3 text-xs">{step.title}</p>
                        <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{step.owner}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeAdminScreen && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">{activeAdminScreen.label} actions</h4>
                    <div className="mt-3 space-y-2">
                      {activeAdminScreen.operations.map((operation) => (
                        <div key={operation} className="rounded-xl bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">{operation}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Filters and tools</h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...(activeAdminScreen.filters ?? []), ...(activeAdminScreen.special ?? [])].map((item) => (
                        <span key={item} className="rounded-full bg-[var(--crm-card)] px-3 py-1.5 text-[11px] text-[var(--crm-muted)]">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {accessModal && (
        <div className="fixed inset-0 z-[275] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Access setup</p>
                <h3 className="mt-1 text-lg">
                  {accessModal === 'role' && 'Step 1: Select role'}
                  {accessModal === 'module' && 'Step 2: Select module'}
                  {accessModal === 'crud' && 'Step 3: Feature CRUD permissions'}
                  {accessModal === 'users' && 'Step 4: Assign users'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAccessModal(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                aria-label="Close access setup"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {accessModal === 'role' && (
                <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                  <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Create role</p>
                    <input value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} placeholder="Role name" className="mt-3 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                    <input value={newRoleTeam} onChange={(event) => setNewRoleTeam(event.target.value)} placeholder="Department / team" className="mt-2 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                    <button type="button" onClick={addCollegeRole} className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Add role</button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {filteredCollegeRoles.map((role) => {
                      const rolePermissions = roleAccess[role.id] ?? [];
                      const roleCoverage = allPermissionKeys.length ? Math.round((rolePermissions.length / allPermissionKeys.length) * 100) : 0;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedAccessRoleId(role.id)}
                          className={`rounded-xl border p-4 text-left ${selectedAccessRole.id === role.id ? 'border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_8%,var(--crm-surface))]' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm">{role.name}</p>
                              <p className="mt-1 text-[10px] uppercase text-[var(--crm-muted)]">{role.team}</p>
                            </div>
                            <span className="rounded-lg bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">{roleCoverage}%</span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-[11px] text-[var(--crm-muted)]">{role.scope}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {accessModal === 'module' && (
                <div className="grid gap-3 md:grid-cols-3">
                  {operationModules.map((module) => {
                    const moduleKeys = modulePermissionKeys(module);
                    const enabledCount = moduleKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                    const progress = moduleKeys.length ? Math.round((enabledCount / moduleKeys.length) * 100) : 0;
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccessModuleId(module.id);
                          setFeatureModuleId(module.id);
                        }}
                        className={`rounded-xl border p-4 text-left ${selectedAccessModule.id === module.id ? 'border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_8%,var(--crm-surface))]' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm">{module.name}</p>
                          <span className="text-[10px] text-[var(--crm-muted)]">{progress}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--crm-card)]">
                          <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--tenant-primary), var(--tenant-secondary))' }} />
                        </div>
                        <p className="mt-3 line-clamp-2 text-[11px] text-[var(--crm-muted)]">{module.features.slice(0, 4).join(', ')}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {accessModal === 'crud' && (
                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm">{selectedAccessModule.name}</p>
                      <p className="mt-1 text-xs text-[var(--crm-muted)]">Choose Create, Read, Update, Delete for each feature.</p>
                    </div>
                    <button type="button" onClick={() => toggleRoleModule(selectedAccessRole.id, selectedAccessModule.id)} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2 text-xs text-[var(--crm-muted)]">
                      {selectedModuleFullyEnabled ? 'Clear module' : 'Enable module'}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {selectedAccessModule.features.map((feature) => {
                      const crudKeys = featurePermissionKeys(selectedAccessModule.id, feature);
                      const enabledCount = crudKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                      return (
                        <div key={feature} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm">{feature}</p>
                              <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{enabledCount}/4 actions enabled</p>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {CRUD_ACTIONS.map((action) => {
                                const permissionKey = permissionKeyFor(selectedAccessModule.id, feature, action.id);
                                const enabled = selectedRolePermissionSet.has(permissionKey);
                                return (
                                  <button
                                    key={permissionKey}
                                    type="button"
                                    onClick={() => toggleRolePermission(selectedAccessRole.id, permissionKey)}
                                    title={action.id}
                                    className={`h-10 w-10 rounded-xl border text-xs ${enabled ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)]'}`}
                                  >
                                    {action.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {accessModal === 'users' && (
                <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                  <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Add user to {selectedAccessRole.name}</p>
                    <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="User name" className="mt-3 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                    <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="Email" className="mt-2 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none" />
                    <button type="button" onClick={addUserUnderRole} className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Add user</button>
                  </div>
                  <div className="grid gap-2">
                    {selectedRoleUsers.length ? selectedRoleUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl text-xs text-white" style={{ background: brandGradient }}>{user.initials}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm">{user.name}</p>
                          <p className="truncate text-[10px] text-[var(--crm-muted)]">{user.email}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] p-6 text-xs text-[var(--crm-muted)]">No users assigned to this role yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--crm-border)] px-5 py-4">
              <p className="text-xs text-[var(--crm-muted)]">{selectedAccessRole.name} / {selectedAccessModule.name}</p>
              <button type="button" onClick={() => setAccessModal(null)} className="rounded-xl px-4 py-2 text-xs text-white" style={{ background: brandGradient }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {formDraft && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] px-6 py-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">{formBuilders.some((form) => form.id === formDraft.id) ? 'Edit builder' : 'Create builder'}</p>
                <h3 className="mt-1 truncate text-lg leading-tight">{formDraft.name || 'Untitled Form'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setFormDraft(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                aria-label="Close builder editor"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid max-h-[70vh] gap-5 overflow-y-auto p-5 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid content-start gap-4">
                <div
                  className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_7%,var(--crm-surface))] p-6 text-center"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={handleFormPreviewDrop}
                >
                  <div className="w-full">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Drop fields here</p>
                    <h4 className="mt-2 text-xl">Add fields to {formDraft.name || 'this builder'}</h4>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[var(--crm-muted)]">Drag a field from the palette and drop it in this area. Clicking a palette field also adds it to the selected builder.</p>
                    <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
                      {formDraftSchema.flatMap((section, sectionIndex) => section.fields.map((field, fieldIndex) => {
                        const fieldKey = `${sectionIndex}:${fieldIndex}`;
                        return (
                          <button
                            key={`${section.section}-${field.label}-${fieldIndex}`}
                            type="button"
                            onClick={() => setSelectedFieldKey(fieldKey)}
                            className={`rounded-xl border bg-[var(--crm-card)] p-3 text-left transition-colors ${
                              field.width === 'full' ? 'sm:col-span-2' : ''
                            } ${
                              selectedFieldKey === fieldKey
                                ? 'border-[var(--tenant-primary)] ring-2 ring-[color-mix(in_srgb,var(--tenant-primary)_16%,transparent)]'
                                : 'border-[var(--crm-border)] hover:border-[var(--tenant-primary)]'
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2 text-[11px] text-[var(--crm-muted)]">
                              <span className="min-w-0 truncate">{field.label}</span>
                              <span className="flex shrink-0 items-center gap-1">
                                {field.required && <span className="text-[#ef4444]">Required</span>}
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openFieldEditor(fieldKey, field);
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      openFieldEditor(fieldKey, field);
                                    }
                                  }}
                                  className="grid h-6 w-6 place-items-center rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--tenant-primary)]"
                                  aria-label={`Edit ${field.label}`}
                                >
                                  <Pencil size={12} />
                                </span>
                              </span>
                            </span>
                            <div className="mt-2 h-9 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-panel)] px-3 text-[10px] leading-9 text-[var(--crm-muted)]">{field.type}</div>
                          </button>
                        );
                      }))}
                    </div>
                    {countSchemaFields(formDraftSchema) === 0 && (
                      <div className="mt-5 rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-8 text-xs text-[var(--crm-muted)]">
                        No fields yet.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Builder details</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <span className="rounded-lg bg-[var(--crm-card)] px-3 py-2 text-[11px] text-[var(--crm-muted)]">{formDraft.module}</span>
                    <span className="rounded-lg bg-[var(--crm-card)] px-3 py-2 text-[11px] text-[var(--crm-muted)]">{formDraft.owner}</span>
                    <span className="rounded-lg bg-[var(--crm-card)] px-3 py-2 text-[11px] text-[var(--crm-muted)]">{formDraft.status}</span>
                    <span className="rounded-lg bg-[var(--crm-card)] px-3 py-2 text-[11px] text-[var(--crm-muted)]">{countSchemaFields(formDraftSchema)} fields</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Field palette</p>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_PALETTE.map((field) => {
                    const Icon = field.icon;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        draggable
                        onDragStart={(event) => handlePaletteFieldDragStart(event, field.id)}
                        onClick={() => addFieldToSelectedForm(field)}
                        className="min-h-11 w-full cursor-grab flex items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2.5 py-2 text-left text-[10px] leading-tight text-[var(--crm-muted)] hover:border-[var(--tenant-primary)] hover:text-[var(--crm-text)] active:cursor-grabbing"
                      >
                        <Icon size={13} className="shrink-0" />
                        <span className="min-w-0 break-words">{field.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[var(--crm-border)] px-5 py-4">
              <button type="button" onClick={() => setFormDraft(null)} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2.5 text-xs text-[var(--crm-muted)] hover:text-[var(--crm-text)]">Cancel</button>
              <button type="button" onClick={saveFormDraft} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                <Save size={14} />
                Save builder
              </button>
            </div>
          </div>
        </div>
      )}

      {fieldDraft && (
        <div className="fixed inset-0 z-[285] flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Field settings</p>
                <h3 className="mt-1 text-lg">{fieldDraft.field.label || 'Untitled Field'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setFieldDraft(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                aria-label="Close field settings"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <label className="text-xs text-[var(--crm-muted)]">
                Field label
                <input
                  value={fieldDraft.field.label}
                  onChange={(event) => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, label: event.target.value } })}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-sm text-[var(--crm-text)] outline-none"
                  placeholder="Student name"
                />
              </label>
              <label className="text-xs text-[var(--crm-muted)]">
                Input type
                <select
                  value={fieldDraft.field.type}
                  onChange={(event) => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, type: event.target.value } })}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-sm text-[var(--crm-text)] outline-none"
                >
                  {FIELD_PALETTE.map((field) => <option key={field.id} value={field.type}>{field.type}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, required: !fieldDraft.field.required } })}
                  className={`rounded-xl border px-4 py-3 text-xs ${fieldDraft.field.required ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}
                >
                  Required
                </button>
                <button
                  type="button"
                  onClick={() => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, width: fieldDraft.field.width === 'full' ? 'half' : 'full' } })}
                  className="rounded-xl border border-[var(--crm-border)] px-4 py-3 text-xs text-[var(--crm-muted)]"
                >
                  {fieldDraft.field.width === 'full' ? 'Full width' : 'Half width'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--crm-border)] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedFieldKey(fieldDraft.key);
                  removeSelectedField();
                  showToast('Field deleted');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setFieldDraft(null)} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2.5 text-xs text-[var(--crm-muted)] hover:text-[var(--crm-text)]">Cancel</button>
                <button type="button" onClick={saveFieldDraft} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                  <Save size={14} />
                  Save field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 bg-[var(--crm-text)] text-[var(--crm-bg)] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
