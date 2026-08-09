'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS } from '@/lib/kanban/kanban-data';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import ActivityFeed from '@/components/kanban/ActivityFeed';
import { AdmissionsSidebar } from '@/components/modules/AdmissionsSidebar';
import { ApplicationDeskWorkspace } from '@/components/modules/ApplicationDeskWorkspace';
import {
  availableStaffNavigation,
  availableStaffSettings,
  dashboardCapabilities,
  hasPermission,
  type StaffNavigationId,
  type StaffSettingsId,
} from '@/lib/staff-access';
import { useApp } from '@/lib/context';
import {
  bulkImportCrmLeads,
  createCrmForm,
  getCrmBoard,
  getCrmForms,
  getCrmOperationsDashboard,
  getPublishedCrmLeadCaptureForm,
  publishCrmForm,
  submitCrmForm,
  unpublishCrmForm,
  updateCrmForm,
  type BulkImportLeadRow,
  type BulkImportLeadsResponse,
  type CrmForm,
  type CrmLead,
  type CrmOperationsDashboard,
} from '@/lib/crm-api';
import {
  assignTenantUserRoles,
  createAuthorizationRole,
  createTenantUser,
  getAuthorizationPermissions,
  getAuthorizationRoles,
  getTenantUsers,
  setAuthorizationRolePermissions,
  type AuthorizationPermission,
  type AuthorizationRole,
  type PermissionScope,
  type TenantUser,
} from '@/lib/authorization-api';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, BarChart3, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Clock, Database, FileText, Grip, GripVertical, Info, LayoutDashboard, Layers, ListChecks, LogOut, Mail, MapPin, Monitor, Moon, MoreHorizontal, Pencil, PhoneCall, PlusCircle, RefreshCw, Save, Search, ShieldCheck, SlidersHorizontal, Smartphone, Sun, Target, TrendingUp, Trash2, UploadCloud, User, UserCog, Users, X } from 'lucide-react';

type NavSection = StaffNavigationId;
type ThemeId = 'classic' | 'ocean' | 'emerald' | 'midnight';
type SettingsSection = StaffSettingsId;
type PreviewMode = 'desktop' | 'mobile';
type CollegeRole = { id: string; name: string; team: string; scope: string; moduleIds: string[]; protected?: boolean };
type OperationModule = {
  id: string;
  name: string;
  features: string[];
  permissionCells?: Record<string, Partial<Record<CrudAction, string[]>>>;
};
type StaffUser = { id: string; name: string; email: string; initials: string; role: string; roleId: string; roleIds: string[]; team: string; access: string[] };
type TenantBrand = { logoDataUrl: string | null; primary: string; secondary: string; surface: string };
type FormBuilder = { id: string; name: string; module: string; formType: string; fields: number; status: string; owner: string; usage: string };
type FormField = {
  key?: string;
  label: string;
  type: string;
  required?: boolean;
  width?: 'half' | 'full';
  placeholder?: string;
  helpText?: string;
  options?: string[];
};
type FormSchemaSection = { section: string; fields: FormField[] };
type FormDraft = Pick<FormBuilder, 'id' | 'name' | 'module' | 'formType' | 'status' | 'owner' | 'usage'>;
type LeadImportField = 'name' | 'email' | 'phone' | 'whatsapp' | 'program' | 'source' | 'priority' | 'parentName' | 'parentPhone';
type LeadImportMapping = Record<LeadImportField, string>;
type LeadImportPreviewRow = {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  program: string;
  source: string;
  issue: string | null;
  duplicateInFile: boolean;
  payload: BulkImportLeadRow;
};
type FieldDraft = { key: string; field: FormField };
type FieldPaletteItem = { id: string; label: string; type: string; icon: LucideIcon };
type AccessModal = 'role' | 'module' | 'crud' | 'users' | null;
type OperationModal = { title: string; context: string; fields: string[]; confirmLabel?: string } | null;
type RequirementGroup = { title: string; description: string; items: string[] };
type RequirementPage = { eyebrow: string; title: string; description: string; stats: string[]; groups: RequirementGroup[] };

const FORM_MODULE_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  CRM: [
    { value: 'lead_capture', label: 'Lead capture' },
    { value: 'enquiry', label: 'Enquiry' },
    { value: 'counselor_follow_up', label: 'Counselor follow-up' },
  ],
  Admissions: [
    { value: 'application', label: 'Application' },
    { value: 'document_checklist', label: 'Document checklist' },
    { value: 'interview', label: 'Interview' },
  ],
  Students: [
    { value: 'student_profile', label: 'Student profile' },
    { value: 'service_request', label: 'Service request' },
  ],
  Academics: [
    { value: 'academic_request', label: 'Academic request' },
    { value: 'feedback', label: 'Feedback' },
  ],
  Fees: [
    { value: 'fee_request', label: 'Fee request' },
    { value: 'concession', label: 'Concession' },
  ],
  ERP: [
    { value: 'erp_service_request', label: 'ERP service request' },
    { value: 'approval', label: 'Approval' },
  ],
};

const CHOICE_FIELD_TYPES = new Set(['Dropdown', 'Multi select', 'Radio group']);

function formTypeLabel(module: string, formType: string) {
  return FORM_MODULE_TYPES[module]?.find((candidate) => candidate.value === formType)?.label
    ?? formType.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function fieldPreviewText(field: FormField) {
  if (CHOICE_FIELD_TYPES.has(field.type)) {
    return field.options?.length ? field.options.join('  ·  ') : 'No choices configured';
  }
  return field.placeholder?.trim() || field.type;
}

const LEAD_IMPORT_COLUMNS: Array<{ key: LeadImportField; label: string; required?: boolean; aliases: string[] }> = [
  { key: 'name', label: 'Student name', required: true, aliases: ['name', 'studentname', 'fullname', 'applicantname'] },
  { key: 'email', label: 'Email', aliases: ['email', 'emailaddress', 'studentemail'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'mobilenumber', 'phonenumber', 'studentphone'] },
  { key: 'whatsapp', label: 'WhatsApp', aliases: ['whatsapp', 'whatsappnumber'] },
  { key: 'program', label: 'Program/course', aliases: ['program', 'course', 'programname', 'coursetype'] },
  { key: 'source', label: 'Source', aliases: ['source', 'leadsource', 'channel'] },
  { key: 'priority', label: 'Priority', aliases: ['priority', 'leadpriority'] },
  { key: 'parentName', label: 'Parent name', aliases: ['parentname', 'guardianname'] },
  { key: 'parentPhone', label: 'Parent phone', aliases: ['parentphone', 'guardianphone', 'parentmobile'] },
];

const EMPTY_LEAD_IMPORT_MAPPING: LeadImportMapping = {
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  program: '',
  source: '',
  priority: '',
  parentName: '',
  parentPhone: '',
};

function normalizedCsvHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function autoMapLeadImportHeaders(headers: string[]): LeadImportMapping {
  const mapping = { ...EMPTY_LEAD_IMPORT_MAPPING };
  for (const column of LEAD_IMPORT_COLUMNS) {
    const match = headers.find((header) => column.aliases.includes(normalizedCsvHeader(header)));
    if (match) mapping[column.key] = match;
  }
  return mapping;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (quoted) throw new Error('The CSV contains an unclosed quoted value');
  return rows;
}
function CrmMultiSelectInput({
  options = ['abcd', 'efgh', 'Tamil Nadu', 'Sikkim', 'Telangana', 'Tripura', 'Uttar Pradesh', 'West Bengal'],
  value = '',
  onChange,
  placeholder = 'Select options...',
}: {
  options?: string[];
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = useMemo(
    () => value.split(',').map((opt) => opt.trim()).filter(Boolean),
    [value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    let next: string[];
    if (selectedValues.includes(opt)) {
      next = selectedValues.filter((v) => v !== opt);
    } else {
      next = [...selectedValues, opt];
    }
    onChange(next.join(', '));
  };

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative mt-1">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-h-10 w-full cursor-pointer rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 flex items-center justify-between gap-2 text-xs text-[var(--crm-text)] transition-colors hover:border-[var(--tenant-primary)] shadow-2xs"
      >
        <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
          {selectedValues.length > 0 ? (
            selectedValues.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--tenant-surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--tenant-primary)] border border-[color-mix(in_srgb,var(--tenant-primary)_20%,transparent)]"
              >
                {val}
                <X
                  size={11}
                  className="cursor-pointer hover:opacity-75"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(val);
                  }}
                />
              </span>
            ))
          ) : (
            <span className="text-[var(--crm-muted)]">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`shrink-0 text-[var(--crm-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-[300] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-xl p-2 space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--crm-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="h-8 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] pl-8 pr-2.5 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
            />
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <div
                  key={option}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-[var(--tenant-surface)] font-bold text-[var(--tenant-primary)]'
                      : 'hover:bg-[var(--crm-surface)] text-[var(--crm-text)]'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check size={14} className="text-[var(--tenant-primary)] shrink-0" />}
                </div>
              );
            })
          ) : (
            <div className="p-2 text-center text-xs text-[var(--crm-muted)]">No matching options</div>
          )}
        </div>
      )}
    </div>
  );
}

function CrmAddressBlockInput({
  value = '',
  onChange,
}: {
  value?: string;
  onChange: (val: string) => void;
}) {
  const parseAddress = (str: string) => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null
        ? { country: '', street: '', city: '', state: '', zip: '', lat: '', lng: '', ...parsed }
        : { country: '', street: str, city: '', state: '', zip: '', lat: '', lng: '' };
    } catch {
      return { country: '', street: str, city: '', state: '', zip: '', lat: '', lng: '' };
    }
  };

  const [addr, setAddr] = useState(() => parseAddress(value));

  const updateSubField = (fieldKey: string, val: string) => {
    const updated = { ...addr, [fieldKey]: val };
    setAddr(updated);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="mt-1.5 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--crm-text)] border-b border-[var(--crm-border)] pb-2.5">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} className="text-[var(--tenant-primary)]" />
          <span>Address Information</span>
        </span>
        <MoreHorizontal size={14} className="text-[var(--crm-muted)] cursor-pointer hover:text-[var(--crm-text)]" />
      </div>

      <div className="grid gap-2.5">
        <input
          type="text"
          placeholder="Country / Region"
          value={addr.country}
          onChange={(e) => updateSubField('country', e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
        />
        <input
          type="text"
          placeholder="Street Address"
          value={addr.street}
          onChange={(e) => updateSubField('street', e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
        />
        <input
          type="text"
          placeholder="City"
          value={addr.city}
          onChange={(e) => updateSubField('city', e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
        />
        <input
          type="text"
          placeholder="State / Province"
          value={addr.state}
          onChange={(e) => updateSubField('state', e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
        />
        <input
          type="text"
          placeholder="Zip / Postal Code"
          value={addr.zip}
          onChange={(e) => updateSubField('zip', e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Latitude"
            value={addr.lat}
            onChange={(e) => updateSubField('lat', e.target.value)}
            className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
          />
          <input
            type="text"
            placeholder="Longitude"
            value={addr.lng}
            onChange={(e) => updateSubField('lng', e.target.value)}
            className="h-9 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
          />
        </div>
      </div>
    </div>
  );
}

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

const pipelineStatus = (value: string) => value.replaceAll('_', '-');

function recordText(record: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!record || typeof record !== 'object') return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function toKanbanLead(lead: CrmLead): Lead {
  const name = lead.fullName?.trim() || 'Unnamed lead';
  const interestRecord = (lead.interest || (lead.customFields?.interest as Record<string, unknown>)) ?? {};
  const course = recordText(interestRecord, ['programName', 'program_name', 'programId', 'program_id']);
  const intake = recordText(interestRecord, ['intake', 'intakeYear', 'intake_year']);
  const city = recordText(lead.customFields, ['city']);
  return {
    id: lead.id,
    name,
    initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'UL',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    course: course ?? 'Not provided',
    intake: intake ?? 'Not provided',
    source: lead.source,
    city: city ?? 'Not provided',
    assignedTo: { name: lead.assignedTo ?? 'Unassigned' },
    status: pipelineStatus(lead.stageKey),
    documents: { uploaded: lead.documentsVerified ? 1 : 0, required: 1 },
    communicationCount: 0,
    nextFollowUp: lead.followUpAt,
    lastContact: new Date(lead.updatedAt).toLocaleString(),
    parent: { name: lead.parentName ?? 'Not provided', phone: lead.parentPhone ?? '', relation: 'Parent' },
    createdAt: lead.createdAt,
    moveHistory: [],
    tags: [lead.priority],
  };
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-item';
const initialsFromName = (value: string) => value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
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


const NAV_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  pipeline: 'Admissions Pipeline',
  admissions: 'Admissions',
  'application-desk': 'Application Desk',
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
const permissionKeysFor = (module: OperationModule, feature: string, action: CrudAction) => (
  module.permissionCells?.[feature]?.[action] ?? []
);
const featurePermissionKeys = (module: OperationModule, feature: string) => (
  Array.from(new Set(CRUD_ACTIONS.flatMap((action) => permissionKeysFor(module, feature, action.id))))
);
const modulePermissionKeys = (module: OperationModule) => (
  Array.from(new Set(module.features.flatMap((feature) => featurePermissionKeys(module, feature))))
);
const EMPTY_PERMISSION_KEYS: string[] = [];

const permissionLabel = (key: string) => key
  .split(/[._-]/)
  .filter(Boolean)
  .map((part) => part.toUpperCase() === 'CRM' || part.toUpperCase() === 'ERP'
    ? part.toUpperCase()
    : `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
  .join(' ');

function buildOperationModules(permissions: AuthorizationPermission[]): OperationModule[] {
  const modules = new Map<string, OperationModule>();
  permissions.filter((permission) => permission.active && permission.key !== '*').forEach((permission) => {
    const current = modules.get(permission.moduleKey) ?? {
      id: permission.moduleKey,
      name: permission.moduleKey === 'authorization' ? 'Users & Roles' : permissionLabel(permission.moduleKey),
      features: [],
      permissionCells: {},
    };
    const feature = permissionLabel(permission.featureKey);
    if (!current.features.includes(feature)) current.features.push(feature);
    current.permissionCells ??= {};
    current.permissionCells[feature] ??= {};
    permission.crudActions.forEach((action) => {
      const keys = current.permissionCells?.[feature]?.[action] ?? [];
      if (!keys.includes(permission.key)) keys.push(permission.key);
      current.permissionCells![feature][action] = keys;
    });
    modules.set(permission.moduleKey, current);
  });
  return Array.from(modules.values());
}

function formSchemaFromApi(form: CrmForm): FormSchemaSection[] {
  if (Array.isArray(form.schema)) return form.schema as FormSchemaSection[];
  if (!form.schema || typeof form.schema !== 'object') return [];
  const schema = form.schema as { sections?: unknown };
  return Array.isArray(schema.sections) ? schema.sections as FormSchemaSection[] : [];
}

function formBuilderFromApi(form: CrmForm): FormBuilder {
  const schema = form.schema && typeof form.schema === 'object'
    ? form.schema as { metadata?: { module?: string; owner?: string; usage?: string } }
    : {};
  const sections = formSchemaFromApi(form);
  return {
    id: form.id,
    name: form.name,
    module: schema.metadata?.module ?? (form.formType === 'lead_capture' ? 'CRM' : 'Admissions'),
    formType: form.formType,
    fields: countSchemaFields(sections),
    status: form.status === 'published' ? 'Live' : form.status === 'archived' ? 'Archived' : 'Draft',
    owner: schema.metadata?.owner ?? 'Tenant Admin',
    usage: schema.metadata?.usage ?? 'Tenant workflow',
  };
}

const EMPTY_ROLE: CollegeRole = {
  id: '',
  name: 'No role selected',
  team: '',
  scope: '',
  moduleIds: [],
};
const EMPTY_MODULE: OperationModule = {
  id: '',
  name: 'No permission module',
  features: [],
  permissionCells: {},
};
const EMPTY_FORM: FormBuilder = {
  id: '',
  name: 'No forms created',
  module: 'CRM',
  formType: 'lead_capture',
  fields: 0,
  status: 'Draft',
  owner: '',
  usage: 'Create a tenant form to begin',
};

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
  const { student, authStatus, logout } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [crmDashboard, setCrmDashboard] = useState<CrmOperationsDashboard | null>(null);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmError, setCrmError] = useState<string | null>(null);
  const permissions = useMemo(() => student?.access ?? [], [student?.access]);
  const allowedNavigation = useMemo(() => availableStaffNavigation(permissions), [permissions]);
  const allowedSettings = useMemo(() => availableStaffSettings(permissions), [permissions]);
  const dashboardAccess = useMemo(() => dashboardCapabilities(permissions), [permissions]);
  const roleId = student?.role ?? (hasPermission(permissions, 'authorization.roles.update') || hasPermission(permissions, 'authorization.users.create') ? 'admin' : 'counselor');
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [theme, setTheme] = useState<ThemeId>('classic');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('account');
  const canReadLeads = hasPermission(permissions, 'crm.leads.read');
  const canReadCrmDashboard = hasPermission(permissions, 'crm.dashboard.read');
  const canCreateLeads = hasPermission(permissions, 'crm.leads.create');
  const canUpdateLeads = hasPermission(permissions, 'crm.leads.update');
  const canImportLeads = hasPermission(permissions, 'crm.leads.import');
  const canAssignLeads = hasPermission(permissions, 'crm.leads.assign')
    || hasPermission(permissions, 'crm.leads.claim');
  const canMoveLeadStage = hasPermission(permissions, 'crm.leads.stage.move');
  const canHoldLeads = hasPermission(permissions, 'crm.leads.hold');
  const canSendCrmCommunications = hasPermission(permissions, 'crm.communications.send');
  const canReadCrmConfiguration = hasPermission(permissions, 'crm.configuration.read');
  const canUpdateCrmConfiguration = hasPermission(permissions, 'crm.configuration.update');
  const canTriggerErpHandoff = hasPermission(permissions, 'crm.erp.handoff');
  const canCreateCampaigns = hasPermission(permissions, 'crm.campaigns.create');
  const canCreateForms = hasPermission(permissions, 'crm.forms.create');
  const canReadForms = hasPermission(permissions, 'crm.forms.read');
  const canReadPermissionCatalog = hasPermission(permissions, 'authorization.permissions.read');
  const canReadRoles = hasPermission(permissions, 'authorization.roles.read');
  const canReadUsers = hasPermission(permissions, 'authorization.users.read');
  const canCreateRoles = hasPermission(permissions, 'authorization.roles.create');
  const canUpdateRoles = hasPermission(permissions, 'authorization.roles.update');
  const canCreateUsers = hasPermission(permissions, 'authorization.users.create');
  const canUpdateUsers = hasPermission(permissions, 'authorization.users.update');
  const canUpdateForms = hasPermission(permissions, 'crm.forms.update');
  const canPublishForms = hasPermission(permissions, 'crm.forms.publish');
  const [formBuilders, setFormBuilders] = useState<FormBuilder[]>([]);
  const [formSchemas, setFormSchemas] = useState<Record<string, FormSchemaSection[]>>({});
  const [selectedFormId, setSelectedFormId] = useState('');
  const [publishedLeadForm, setPublishedLeadForm] = useState<CrmForm | null>(null);
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FieldDraft | null>(null);
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [collegeRoles, setCollegeRoles] = useState<CollegeRole[]>([]);
  const [operationModules, setOperationModules] = useState<OperationModule[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [selectedAccessRoleId, setSelectedAccessRoleId] = useState('');
  const [selectedAccessModuleId, setSelectedAccessModuleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [roleAccess, setRoleAccess] = useState<Record<string, string[]>>({});
  const [roleScopes, setRoleScopes] = useState<Record<string, Record<string, PermissionScope>>>({});
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleTeam, setNewRoleTeam] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [featureModuleId, setFeatureModuleId] = useState('');
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
  const [operationValues, setOperationValues] = useState<Record<string, string>>({});
  const [leadImportFileName, setLeadImportFileName] = useState('');
  const [leadImportHeaders, setLeadImportHeaders] = useState<string[]>([]);
  const [leadImportRows, setLeadImportRows] = useState<string[][]>([]);
  const [leadImportMapping, setLeadImportMapping] = useState<LeadImportMapping>(EMPTY_LEAD_IMPORT_MAPPING);
  const [leadImportDuplicateStrategy, setLeadImportDuplicateStrategy] = useState<'skip' | 'flag'>('skip');
  const [leadImportResult, setLeadImportResult] = useState<BulkImportLeadsResponse | null>(null);
  const [leadImportBusy, setLeadImportBusy] = useState(false);
  const sessionStaffUser = useMemo<StaffUser | null>(() => {
    if (!student) return null;
    const databaseUser = staffUsers.find((user) => user.id === student.id);
    if (databaseUser) return { ...databaseUser, access: student.access };
    return {
    id: student.id,
    name: student.name,
    email: student.email,
    initials: student.initials,
    role: student.role.replaceAll('_', ' '),
    roleId: student.role.replaceAll('_', '-'),
    roleIds: [],
    team: student.team || 'Campus',
    access: student.access,
    };
  }, [staffUsers, student]);
  const visibleStaffUsers = useMemo(
    () => sessionStaffUser ? [sessionStaffUser, ...staffUsers.filter((user) => user.id !== sessionStaffUser.id)] : staffUsers,
    [sessionStaffUser, staffUsers],
  );
  const userAccess = useMemo(
    () => Object.fromEntries(visibleStaffUsers.map((user) => {
      const rolePermissions = Array.from(new Set(user.roleIds.flatMap((roleId) => roleAccess[roleId] ?? [])));
      return [user.id, user.access.length ? user.access : rolePermissions];
    })),
    [roleAccess, visibleStaffUsers],
  );
  const customModuleCounter = useRef(1);
  useEffect(() => {
    queueMicrotask(() => {
      const brand = readTenantBrand();
      setTenantBrand(brand);
      applyTenantBrand(brand);
    });
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const fallbackNavigation = allowedNavigation[0];
    const fallbackSettings = allowedSettings[0];
    if (fallbackNavigation && !allowedNavigation.includes(activeNav)) {
      queueMicrotask(() => setActiveNav(fallbackNavigation));
    }
    if (activeNav === 'settings' && fallbackSettings && !allowedSettings.includes(settingsSection)) {
      queueMicrotask(() => setSettingsSection(fallbackSettings));
    }
  }, [activeNav, allowedNavigation, allowedSettings, settingsSection]);

  const applyTheme = useCallback((nextTheme: ThemeId) => {
    setTheme(nextTheme);
    const root = document.documentElement;
    Object.entries(THEMES[nextTheme]).forEach(([key, value]) => root.style.setProperty(key, value));
  }, []);

  const toggleDarkTheme = useCallback(() => {
    applyTheme(theme === 'midnight' ? 'classic' : 'midnight');
  }, [applyTheme, theme]);

  const showToast = useCallback((msg: string, durationMs = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), durationMs);
  }, []);

  const refreshCrmBoard = useCallback(async (notify = false) => {
    setCrmLoading(true);
    setCrmError(null);
    try {
      const [boardResponse, dashboardResponse] = await Promise.all([
        canReadLeads ? getCrmBoard() : Promise.resolve(null),
        canReadCrmDashboard ? getCrmOperationsDashboard() : Promise.resolve(null),
      ]);
      if (boardResponse) {
        setLeads(boardResponse.data.stages.flatMap((stage) => stage.leads.map(toKanbanLead)));
      }
      if (dashboardResponse) setCrmDashboard(dashboardResponse.data);
      if (notify) showToast('CRM data refreshed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load CRM data';
      setCrmError(message);
      if (notify) showToast(message);
    } finally {
      setCrmLoading(false);
    }
  }, [canReadCrmDashboard, canReadLeads, showToast]);

  const refreshTenantConfiguration = useCallback(async () => {
    try {
      const [permissionsResponse, rolesResponse, usersResponse, formsResponse, publishedResponse] = await Promise.all([
        canReadPermissionCatalog
          ? getAuthorizationPermissions()
          : Promise.resolve({ data: [] as AuthorizationPermission[] }),
        canReadRoles
          ? getAuthorizationRoles()
          : Promise.resolve({ data: [] as AuthorizationRole[] }),
        canReadUsers
          ? getTenantUsers()
          : Promise.resolve({ data: [] as TenantUser[] }),
        canReadForms
          ? getCrmForms()
          : Promise.resolve({ data: [] as CrmForm[] }),
        (canReadForms || canCreateLeads)
          ? getPublishedCrmLeadCaptureForm().catch(() => null)
          : Promise.resolve(null),
      ]);
      const modules = buildOperationModules(permissionsResponse.data);
      const permissionModule = new Map(permissionsResponse.data.map((permission) => [permission.key, permission.moduleKey]));
      const roles = rolesResponse.data.map((role: AuthorizationRole): CollegeRole => ({
        id: role.id,
        name: role.name,
        team: role.team,
        scope: role.scope,
        protected: role.protected,
        moduleIds: Array.from(new Set(role.permissions.map((grant) => permissionModule.get(grant.key)).filter((value): value is string => Boolean(value)))),
      }));
      setCollegeRoles(roles);
      setRoleAccess(Object.fromEntries(rolesResponse.data.map((role) => [
        role.id,
        role.permissions.map((grant) => grant.key),
      ])));
      setRoleScopes(Object.fromEntries(rolesResponse.data.map((role) => [
        role.id,
        Object.fromEntries(role.permissions.map((grant) => [grant.key, grant.scope])),
      ])));
      setOperationModules(modules);
      setSelectedAccessRoleId((current) => roles.some((role) => role.id === current) ? current : roles[0]?.id ?? '');
      setSelectedAccessModuleId((current) => modules.some((module) => module.id === current) ? current : modules[0]?.id ?? '');
      setFeatureModuleId((current) => modules.some((module) => module.id === current) ? current : modules[0]?.id ?? '');
      setStaffUsers(usersResponse.data.map((user) => {
        const role = user.roles[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          initials: user.initials,
          role: role?.name ?? 'Unassigned',
          roleId: role?.id ?? '',
          roleIds: user.roles.map((assignedRole) => assignedRole.id),
          team: role?.team ?? '',
          access: [],
        };
      }));
      const builders = formsResponse.data.map(formBuilderFromApi);
      setFormBuilders(builders);
      setFormSchemas(Object.fromEntries(formsResponse.data.map((form) => [form.id, formSchemaFromApi(form)])));
      setSelectedFormId((current) => builders.some((form) => form.id === current) ? current : builders[0]?.id ?? '');
      setPublishedLeadForm(publishedResponse?.data ?? null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load tenant configuration');
    }
  }, [canCreateLeads, canReadForms, canReadPermissionCatalog, canReadRoles, canReadUsers, showToast]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') window.location.assign('/');
    if (authStatus !== 'authenticated') return;
    const frame = window.requestAnimationFrame(() => {
      void refreshCrmBoard();
      void refreshTenantConfiguration();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [authStatus, refreshCrmBoard, refreshTenantConfiguration]);

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

  const updateSelectedFormSchema = useCallback((updater: (schema: FormSchemaSection[]) => FormSchemaSection[], targetId?: string) => {
    const activeId = targetId ?? formDraft?.id ?? selectedFormId;
    setFormSchemas((current) => {
      const currentSchema = current[activeId] ?? [{ section: 'Primary details', fields: [] }];
      const nextSchema = updater(currentSchema);
      setFormBuilders((builders) => builders.map((form) => (
        form.id === activeId ? { ...form, fields: countSchemaFields(nextSchema) } : form
      )));
      return { ...current, [activeId]: nextSchema };
    });
  }, [formDraft?.id, selectedFormId]);

  const draggedCardKeyRef = useRef<string | null>(null);
  const draggedPaletteFieldRef = useRef<FieldPaletteItem | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const openCreateForm = useCallback(() => {
    const id = `custom-form-${Date.now()}`;
    setSelectedFormId(id);
    setSelectedFieldKey(null);
    setFormSchemas((current) => ({ ...current, [id]: [{ section: 'Primary details', fields: [] }] }));
    setFormDraft({
      id,
      name: 'Lead Capture Form',
      module: 'CRM',
      formType: 'lead_capture',
      status: 'Draft',
      owner: 'Tenant Admin',
      usage: 'CRM lead capture',
    });
  }, []);

  const openEditForm = useCallback((form: FormBuilder) => {
    setSelectedFormId(form.id);
    setSelectedFieldKey(null);
    const availableTypes = FORM_MODULE_TYPES[form.module] ?? [];
    setFormDraft({
      id: form.id,
      name: form.name,
      module: form.module,
      formType: availableTypes.some((type) => type.value === form.formType)
        ? form.formType
        : availableTypes[0]?.value ?? form.formType,
      status: form.status,
      owner: form.owner,
      usage: form.usage,
    });
  }, []);

  const saveFormDraft = useCallback(async (publishAfterSave = false) => {
    if (!formDraft) return;
    const isPersisted = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(formDraft.id);
    if ((isPersisted && !canUpdateForms) || (!isPersisted && !canCreateForms)) {
      showToast('You do not have permission to save this form');
      return;
    }
    if (publishAfterSave && !canPublishForms) {
      showToast('You do not have permission to publish forms');
      return;
    }
    const cleanName = formDraft.name.trim() || 'Untitled Form';
    const schema = formSchemas[formDraft.id] ?? [{ section: 'Primary details', fields: [] }];
    const incompleteChoice = schema
      .flatMap((section) => section.fields)
      .find((field) => CHOICE_FIELD_TYPES.has(field.type) && !field.options?.some((option) => option.trim()));
    if (publishAfterSave && incompleteChoice) {
      showToast(`Add at least one choice to ${incompleteChoice.label} before publishing`);
      return;
    }
    const storedSchema = {
      sections: schema.map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({ ...field, key: field.key ?? slugify(field.label) })),
      })),
      metadata: {
        module: formDraft.module.trim() || 'Admissions',
        owner: formDraft.owner.trim() || 'Tenant Admin',
        usage: formDraft.usage.trim() || 'Tenant workflow',
      },
    };
    const formType = formDraft.formType.trim() || FORM_MODULE_TYPES[formDraft.module]?.[0]?.value;
    if (!formType) {
      showToast('Select a form type before saving');
      return;
    }
    try {
      let saved = isPersisted
        ? (await updateCrmForm(formDraft.id, { name: cleanName, formType, schema: storedSchema })).data
        : (await createCrmForm({ name: cleanName, formType, schema: storedSchema })).data;
      if (publishAfterSave) {
        saved = (await publishCrmForm(saved.id)).data;
      }
      const builder = formBuilderFromApi(saved);
      setFormBuilders((current) => {
        const withoutDraft = current.filter((form) => form.id !== formDraft.id && form.id !== saved.id);
        return [builder, ...withoutDraft];
      });
      setFormSchemas((current) => {
        const next = { ...current, [saved.id]: formSchemaFromApi(saved) };
        if (saved.id !== formDraft.id) delete next[formDraft.id];
        return next;
      });
      if (saved.status === 'published' && saved.formType.replace('-', '_') === 'lead_capture') {
        setPublishedLeadForm(saved);
      } else if (publishedLeadForm?.id === saved.id) {
        setPublishedLeadForm(null);
      }
      setSelectedFormId(saved.id);
      setSelectedFieldKey(null);
      setFormDraft(null);
      const isLeadCapture = saved.formType.replace('-', '_') === 'lead_capture';
      showToast(saved.status !== 'published'
        ? 'Form draft saved'
        : isLeadCapture
          ? 'Published to CRM Create Lead'
          : `Published to ${formDraft.module} · ${formTypeLabel(formDraft.module, saved.formType)}; it will not appear in CRM Create Lead`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save form');
    }
  }, [canCreateForms, canPublishForms, canUpdateForms, formDraft, formSchemas, publishedLeadForm, showToast]);

  const changeFormPublication = useCallback(async (form: FormBuilder, publish: boolean) => {
    if (!form.id) return;
    if (!canPublishForms) {
      showToast('You do not have permission to publish or unpublish forms');
      return;
    }
    try {
      const saved = publish
        ? (await publishCrmForm(form.id)).data
        : (await unpublishCrmForm(form.id)).data;
      const builder = formBuilderFromApi(saved);
      setFormBuilders((current) => current.map((form) => form.id === saved.id ? builder : form));
      if (saved.formType.replace('-', '_') === 'lead_capture') {
        setPublishedLeadForm(publish ? saved : null);
      }
      const isLeadCapture = saved.formType.replace('-', '_') === 'lead_capture';
      showToast(!publish
        ? 'Form returned to draft'
        : isLeadCapture
          ? 'Published to CRM Create Lead'
          : `Published to ${builder.module} · ${formTypeLabel(builder.module, saved.formType)}; it will not appear in CRM Create Lead`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to change form status');
    }
  }, [canPublishForms, showToast]);

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
    const cleanLabel = fieldDraft.field.label.trim();
    if (!cleanLabel) {
      showToast('Enter a field label');
      return;
    }
    const options = CHOICE_FIELD_TYPES.has(fieldDraft.field.type)
      ? Array.from(new Set((fieldDraft.field.options ?? []).map((option) => option.trim()).filter(Boolean)))
      : fieldDraft.field.options;
    if (CHOICE_FIELD_TYPES.has(fieldDraft.field.type) && !options?.length) {
      showToast(`Add at least one choice to ${cleanLabel}`);
      return;
    }
    const savedField = { ...fieldDraft.field, label: cleanLabel, options };
    const [sectionIndex, fieldIndex] = fieldDraft.key.split(':').map(Number);
    updateSelectedFormSchema((schema) => schema.map((section, currentSectionIndex) => (
      currentSectionIndex !== sectionIndex
        ? section
        : {
            ...section,
            fields: section.fields.map((field, currentFieldIndex) => (
              currentFieldIndex === fieldIndex ? savedField : field
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

  const deleteFieldByKey = useCallback((targetKey: string) => {
    const [sectionIndex, fieldIndex] = targetKey.split(':').map(Number);
    updateSelectedFormSchema((schema) => schema.map((section, currentSectionIndex) => (
      currentSectionIndex !== sectionIndex
        ? section
        : { ...section, fields: section.fields.filter((_, currentFieldIndex) => currentFieldIndex !== fieldIndex) }
    )));
    if (selectedFieldKey === targetKey) setSelectedFieldKey(null);
    showToast('Field removed from form');
  }, [selectedFieldKey, showToast, updateSelectedFormSchema]);

  const moveFieldByKey = useCallback((targetKey: string, direction: 'up' | 'down') => {
    const [sectionIndex, fieldIndex] = targetKey.split(':').map(Number);
    updateSelectedFormSchema((schema) => schema.map((section, currentSectionIndex) => {
      if (currentSectionIndex !== sectionIndex) return section;
      const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
      if (targetIndex < 0 || targetIndex >= section.fields.length) return section;
      const nextFields = [...section.fields];
      const [moved] = nextFields.splice(fieldIndex, 1);
      nextFields.splice(targetIndex, 0, moved);
      return { ...section, fields: nextFields };
    }));
  }, [updateSelectedFormSchema]);

  const handlePaletteFieldDragStart = useCallback((event: React.DragEvent, field: FieldPaletteItem) => {
    draggedPaletteFieldRef.current = field;
    draggedCardKeyRef.current = null;
    event.dataTransfer.setData('application/x-supercampus-form-field', field.id);
    event.dataTransfer.setData('text/plain', field.id);
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFieldCardDragStart = useCallback((event: React.DragEvent, fieldKey: string) => {
    event.stopPropagation();
    draggedCardKeyRef.current = fieldKey;
    draggedPaletteFieldRef.current = null;
    event.dataTransfer.setData('application/x-supercampus-card-key', fieldKey);
    event.dataTransfer.setData('text/plain', fieldKey);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleFieldCardDragOver = useCallback((event: React.DragEvent, fieldKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== fieldKey) setDragOverKey(fieldKey);
  }, [dragOverKey]);

  const handleFieldCardDrop = useCallback((event: React.DragEvent, targetKey: string) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverKey(null);
    const draggedKey = draggedCardKeyRef.current || event.dataTransfer.getData('application/x-supercampus-card-key');
    
    if (draggedKey && draggedKey !== targetKey) {
      const [srcSec, srcIdx] = draggedKey.split(':').map(Number);
      const [tgtSec, tgtIdx] = targetKey.split(':').map(Number);
      if (srcSec === tgtSec) {
        updateSelectedFormSchema((schema) => schema.map((section, idx) => {
          if (idx !== srcSec) return section;
          const fields = [...section.fields];
          const [moved] = fields.splice(srcIdx, 1);
          fields.splice(tgtIdx, 0, moved);
          return { ...section, fields };
        }));
        showToast('Field relocated');
      }
      draggedCardKeyRef.current = null;
      return;
    }

    const field = draggedPaletteFieldRef.current || FIELD_PALETTE.find((item) => item.id === event.dataTransfer.getData('application/x-supercampus-form-field'));
    if (field) {
      const [tgtSec, tgtIdx] = targetKey.split(':').map(Number);
      const newField: FormField = {
        label: field.label,
        type: field.type,
        required: false,
        placeholder: `Enter ${field.label.toLowerCase()}`,
        options: CHOICE_FIELD_TYPES.has(field.type) ? ['Option 1', 'Option 2'] : undefined,
      };
      updateSelectedFormSchema((schema) => schema.map((section, idx) => {
        if (idx !== tgtSec) return section;
        const fields = [...section.fields];
        fields.splice(tgtIdx, 0, newField);
        return { ...section, fields };
      }));
      showToast(`Inserted ${field.label}`);
      draggedPaletteFieldRef.current = null;
    }
  }, [showToast, updateSelectedFormSchema]);

  const handleFormPreviewDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverKey(null);
    if (draggedCardKeyRef.current) {
      draggedCardKeyRef.current = null;
      return;
    }
    const field = draggedPaletteFieldRef.current || FIELD_PALETTE.find((item) => item.id === event.dataTransfer.getData('application/x-supercampus-form-field'));
    if (field) {
      addFieldToSelectedForm(field, formDraft?.id ?? selectedFormId);
      draggedPaletteFieldRef.current = null;
    }
  }, [addFieldToSelectedForm, formDraft?.id, selectedFormId]);


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

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      window.location.assign('/');
    }
  }, [logout]);

  const saveRolePermissions = useCallback(async (roleId: string, keys: string[]) => {
    if (!canUpdateRoles) {
      throw new Error('You do not have permission to update roles');
    }
    await setAuthorizationRolePermissions(roleId, keys.map((key) => ({
      key,
      scope: roleScopes[roleId]?.[key] ?? 'all',
      constraints: {},
    })));
  }, [canUpdateRoles, roleScopes]);

  const toggleRolePermissions = async (roleId: string, permissionKeys: string[]) => {
    if (!permissionKeys.length) return;
    if (collegeRoles.find((role) => role.id === roleId)?.protected) {
      showToast('The tenant admin recovery role is protected');
      return;
    }
    const current = roleAccess[roleId] ?? [];
    const allEnabled = permissionKeys.every((permissionKey) => current.includes(permissionKey));
    const next = allEnabled
      ? current.filter((item) => !permissionKeys.includes(item))
      : Array.from(new Set([...current, ...permissionKeys]));
    setRoleAccess((previous) => ({ ...previous, [roleId]: next }));
    try {
      await saveRolePermissions(roleId, next);
      showToast('Role permissions updated');
    } catch (error) {
      setRoleAccess((previous) => ({ ...previous, [roleId]: current }));
      showToast(error instanceof Error ? error.message : 'Unable to update role permissions');
    }
  };

  const toggleRoleModule = async (roleId: string, moduleId: string) => {
    const moduleConfig = operationModules.find((module) => module.id === moduleId);
    if (!moduleConfig) return;
    if (collegeRoles.find((role) => role.id === roleId)?.protected) {
      showToast('The tenant admin recovery role is protected');
      return;
    }
    const moduleKeys = modulePermissionKeys(moduleConfig);
    const current = roleAccess[roleId] ?? [];
    const moduleFullyEnabled = moduleKeys.every((key) => current.includes(key));
    const next = moduleFullyEnabled
      ? current.filter((key) => !moduleKeys.includes(key))
      : Array.from(new Set([...current, ...moduleKeys]));
    setRoleAccess((previous) => ({ ...previous, [roleId]: next }));
    try {
      await saveRolePermissions(roleId, next);
      showToast('Module access updated');
    } catch (error) {
      setRoleAccess((previous) => ({ ...previous, [roleId]: current }));
      showToast(error instanceof Error ? error.message : 'Unable to update module access');
    }
  };

  const toggleRoleFeature = async (roleId: string, module: OperationModule, feature: string) => {
    const featureKeys = featurePermissionKeys(module, feature);
    const current = roleAccess[roleId] ?? [];
    const fullyEnabled = featureKeys.length > 0 && featureKeys.every((key) => current.includes(key));
    const next = fullyEnabled
      ? current.filter((key) => !featureKeys.includes(key))
      : Array.from(new Set([...current, ...featureKeys]));
    setRoleAccess((previous) => ({ ...previous, [roleId]: next }));
    try {
      await saveRolePermissions(roleId, next);
    } catch (error) {
      setRoleAccess((previous) => ({ ...previous, [roleId]: current }));
      showToast(error instanceof Error ? error.message : 'Unable to update feature access');
    }
  };

  const addCollegeRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    if (!canCreateRoles) {
      showToast('You do not have permission to create roles');
      return;
    }
    try {
      const response = await createAuthorizationRole({
        key: slugify(name).replaceAll('-', '_'),
        name,
        team: newRoleTeam.trim() || 'Custom',
        scope: 'Custom role managed by tenant admin',
      });
      const role: CollegeRole = {
        id: response.data.id,
        name: response.data.name,
        team: response.data.team,
        scope: response.data.scope,
        protected: response.data.protected,
        moduleIds: [],
      };
      setCollegeRoles((previous) => [...previous, role]);
      setRoleAccess((previous) => ({ ...previous, [role.id]: [] }));
      setRoleScopes((previous) => ({ ...previous, [role.id]: {} }));
      setSelectedAccessRoleId(role.id);
      setNewRoleName('');
      setNewRoleTeam('');
      showToast(`Role added: ${name}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create role');
    }
  };

  const addUserUnderRole = async () => {
    const name = newUserName.trim();
    const email = newUserEmail.trim().toLowerCase();
    if (!name || !email || !selectedAccessRole.id) return;
    if (!canCreateUsers) {
      showToast('You do not have permission to create users');
      return;
    }
    if (!email.includes('@')) {
      showToast('Enter a valid email address');
      return;
    }
    if (staffUsers.some((user) => user.email.trim().toLowerCase() === email)) {
      showToast('This user already belongs to the tenant. Update the existing user role instead.');
      return;
    }
    try {
      const response = await createTenantUser({ name, email, roleIds: [selectedAccessRole.id] });
      const user: StaffUser = {
        id: response.data.id,
        name,
        email,
        initials: initialsFromName(name),
        role: selectedAccessRole.name,
        roleId: selectedAccessRole.id,
        roleIds: [selectedAccessRole.id],
        team: selectedAccessRole.team,
        access: [],
      };
      setStaffUsers((previous) => [user, ...previous.filter((item) => item.id !== user.id)]);
      setNewUserName('');
      setNewUserEmail('');
      const hasTemporaryPassword = Boolean(response.data.temporaryPassword);
      showToast(
        hasTemporaryPassword
          ? `${name} added. Temporary password: ${response.data.temporaryPassword}`
          : `${name} assigned to ${selectedAccessRole.name}`,
        hasTemporaryPassword ? 5000 : 3000,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create user');
    }
  };

  const toggleUserRole = async (user: StaffUser) => {
    if (!selectedAccessRole.id) return;
    if (!canUpdateUsers) {
      showToast('You do not have permission to assign roles');
      return;
    }
    const isAssigned = user.roleIds.includes(selectedAccessRole.id);
    if (isAssigned && user.roleIds.length === 1) {
      showToast('A user must keep at least one role');
      return;
    }
    const nextRoleIds = isAssigned
      ? user.roleIds.filter((roleId) => roleId !== selectedAccessRole.id)
      : Array.from(new Set([...user.roleIds, selectedAccessRole.id]));
    const previous = staffUsers;
    const primaryRole = collegeRoles.find((role) => role.id === nextRoleIds[0]);
    setStaffUsers((current) => current.map((item) => item.id === user.id ? {
      ...item,
      roleIds: nextRoleIds,
      roleId: primaryRole?.id ?? '',
      role: primaryRole?.name ?? 'Unassigned',
      team: primaryRole?.team ?? '',
      access: [],
    } : item));
    try {
      await assignTenantUserRoles(user.id, nextRoleIds);
      showToast(isAssigned
        ? `${user.name} removed from ${selectedAccessRole.name}`
        : `${user.name} assigned to ${selectedAccessRole.name}`);
    } catch (error) {
      setStaffUsers(previous);
      showToast(error instanceof Error ? error.message : 'Unable to update user roles');
    }
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
    { label: 'Team Users', value: visibleStaffUsers.length, icon: UserCog },
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

  const formDraftIsPersisted = Boolean(formDraft && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(formDraft.id));
  const canSaveOpenForm = Boolean(formDraft && (formDraftIsPersisted ? canUpdateForms : canCreateForms));

  const settingsTabs = [
    { id: 'account' as const, label: 'Account & Session', icon: User },
    { id: 'access' as const, label: 'Access Control', icon: ShieldCheck },
    { id: 'forms' as const, label: 'Form Builders', icon: ClipboardList },
    { id: 'workflows' as const, label: 'Workflow Studio', icon: ListChecks },
    { id: 'theme' as const, label: 'Theme', icon: Sun },
  ].filter((tab) => allowedSettings.includes(tab.id));
  const selectedForm = formBuilders.find((form) => form.id === selectedFormId) ?? formBuilders[0] ?? EMPTY_FORM;
  const selectedFormSchema = formSchemas[selectedForm.id] ?? [];
  const formDraftSchema = formDraft ? (formSchemas[formDraft.id] ?? []) : [];
  const publishedLeadFields = useMemo(() => (
    publishedLeadForm
      ? formSchemaFromApi(publishedLeadForm)
          .flatMap((section) => section.fields)
          .filter((field) => !['Hidden field', 'Automation', 'Section heading', 'Divider'].includes(field.type))
      : []
  ), [publishedLeadForm]);
  const liveNonLeadForm = useMemo(
    () => formBuilders.find((form) => form.status === 'Live' && form.formType.replace('-', '_') !== 'lead_capture') ?? null,
    [formBuilders],
  );


  const renderLeadField = (field: FormField) => {
    const key = field.key ?? slugify(field.label);
    const value = operationValues[key] ?? '';
    const isAddressField = field.type === 'Address' || field.label.toLowerCase().includes('address');
    const fieldClass = field.width === 'full' || isAddressField ? 'col-span-2' : '';
    const controlClass = 'mt-1 min-h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]';
    const label = (
      <span className="text-[11px] font-semibold text-[var(--crm-muted)]">
        {field.label}{field.required ? ' *' : ''}
      </span>
    );
    let control: React.ReactNode;

    if (field.type === 'Dropdown') {
      control = (
        <select
          required={field.required}
          value={value}
          onChange={(event) => setOperationValues((current) => ({ ...current, [key]: event.target.value }))}
          className={controlClass}
        >
          <option value="">{field.placeholder?.trim() || `Select ${field.label}`}</option>
          {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    } else if (field.type === 'Multi select') {
      const defaultOptions = (field.options && field.options.length > 0)
        ? field.options
        : ['abcd', 'efgh', 'Tamil Nadu', 'Sikkim', 'Telangana', 'Tripura', 'Uttar Pradesh', 'West Bengal'];
      control = (
        <CrmMultiSelectInput
          options={defaultOptions}
          value={value}
          onChange={(val) => setOperationValues((current) => ({ ...current, [key]: val }))}
          placeholder={field.placeholder || `Select ${field.label}...`}
        />
      );
    } else if (isAddressField) {
      control = (
        <CrmAddressBlockInput
          value={value}
          onChange={(val) => setOperationValues((current) => ({ ...current, [key]: val }))}
        />
      );
    } else if (field.type === 'Radio group') {
      control = (
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-text)]">
              <input
                type="radio"
                name={`lead-field-${key}`}
                value={option}
                checked={value === option}
                required={field.required}
                onChange={(event) => setOperationValues((current) => ({ ...current, [key]: event.target.value }))}
              />
              {option}
            </label>
          ))}
        </div>
      );
    } else if (field.type === 'Checkbox' || field.type === 'Consent') {
      control = (
        <label className="mt-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)]">
          <input
            type="checkbox"
            checked={value === 'true'}
            required={field.required}
            onChange={(event) => setOperationValues((current) => ({ ...current, [key]: String(event.target.checked) }))}
          />
          {field.placeholder?.trim() || `Confirm ${field.label}`}
        </label>
      );
    } else if (field.type === 'Paragraph') {
      control = (
        <textarea
          required={field.required}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => setOperationValues((current) => ({ ...current, [key]: event.target.value }))}
          className={`${controlClass} min-h-24 py-3`}
        />
      );
    } else if (field.type === 'Upload' || field.type === 'Image upload') {
      control = (
        <input
          type="file"
          required={field.required}
          accept={field.type === 'Image upload' ? 'image/*' : undefined}
          onChange={(event) => setOperationValues((current) => ({ ...current, [key]: event.target.files?.[0]?.name ?? '' }))}
          className={`${controlClass} py-2`}
        />
      );
    } else {
      const inputType = field.type === 'Email'
        ? 'email'
        : field.type === 'Phone'
          ? 'tel'
          : field.type === 'Number' || field.type === 'Currency'
            ? 'number'
            : field.type === 'Date'
              ? 'date'
              : field.type === 'Date time'
                ? 'datetime-local'
                : 'text';
      control = (
        <input
          type={inputType}
          required={field.required}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => setOperationValues((current) => ({ ...current, [key]: event.target.value }))}
          className={controlClass}
        />
      );
    }

    return (
      <div key={key} className={fieldClass}>
        {label}
        {control}
        {field.helpText?.trim() && <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{field.helpText}</p>}
      </div>
    );
  };
  const allPermissionKeys = operationModules.flatMap(modulePermissionKeys);
  const selectedAccessRole = collegeRoles.find((role) => role.id === selectedAccessRoleId) ?? collegeRoles[0] ?? EMPTY_ROLE;
  const selectedRolePermissions = roleAccess[selectedAccessRole.id] ?? EMPTY_PERMISSION_KEYS;
  const selectedRolePermissionSet = useMemo(
    () => new Set(selectedRolePermissions.includes('*') ? [...selectedRolePermissions, ...allPermissionKeys] : selectedRolePermissions),
    [allPermissionKeys, selectedRolePermissions],
  );
  const selectedAccessModule = operationModules.find((module) => module.id === selectedAccessModuleId) ?? operationModules[0] ?? EMPTY_MODULE;
  const selectedModuleKeys = modulePermissionKeys(selectedAccessModule);
  const selectedModuleEnabledCount = selectedModuleKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
  const selectedModuleFullyEnabled = selectedModuleKeys.length > 0 && selectedModuleEnabledCount === selectedModuleKeys.length;
  const selectedModulePartiallyEnabled = selectedModuleEnabledCount > 0 && !selectedModuleFullyEnabled;
  const selectedRoleUsers = visibleStaffUsers.filter((user) => user.roleIds.includes(selectedAccessRole.id));
  const teamSummary = Object.entries(visibleStaffUsers.reduce<Record<string, number>>((summary, user) => {
    summary[user.team] = (summary[user.team] ?? 0) + 1;
    return summary;
  }, {})).sort((a, b) => b[1] - a[1]);
  const moduleUserCoverage = operationModules.map((module) => {
    const users = visibleStaffUsers.filter((user) => {
      const roles = collegeRoles.filter((item) => user.roleIds.includes(item.id));
      const effectivePermissions = userAccess[user.id] ?? user.access;
      return effectivePermissions.includes('*')
        || roles.some((role) => role.moduleIds.includes('*') || role.moduleIds.includes(module.id))
        || effectivePermissions.some((permission) => permission.startsWith(`${module.id}.`));
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
  const accessCoverage = selectedRolePermissions.includes('*')
    ? 100
    : allPermissionKeys.length ? Math.round((selectedRolePermissions.length / allPermissionKeys.length) * 100) : 0;
  const selectedPermissionCount = selectedRolePermissions.includes('*')
    ? allPermissionKeys.length
    : selectedRolePermissions.length;
  const enabledModuleCount = operationModules.filter((module) =>
    modulePermissionKeys(module).some((key) => selectedRolePermissionSet.has(key))
  ).length;
  const requirementPage = ADMIN_REQUIREMENTS[activeNav];
  const crmHeadlineValues = crmDashboard ? [
    crmDashboard.headline.leadIntake,
    crmDashboard.headline.followUpsDue,
    crmDashboard.headline.campaignRoi,
    crmDashboard.headline.counselorSla,
  ] : [0, 0, 0, 0];
  const requirementStatValues = activeNav === 'crm' ? crmHeadlineValues : [128, 24, 12, 91];
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
    : operationTitleLower.includes('import') ? 'import'
    : operationTitleLower.includes('filter') || ['enquiry date', 'last contact date', 'source', 'course', 'status', 'priority', 'assigned counselor', 'city/state', 'lead age'].some((item) => operationTitleLower.includes(item)) ? 'filter'
    : operationTitleLower.includes('list') || operationContextLower.includes('board settings') ? 'board'
    : operationTitleLower.includes('export') ? 'export'
    : operationTitleLower.includes('archive') || operationTitleLower.includes('hold') || operationTitleLower.includes('defer') || operationTitleLower.includes('prospect') ? 'status'
    : operationTitleLower.includes('assign') || operationTitleLower.includes('reassign') ? 'assignment'
    : operationTitleLower.includes('whatsapp') || operationTitleLower.includes('email') || operationTitleLower.includes('call') || operationTitleLower.includes('follow') || operationContextLower.includes('communication') ? 'communication'
    : operationTitleLower.includes('new') || operationTitleLower.includes('create') || operationTitleLower.includes('lead') || operationContextLower.includes('lead') ? 'lead'
    : null;
  const operationCreatesLead = Boolean(operationModal && crmOperationKind === 'lead' && (
    operationTitleLower === 'new record'
    || operationTitleLower === 'create lead'
    || (operationContext === 'Dashboard' && operationTitle === 'Add lead')
  ));
  const canCreateActiveRecord = activeNav === 'crm'
    ? canCreateLeads
    : hasPermission(permissions, `${activeNav}.records.create`);
  const canConfirmOperation = Boolean(operationModal && (
    crmOperationKind === 'import' ? canImportLeads
      : operationCreatesLead ? canCreateLeads
        : operationContext === 'Leads' && operationTitleLower.startsWith('open ') ? canUpdateLeads
          : operationContext === 'CRM Settings' && operationTitleLower.includes('assign') ? canAssignLeads
            : operationContext === 'CRM Settings' && operationTitleLower.includes('handoff') ? canTriggerErpHandoff
              : operationContext === 'CRM Settings' && ['whatsapp', 'email', 'call', 'follow'].some((term) => operationTitleLower.includes(term)) ? canSendCrmCommunications
                : operationContext === 'CRM Settings' ? canUpdateCrmConfiguration
                  : true
  ));
  const operationHasFeatureWorkspace = Boolean(operationModal && (
    crmOperationKind ||
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
    setOperationValues({});
    setOperationModal({ title, context, fields, confirmLabel });
  }, []);

  const resetLeadImport = useCallback(() => {
    setLeadImportFileName('');
    setLeadImportHeaders([]);
    setLeadImportRows([]);
    setLeadImportMapping(EMPTY_LEAD_IMPORT_MAPPING);
    setLeadImportDuplicateStrategy('skip');
    setLeadImportResult(null);
    setLeadImportBusy(false);
  }, []);

  const openLeadImport = useCallback(() => {
    resetLeadImport();
    openOperation(
      'Bulk import leads',
      'Lead Capture',
      ['Upload CSV', 'Column mapping', 'Duplicate handling'],
      'Import valid rows',
    );
  }, [openOperation, resetLeadImport]);

  const handleLeadImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Upload a CSV file. Excel files should be exported as CSV first.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('The CSV file must be 2 MB or smaller');
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error('The CSV must include a header and at least one data row');
      if (parsed.length - 1 > 1_000) throw new Error('A single import is limited to 1000 rows');
      const headers = parsed[0].map((header, index) => header.replace(/^\uFEFF/, '').trim() || `Column ${index + 1}`);
      if (new Set(headers.map(normalizedCsvHeader)).size !== headers.length) {
        throw new Error('CSV headers must be unique');
      }
      setLeadImportFileName(file.name);
      setLeadImportHeaders(headers);
      setLeadImportRows(parsed.slice(1));
      setLeadImportMapping(autoMapLeadImportHeaders(headers));
      setLeadImportResult(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to read the CSV file');
    }
  }, [showToast]);

  const leadImportPreview = useMemo<LeadImportPreviewRow[]>(() => {
    const headerIndexes = new Map(leadImportHeaders.map((header, index) => [header, index]));
    const seenContacts = new Set<string>();
    return leadImportRows.map((cells, index) => {
      const valueFor = (field: LeadImportField) => {
        const header = leadImportMapping[field];
        const cellIndex = header ? headerIndexes.get(header) : undefined;
        return cellIndex === undefined ? '' : (cells[cellIndex] ?? '').trim();
      };
      const name = valueFor('name');
      const email = valueFor('email').toLowerCase();
      const phone = valueFor('phone');
      const whatsapp = valueFor('whatsapp');
      const program = valueFor('program');
      const source = valueFor('source') || 'Bulk import';
      const priorityValue = valueFor('priority').toLowerCase() || 'medium';
      const priority = ['high', 'medium', 'low'].includes(priorityValue) ? priorityValue : 'medium';
      const contacts = [
        email ? `email:${email}` : '',
        phone ? `phone:${phone.replace(/\D/g, '')}` : '',
      ].filter(Boolean);
      const duplicateInFile = contacts.some((contact) => seenContacts.has(contact));
      contacts.forEach((contact) => seenContacts.add(contact));
      let issue: string | null = null;
      if (!name) issue = 'Student name is required';
      else if (!phone && !email) issue = 'Phone or email is required';
      else if (valueFor('priority') && priorityValue !== priority) issue = 'Priority must be high, medium, or low';
      return {
        rowNumber: index + 2,
        name,
        email,
        phone,
        program,
        source,
        issue,
        duplicateInFile,
        payload: {
          rowNumber: index + 2,
          source,
          student: {
            name,
            email: email || undefined,
            phone: phone || undefined,
            whatsapp: whatsapp || undefined,
            parentName: valueFor('parentName') || undefined,
            parentPhone: valueFor('parentPhone') || undefined,
          },
          priority: priorityValue,
          communication: { consentGiven: false },
          interest: program ? { programName: program } : {},
          customFields: { importFile: leadImportFileName, csvRow: index + 2 },
        },
      };
    });
  }, [leadImportFileName, leadImportHeaders, leadImportMapping, leadImportRows]);

  const executeLeadImport = useCallback(async () => {
    const validRows = leadImportPreview.filter((row) => !row.issue);
    if (!leadImportFileName || validRows.length === 0) {
      showToast('Upload and map a CSV containing at least one valid row');
      return;
    }
    setLeadImportBusy(true);
    try {
      const response = await bulkImportCrmLeads(leadImportPreview.map((row) => row.payload), leadImportDuplicateStrategy);
      setLeadImportResult(response.data);
      await refreshCrmBoard();
      showToast(`Import complete: ${response.data.created} created, ${response.data.skipped} skipped, ${response.data.failed} failed`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to import leads');
    } finally {
      setLeadImportBusy(false);
    }
  }, [leadImportDuplicateStrategy, leadImportFileName, leadImportPreview, refreshCrmBoard, showToast]);

  const completeOperation = useCallback(async () => {
    if (!operationModal) return;
    if (!canConfirmOperation) {
      showToast('You do not have permission to perform this action');
      return;
    }
    if (crmOperationKind === 'import') {
      await executeLeadImport();
      return;
    }
    if (operationCreatesLead) {
      if (!publishedLeadForm || publishedLeadFields.length === 0) {
        showToast('Publish a CRM lead capture form before creating leads');
        return;
      }
      const missing = publishedLeadFields.find((field) => field.required && !operationValues[field.key ?? slugify(field.label)]?.trim());
      if (missing) {
        showToast(`${missing.label} is required`);
        return;
      }
      const fieldValue = (includes: string[], excludes: string[] = []) => {
        const field = publishedLeadFields.find((candidate) => {
          const label = `${candidate.key ?? ''} ${candidate.label}`.toLowerCase();
          return includes.some((term) => label.includes(term))
            && !excludes.some((term) => label.includes(term));
        });
        return field ? operationValues[field.key ?? slugify(field.label)]?.trim() : undefined;
      };
      const name = fieldValue(['student name', 'full name', 'applicant name', 'name'], ['parent', 'guardian']);
      const whatsapp = fieldValue(['whatsapp']);
      const phone = fieldValue(['mobile', 'phone'], ['parent', 'guardian', 'whatsapp']) ?? whatsapp;
      const email = fieldValue(['email']);
      if (!name || (!phone && !email)) {
        showToast('The published form must collect a student name and phone, WhatsApp, or email');
        return;
      }
      try {
        await submitCrmForm(publishedLeadForm.id, {
          student: {
            name,
            phone,
            email,
            whatsapp,
            parentName: fieldValue(['parent name', 'guardian name']),
            parentPhone: fieldValue(['parent phone', 'guardian phone']),
          },
          source: fieldValue(['source']) ?? 'Admin lead capture',
          interest: { programName: fieldValue(['course', 'program']) },
          values: operationValues,
          priority: operationValues.priority ?? 'medium',
        });
        await refreshCrmBoard();
        showToast('Lead created from the published tenant form');
        setOperationModal(null);
        setOperationValues({});
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to create lead');
      }
      return;
    }
    showToast(`${operationModal.title} saved`);
    setOperationModal(null);
  }, [
    canConfirmOperation,
    crmOperationKind,
    executeLeadImport,
    operationModal,
    operationCreatesLead,
    operationValues,
    publishedLeadFields,
    publishedLeadForm,
    refreshCrmBoard,
    showToast,
  ]);
  const completeAdminAction = (action: string) => {
    if (!activeScreenKey) return;
    setCompletedActions((current) => {
      const actions = current[activeScreenKey] ?? [];
      return { ...current, [activeScreenKey]: actions.includes(action) ? actions : [...actions, action] };
    });
    showToast(`${action} completed`);
  };
  const [pipelineTab, setPipelineTab] = useState<'leads' | 'enrolled'>('leads');

  const pipelineMonths = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return labels;
  }, []);

  const monthlyPipelineData = useMemo(() => {
    const now = new Date();
    const counts: number[] = [];
    const targets =
      pipelineTab === 'leads'
        ? leads
        : leads.filter((lead) =>
            lead.offerDecision === 'accepted' || ['application', 'application-status', 'offer-status'].includes(lead.status),
          );
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      counts.push(
        targets.reduce((acc, lead) => {
          const t = lead.createdAt ? new Date(lead.createdAt) : null;
          return t && !Number.isNaN(t.getTime()) && t >= start && t < end ? acc + 1 : acc;
        }, 0),
      );
    }
    return counts;
  }, [leads, pipelineTab]);

  const areaChartPaths = useMemo(() => {
    const data = monthlyPipelineData;
    const maxVal = Math.max(10, ...data);
    const W = 500;
    const H = 160;
    const paddingY = 20;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * W;
      const y = H - paddingY - (val / maxVal) * (H - paddingY * 2);
      return { x, y, val, month: pipelineMonths[idx] };
    });

    let strokePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      strokePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }

    const areaPath = `${strokePath} L ${W},${H} L 0,${H} Z`;

    return { points, strokePath, areaPath, maxVal };
  }, [monthlyPipelineData, pipelineMonths]);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--crm-bg)]">
        <p className="text-sm text-[var(--crm-muted)] font-medium">Loading admissions portal...</p>
      </div>
    );
  }

  if (authStatus === 'authenticated' && allowedNavigation.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--crm-bg)] p-6 text-[var(--crm-text)]">
        <div className="w-full max-w-lg rounded-3xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-8 text-center shadow-sm">
          <ShieldCheck size={36} className="mx-auto text-[var(--tenant-primary)]" />
          <h1 className="mt-4 text-2xl">No workspace access assigned</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--crm-muted)]">
            {student?.name ?? 'This user'} is authenticated, but no module read permission is assigned. Ask the tenant administrator to assign a role or permission.
          </p>
          <button type="button" onClick={handleSignOut} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border)] px-4 py-2.5 text-sm text-[var(--crm-muted)]">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-admin-shell h-screen flex bg-[var(--crm-bg)] text-[var(--crm-text)] overflow-hidden">
      <AdmissionsSidebar
        active={activeNav}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onSelect={setActiveNav}
        permissions={permissions}
        brandGradient={brandGradient}
        logoDataUrl={tenantBrand.logoDataUrl}
        user={student}
        onSignOut={handleSignOut}
      />

      <main className="campus-admin-main flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="campus-admin-header h-16 shrink-0 flex items-center justify-end px-6 bg-[var(--crm-card)] border-b border-[var(--crm-border)] gap-4">
          <div className="campus-admin-header-actions flex items-center gap-3">
            <button onClick={toggleDarkTheme} className="p-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] transition-colors" title="Toggle theme">
              {theme === 'midnight' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <ActivityFeed leads={leads} />
            {(canReadLeads || canReadCrmDashboard) && (
              <button
                type="button"
                onClick={() => void refreshCrmBoard(true)}
                disabled={crmLoading}
                className="p-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] transition-colors disabled:opacity-60"
                title="Refresh CRM"
              >
                <RefreshCw size={15} className={crmLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-300/40">
              {student?.initials ?? 'AS'}
            </div>
          </div>
        </header>

        {activeNav === 'pipeline' && (
          <section className="campus-admin-pipeline flex-1 overflow-hidden p-5 flex flex-col bg-[var(--crm-panel)]">
            {crmError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{crmError}</div>}
            {crmLoading && leads.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--crm-muted)]">Loading live pipeline…</div>
            ) : (
              <KanbanBoard
                leads={leads}
                setLeads={setLeads}
                roleId={roleId}
                canUpdateLeads={canUpdateLeads}
                canMoveLeadStage={canMoveLeadStage}
                onShowToast={showToast}
              />
            )}
          </section>
        )}

        {activeNav === 'application-desk' && <ApplicationDeskWorkspace embedded />}

        {activeNav === 'dashboard' && (
          <section className="campus-dashboard flex-1 overflow-y-auto kanban-scroll-hidden bg-[#fafafa] dark:bg-[var(--crm-bg)] p-6 space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--crm-text)]">Admissions CRM</h1>
                <p className="text-xs text-[var(--crm-muted)] mt-0.5">Manage your student admissions pipeline, counselor workload, and enrollment targets.</p>
              </div>
              <div className="flex items-center gap-2" aria-label="Dashboard capabilities">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-1 text-xs text-[var(--crm-muted)] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational
                </span>
                {dashboardAccess.leads && <span className="rounded-full bg-[var(--tenant-surface)] px-3 py-1 text-xs font-semibold text-[var(--tenant-primary)]">Leads Pipeline</span>}
                {dashboardAccess.team && <span className="rounded-full bg-[var(--tenant-surface)] px-3 py-1 text-xs font-semibold text-[var(--tenant-primary)]">Counselor SLA</span>}
              </div>
            </div>

            {/* Top 4 Stat Cards with Bottom Wave Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Active Leads */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-xs transition-all hover:shadow-md animate-fade-in-up [animation-delay:50ms]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--crm-muted)]">Active Leads</span>
                  <div className="w-9 h-9 rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)] flex items-center justify-center">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-[var(--crm-text)]">{leads.length}</p>
                  <p className="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
                    <TrendingUp size={12} className="mr-1" /> +12.4% vs last week
                  </p>
                </div>
                <svg className="absolute bottom-0 inset-x-0 w-full h-9 text-[var(--tenant-primary)] pointer-events-none opacity-80" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <path d="M0,20 Q15,17 30,14 T60,16 T90,8 L100,5 L100,25 L0,25 Z" fill="currentColor" fillOpacity="0.08" />
                  <path d="M0,20 Q15,17 30,14 T60,16 T90,8 L100,5" fill="none" stroke="currentColor" strokeWidth="1.8" className="animate-draw-stroke" />
                </svg>
              </div>

              {/* Card 2: Confirmed Applications */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-xs transition-all hover:shadow-md animate-fade-in-up [animation-delay:100ms]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--crm-muted)]">Applications Received</span>
                  <div className="w-9 h-9 rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)] flex items-center justify-center">
                    <ClipboardList size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-[var(--crm-text)]">{dashboardStats[1]?.value ?? '42'}</p>
                  <p className="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
                    <TrendingUp size={12} className="mr-1" /> +22.1% this month
                  </p>
                </div>
                <svg className="absolute bottom-0 inset-x-0 w-full h-9 text-cyan-500 pointer-events-none" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <path d="M0,22 Q20,18 40,15 T70,12 T90,9 L100,6 L100,25 L0,25 Z" fill="currentColor" fillOpacity="0.08" />
                  <path d="M0,22 Q20,18 40,15 T70,12 T90,9 L100,6" fill="none" stroke="currentColor" strokeWidth="1.8" className="animate-draw-stroke [animation-delay:150ms]" />
                </svg>
              </div>

              {/* Card 3: Counselor SLA Response */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-xs transition-all hover:shadow-md animate-fade-in-up [animation-delay:150ms]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--crm-muted)]">Avg Outreach SLA</span>
                  <div className="w-9 h-9 rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)] flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-[var(--crm-text)]">46 min</p>
                  <p className="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
                    <TrendingUp size={12} className="mr-1" /> Target &lt; 60m
                  </p>
                </div>
                <svg className="absolute bottom-0 inset-x-0 w-full h-9 text-blue-500 pointer-events-none" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <path d="M0,19 Q25,21 50,16 T80,14 L100,10 L100,25 L0,25 Z" fill="currentColor" fillOpacity="0.08" />
                  <path d="M0,19 Q25,21 50,16 T80,14 L100,10" fill="none" stroke="currentColor" strokeWidth="1.8" className="animate-draw-stroke [animation-delay:200ms]" />
                </svg>
              </div>

              {/* Card 4: Enrollment Conversion Rate */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-xs transition-all hover:shadow-md animate-fade-in-up [animation-delay:200ms]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--crm-muted)]">Offer Conversion</span>
                  <div className="w-9 h-9 rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)] flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-[var(--crm-text)]">41.2%</p>
                  <p className="mt-1 inline-flex items-center text-xs font-semibold text-emerald-600">
                    <TrendingUp size={12} className="mr-1" /> +3.8% on target
                  </p>
                </div>
                <svg className="absolute bottom-0 inset-x-0 w-full h-9 text-amber-500 pointer-events-none" viewBox="0 0 100 25" preserveAspectRatio="none">
                  <path d="M0,14 Q25,12 50,18 T80,16 L100,21 L100,25 L0,25 Z" fill="currentColor" fillOpacity="0.08" />
                  <path d="M0,14 Q25,12 50,18 T80,16 L100,21" fill="none" stroke="currentColor" strokeWidth="1.8" className="animate-draw-stroke [animation-delay:250ms]" />
                </svg>
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Columns wide on LG) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Admissions Pipeline Overview Card with Area Chart */}
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-xs animate-fade-in-up [animation-delay:250ms]">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-[var(--crm-text)]">Admissions Pipeline Overview</h3>
                      <p className="text-xs text-[var(--crm-muted)] mt-0.5">Monthly student inquiry velocity & enrollment movement</p>
                    </div>
                    <div className="flex items-center bg-[var(--crm-bg)] p-1 rounded-xl border border-[var(--crm-border)]">
                      <button
                        onClick={() => setPipelineTab('leads')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${pipelineTab === 'leads' ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-xs font-bold' : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'}`}
                      >
                        Leads
                      </button>
                      <button
                        onClick={() => setPipelineTab('enrolled')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${pipelineTab === 'enrolled' ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-xs font-bold' : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'}`}
                      >
                        Enrolled
                      </button>
                    </div>
                  </div>

                  {/* 100% Data-Driven Smooth SVG Area Chart */}
                  <div className="relative pt-4">
                    <div className="flex h-56 items-end gap-2 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-[var(--crm-muted)] font-medium">
                        <div className="border-b border-dashed border-[var(--crm-border)]/60 pb-1">{areaChartPaths.maxVal} {pipelineTab === 'leads' ? 'Leads' : 'Enrolled'}</div>
                        <div className="border-b border-dashed border-[var(--crm-border)]/60 pb-1">{Math.round(areaChartPaths.maxVal * 0.75)}</div>
                        <div className="border-b border-dashed border-[var(--crm-border)]/60 pb-1">{Math.round(areaChartPaths.maxVal * 0.5)}</div>
                        <div className="border-b border-dashed border-[var(--crm-border)]/60 pb-1">{Math.round(areaChartPaths.maxVal * 0.25)}</div>
                        <div className="pb-1">0</div>
                      </div>

                      <svg className="w-full h-full text-[var(--tenant-primary)] overflow-visible relative z-10" viewBox="0 0 500 160" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="admissionsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--tenant-primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--tenant-primary)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          key={`area-${pipelineTab}`}
                          d={areaChartPaths.areaPath}
                          fill="url(#admissionsAreaGradient)"
                          className="animate-fade-in-up transition-all duration-700 ease-out"
                        />
                        <path
                          key={`stroke-${pipelineTab}`}
                          d={areaChartPaths.strokePath}
                          fill="none"
                          stroke="var(--tenant-primary)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-draw-stroke transition-all duration-700 ease-out"
                        />
                      </svg>
                    </div>

                    {/* X-Axis Months */}
                    <div className="flex justify-between mt-4 pt-2 border-t border-[var(--crm-border)]/60 text-[11px] text-[var(--crm-muted)] font-medium">
                      {pipelineMonths.map((month) => (
                        <span key={month}>{month}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Admissions Counselors Table Card */}
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-xs animate-fade-in-up [animation-delay:300ms]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-base font-bold text-[var(--crm-text)]">Admissions Counselor Workload</h3>
                      <p className="text-xs text-[var(--crm-muted)] mt-0.5">Active lead assignments and conversion metrics</p>
                    </div>
                    <button onClick={() => setActiveNav('crm')} className="text-xs font-semibold text-[var(--tenant-primary)] hover:opacity-80 flex items-center gap-1">
                      View all →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--crm-border)] text-[var(--crm-muted)] font-semibold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 w-8">#</th>
                          <th className="pb-3">Counselor</th>
                          <th className="pb-3 text-right">Assigned Leads</th>
                          <th className="pb-3 text-right">Enrolled</th>
                          <th className="pb-3 text-right pl-6">SLA & Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--crm-border)]/60">
                        {counselorSummary.slice(0, 4).map((owner, idx) => {
                          const winRate = 58 - idx * 6;
                          return (
                            <tr key={owner.name} className="group hover:bg-[var(--crm-surface)] transition-colors">
                              <td className="py-3.5 text-[var(--crm-muted)] font-medium">{idx + 1}</td>
                              <td className="py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs" style={{ background: brandGradient }}>
                                    <span>{owner.name.slice(0, 2).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[var(--crm-text)]">{owner.name}</p>
                                    <p className="text-[11px] text-[var(--crm-muted)]">Admissions Counselor</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-[14px] text-right font-bold text-[var(--crm-text)]">{owner.total}</td>
                              <td className="py-[14px] text-right font-bold text-[var(--crm-text)]">{Math.max(1, Math.round(owner.total * 0.42))}</td>
                              <td className="py-[14px] text-right pl-6">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 h-2 rounded-full bg-[var(--crm-panel)] overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: 'var(--tenant-primary)' }} />
                                  </div>
                                  <span className="font-bold text-[var(--crm-text)] min-w-[32px]">{winRate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1 Column wide on LG) */}
              <div className="space-y-6">

                {/* Admissions Stages Donut Chart Card */}
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-xs animate-fade-in-up [animation-delay:350ms]">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-[var(--crm-text)]">Admissions Stages</h3>
                    <p className="text-xs text-[var(--crm-muted)] mt-0.5">Distribution of active leads by pipeline stage</p>
                  </div>

                  {/* 100% Data-Driven SVG Donut Chart */}
                  <div className="relative my-6 flex items-center justify-center">
                    <svg className="w-48 h-48 transform -rotate-90 transition-all duration-700 ease-out" viewBox="0 0 100 100">
                      {(() => {
                        const STAGE_COLORS = [
                          'var(--tenant-primary)',
                          'var(--tenant-secondary)',
                          '#3b82f6',
                          '#f59e0b',
                          '#a855f7',
                          '#ec4899',
                          '#10b981',
                          '#6366f1',
                        ];
                        const total = pipelineSummary.reduce((acc, curr) => acc + curr.count, 0);
                        if (total === 0) {
                          return <circle cx="50" cy="50" r="38" fill="none" stroke="var(--crm-border)" strokeWidth="12" />;
                        }
                        const C = 238.76;
                        let currentOffset = 0;
                        return pipelineSummary.map((stage, idx) => {
                          if (stage.count === 0) return null;
                          const sliceLength = (stage.count / total) * C;
                          const gap = C - sliceLength;
                          const dashArray = `${sliceLength.toFixed(2)} ${gap.toFixed(2)}`;
                          const dashOffset = -currentOffset;
                          currentOffset += sliceLength;
                          const color = STAGE_COLORS[idx % STAGE_COLORS.length];
                          return (
                            <circle
                              key={stage.id}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke={color}
                              strokeWidth="12"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                              className="animate-donut-arc transition-all duration-700 ease-out"
                              style={{ animationDelay: `${idx * 150 + 200}ms` }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black tracking-tight text-[var(--crm-text)]">{leads.length}</span>
                      <span className="text-[11px] font-semibold text-[var(--crm-muted)]">Active Leads</span>
                    </div>
                  </div>

                  {/* 100% Data-Driven Legend List */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-3 border-t border-[var(--crm-border)]/60 text-xs">
                    {pipelineSummary.map((stage, idx) => {
                      const STAGE_COLORS = [
                        'var(--tenant-primary)',
                        'var(--tenant-secondary)',
                        '#3b82f6',
                        '#f59e0b',
                        '#a855f7',
                        '#ec4899',
                        '#10b981',
                        '#6366f1',
                      ];
                      const color = STAGE_COLORS[idx % STAGE_COLORS.length];
                      return (
                        <div key={stage.id} className="flex items-center justify-between min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="font-medium text-[var(--crm-text)] truncate text-[11px]">{stage.title}</span>
                          </div>
                          <span className="font-bold text-[var(--crm-text)] text-[11px] shrink-0 ml-1">{stage.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lead Acquisition Sources Card */}
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-xs animate-fade-in-up [animation-delay:400ms]">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-[var(--crm-text)]">Lead Acquisition Sources</h3>
                    <p className="text-xs text-[var(--crm-muted)] mt-0.5">Where applicant inquiries originate</p>
                  </div>

                  <div className="space-y-4">
                    {sourceSummary.slice(0, 4).map((source) => (
                      <div key={source.source} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-[var(--crm-text)]">
                          <span>{source.source}</span>
                          <span className="text-[var(--crm-muted)] font-bold">{source.percent}%</span>
                        </div>
                        <div className="h-3.5 rounded-lg bg-[var(--crm-panel)] overflow-hidden">
                          <div className="h-full rounded-lg transition-all duration-500 ease-out" style={{ width: `${Math.max(10, source.percent)}%`, background: 'var(--tenant-primary)' }} />
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
          <section className={`campus-admin-module campus-admin-module-${activeNav} flex-1 overflow-y-auto kanban-scroll-hidden p-6`}>
            <div className="campus-module-header mb-5 flex flex-wrap items-end justify-between gap-4">
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
              {canCreateActiveRecord && (
                <button
                  type="button"
                  onClick={() => openOperation(workArea?.primaryAction ?? 'New record', requirementPage.title, ['Name', 'Owner', 'Priority', 'Notes'], 'Create')}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm"
                  style={{ background: brandGradient }}
                >
                  <PlusCircle size={15} />
                  {workArea?.primaryAction ?? 'New record'}
                </button>
              )}
            </div>

            <div className="campus-module-stats grid grid-cols-4 gap-4">
              {requirementPage.stats.map((stat, index) => {
                const Icon = [Target, Clock, CheckCircle2, BarChart3][index] ?? BarChart3;
                return (
                  <div key={stat} className={`rounded-2xl border p-5 shadow-sm ${index === 0 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${index === 0 ? 'text-white/75' : 'text-[var(--crm-muted)]'}`}>{stat}</p>
                      <Icon size={17} />
                    </div>
                    <p className="mt-4 text-4xl">{requirementStatValues[index]}{index === 3 ? '%' : ''}</p>
                  </div>
                );
              })}
            </div>

            {activeAdminScreen && !customRequirementLayout && (
              <div className={`campus-module-layout mt-4 grid gap-4 ${activeNav === 'admissions' || activeNav === 'students' ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_340px]'}`}>
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

                  <div className="campus-record-toolbar mt-4 flex items-center gap-2 rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-2">
                    <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">
                      <Search size={14} />
                      <input placeholder={`Search ${activeAdminScreen.label.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent outline-none" />
                    </label>
                    <button type="button" onClick={() => openOperation('Export records', activeAdminScreen.label, ['Format', 'Date range', 'Columns'], 'Export')} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-muted)]">Export</button>
                    <button type="button" onClick={() => openOperation(activeAdminScreen.operations[0] ?? 'New', activeAdminScreen.label, ['Name', 'Status', 'Owner', 'Notes'], 'Save')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>
                      {activeAdminScreen.operations[0] ?? 'New'}
                    </button>
                  </div>

                  <div className="campus-data-table mt-4 overflow-x-auto rounded-2xl border border-[var(--crm-border)]">
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

                  <div className="campus-card-grid mt-4 grid grid-cols-4 gap-2">
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
              <div className="campus-module-layout campus-crm-layout mt-4 grid grid-cols-[minmax(0,1fr)_340px] gap-4">
                <div className="space-y-4">
                  <div className="rounded-[28px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">CRM command center</p>
                        <h3 className="mt-1 text-2xl">Lead operations board</h3>
                      </div>
                      <div className="flex gap-2">
                        {canImportLeads && <button type="button" onClick={openLeadImport} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]">Import</button>}
                        {canCreateLeads && <button type="button" onClick={() => openOperation('Create lead', 'Lead Capture', ['Student name', 'Phone', 'WhatsApp', 'Course', 'Source', 'City'], 'Create lead')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Create lead</button>}
                      </div>
                    </div>

                    <div className="campus-card-grid mt-5 grid grid-cols-5 gap-3">
                      {[
                        ['New leads', crmDashboard?.operations.newLeads ?? 0, Target],
                        ['Contact due', crmDashboard?.operations.contactDue ?? 0, Clock],
                        ['Qualified', crmDashboard?.operations.qualified ?? 0, CheckCircle2],
                        ['Applications', crmDashboard?.operations.applications ?? 0, FileText],
                        ['Accepted', crmDashboard?.operations.accepted ?? 0, ShieldCheck],
                      ].map(([label, value, Icon], index) => (
                        <div key={label as string} className={`rounded-2xl border p-4 text-left ${index === 0 ? 'border-transparent text-white' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`} style={index === 0 ? { background: brandGradient } : undefined}>
                          {React.createElement(Icon as LucideIcon, { size: 16 })}
                          <p className="mt-4 text-3xl">{value as number}</p>
                          <p className={`mt-1 text-[10px] ${index === 0 ? 'text-white/70' : 'text-[var(--crm-muted)]'}`}>{label as string}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`campus-crm-operation-grid mt-5 grid gap-4 ${canReadCrmConfiguration || canUpdateCrmConfiguration ? 'grid-cols-[1fr_220px]' : 'grid-cols-1'}`}>
                      <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm">Priority lead queue</h4>
                          <button type="button" onClick={() => openOperation('Filter leads', 'Leads', ['Source', 'Stage', 'Assignee', 'Priority'], 'Apply filter')} className="rounded-lg bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--crm-muted)]">Filter</button>
                        </div>
                        <div className="space-y-2">
                          {(crmDashboard?.operations.priorityQueue ?? []).map((lead) => {
                            const priorityLabel = lead.priority === 'urgent' || lead.priority === 'high' ? 'Hot' : lead.priority === 'medium' ? 'Warm' : 'Cold';
                            const priorityTone = priorityLabel === 'Hot' ? 'bg-red-50 text-red-600' : priorityLabel === 'Warm' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700';
                            return (
                            <button key={lead.leadId} type="button" onClick={() => openOperation(`Open ${lead.fullName}`, 'Leads', ['Details', 'Timeline', 'Documents', 'Forms'], 'Update lead')} className="campus-priority-row grid w-full grid-cols-[1fr_110px_90px_auto] items-center gap-3 rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs hover:bg-[var(--tenant-surface)]">
                              <span className="min-w-0">
                                <span className="block truncate">{lead.fullName}</span>
                                <span className="mt-1 block truncate text-[10px] text-[var(--crm-muted)]">{lead.course ?? 'Not provided'} / {lead.city ?? 'Not provided'}</span>
                              </span>
                              <span className="truncate text-[var(--crm-muted)]">{lead.source}</span>
                              <span className="truncate text-[var(--crm-muted)]">{lead.assignedTo ?? 'Unassigned'}</span>
                              <span className={`rounded-full px-2 py-1 text-[10px] ${priorityTone}`}>{priorityLabel}</span>
                            </button>
                          );})}
                        </div>
                      </div>

                      {(canReadCrmConfiguration || canUpdateCrmConfiguration) && (
                        <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                          <h4 className="text-sm">Stage automation</h4>
                          <div className="mt-4 space-y-2">
                            {(crmDashboard?.automations ?? []).map((automation) => {
                              const automationText = `${automation.label} ${automation.action}`.toLowerCase();
                              const canRunAutomation = automationText.includes('assign')
                                ? canAssignLeads
                                : automationText.includes('handoff')
                                  ? canTriggerErpHandoff
                                  : ['whatsapp', 'email', 'call', 'follow'].some((term) => automationText.includes(term))
                                    ? canSendCrmCommunications
                                    : canUpdateCrmConfiguration;
                              const automationContent = (
                                <>
                                  <span>{automation.label}</span>
                                  <span className={`h-5 w-9 rounded-full p-0.5 ${automation.enabled ? 'bg-[var(--tenant-primary)]' : 'bg-[var(--crm-panel)]'}`}>
                                    <span className={`block h-4 w-4 rounded-full bg-white ${automation.enabled ? 'ml-4' : ''}`} />
                                  </span>
                                </>
                              );
                              return canRunAutomation ? (
                                <button key={automation.id ?? `${automation.stage}:${automation.action}`} type="button" onClick={() => openOperation(automation.label, 'CRM Settings', ['Trigger', 'Condition', 'Template', 'Enabled'], 'Save rule')} className="flex w-full items-center justify-between rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs">
                                  {automationContent}
                                </button>
                              ) : (
                                <div key={automation.id ?? `${automation.stage}:${automation.action}`} className="flex w-full items-center justify-between rounded-xl bg-[var(--crm-card)] p-3 text-left text-xs text-[var(--crm-muted)]">
                                  {automationContent}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Campaign ledger</p>
                          <h3 className="mt-1 text-lg">Source ROI</h3>
                        </div>
                        {canCreateCampaigns && <button type="button" onClick={() => openOperation('Create campaign', 'Campaign Management', ['Campaign name', 'Budget', 'Audience', 'UTM'], 'Create campaign')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>New campaign</button>}
                      </div>
                      <div className="campus-data-table mt-5 overflow-x-auto rounded-xl">
                      <div className="grid grid-cols-[1.1fr_.7fr_.7fr_.7fr_.8fr] rounded-xl bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                        <span>Source</span>
                        <span>Leads</span>
                        <span>Apps</span>
                        <span>CPL</span>
                        <span>ROI</span>
                      </div>
                      <div className="overflow-hidden rounded-b-xl border-x border-b border-[var(--crm-border)]">
                        {(crmDashboard?.sourceRoi ?? []).slice(0, 5).map((source) => (
                          <button key={source.source} type="button" onClick={() => openOperation(`${source.source} campaign`, 'Campaign Management', ['Spend', 'Leads', 'Applications', 'ROI'], 'Open campaign')} className="grid w-full grid-cols-[1.1fr_.7fr_.7fr_.7fr_.8fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs first:border-t-0 hover:bg-[var(--crm-surface)]">
                            <span className="truncate">{source.source}</span>
                            <span>{source.leads}</span>
                            <span>{source.applications}</span>
                            <span>{source.costPerLead == null ? 'N/A' : `Rs. ${source.costPerLead.toLocaleString('en-IN')}`}</span>
                            <span>
                              <span className="inline-flex min-w-14 justify-center rounded-full bg-[var(--tenant-surface)] px-2 py-1 text-[10px] text-[var(--tenant-primary)]">{source.roi == null ? 'N/A' : `${source.roi}x`}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                      </div>
                      <div className="campus-card-grid mt-4 grid grid-cols-3 gap-3">
                        {[
                          ['Budget used', `${crmDashboard?.campaignSummary.budgetUsedPercent ?? 0}%`],
                          ['Landing pages', crmDashboard?.campaignSummary.landingPages ?? 0],
                          ['Active UTM', crmDashboard?.campaignSummary.activeUtm ?? 0],
                        ].map(([metric, value]) => (
                          <button key={metric} type="button" onClick={() => openOperation(metric as string, 'Campaign Management', ['Date range', 'Source', 'Budget'], 'View metric')} className="rounded-xl bg-[var(--crm-surface)] p-3 text-left">
                            <p className="text-[10px] text-[var(--crm-muted)]">{metric}</p>
                            <p className="mt-2 text-xl">{value}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] p-5 text-white shadow-sm" style={{ background: 'linear-gradient(145deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 72%, #000))' }}>
                    <p className="text-xs text-white/70">CRM health</p>
                    <p className="mt-4 text-5xl">{crmDashboard?.health.score ?? 0}%</p>
                    <p className="mt-2 text-xs text-white/70">lead records with owner, follow-up, and source attribution</p>
                    <div className="mt-6 space-y-3">
                      {[
                        ['Duplicate detection', crmDashboard?.health.duplicateDetection ?? 0],
                        ['Source attribution', crmDashboard?.health.sourceAttribution ?? 0],
                        ['Post-qualified WhatsApp', crmDashboard?.health.postQualifiedWhatsapp ?? 0],
                      ].map(([item, value]) => (
                        <button key={item} type="button" onClick={() => openOperation(item as string, 'CRM Settings', ['Rule', 'Owner', 'Status'], 'Configure')} className="w-full rounded-2xl bg-white/12 p-3 text-left text-xs">
                          <div className="flex justify-between"><span>{item}</span><span>{value}%</span></div>
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
                      <span className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] text-red-600">{crmDashboard?.cases.open ?? 0} open</span>
                    </div>
                    <div className="campus-card-grid mt-5 grid grid-cols-4 gap-2">
                      {[
                        ['Prospect', crmDashboard?.cases.counts.prospect ?? 0, 'Future'],
                        ['Deferred', crmDashboard?.cases.counts.deferred ?? 0, 'Intake'],
                        ['On Hold', crmDashboard?.cases.counts.on_hold ?? 0, 'Paused'],
                        ['Archive', crmDashboard?.cases.counts.archive ?? 0, 'Review'],
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
                      {(crmDashboard?.cases.items ?? []).map((item) => {
                        const status = item.status ?? 'Case review';
                        const tone = status.toLowerCase().includes('archive') ? 'bg-red-50 text-red-600' : status.toLowerCase().includes('hold') ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700';
                        return (
                        <button key={item.leadId} type="button" onClick={() => openOperation(`${status}: ${item.fullName}`, 'Archive & Hold', ['Lead', 'Reason', 'Reminder date', 'Approval'], 'Review case')} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-[var(--crm-surface)] p-3.5 text-left text-xs transition hover:bg-[var(--tenant-surface)]">
                          <span className="min-w-0">
                            <span className="block truncate text-sm">{item.fullName}</span>
                            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-[var(--crm-muted)]">
                              <span className="truncate">{status}</span>
                              <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--crm-muted)]/50" />
                              <span className="truncate">{item.reason ?? 'No reason provided'}</span>
                            </span>
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] ${tone}`}>{item.due ?? 'Not set'}</span>
                        </button>
                      );})}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === 'admissions' && (
              <div className="campus-module-layout campus-admissions-layout mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="space-y-4">
                  <div className="campus-card-grid grid grid-cols-3 gap-4">
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
                    <div className="campus-data-table mt-5 overflow-x-auto rounded-xl">
                    <div className="grid grid-cols-[1fr_.8fr_.8fr_.8fr_auto] gap-2 rounded-xl bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
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
                  <div className="campus-data-table overflow-x-auto rounded-xl border border-[var(--crm-border)]">
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
                <div className="campus-card-grid grid grid-cols-5 gap-3">
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

                <div className="campus-module-layout grid grid-cols-[minmax(0,1fr)_320px] gap-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base">Timetable Command Board</h3>
                      <button type="button" onClick={() => openOperation('Publish timetable', 'Timetable Command Board', ['Academic year', 'Effective date', 'Notify students', 'Publish note'], 'Publish')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Publish timetable</button>
                    </div>
                    <div className="campus-academic-board mt-5 grid grid-cols-6 gap-3">
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
              <div className="campus-module-layout campus-fees-layout mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base">Finance Ledger</h3>
                    <button type="button" onClick={() => openOperation('Generate invoice', 'Finance Ledger', ['Student or batch', 'Fee structure', 'Due date', 'Installment plan'], 'Generate')} className="rounded-xl px-3 py-2 text-xs text-white" style={{ background: brandGradient }}>Generate invoice</button>
                  </div>
                  <div className="campus-card-grid mt-5 grid grid-cols-4 gap-3">
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
              <div className="campus-module-layout campus-erp-layout mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="campus-card-grid grid grid-cols-3 gap-4">
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
              <div className="campus-module-layout campus-reports-layout mt-4 grid grid-cols-[320px_minmax(0,1fr)] gap-4">
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
                  <div className="campus-card-grid mt-5 grid grid-cols-3 gap-4">
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
                  <div className="campus-card-grid mt-5 grid grid-cols-2 gap-3">
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
          <section className="campus-admin-module campus-admin-users flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="campus-module-header mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Access directory</p>
                <h2 className="mt-1 text-2xl">Users, roles, and module coverage</h2>
                <p className="mt-1 text-xs text-[var(--crm-muted)]">One directory for CRM, Fee Management, ERP, staff portals, student app, and parent portal access.</p>
              </div>
              {canCreateUsers && <button type="button" onClick={() => setAccessModal('users')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                <PlusCircle size={15} />
                Add user
              </button>}
            </div>

            <div className="campus-module-stats grid grid-cols-4 gap-4">
              {[
                ['Total users', visibleStaffUsers.length, Users],
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

            <div className="campus-module-layout mt-4 grid grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base">All role users</h3>
                    <p className="mt-1 text-xs text-[var(--crm-muted)]">Every operational role is represented, not only admissions CRM users.</p>
                  </div>
                  <span className="rounded-full bg-[var(--crm-panel)] px-3 py-1.5 text-[11px] text-[var(--crm-muted)]">{visibleStaffUsers.length} accounts</span>
                </div>
                <div className="campus-data-table mt-4 overflow-x-auto rounded-xl border border-[var(--crm-border)]">
                  <div className="grid grid-cols-[1.1fr_.9fr_.9fr_1.4fr] bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                    <span>User</span>
                    <span>Role</span>
                    <span>Team</span>
                    <span>Access</span>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto kanban-scroll-hidden">
                    {visibleStaffUsers.map((user) => (
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
                          <span className="block h-full rounded-full bg-[var(--tenant-primary)]" style={{ width: `${Math.max(12, Math.round((count / Math.max(visibleStaffUsers.length, 1)) * 100))}%` }} />
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
              {visibleStaffUsers.map((user) => (
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
          <section className="campus-admin-module campus-admin-settings flex-1 overflow-y-auto kanban-scroll-hidden p-6">
            <div className="campus-settings-header mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Admin Settings</h2>
                <p className="text-xs text-[var(--crm-muted)] font-semibold mt-1">Control account session, forms, access, workflows, and themes from one place.</p>
              </div>
              <div className="flex items-center gap-3">
                {settingsSection === 'forms' && canCreateForms && (
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
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-extrabold text-red-600 shadow-sm transition-colors hover:bg-red-100 hover:border-red-300"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
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

            {settingsSection === 'account' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-sm"
                        style={{ background: brandGradient }}
                      >
                        {student?.initials ?? 'SC'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold">{student?.name ?? 'Campus User'}</h3>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            Active Session
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--crm-muted)] font-semibold">
                          {student?.email ?? 'user@supercampus.io'} · {student?.role?.replaceAll('_', ' ') ?? 'Authenticated Staff User'}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--crm-muted)]">
                          Tenant Access: <span className="font-extrabold text-[var(--crm-text)]">{student?.college ?? 'SuperCampus Main'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-[var(--crm-surface)] border border-[var(--crm-border)]">
                        <User size={18} className="text-[var(--tenant-primary)]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold">Account Profile</h4>
                        <p className="text-[11px] text-[var(--crm-muted)] font-semibold">Current credentials & assigned permissions</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-[var(--crm-surface)] p-3">
                        <span className="text-[var(--crm-muted)] font-semibold">Account Role</span>
                        <span className="font-bold">{student?.role?.replaceAll('_', ' ') ?? 'Staff'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[var(--crm-surface)] p-3">
                        <span className="text-[var(--crm-muted)] font-semibold">Assigned Permissions</span>
                        <span className="font-bold">{permissions.includes('*') ? 'Super Admin (All)' : `${permissions.length} keys`}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[var(--crm-surface)] p-3">
                        <span className="text-[var(--crm-muted)] font-semibold">Authentication Method</span>
                        <span className="font-bold">OAuth 2.0 / JWT Session</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === 'forms' && (
              <div className="campus-settings-layout campus-settings-form-layout grid grid-cols-[260px_1fr] gap-4 min-h-[680px]">
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
                            {canUpdateForms && (
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
                            )}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-[var(--crm-muted)] font-bold">{form.module} · {formTypeLabel(form.module, form.formType)}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[var(--crm-muted)]">
                          <span>{form.fields} fields</span>
                          <span>{form.owner}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] overflow-hidden flex flex-col">
                  <div className="campus-settings-toolbar min-h-14 px-4 py-2 border-b border-[var(--crm-border)] flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold truncate">{selectedForm.name}</h3>
                      <p className="text-[11px] text-[var(--crm-muted)] font-semibold">{selectedForm.module} → {formTypeLabel(selectedForm.module, selectedForm.formType)} · {countSchemaFields(selectedFormSchema)} configured fields</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg border ${previewMode === 'desktop' ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}><Monitor size={15} /></button>
                      <button type="button" onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg border ${previewMode === 'mobile' ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}><Smartphone size={15} /></button>
                      {selectedForm.id && (
                        <>
                          {canUpdateForms && <button type="button" onClick={() => openEditForm(selectedForm)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2 text-xs text-[var(--crm-muted)]"><Pencil size={14} /> Edit</button>}
                          {canPublishForms && (
                            <button
                              type="button"
                              onClick={() => changeFormPublication(selectedForm, selectedForm.status !== 'Live')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold text-white"
                              style={{ background: brandGradient }}
                            >
                              <CheckCircle2 size={14} />
                              {selectedForm.status === 'Live' ? 'Unpublish' : 'Publish'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {selectedForm.id && selectedForm.status === 'Live' && selectedForm.formType.replace('-', '_') !== 'lead_capture' && (
                    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
                      <span>
                        This form is live for <strong>{selectedForm.module} → {formTypeLabel(selectedForm.module, selectedForm.formType)}</strong>. It will not appear in CRM Create Lead.
                      </span>
                      {canUpdateForms && <button type="button" onClick={() => openEditForm(selectedForm)} className="shrink-0 font-extrabold underline">Change destination</button>}
                    </div>
                  )}

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
                              <div className="campus-settings-section-fields grid grid-cols-2 gap-3">
                                {section.fields.map((field, fieldIndex) => {
                                  const fieldKey = `${sectionIndex}:${fieldIndex}`;
                                  const isDragOver = dragOverKey === fieldKey;
                                  const isSelected = selectedFieldKey === fieldKey;
                                  return (
                                  <div
                                    key={`${section.section}-${field.label}-${fieldIndex}`}
                                    draggable
                                    onDragStart={(event) => handleFieldCardDragStart(event, fieldKey)}
                                    onDragOver={(event) => handleFieldCardDragOver(event, fieldKey)}
                                    onDragLeave={() => setDragOverKey(null)}
                                    onDrop={(event) => handleFieldCardDrop(event, fieldKey)}
                                    onClick={() => setSelectedFieldKey(fieldKey)}
                                    className={`group relative cursor-grab active:cursor-grabbing rounded-2xl border bg-[var(--crm-card)] p-4 text-left transition-all ${
                                      field.width === 'full' || previewMode === 'mobile' ? 'col-span-2' : ''
                                    } ${
                                      isDragOver
                                        ? 'border-[var(--tenant-primary)] ring-4 ring-[var(--tenant-primary)]/20 scale-[1.02] bg-[var(--tenant-surface)] shadow-lg z-10'
                                        : isSelected
                                          ? 'border-[var(--tenant-primary)] ring-2 ring-[var(--tenant-primary)]/15 shadow-sm'
                                          : 'border-[var(--crm-border)] hover:border-[var(--tenant-primary)]/60 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1 rounded-md bg-[var(--crm-panel)] text-[var(--crm-muted)] opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                          <GripVertical size={13} />
                                        </div>
                                        <span className="truncate text-xs font-bold text-[var(--crm-text)]">{field.label}</span>
                                        {field.required && (
                                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                                            Required
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0 bg-[var(--crm-surface)] p-0.5 rounded-lg border border-[var(--crm-border)]">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            moveFieldByKey(fieldKey, 'up');
                                          }}
                                          className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                          title="Move up"
                                        >
                                          <ChevronUp size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            moveFieldByKey(fieldKey, 'down');
                                          }}
                                          className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                          title="Move down"
                                        >
                                          <ChevronDown size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openFieldEditor(fieldKey, field);
                                          }}
                                          className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                          title="Edit field settings"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            deleteFieldByKey(fieldKey);
                                          }}
                                          className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition-colors"
                                          title="Delete field"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="min-h-10 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-bg)]/80 px-3.5 py-2 flex items-center justify-between text-xs text-[var(--crm-muted)] font-medium transition-colors group-hover:border-[var(--crm-border)]">
                                      <span className="truncate">{fieldPreviewText(field)}</span>
                                      <span className="text-[10px] font-semibold text-[var(--crm-muted)] px-2 py-0.5 rounded-md bg-[var(--crm-card)] border border-[var(--crm-border)] shrink-0 ml-2">
                                        {field.type}
                                      </span>
                                    </div>
                                    {field.helpText?.trim() && <p className="mt-1.5 text-[10px] text-[var(--crm-muted)]">{field.helpText}</p>}
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

            {settingsSection === 'workflows' && (
              <div className="campus-settings-layout grid grid-cols-[minmax(0,1fr)_340px] gap-4">
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

                <div className="campus-module-stats grid grid-cols-4 gap-4">
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

                <div className="campus-settings-layout grid grid-cols-[minmax(0,1fr)_340px] gap-4">
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
                        <p className="mt-1">{selectedPermissionCount}/{allPermissionKeys.length}</p>
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
      const roleUsers = visibleStaffUsers.filter((user) => user.roleIds.includes(role.id));
                      const roleCoverage = rolePermissions.includes('*')
                        ? 100
                        : allPermissionKeys.length ? Math.round((rolePermissions.length / allPermissionKeys.length) * 100) : 0;
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
                          onClick={() => void toggleRolePermissions(selectedAccessRole.id, allPermissionKeys)}
                          disabled={!canUpdateRoles}
                          className="px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs font-bold text-[var(--crm-muted)] hover:text-[var(--crm-text)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleRolePermissions(selectedAccessRole.id, selectedRolePermissions)}
                          disabled={!canUpdateRoles}
                          className="px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs font-bold text-[var(--crm-muted)] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-3">
                      {[
                        ['Coverage', `${accessCoverage}%`],
                        ['Permissions', `${selectedPermissionCount}/${allPermissionKeys.length}`],
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
                            disabled={!canUpdateRoles}
                          />
                          Enable module
                        </label>
                      </div>

                      <div className="grid gap-2">
                        {selectedAccessModule.features.map((feature) => {
                          const crudKeys = featurePermissionKeys(selectedAccessModule, feature);
                          const enabledCount = crudKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                          const featureFullyEnabled = crudKeys.length > 0 && enabledCount === crudKeys.length;
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
                                  <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{enabledCount}/{crudKeys.length} permission enabled</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRoleFeature(selectedAccessRole.id, selectedAccessModule, feature)}
                                  disabled={!canUpdateRoles}
                                  className="shrink-0 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-1 text-[10px] text-[var(--crm-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {featureFullyEnabled ? 'Clear' : 'All'}
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-4 gap-2">
                                {CRUD_ACTIONS.map((action) => {
                                  const permissionKeys = permissionKeysFor(selectedAccessModule, feature, action.id);
                                  if (!permissionKeys.length) {
                                    return (
                                      <span
                                        key={action.id}
                                        className="grid place-items-center rounded-lg border border-dashed border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-2 text-[9px] text-[var(--crm-muted)] opacity-60"
                                        aria-label={`${action.id} is not applicable for ${feature}`}
                                        title={`No ${action.id} operation is registered for ${feature}`}
                                      >
                                        N/A
                                      </span>
                                    );
                                  }
                                  const enabled = permissionKeys.every((permissionKey) => selectedRolePermissionSet.has(permissionKey));
                                  return (
                                    <button
                                      key={action.id}
                                      type="button"
                                      onClick={() => toggleRolePermissions(selectedAccessRole.id, permissionKeys)}
                                      disabled={!canUpdateRoles}
                                      className={`rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                                        enabled
                                          ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white'
                                          : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                                      }`}
                                      aria-label={`${action.id} ${feature}`}
                                      title={`${action.id}: ${permissionKeys.join(', ')}`}
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
                      <button type="button" onClick={addUserUnderRole} disabled={!canCreateUsers} className="w-full rounded-lg border border-[var(--crm-border)] px-3 py-2 text-xs font-extrabold text-[var(--crm-text)] hover:bg-[var(--crm-panel)] disabled:cursor-not-allowed disabled:opacity-40">Add to role</button>
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
                      className={`px-3 py-4 rounded-xl border text-xs font-bold capitalize transition-colors ${
                        theme === themeId
                          ? 'border-[var(--tenant-primary)] text-[var(--tenant-primary)] bg-[var(--tenant-surface)] shadow-xs'
                          : 'border-[var(--crm-border)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]'
                      }`}
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
          <div className={`w-full ${crmOperationKind === 'import' ? 'max-w-5xl' : 'max-w-xl'} overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl`}>
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
              {crmOperationKind === 'import' && (
                <div className="space-y-4">
                  {!leadImportResult ? (
                    <>
                      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <label className="grid min-h-44 cursor-pointer place-items-center rounded-2xl border border-dashed border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_7%,var(--crm-surface))] p-5 text-center">
                            <span>
                              <UploadCloud size={28} className="mx-auto text-[var(--tenant-primary)]" />
                              <span className="mt-3 block text-sm">{leadImportFileName || 'Upload lead CSV'}</span>
                              <span className="mt-1 block text-[10px] leading-5 text-[var(--crm-muted)]">Header row required · maximum 1000 rows · 2 MB</span>
                            </span>
                            <input type="file" accept=".csv,text/csv" onChange={handleLeadImportFile} className="hidden" />
                          </label>
                          <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                            <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Duplicate handling</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {([
                                ['skip', 'Skip duplicates'],
                                ['flag', 'Import & flag'],
                              ] as const).map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setLeadImportDuplicateStrategy(value)}
                                  className={`rounded-xl px-3 py-2.5 text-xs ${leadImportDuplicateStrategy === value ? 'text-white' : 'border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)]'}`}
                                  style={leadImportDuplicateStrategy === value ? { background: brandGradient } : undefined}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <p className="mt-3 text-[10px] leading-5 text-[var(--crm-muted)]">Duplicates are checked within the file and against tenant leads using phone or email. Skip is the safe default.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm">Column mapping</h4>
                                <p className="mt-1 text-[10px] text-[var(--crm-muted)]">Headers are matched automatically; review before importing.</p>
                              </div>
                              <span className="rounded-lg bg-[var(--crm-card)] px-2.5 py-1 text-[10px] text-[var(--crm-muted)]">{leadImportRows.length} rows</span>
                            </div>
                            {leadImportHeaders.length ? (
                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                {LEAD_IMPORT_COLUMNS.map((column) => (
                                  <label key={column.key} className="text-[10px] text-[var(--crm-muted)]">
                                    {column.label}{column.required ? ' *' : ''}
                                    <select
                                      value={leadImportMapping[column.key]}
                                      onChange={(event) => setLeadImportMapping((current) => ({ ...current, [column.key]: event.target.value }))}
                                      className="mt-1 h-9 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 text-[11px] text-[var(--crm-text)] outline-none"
                                    >
                                      <option value="">Not mapped</option>
                                      {leadImportHeaders.map((header) => <option key={header} value={header}>{header}</option>)}
                                    </select>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-4 rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-card)] p-8 text-center text-xs text-[var(--crm-muted)]">Upload a CSV to configure the mapping.</div>
                            )}
                          </div>

                          {leadImportHeaders.length > 0 && (
                            <div className="overflow-hidden rounded-2xl border border-[var(--crm-border)]">
                              <div className="flex items-center justify-between bg-[var(--crm-surface)] px-4 py-3">
                                <h4 className="text-xs">Import preview</h4>
                                <span className="text-[10px] text-[var(--crm-muted)]">
                                  {leadImportPreview.filter((row) => !row.issue).length} valid · {leadImportPreview.filter((row) => row.issue).length} invalid
                                </span>
                              </div>
                              <div className="grid grid-cols-[52px_1.2fr_1fr_1fr_90px] bg-[var(--crm-panel)] px-3 py-2 text-[9px] uppercase tracking-wider text-[var(--crm-muted)]">
                                <span>Row</span><span>Name</span><span>Contact</span><span>Program/source</span><span>Status</span>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {leadImportPreview.slice(0, 50).map((row) => (
                                  <div key={row.rowNumber} className="grid grid-cols-[52px_1.2fr_1fr_1fr_90px] items-center border-t border-[var(--crm-border)] px-3 py-2.5 text-[10px]">
                                    <span className="text-[var(--crm-muted)]">{row.rowNumber}</span>
                                    <span className="truncate">{row.name || 'Missing name'}</span>
                                    <span className="truncate text-[var(--crm-muted)]">{row.phone || row.email || 'Missing contact'}</span>
                                    <span className="truncate text-[var(--crm-muted)]">{row.program || row.source}</span>
                                    <span className={`rounded-md px-2 py-1 text-center ${row.issue ? 'bg-red-50 text-red-600' : row.duplicateInFile ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                      {row.issue ? 'Invalid' : row.duplicateInFile ? 'Duplicate' : 'Ready'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          ['Rows', leadImportResult.total],
                          ['Created', leadImportResult.created],
                          ['Skipped', leadImportResult.skipped],
                          ['Failed', leadImportResult.failed],
                        ].map(([label, value], index) => (
                          <div key={label} className={`rounded-2xl border p-4 ${index === 1 ? 'border-emerald-200 bg-emerald-50' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`}>
                            <p className="text-[10px] text-[var(--crm-muted)]">{label}</p>
                            <p className="mt-2 text-2xl">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-[var(--crm-border)]">
                        <div className="grid grid-cols-[80px_120px_1fr] bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]"><span>CSV row</span><span>Result</span><span>Details</span></div>
                        <div className="max-h-72 overflow-y-auto">
                          {leadImportResult.rows.map((row) => (
                            <div key={row.rowNumber} className="grid grid-cols-[80px_120px_1fr] border-t border-[var(--crm-border)] px-4 py-3 text-xs">
                              <span>{row.rowNumber}</span>
                              <span className={row.status === 'created' ? 'text-emerald-700' : row.status === 'skipped' ? 'text-amber-700' : 'text-red-600'}>{row.status}</span>
                              <span className="truncate text-[var(--crm-muted)]">{row.message || row.leadId || 'Imported'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {operationModal.context === 'Dashboard' && operationModal.title === 'Add lead' && (
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                    <h4 className="text-sm">Lead Capture</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {publishedLeadFields.map(renderLeadField)}
                      {!publishedLeadFields.length && (
                        <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                          <p>No published CRM lead capture form.</p>
                          {liveNonLeadForm && (
                            <p className="mt-1">
                              “{liveNonLeadForm.name}” is live for {liveNonLeadForm.module} → {formTypeLabel(liveNonLeadForm.module, liveNonLeadForm.formType)}, so CRM does not load it.
                            </p>
                          )}
                          {canReadForms && (
                            <button
                              type="button"
                              onClick={() => {
                                setOperationModal(null);
                                setActiveNav('settings');
                                setSettingsSection('forms');
                                if (liveNonLeadForm) setSelectedFormId(liveNonLeadForm.id);
                              }}
                              className="mt-2 font-extrabold underline"
                            >
                              Open Form Builders
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {['high', 'medium', 'low'].map((priority) => (
                        <button key={priority} type="button" onClick={() => setOperationValues((current) => ({ ...current, priority }))} className={`rounded-xl px-3 py-2 text-xs ${(operationValues.priority ?? 'high') === priority ? 'text-white' : 'bg-[var(--crm-card)] text-[var(--crm-muted)]'}`} style={(operationValues.priority ?? 'high') === priority ? { background: brandGradient } : undefined}>{priority[0].toUpperCase() + priority.slice(1)}</button>
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
                <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[var(--crm-text)]">
                      {operationTitleLower.includes('open') ? 'Lead Detail' : 'Lead Capture'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[var(--crm-muted)]">Priority:</span>
                      <div className="flex gap-1.5">
                        {['high', 'medium', 'low'].map((priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => setOperationValues((current) => ({ ...current, priority }))}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${(operationValues.priority ?? 'high') === priority ? 'text-white shadow-xs' : 'bg-[var(--crm-card)] border border-[var(--crm-border)] text-[var(--crm-muted)] hover:text-[var(--crm-text)]'}`}
                            style={(operationValues.priority ?? 'high') === priority ? { background: brandGradient } : undefined}
                          >
                            {priority[0].toUpperCase() + priority.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {publishedLeadFields.map(renderLeadField)}
                    {!publishedLeadFields.length && (
                      <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                        <p className="font-semibold">No published CRM lead capture form.</p>
                        {liveNonLeadForm && (
                          <p className="mt-1">
                            “{liveNonLeadForm.name}” is live for {liveNonLeadForm.module} → {formTypeLabel(liveNonLeadForm.module, liveNonLeadForm.formType)}, so CRM does not load it.
                          </p>
                        )}
                        {canReadForms && (
                          <button
                            type="button"
                            onClick={() => {
                              setOperationModal(null);
                              setActiveNav('settings');
                              setSettingsSection('forms');
                              if (liveNonLeadForm) setSelectedFormId(liveNonLeadForm.id);
                            }}
                            className="mt-2 font-extrabold underline"
                          >
                            Open Form Builders
                          </button>
                        )}
                      </div>
                    )}
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
                    {['Prospect', 'Deferred', 'On Hold', 'Archive'].map((status) => (
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
                {canConfirmOperation && (crmOperationKind === 'import' && leadImportResult ? (
                  <button type="button" onClick={resetLeadImport} className="rounded-xl px-4 py-2.5 text-xs text-white" style={{ background: brandGradient }}>Import another file</button>
                ) : (
                  <button
                    type="button"
                    onClick={completeOperation}
                    disabled={crmOperationKind === 'import' && (leadImportBusy || !leadImportPreview.some((row) => !row.issue))}
                    className="rounded-xl px-4 py-2.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: brandGradient }}
                  >
                    {crmOperationKind === 'import' && leadImportBusy ? 'Importing...' : operationModal.confirmLabel ?? 'Save'}
                  </button>
                ))}
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
                    <button type="button" onClick={addCollegeRole} disabled={!canCreateRoles} className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: brandGradient }}>Add role</button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {filteredCollegeRoles.map((role) => {
                      const rolePermissions = roleAccess[role.id] ?? [];
                      const roleCoverage = rolePermissions.includes('*')
                        ? 100
                        : allPermissionKeys.length ? Math.round((rolePermissions.length / allPermissionKeys.length) * 100) : 0;
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
                      <p className="mt-1 text-xs text-[var(--crm-muted)]">Choose API-backed Create, Read, Update, and Delete permissions. N/A means that operation does not exist for the feature.</p>
                    </div>
                    <button type="button" onClick={() => toggleRoleModule(selectedAccessRole.id, selectedAccessModule.id)} disabled={!canUpdateRoles} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2 text-xs text-[var(--crm-muted)] disabled:cursor-not-allowed disabled:opacity-40">
                      {selectedModuleFullyEnabled ? 'Clear module' : 'Enable module'}
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {selectedAccessModule.features.map((feature) => {
                      const crudKeys = featurePermissionKeys(selectedAccessModule, feature);
                      const enabledCount = crudKeys.filter((key) => selectedRolePermissionSet.has(key)).length;
                      return (
                        <div key={feature} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm">{feature}</p>
                              <p className="mt-1 text-[10px] text-[var(--crm-muted)]">{enabledCount}/{crudKeys.length} permission enabled</p>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {CRUD_ACTIONS.map((action) => {
                                const permissionKeys = permissionKeysFor(selectedAccessModule, feature, action.id);
                                if (!permissionKeys.length) {
                                  return (
                                    <span
                                      key={action.id}
                                      className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-card)] text-[8px] text-[var(--crm-muted)] opacity-60"
                                      aria-label={`${action.id} is not applicable for ${feature}`}
                                      title={`No ${action.id} operation is registered for ${feature}`}
                                    >
                                      N/A
                                    </span>
                                  );
                                }
                                const enabled = permissionKeys.every((permissionKey) => selectedRolePermissionSet.has(permissionKey));
                                return (
                                  <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => toggleRolePermissions(selectedAccessRole.id, permissionKeys)}
                                    title={`${action.id}: ${permissionKeys.join(', ')}`}
                                    disabled={!canUpdateRoles}
                                    className={`h-10 w-10 rounded-xl border text-xs disabled:cursor-not-allowed disabled:opacity-40 ${enabled ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white' : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)]'}`}
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
                    <button type="button" onClick={addUserUnderRole} disabled={!canCreateUsers} className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ background: brandGradient }}>Add user</button>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Assign existing tenant users</p>
                    {visibleStaffUsers.length ? visibleStaffUsers.map((user) => {
                      const assigned = user.roleIds.includes(selectedAccessRole.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUserRole(user)}
                          disabled={!canUpdateUsers}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${assigned ? 'border-[var(--tenant-primary)] bg-[color-mix(in_srgb,var(--tenant-primary)_8%,var(--crm-surface))]' : 'border-[var(--crm-border)] bg-[var(--crm-surface)]'}`}
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-xl text-xs text-white" style={{ background: brandGradient }}>{user.initials}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{user.name}</span>
                            <span className="block truncate text-[10px] text-[var(--crm-muted)]">{user.email}</span>
                          </span>
                          <span className={`grid h-6 min-w-6 place-items-center rounded-md border px-1 text-[9px] ${assigned ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}>{assigned ? 'ON' : 'OFF'}</span>
                        </button>
                      );
                    }) : (
                      <div className="rounded-xl border border-dashed border-[var(--crm-border)] bg-[var(--crm-surface)] p-6 text-xs text-[var(--crm-muted)]">No tenant users are available.</div>
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
                        const isDragOver = dragOverKey === fieldKey;
                        const isSelected = selectedFieldKey === fieldKey;
                        return (
                          <div
                            key={`${section.section}-${field.label}-${fieldIndex}`}
                            draggable
                            onDragStart={(event) => handleFieldCardDragStart(event, fieldKey)}
                            onDragOver={(event) => handleFieldCardDragOver(event, fieldKey)}
                            onDragLeave={() => setDragOverKey(null)}
                            onDrop={(event) => handleFieldCardDrop(event, fieldKey)}
                            onClick={() => setSelectedFieldKey(fieldKey)}
                            className={`group relative cursor-grab active:cursor-grabbing rounded-2xl border bg-[var(--crm-card)] p-4 text-left transition-all ${
                              field.width === 'full' ? 'sm:col-span-2' : ''
                            } ${
                              isDragOver
                                ? 'border-[var(--tenant-primary)] ring-4 ring-[var(--tenant-primary)]/20 scale-[1.02] bg-[var(--tenant-surface)] shadow-lg z-10'
                                : isSelected
                                  ? 'border-[var(--tenant-primary)] ring-2 ring-[var(--tenant-primary)]/15 shadow-sm'
                                  : 'border-[var(--crm-border)] hover:border-[var(--tenant-primary)]/60 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1 rounded-md bg-[var(--crm-panel)] text-[var(--crm-muted)] opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                  <GripVertical size={13} />
                                </div>
                                <span className="truncate text-xs font-bold text-[var(--crm-text)]">{field.label}</span>
                                {field.required && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                                    Required
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0 bg-[var(--crm-surface)] p-0.5 rounded-lg border border-[var(--crm-border)]">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveFieldByKey(fieldKey, 'up');
                                  }}
                                  className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                  title="Move up"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    moveFieldByKey(fieldKey, 'down');
                                  }}
                                  className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                  title="Move down"
                                >
                                  <ChevronDown size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openFieldEditor(fieldKey, field);
                                  }}
                                  className="p-1 rounded-md text-[var(--crm-muted)] hover:bg-[var(--crm-card)] hover:text-[var(--tenant-primary)] transition-colors"
                                  title="Edit field settings"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteFieldByKey(fieldKey);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition-colors"
                                  title="Delete field"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="min-h-10 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-bg)]/80 px-3.5 py-2 flex items-center justify-between text-xs text-[var(--crm-muted)] font-medium transition-colors group-hover:border-[var(--crm-border)]">
                              <span className="truncate">{fieldPreviewText(field)}</span>
                              <span className="text-[10px] font-semibold text-[var(--crm-muted)] px-2 py-0.5 rounded-md bg-[var(--crm-card)] border border-[var(--crm-border)] shrink-0 ml-2">
                                {field.type}
                              </span>
                            </div>
                            {field.helpText?.trim() && <p className="mt-1.5 text-[10px] text-[var(--crm-muted)]">{field.helpText}</p>}
                          </div>
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Builder details</p>
                    <span className="rounded-lg bg-[var(--crm-card)] px-2.5 py-1 text-[10px] text-[var(--tenant-primary)]">{formDraft.status} · {countSchemaFields(formDraftSchema)} fields</span>
                  </div>
                  <div className={`mt-3 rounded-lg border px-3 py-2.5 text-[10px] ${
                    formDraft.module === 'CRM' && formDraft.formType.replace('-', '_') === 'lead_capture'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    Destination: <strong>{formDraft.module} → {formTypeLabel(formDraft.module, formDraft.formType)}</strong>.
                    {formDraft.module === 'CRM' && formDraft.formType.replace('-', '_') === 'lead_capture'
                      ? ' Publishing makes this form available in CRM Create Lead.'
                      : ' Publishing sends it to this workflow, not CRM Create Lead.'}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-[10px] text-[var(--crm-muted)]">
                      Form name
                      <input
                        value={formDraft.name}
                        onChange={(event) => setFormDraft({ ...formDraft, name: event.target.value })}
                        className="mt-1 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)] outline-none"
                      />
                    </label>
                    <label className="text-[10px] text-[var(--crm-muted)]">
                      Module
                      <select
                        value={formDraft.module}
                        onChange={(event) => {
                          const selectedModuleName = event.target.value;
                          const availableTypes = FORM_MODULE_TYPES[selectedModuleName] ?? [];
                          const formType = availableTypes.some((type) => type.value === formDraft.formType)
                            ? formDraft.formType
                            : availableTypes[0]?.value ?? '';
                          setFormDraft({ ...formDraft, module: selectedModuleName, formType });
                        }}
                        className="mt-1 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)] outline-none"
                      >
                        {Object.keys(FORM_MODULE_TYPES).map((module) => <option key={module} value={module}>{module}</option>)}
                      </select>
                    </label>
                    <label className="text-[10px] text-[var(--crm-muted)]">
                      Form type / purpose
                      <select
                        value={formDraft.formType}
                        onChange={(event) => setFormDraft({ ...formDraft, formType: event.target.value })}
                        className="mt-1 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)] outline-none"
                      >
                        {(FORM_MODULE_TYPES[formDraft.module] ?? []).map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </label>
                    <label className="text-[10px] text-[var(--crm-muted)]">
                      Owner
                      <input
                        value={formDraft.owner}
                        onChange={(event) => setFormDraft({ ...formDraft, owner: event.target.value })}
                        className="mt-1 h-10 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-text)] outline-none"
                      />
                    </label>
                    <label className="text-[10px] text-[var(--crm-muted)] sm:col-span-2">
                      Description / usage
                      <textarea
                        value={formDraft.usage}
                        onChange={(event) => setFormDraft({ ...formDraft, usage: event.target.value })}
                        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-text)] outline-none"
                        placeholder="Explain where and how this form is used"
                      />
                    </label>
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
                        onDragStart={(event) => handlePaletteFieldDragStart(event, field)}
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
              {canSaveOpenForm && (
                <button type="button" onClick={() => saveFormDraft(false)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2.5 text-xs text-[var(--crm-muted)]">
                  <Save size={14} />
                  Save draft
                </button>
              )}
              {canSaveOpenForm && canPublishForms && (
                <button type="button" onClick={() => saveFormDraft(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-sm" style={{ background: brandGradient }}>
                  <CheckCircle2 size={14} />
                  {formDraft.status === 'Live' ? 'Save & republish' : 'Publish'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {fieldDraft && (
        <div className="fixed inset-0 z-[285] flex items-center justify-center bg-black/35 p-6">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
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
            <div className="grid gap-4 overflow-y-auto p-5">
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
              <label className="text-xs text-[var(--crm-muted)]">
                Placeholder
                <input
                  value={fieldDraft.field.placeholder ?? ''}
                  onChange={(event) => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, placeholder: event.target.value } })}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-sm text-[var(--crm-text)] outline-none"
                  placeholder="Example: Select a course"
                />
              </label>
              <label className="text-xs text-[var(--crm-muted)]">
                Help text
                <input
                  value={fieldDraft.field.helpText ?? ''}
                  onChange={(event) => setFieldDraft({ ...fieldDraft, field: { ...fieldDraft.field, helpText: event.target.value } })}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-sm text-[var(--crm-text)] outline-none"
                  placeholder="Explain what the user should enter"
                />
              </label>
              {CHOICE_FIELD_TYPES.has(fieldDraft.field.type) && (
                <label className="text-xs text-[var(--crm-muted)]">
                  Choices <span className="text-[#ef4444]">*</span>
                  <textarea
                    value={(fieldDraft.field.options ?? []).join('\n')}
                    onChange={(event) => setFieldDraft({
                      ...fieldDraft,
                      field: { ...fieldDraft.field, options: event.target.value.split('\n') },
                    })}
                    className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-3 text-sm text-[var(--crm-text)] outline-none"
                    placeholder={'B.Tech Computer Science\nB.Tech Electronics\nMBA'}
                  />
                  <span className="mt-1 block text-[10px]">Enter one option per line. Duplicate and empty options are removed when you save.</span>
                </label>
              )}
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
