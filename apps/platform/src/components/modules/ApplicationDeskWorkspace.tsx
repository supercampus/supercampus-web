'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Info,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Undo2,
  UserMinus,
  X,
  XCircle,
} from 'lucide-react';
import {
  TERMINAL_STATUSES,
  runGuards,
  stageById,
  type ActionKind,
  type FinanceState,
  type IdentityMatchKind,
  type OnboardingCase,
  type StageInput,
} from '@supercampus/application-desk';
import { useApp } from '@/lib/context';
import {
  applicationDeskCapabilities,
  hasPermission,
  permissionForAdvance,
  permissionForCasework,
} from '@/lib/staff-access';
import {
  DEMO_APPLICANT_NAMES,
  actOnCase,
  loadDesk,
  type DeskSnapshot,
} from '@/lib/application-desk-api';

type QueueKey = keyof DeskSnapshot['queues'];

const FINANCE_STATES: FinanceState[] = ['CLEARED', 'PENDING', 'HOLD', 'NOT_REQUIRED'];

/**
 * The queue filters are two tiers, not one flat row of eleven chips.
 *
 * An officer's first question is "what is live on my desk", not "how many cases
 * are in ACCESS_PROVISIONING" Ã¢â‚¬â€ and a flat row answers the second question
 * eleven times, mostly with zero. So: lifecycle views first, and the stage
 * narrowing only appears inside the live view, where it is the follow-up
 * question that actually gets asked.
 */
const VIEWS = [
  { key: 'live', label: 'Needs action' },
  { key: 'onHold', label: 'On hold' },
  { key: 'activated', label: 'Activated' },
  { key: 'closed', label: 'Closed' },
  { key: 'all', label: 'All' },
] as const;

type ViewKey = (typeof VIEWS)[number]['key'];

const STAGE_FILTERS: Array<{ key: QueueKey; label: string }> = [
  { key: 'new', label: 'Review' },
  { key: 'pendingVerification', label: 'Identity' },
  { key: 'documentsPending', label: 'Documents' },
  { key: 'academicPending', label: 'Academic' },
  { key: 'financePending', label: 'Finance' },
  { key: 'approvalPending', label: 'Approval' },
  { key: 'readyForActivation', label: 'Provisioning' },
];

const SORTS = [
  { key: 'oldest', label: 'Oldest first' },
  { key: 'newest', label: 'Recently updated' },
  { key: 'stage', label: 'Furthest along' },
  { key: 'name', label: 'Name AÃ¢â‚¬â€œZ' },
] as const;

type SortKey = (typeof SORTS)[number]['key'];

const STAGE_RAIL: Array<{ id: OnboardingCase['stage']; short: string }> = [
  { id: 'DATA_REVIEW', short: 'Review' },
  { id: 'IDENTITY_VERIFICATION', short: 'Identity' },
  { id: 'DOCUMENT_VERIFICATION', short: 'Documents' },
  { id: 'ACADEMIC_MAPPING', short: 'Academic' },
  { id: 'SECTION_ALLOCATION', short: 'Section' },
  { id: 'FINANCE_VERIFICATION', short: 'Finance' },
  { id: 'APPROVAL', short: 'Approval' },
  { id: 'STUDENT_CREATION', short: 'Student' },
  { id: 'ACCOUNT_PROVISIONING', short: 'Account' },
  { id: 'ACCESS_PROVISIONING', short: 'Access' },
  { id: 'ACTIVATION', short: 'Activation' },
  { id: 'COMPLETED', short: 'Done' },
];

const TABS = ['application', 'overview', 'documents', 'academic', 'approvals', 'activity'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  application: 'Application',
  overview: 'Review',
  documents: 'Documents',
  academic: 'Academic',
  approvals: 'Approvals',
  activity: 'History',
};

type ApplicationField = {
  key?: string;
  label: string;
  type: string;
  required?: boolean;
  width?: 'half' | 'full';
  placeholder?: string;
  helpText?: string;
  options?: string[];
};
type ApplicationSection = { section: string; fields: ApplicationField[] };
type ApplicationRecord = {
  formId: string;
  formVersion: number;
  status: 'draft' | 'submitted';
  data: Record<string, unknown>;
  revision: number;
  updatedAt?: string;
  updatedBy?: string;
};

// -- value presentation -----------------------------------------------------

type Tone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger';

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-[var(--crm-muted)]',
  brand: 'text-[var(--tenant-primary)]',
  positive: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
};

const TONE_PILL: Record<Tone, string> = {
  neutral: 'bg-[var(--crm-surface)] text-[var(--crm-muted)] ring-[var(--crm-border)]',
  brand: 'bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)] ring-[var(--tenant-primary)]/25',
  positive: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-700 ring-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-700 ring-rose-500/25',
};

function statusTone(status: OnboardingCase['status']): Tone {
  switch (status) {
    case 'ACTIVE':
      return 'brand';
    case 'COMPLETED':
      return 'positive';
    case 'ON_HOLD':
    case 'RETURNED':
      return 'warning';
    default:
      return 'danger';
  }
}

/** `identityMatch` reports duplicate detection, so "no match" is the good outcome. */
function identityTone(match: NonNullable<OnboardingCase['identityMatch']>): Tone {
  if (match === 'NO_MATCH') return 'positive';
  if (match === 'DUPLICATE') return 'danger';
  return 'warning';
}

function financeTone(finance: OnboardingCase['finance']): Tone {
  if (finance === 'CLEARED') return 'positive';
  if (finance === 'HOLD') return 'danger';
  if (finance === 'PENDING') return 'warning';
  return 'neutral';
}

function documentTone(state: string | undefined): Tone {
  if (state === 'VERIFIED' || state === 'WAIVED') return 'positive';
  if (state === 'REJECTED' || state === 'EXPIRED') return 'danger';
  if (!state || state === 'NOT_SUBMITTED') return 'neutral';
  return 'warning';
}

function approvalTone(state: string): Tone {
  if (state === 'APPROVED') return 'positive';
  if (state === 'REJECTED') return 'danger';
  return 'warning';
}

/**
 * `NO_MATCH` Ã¢â€ â€™ `No match`, `application-desk-officer` Ã¢â€ â€™ `Application desk officer`.
 * Enum codes and role slugs are for the API, not for the operator.
 */
function humanize(value: string) {
  const words = value.replace(/[_-]/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * What this case is actually waiting on, in the words the operator needs.
 *
 * The workflow engine already knows Ã¢â‚¬â€ `runGuards` returns the exact reason a
 * stage refuses to advance ("Missing documents: Transfer certificate"). Putting
 * that on the row means the queue tells you what to do next instead of making
 * you open four cases to find the one you can clear.
 */
function nextAction(
  onboarding: OnboardingCase,
  definition: DeskSnapshot['definition'],
): { text: string; tone: Tone } {
  switch (onboarding.status) {
    case 'ON_HOLD':
      return { text: onboarding.holdReason ?? 'On hold', tone: 'warning' };
    case 'RETURNED':
      return { text: 'Returned for correction', tone: 'warning' };
    case 'FAILED':
      return { text: 'Provisioning failed Ã¢â‚¬â€ retry needed', tone: 'danger' };
    case 'COMPLETED':
      return { text: 'Onboarding complete', tone: 'positive' };
    case 'ACTIVE':
      break;
    default:
      return { text: `Closed Ã‚Â· ${humanize(onboarding.status)}`, tone: 'neutral' };
  }

  if (
    onboarding.stage === 'DATA_REVIEW'
    && onboarding.attributes.applicationFormRequired === true
    && applicationRecord(onboarding)?.status !== 'submitted'
  ) {
    return { text: 'Application form not submitted', tone: 'warning' };
  }

  const stage = stageById(definition, onboarding.stage);
  if (!stage) return { text: 'Awaiting review', tone: 'neutral' };
  const guard = runGuards(onboarding, definition, stage.guards);
  return guard.ok
    ? { text: 'Ready to advance', tone: 'positive' }
    : { text: guard.reason ?? 'Stage checks not met', tone: 'warning' };
}

/**
 * Age of the case, and how loudly to say it. A queue without an ageing signal
 * lets the quiet cases rot at the bottom, so anything past three days starts
 * colouring itself.
 */
function ageOf(iso: string): { label: string; className: string; title: string } {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return { label: 'Ã¢â‚¬â€', className: 'text-[var(--crm-muted)]', title: '' };
  const hours = (Date.now() - then) / 3600000;
  const days = Math.floor(hours / 24);
  const label = hours < 1 ? 'new' : hours < 24 ? `${Math.floor(hours)}h` : `${days}d`;
  const className =
    days >= 7 ? 'text-rose-600' : days >= 3 ? 'text-amber-600' : 'text-[var(--crm-muted)]';
  return { label, className, title: `Last updated ${new Date(then).toLocaleString()}` };
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(then).toLocaleDateString();
}

function applicantName(onboarding: OnboardingCase) {
  return onboarding.applicant?.fullName ?? DEMO_APPLICANT_NAMES[onboarding.applicantId] ?? onboarding.applicantId;
}

function attribute(onboarding: OnboardingCase, key: string) {
  const value = onboarding.attributes[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function applicationRecord(onboarding: OnboardingCase): ApplicationRecord | undefined {
  const value = onboarding.attributes.applicationForm;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as ApplicationRecord
    : undefined;
}

function applicationSections(schema: unknown): ApplicationSection[] {
  if (Array.isArray(schema)) return schema as ApplicationSection[];
  if (!schema || typeof schema !== 'object') return [];
  const sections = (schema as { sections?: unknown }).sections;
  return Array.isArray(sections) ? sections as ApplicationSection[] : [];
}

function formFieldKey(field: ApplicationField) {
  return field.key ?? field.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function deskFormFields(form: DeskSnapshot['deskForm']): ApplicationField[] {
  if (!form) return [];
  return applicationSections(form.schema).flatMap((section) => section.fields ?? []);
}

function deskFieldMatches(field: ApplicationField, aliases: string[]) {
  const key = formFieldKey(field).toLowerCase().replace(/[^a-z0-9]/g, '');
  const label = field.label.toLowerCase();
  return aliases.some((alias) => key === alias || label.includes(alias.replace(/([A-Z])/g, ' $1').toLowerCase()));
}

/** Rail position of a case. `NEW` sits before the first rail entry. */
function stageIndex(stage: OnboardingCase['stage']) {
  const index = STAGE_RAIL.findIndex((entry) => entry.id === stage);
  return index < 0 ? 0 : index;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Clock }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--tenant-primary)] opacity-70" />
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-2xl font-semibold leading-none tracking-tight text-[var(--crm-text)]">{value}</span>
          <span className="mt-2 block truncate text-[11px] font-medium text-[var(--crm-muted)]">{label}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)] transition group-hover:scale-105">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function workTabForStage(stage: OnboardingCase['stage']): Tab {
  switch (stage) {
    case 'DATA_REVIEW': return 'application';
    case 'DOCUMENT_VERIFICATION': return 'documents';
    case 'ACADEMIC_MAPPING':
    case 'SECTION_ALLOCATION': return 'academic';
    case 'FINANCE_VERIFICATION': return 'overview';
    case 'APPROVAL': return 'approvals';
    case 'IDENTITY_VERIFICATION': return 'overview';
    default: return 'overview';
  }
}

function stageTask(stage: OnboardingCase['stage']): { title: string; description: string } {
  switch (stage) {
    case 'DATA_REVIEW': return { title: 'Review the application', description: 'Check the applicant form and submit any missing required information.' };
    case 'IDENTITY_VERIFICATION': return { title: 'Complete identity verification', description: 'Record the result of the duplicate and identity search.' };
    case 'DOCUMENT_VERIFICATION': return { title: 'Verify required documents', description: 'Review each uploaded document and verify, waive, or reject it.' };
    case 'ACADEMIC_MAPPING': return { title: 'Map academic details', description: 'Assign the programme, department, academic year, and batch.' };
    case 'SECTION_ALLOCATION': return { title: 'Allocate a section', description: 'Assign the applicant to the appropriate class section.' };
    case 'FINANCE_VERIFICATION': return { title: 'Verify finance status', description: 'Record the latest status reported by the Finance team.' };
    case 'APPROVAL': return { title: 'Complete approvals', description: 'Review and approve each step in the configured approval chain.' };
    case 'STUDENT_CREATION': return { title: 'Create the student record', description: 'The system will create the student master record after approval.' };
    case 'ACCOUNT_PROVISIONING': return { title: 'Create the user account', description: 'The system will provision the student account.' };
    case 'ACCESS_PROVISIONING': return { title: 'Provision module access', description: 'The system will apply the student’s configured access.' };
    case 'ACTIVATION': return { title: 'Activate the student', description: 'Complete the final activation step.' };
    default: return { title: 'Review case status', description: 'Review the case details and history.' };
  }
}

/**
 * Dev-only escape hatch. There is no backend in local development, so no staff
 * session can exist and the desk would be permanently unreachable. When Ã¢â‚¬â€ and
 * only when Ã¢â‚¬â€ this is a development build, there is no session, and the data
 * layer fell back to the demo store, the desk renders read/write against demo
 * data behind a loud banner.
 *
 * `process.env.NODE_ENV` is inlined at build time, so in a production build
 * this constant is `false` and the whole branch is dead code. It cannot be
 * turned on by a request, a cookie or an env var at runtime.
 */
const DEV_BUILD = process.env.NODE_ENV === 'development';

const DEMO_PERMISSIONS = [
  'application-desk.view',
  'application-desk.edit',
  'application-desk.verify',
  'application-desk.assign',
  'application-desk.approve',
  'application-desk.reject',
  'application-desk.hold',
  'application-desk.resume',
  'application-desk.activate',
];

/**
 * Renders standalone at /dashboard/application-desk and embedded inside the
 * staff shell under the Admissions nav group. `embedded` drops the full-height
 * page chrome so it sits inside the shell's existing scroll container.
 */
function DeskShell({ embedded, children }: { embedded: boolean; children: React.ReactNode }) {
  return embedded ? (
    <section className="flex-1 overflow-y-auto kanban-scroll-hidden bg-[radial-gradient(circle_at_top_right,var(--tenant-surface),transparent_32%),var(--crm-panel)] p-4 lg:p-6">{children}</section>
  ) : (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--tenant-surface),transparent_32%),var(--crm-panel)] p-4 lg:p-6">{children}</main>
  );
}

export function ApplicationDeskWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { student, authStatus } = useApp();
  const permissions = useMemo(() => student?.access ?? [], [student?.access]);
  const grantedView = hasPermission(permissions, 'application-desk.view');

  const [snapshot, setSnapshot] = useState<DeskSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<ViewKey>('live');
  const [stageFilter, setStageFilter] = useState<QueueKey | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('oldest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tab, setTab] = useState<Tab>('application');
  const [actionReason, setActionReason] = useState('');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const drawerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeDrawer = useCallback(() => {
    if (drawerCloseTimer.current) clearTimeout(drawerCloseTimer.current);
    setDrawerVisible(false);
    drawerCloseTimer.current = setTimeout(() => {
      setSelectedId(null);
      drawerCloseTimer.current = null;
    }, 280);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    if (drawerCloseTimer.current) clearTimeout(drawerCloseTimer.current);
    const frame = window.requestAnimationFrame(() => setDrawerVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [closeDrawer, selectedId]);

  useEffect(() => () => {
    if (drawerCloseTimer.current) clearTimeout(drawerCloseTimer.current);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const refresh = useCallback(() => {
    setLoadError(null);
    setReloadToken((token) => token + 1);
  }, []);

  // Never call the protected endpoint without an authenticated view grant.
  // The previous development fallback mounted for signed-out and partially
  // authorised users, which caused repeated 401/403 requests in the browser.
  const mayLoad = authStatus === 'authenticated' && grantedView;

  useEffect(() => {
    if (!mayLoad) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadDesk();
        if (cancelled) return;
        setSnapshot(next);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load the Admission Desk');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mayLoad, reloadToken]);

  /** True only in a dev build, with no session, against the demo store. */
  const demoAccess = DEV_BUILD && !student && snapshot?.source === 'demo';
  const canView = grantedView || demoAccess;
  const desk = useMemo(
    () => applicationDeskCapabilities(demoAccess ? DEMO_PERMISSIONS : permissions),
    [demoAccess, permissions],
  );

  const cases = useMemo(() => snapshot?.cases ?? [], [snapshot]);
  const deskFields = useMemo(() => deskFormFields(snapshot?.deskForm), [snapshot?.deskForm]);
  const academicDeskFields = useMemo(
    () => deskFields.filter((field) => ['programme', 'program', 'department', 'academicyear', 'academic year', 'batch'].some((alias) => deskFieldMatches(field, [alias]))),
    [deskFields],
  );
  const sectionDeskField = useMemo(
    () => deskFields.find((field) => deskFieldMatches(field, ['sectionid', 'section'])),
    [deskFields],
  );
  const financeDeskField = useMemo(
    () => deskFields.find((field) => deskFieldMatches(field, ['finance', 'financestate', 'financestatus'])),
    [deskFields],
  );
  const reasonDeskField = useMemo(
    () => deskFields.find((field) => deskFieldMatches(field, ['actionreason', 'action note', 'reason'])),
    [deskFields],
  );
  const actionReasonReady = !reasonDeskField?.required || actionReason.trim().length > 0;
  const selected = cases.find((entry) => entry.id === selectedId) ?? null;

  const inView = useMemo(() => cases.filter((entry) => viewMatches(entry, view)), [cases, view]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = inView.filter((entry) => {
      if (view === 'live' && stageFilter !== 'all' && !queueMatches(entry, stageFilter)) return false;
      if (!term) return true;
      return (
        applicantName(entry).toLowerCase().includes(term) ||
        entry.applicant?.email?.toLowerCase().includes(term) ||
        entry.applicant?.phone?.toLowerCase().includes(term) ||
        entry.id.toLowerCase().includes(term) ||
        entry.applicationId.toLowerCase().includes(term) ||
        entry.admissionId.toLowerCase().includes(term) ||
        entry.crmLeadId?.toLowerCase().includes(term)
      );
    });
    return sortCases(rows, sort);
  }, [inView, query, sort, stageFilter, view]);

  /** Per-row "what is this waiting on" Ã¢â‚¬â€ the engine's own guard reasons. */
  const pending = useMemo(() => {
    if (!snapshot) return new Map<string, ReturnType<typeof nextAction>>();
    return new Map(visible.map((entry) => [entry.id, nextAction(entry, snapshot.definition)]));
  }, [snapshot, visible]);

  /** Arrow keys walk the queue Ã¢â‚¬â€ a desk is worked with hands on the keyboard. */
  const moveSelection = useCallback(
    (delta: number) => {
      if (visible.length === 0) return;
      const current = visible.findIndex((entry) => entry.id === selectedId);
      const nextIndex =
        current < 0
          ? delta > 0
            ? 0
            : visible.length - 1
          : Math.min(visible.length - 1, Math.max(0, current + delta));
      const target = visible[nextIndex];
      if (!target) return;
      setActionError(null);
      setSelectedId(target.id);
      requestAnimationFrame(() => {
        const node = listRef.current?.querySelector<HTMLButtonElement>(`[data-case="${target.id}"]`);
        node?.focus();
        node?.scrollIntoView({ block: 'nearest' });
      });
    },
    [selectedId, visible],
  );

  /** Why `advance` is currently refused Ã¢â‚¬â€ shown before the operator clicks. */
  const blockedReason = useMemo(() => {
    if (!snapshot || !selected || selected.status !== 'ACTIVE') return null;
    const form = applicationRecord(selected);
    if (selected.stage === 'DATA_REVIEW' && (snapshot.applicationForm || selected.attributes.applicationFormRequired === true) && form?.status !== 'submitted') {
      return 'Complete and submit the application form before identity verification';
    }
    const stage = stageById(snapshot.definition, selected.stage);
    if (!stage) return null;
    const guard = runGuards(selected, snapshot.definition, stage.guards);
    return guard.ok ? null : guard.reason ?? 'Stage guards failed';
  }, [selected, snapshot]);

  const actorName = student?.name ?? 'officer';
  const source = snapshot?.source;
  const selectedCaseId = selected?.id;

  const act = useCallback(
    async (action: ActionKind, reason?: string, input?: StageInput) => {
      if (!source || !selectedCaseId) return;
      setBusy(true);
      setActionError(null);
      try {
        const result = await actOnCase(
          { caseId: selectedCaseId, action, actor: actorName, reason, input },
          source,
        );
        setSnapshot(result.snapshot);
        if (!result.ok) setActionError(result.error ?? 'Action refused');
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Action failed');
      } finally {
        setBusy(false);
      }
    },
    [actorName, selectedCaseId, source],
  );

  /** Effective permission set Ã¢â‚¬â€ demo mode stands in for a session in dev only. */
  const effective = useMemo(
    () => (demoAccess ? DEMO_PERMISSIONS : permissions),
    [demoAccess, permissions],
  );
  const mayRun = useCallback(
    (action: ActionKind, stage?: OnboardingCase['stage']) =>
      hasPermission(
        effective,
        action === 'advance' ? permissionForAdvance(stage ?? '') : permissionForCasework(action),
      ),
    [effective],
  );

  /** A closed case is a record, not a workbench Ã¢â‚¬â€ casework controls hide. */
  const open = !!selected && !TERMINAL_STATUSES.includes(selected.status);
  const mayAdvance = !!selected && mayRun('advance', selected.stage);
  const nextRailStage = selected ? STAGE_RAIL[stageIndex(selected.stage) + 1] : undefined;

  if (authStatus === 'checking' || (mayLoad && !snapshot && !loadError)) {
    return (
      <DeskShell embedded={embedded}>
        <p className="grid min-h-[40vh] place-items-center text-sm text-[var(--crm-muted)]">Loading the deskÃ¢â‚¬Â¦</p>
      </DeskShell>
    );
  }

  if (!canView) {
    return (
      <DeskShell embedded={embedded}>
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 text-center">
          <ShieldCheck size={22} className="mx-auto text-[var(--crm-muted)]" />
          <h1 className="mt-3 text-lg text-[var(--crm-text)]">Admission Desk</h1>
          <p className="mt-2 text-sm text-[var(--crm-muted)]">
            You need the <code className="text-[var(--tenant-primary)]">application-desk.view</code> permission to open
            the onboarding queue.
          </p>
        </div>
      </DeskShell>
    );
  }

  if (loadError && !snapshot) {
    return (
      <DeskShell embedded={embedded}>
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-rose-200 bg-[var(--crm-card)] p-6 text-center shadow-sm">
          <XCircle size={24} className="mx-auto text-rose-500" />
          <h1 className="mt-3 text-lg text-[var(--crm-text)]">Admission Desk could not load</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--crm-muted)]">{loadError}</p>
          <button type="button" onClick={refresh} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white">
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </DeskShell>
    );
  }

  const activated = cases.filter((entry) => entry.status === 'COMPLETED').length;

  return (
    <DeskShell embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex items-start gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--crm-text)]">Admission Desk</h1>
            <p className="mt-1 text-xs text-[var(--crm-muted)]">Accepted offers awaiting completion before Student Master activation.</p>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Admission Desk instructions"
              aria-expanded={instructionsOpen}
              onClick={() => setInstructionsOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-full border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] shadow-sm transition hover:border-[var(--tenant-primary)]/40 hover:text-[var(--tenant-primary)]"
            >
              <Info size={17} />
            </button>
            {instructionsOpen && (
              <div className="absolute left-0 top-11 z-20 w-[min(360px,calc(100vw-48px))] rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 text-sm leading-6 text-[var(--crm-muted)] shadow-xl">
                <p className="font-semibold text-[var(--crm-text)]">How to use Admission Desk</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Select an applicant from the live queue.</li>
                  <li>Review application, documents, identity, academic mapping and fee readiness.</li>
                  <li>Clear each checkpoint using the available stage action.</li>
                  <li>Approve activation only after all required checks are complete.</li>
                </ol>
              </div>
            )}
          </div>
        </header>

        {demoAccess && (
          <p className="flex items-start gap-2 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              <strong>Demo mode Ã¢â‚¬â€ no signed-in user.</strong> This development build has no backend session, so the desk
              is showing seeded cases with all Application Desk permissions granted. Nothing here is a real applicant,
              and this branch does not exist in a production build.
            </span>
          </p>
        )}

        {loadError && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{loadError}</p>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Awaiting onboarding" value={cases.filter((c) => c.status === 'ACTIVE').length} icon={Clock} />
          <Metric label="Documents pending" value={snapshot?.queues.documentsPending ?? 0} icon={FileText} />
          <Metric label="Approvals pending" value={snapshot?.queues.approvalPending ?? 0} icon={ShieldCheck} />
          <Metric label="Students activated" value={activated} icon={GraduationCap} />
        </section>

        <div>
          <section className="overflow-hidden rounded-3xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-[0_10px_30px_rgba(15,23,42,0.045)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--crm-border)] px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-[var(--crm-text)]">Application queue</p>
                <p className="mt-0.5 text-[10px] text-[var(--crm-muted)]">Prioritized cases waiting for an officer action</p>
              </div>
              <span className="rounded-full bg-[var(--tenant-primary)]/10 px-3 py-1 text-[10px] font-bold text-[var(--tenant-primary)]">{visible.length} visible</span>
            </div>
            {/* Lifecycle views Ã¢â‚¬â€ what is on the desk right now. */}
            <div className="flex items-end gap-1 overflow-x-auto border-b border-[var(--crm-border)] px-4">
              {VIEWS.map((entry) => (
                <ViewTab
                  key={entry.key}
                  label={entry.label}
                  count={cases.filter((item) => viewMatches(item, entry.key)).length}
                  active={view === entry.key}
                  onClick={() => {
                    setView(entry.key);
                    setStageFilter('all');
                  }}
                />
              ))}
            </div>

            {/* Search and order Ã¢â‚¬â€ the two things you reach for on a real queue. */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--crm-border)] bg-[var(--crm-surface)]/55 px-4 py-3">
              <div className="relative min-w-[180px] flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--crm-muted)]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, case or admission id"
                  className="min-h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] py-2 pl-8 pr-8 text-xs text-[var(--crm-text)] shadow-sm outline-none placeholder:text-[var(--crm-muted)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--crm-muted)]">
                Sort
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="min-h-10 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-[11px] text-[var(--crm-text)] shadow-sm outline-none focus:border-[var(--tenant-primary)]"
                >
                  {SORTS.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Stage narrowing, only where it is the question being asked. */}
            {view === 'live' && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--crm-border)] px-4 py-3">
                <StageFilter
                  label="Every stage"
                  count={inView.length}
                  active={stageFilter === 'all'}
                  onClick={() => setStageFilter('all')}
                />
                {STAGE_FILTERS.map((entry) => {
                  const count = inView.filter((item) => queueMatches(item, entry.key)).length;
                  return (
                    <StageFilter
                      key={entry.key}
                      label={entry.label}
                      count={count}
                      active={stageFilter === entry.key}
                      onClick={() => setStageFilter(count === 0 ? 'all' : entry.key)}
                      empty={count === 0}
                    />
                  );
                })}
              </div>
            )}

            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_44px] items-center gap-3 border-b border-[var(--crm-border)] bg-[var(--crm-surface)]/35 px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--crm-muted)] sm:grid">
              <span>Applicant</span>
              <span>Stage</span>
              <span>Waiting on</span>
              <span className="text-right">Age</span>
            </div>

            <div
              ref={listRef}
              role="listbox"
              aria-label="Onboarding cases"
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'j') {
                  event.preventDefault();
                  moveSelection(1);
                } else if (event.key === 'ArrowUp' || event.key === 'k') {
                  event.preventDefault();
                  moveSelection(-1);
                }
              }}
              className="max-h-[560px] divide-y divide-[var(--crm-border)] overflow-y-auto"
            >
              {visible.length === 0 && (
                <div className="px-4 py-14 text-center">
                  <p className="text-sm text-[var(--crm-text)]">
                    {query ? `Nothing matches Ã¢â‚¬Å“${query.trim()}Ã¢â‚¬Â` : 'This view is clear'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--crm-muted)]">
                    {query ? 'Try a name, case id or admission id.' : 'No cases are sitting here right now.'}
                  </p>
                  {(query || stageFilter !== 'all' || view !== 'live') && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setStageFilter('all');
                        setView('live');
                      }}
                      className="mt-3 text-xs text-[var(--tenant-primary)] underline-offset-2 hover:underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              )}

              {visible.map((entry) => {
                const stageLabel =
                  (snapshot && stageById(snapshot.definition, entry.stage)?.label) ?? humanize(entry.stage);
                const progress = ((stageIndex(entry.stage) + 1) / STAGE_RAIL.length) * 100;
                const waiting = pending.get(entry.id);
                const age = ageOf(entry.updatedAt);
                const isSelected = entry.id === selectedId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    data-case={entry.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setActionError(null);
                      setTab(workTabForStage(entry.stage));
                      setSelectedId(entry.id);
                    }}
                    className={`group grid w-full grid-cols-[minmax(0,1fr)_44px] items-center gap-3 px-4 py-3.5 text-left outline-none transition sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_44px] sm:px-5 ${
                      isSelected
                        ? 'bg-[var(--tenant-primary)]/[0.06] shadow-[inset_2px_0_0_var(--tenant-primary)]'
                        : 'hover:bg-[var(--crm-surface)] focus-visible:bg-[var(--crm-surface)]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold ${
                          isSelected
                            ? 'bg-[var(--tenant-primary)] text-white'
                            : 'bg-[var(--crm-surface)] text-[var(--crm-muted)] group-hover:bg-[var(--crm-card)]'
                        }`}
                      >
                        {initials(applicantName(entry))}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] leading-tight text-[var(--crm-text)]">
                          {applicantName(entry)}
                        </span>
                        <span className="block truncate font-mono text-[10px] leading-tight text-[var(--crm-muted)]">
                          {entry.id}
                        </span>
                      </span>
                    </span>

                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-[11px] leading-tight text-[var(--crm-text)]">
                        {stageLabel}
                      </span>
                      <span className="mt-1.5 block h-[3px] w-14 overflow-hidden rounded-full bg-[var(--crm-border)]">
                        <span
                          className="block h-full rounded-full bg-[var(--tenant-primary)]"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                    </span>

                    <span className="hidden min-w-0 items-center gap-1.5 sm:flex" title={waiting?.text}>
                      {entry.status !== 'ACTIVE' && (
                        <Pill tone={statusTone(entry.status)}>{humanize(entry.status)}</Pill>
                      )}
                      <span className={`min-w-0 truncate text-[11px] ${TONE_TEXT[waiting?.tone ?? 'neutral']}`}>
                        {waiting?.text}
                      </span>
                    </span>

                    <span className={`text-right text-[11px] tabular-nums ${age.className}`} title={age.title}>
                      {age.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {visible.length > 0 && (
              <div className="border-t border-[var(--crm-border)] bg-[var(--crm-surface)] px-4 py-2 text-[10px] text-[var(--crm-muted)]">
                <span>
                  {visible.length} of {cases.length} cases
                </span>
              </div>
            )}
          </section>

          {selected && snapshot && (
            <div
              className={`fixed inset-0 z-[320] bg-slate-950/25 backdrop-blur-[1px] transition-[opacity,backdrop-filter] duration-300 ease-out motion-reduce:transition-none ${drawerVisible ? 'opacity-100' : 'pointer-events-none opacity-0 backdrop-blur-0'}`}
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) closeDrawer();
              }}
            >
              <aside
                role="dialog"
                aria-modal="true"
                aria-label={`${applicantName(selected)} application workspace`}
                className={`ml-auto flex h-full w-full flex-col overflow-hidden border-l border-[var(--crm-border)] bg-[var(--crm-card)] shadow-[-20px_0_60px_rgba(15,23,42,0.16)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none sm:w-[92%] lg:w-3/4 ${drawerVisible ? 'translate-x-0 opacity-100' : 'translate-x-[104%] opacity-70'}`}
              >
                {/* Identity ------------------------------------------------ */}
                <div className="relative flex items-start gap-3 overflow-hidden border-b border-[var(--crm-border)] bg-[linear-gradient(135deg,var(--tenant-surface),var(--crm-card)_62%)] px-5 py-4 sm:px-6">
                  <div className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full bg-[var(--tenant-primary)] opacity-[0.06]" />
                  <button type="button" onClick={closeDrawer} className="relative grid size-9 shrink-0 place-items-center rounded-xl text-[var(--crm-muted)] transition duration-200 hover:rotate-90 hover:bg-[var(--crm-card)] hover:text-[var(--crm-text)] motion-reduce:hover:rotate-0" aria-label="Close application workspace"><X size={18} /></button>
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--tenant-primary)] text-xs font-bold text-white shadow-sm">
                    {initials(applicantName(selected))}
                  </span>
                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-sm font-semibold leading-snug text-[var(--crm-text)] sm:text-base">
                        {applicantName(selected)}
                      </h2>
                      <Pill tone={statusTone(selected.status)}>{humanize(selected.status)}</Pill>
                    </div>
                    <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[var(--crm-muted)]">
                      <div className="flex gap-1.5">
                        <dt className="shrink-0">Case</dt>
                        <dd className="truncate font-mono text-[var(--crm-text)]">{selected.id}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="shrink-0">Application</dt>
                        <dd className="truncate font-mono text-[var(--crm-text)]">{selected.applicationId}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="shrink-0">Admission</dt>
                        <dd className="truncate font-mono text-[var(--crm-text)]">{selected.admissionId}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Progress ------------------------------------------------ */}
                <div className="border-b border-[var(--crm-border)] px-5 py-4">
                  <StageProgress stage={selected.stage} />
                </div>

                {/* Notices ------------------------------------------------- */}
                {(blockedReason || actionError) && (
                  <div className="space-y-2 border-b border-[var(--crm-border)] px-5 py-4">
                    {blockedReason && (
                      <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-700 ring-1 ring-amber-500/25">
                        <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                        <span>{blockedReason}</span>
                      </p>
                    )}
                    {actionError && (
                      <p className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-700 ring-1 ring-rose-500/25">
                        <XCircle size={13} className="mt-0.5 shrink-0" />
                        <span>{actionError}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Current task ------------------------------------------ */}
                {(() => {
                  const task = stageTask(selected.stage);
                  const taskTab = workTabForStage(selected.stage);
                  return (
                    <section className="border-b border-[var(--crm-border)] bg-[var(--tenant-primary)]/[0.04] px-5 py-3.5 sm:px-6" aria-label="Current task">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--tenant-primary)]">Current task</p>
                          <h3 className="mt-1 text-sm font-semibold text-[var(--crm-text)]">{task.title}</h3>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--crm-muted)]">{task.description}</p>
                        </div>
                        {tab !== taskTab && (
                          <button type="button" onClick={() => setTab(taskTab)} className="shrink-0 rounded-lg border border-[var(--tenant-primary)]/30 bg-[var(--crm-card)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--tenant-primary)] transition hover:bg-[var(--tenant-primary)]/10">
                            Open task
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--crm-muted)]">
                        <span>Programme: <strong className="font-medium text-[var(--crm-text)]">{selected.academic.programId ?? 'Not mapped'}</strong></span>
                        <span>Documents: <strong className="font-medium text-[var(--crm-text)]">{selected.documents.filter((doc) => doc.state === 'VERIFIED' || doc.state === 'WAIVED').length}/{snapshot.definition.documentChecklist.length}</strong></span>
                        <span>Finance: <strong className="font-medium text-[var(--crm-text)]">{humanize(selected.finance)}</strong></span>
                      </div>
                    </section>
                  );
                })()}

                {/* Detail tabs --------------------------------------------- */}
                <nav className="flex gap-1 overflow-x-auto border-b border-[var(--crm-border)] bg-[var(--crm-surface)]/45 px-3 pt-2">
                  {TABS.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setTab(entry)}
                      className={`shrink-0 rounded-t-lg border-b-2 px-2.5 py-2.5 text-[10px] font-semibold capitalize transition ${
                        tab === entry
                          ? 'border-[var(--tenant-primary)] text-[var(--crm-text)]'
                          : 'border-transparent text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      {TAB_LABELS[entry]}
                    </button>
                  ))}
                </nav>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-xs sm:px-6">
                  {tab === 'application' && (
                    snapshot.applicationForm ? (
                      <ApplicationFormPanel
                        key={`${selected.id}-${applicationRecord(selected)?.revision ?? 0}`}
                        form={snapshot.applicationForm}
                        onboarding={selected}
                        record={applicationRecord(selected)}
                        disabled={busy || !open || !mayRun('record_application')}
                        onSave={(status, data) => void act(
                          'record_application',
                          status === 'submitted' ? 'Application form submitted' : 'Application draft saved',
                          {
                            applicationForm: {
                              formId: snapshot.applicationForm!.id,
                              formVersion: snapshot.applicationForm!.version,
                              status,
                              data,
                            },
                          },
                        )}
                      />
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800">
                        <p className="font-medium">No published Application form</p>
                        <p className="mt-1 text-[11px] leading-relaxed">
                          Publish an Admissions Ã¢â€ â€™ Application form in Settings Ã¢â€ â€™ Form Builders. It will appear here automatically without storing a duplicate application in CRM.
                        </p>
                      </div>
                    )
                  )}

                  {tab === 'overview' && (
                    <div className="space-y-5">
                      <Group title="Applicant and CRM source">
                        <Row label="Email">{selected.applicant?.email ? <Value>{selected.applicant.email}</Value> : <Muted>Not provided</Muted>}</Row>
                        <Row label="Phone">{selected.applicant?.phone ? <Value>{selected.applicant.phone}</Value> : <Muted>Not provided</Muted>}</Row>
                        <Row label="Lead source">{attribute(selected, 'source') ? <Value>{attribute(selected, 'source')}</Value> : <Muted>Not provided</Muted>}</Row>
                        <Row label="Lead owner">{attribute(selected, 'leadOwner') ? <Value>{attribute(selected, 'leadOwner')}</Value> : <Muted>Unassigned</Muted>}</Row>
                        <Row label="Priority">{attribute(selected, 'priority') ? <Pill tone="neutral">{humanize(attribute(selected, 'priority')!)}</Pill> : <Muted>Not set</Muted>}</Row>
                        {selected.crmLeadId && <Row label="CRM lead"><Mono>{selected.crmLeadId}</Mono></Row>}
                      </Group>

                      <Group title="Verification">
                        <Row label="Identity check">
                          {selected.identityMatch ? (
                            <Pill tone={identityTone(selected.identityMatch)}>{humanize(selected.identityMatch)}</Pill>
                          ) : (
                            <Muted>Not run</Muted>
                          )}
                        </Row>
                        <Row label="Finance">
                          <Pill tone={financeTone(selected.finance)}>{humanize(selected.finance)}</Pill>
                        </Row>
                        <Row label="Documents">
                          <Value>
                            {selected.documents.filter((doc) => doc.state === 'VERIFIED' || doc.state === 'WAIVED')
                              .length}{' '}
                            of {snapshot.definition.documentChecklist.length} cleared
                          </Value>
                        </Row>
                      </Group>

                      {/* Casework: recording the duplicate-search outcome is what
                          releases the identity gate. Without it the case cannot
                          leave IDENTITY_VERIFICATION at all. */}
                      {open && mayRun('record_identity') && (
                        <Casework
                          title="Record identity result"
                          hint="Outcome of the duplicate search against existing people."
                        >
                          {(['NO_MATCH', 'POSSIBLE_MATCH', 'CONFIRMED_MATCH', 'DUPLICATE'] as IdentityMatchKind[]).map(
                            (match) => (
                              <Chip
                                key={match}
                                label={humanize(match)}
                                active={selected.identityMatch === match}
                                disabled={busy}
                                onClick={() =>
                                  void act('record_identity', `Identity recorded as ${match}`, {
                                    identityMatch: match,
                                  })
                                }
                              />
                            ),
                          )}
                        </Casework>
                      )}

                      {open && mayRun('record_finance') && (
                        <Casework
                          title="Record finance state"
                          hint="What Fees & Finance reported Ã¢â‚¬â€ the desk records it, finance owns it."
                        >
                          {(financeDeskField?.options?.length
                            ? financeDeskField.options
                                .map((option) => option.toUpperCase().replace(/[^A-Z]+/g, '_'))
                                .filter((state): state is FinanceState => FINANCE_STATES.includes(state as FinanceState))
                            : FINANCE_STATES
                          ).map((state) => (
                            <Chip
                              key={state}
                              label={humanize(state)}
                              active={selected.finance === state}
                              disabled={busy}
                              onClick={() =>
                                void act('record_finance', `Finance recorded as ${state}`, { finance: state })
                              }
                            />
                          ))}
                        </Casework>
                      )}

                      <Group title="Provisioning">
                        <Row label="Student number">
                          {selected.studentNumber ? <Mono>{selected.studentNumber}</Mono> : <Muted>Not issued</Muted>}
                        </Row>
                        <Row label="Student record">
                          {selected.studentId ? <Mono>{selected.studentId}</Mono> : <Muted>Not created</Muted>}
                        </Row>
                        <Row label="User account">
                          {selected.userAccountId ? (
                            <Mono>{selected.userAccountId}</Mono>
                          ) : (
                            <Muted>Not created</Muted>
                          )}
                        </Row>
                        <Row label="Access">
                          {selected.accessProvisioned ? (
                            <Pill tone="positive">Provisioned</Pill>
                          ) : (
                            <Muted>Pending</Muted>
                          )}
                        </Row>
                      </Group>

                      {(selected.holdReason || selected.rejectionReason) && (
                        <Group title="Notes">
                          {selected.holdReason && (
                            <Row label="Hold reason" stacked>
                              <Value>{selected.holdReason}</Value>
                            </Row>
                          )}
                          {selected.rejectionReason && (
                            <Row label="Rejection reason" stacked>
                              <Value>{selected.rejectionReason}</Value>
                            </Row>
                          )}
                        </Group>
                      )}

                      <p className="text-[10px] text-[var(--crm-muted)]">
                        Last updated {relativeTime(selected.updatedAt)}
                      </p>
                    </div>
                  )}

                  {tab === 'documents' && (
                    <ul className="divide-y divide-[var(--crm-border)]">
                      {snapshot.definition.documentChecklist.map((requirement) => {
                        const record = selected.documents.find((doc) => doc.type === requirement.type);
                        const satisfied = record?.state === 'VERIFIED' || record?.state === 'WAIVED';
                        const reviewable = open && mayRun('review_document');
                        return (
                          <li key={requirement.type} className="py-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2">
                                {satisfied ? (
                                  <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                                ) : (
                                  <XCircle size={14} className="shrink-0 text-[var(--crm-muted)]" />
                                )}
                                <span className="truncate text-[var(--crm-text)]">
                                  {requirement.label}
                                  {requirement.required && <span className="ml-0.5 text-rose-500">*</span>}
                                </span>
                              </span>
                              <Pill tone={documentTone(record?.state)}>
                                {humanize(record?.state ?? 'NOT_SUBMITTED')}
                              </Pill>
                            </div>

                            {record?.verifiedBy && (
                              <p className="mt-1 pl-6 text-[10px] text-[var(--crm-muted)]">
                                {humanize(record.state)} by {record.verifiedBy}
                                {record.verifiedAt ? ` Ã‚Â· ${relativeTime(record.verifiedAt)}` : ''}
                              </p>
                            )}
                            {record?.rejectionReason && (
                              <p className="mt-1 pl-6 text-[10px] text-rose-600">{record.rejectionReason}</p>
                            )}

                            {/* One decision per checklist item Ã¢â‚¬â€ this is the work
                                the document stage is actually waiting for. */}
                            {reviewable && (
                              <div className="mt-1.5 flex flex-wrap gap-1 pl-6">
                                <Chip
                                  label="Verify"
                                  active={record?.state === 'VERIFIED'}
                                  disabled={busy}
                                  onClick={() =>
                                    void act('review_document', `${requirement.label} verified`, {
                                      document: { type: requirement.type, state: 'VERIFIED' },
                                    })
                                  }
                                />
                                <Chip
                                  label="Waive"
                                  active={record?.state === 'WAIVED'}
                                  disabled={busy}
                                  onClick={() =>
                                    void act('review_document', `${requirement.label} waived`, {
                                      document: { type: requirement.type, state: 'WAIVED' },
                                    })
                                  }
                                />
                                <Chip
                                  label="Reject"
                                  tone="danger"
                                  active={record?.state === 'REJECTED'}
                                  disabled={busy}
                                  onClick={() =>
                                    void act('review_document', `${requirement.label} rejected`, {
                                      document: {
                                        type: requirement.type,
                                        state: 'REJECTED',
                                        reason: 'Rejected at Application Desk',
                                      },
                                    })
                                  }
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {tab === 'academic' && (
                    <div className="space-y-5">
                      <Group title="Mapping">
                        <Row label="Campus">{fallback(selected.academic.campusId)}</Row>
                        <Row label="Department">{fallback(selected.academic.departmentId)}</Row>
                        <Row label="Program">{fallback(selected.academic.programId)}</Row>
                        <Row label="Academic year">{fallback(selected.academic.academicYear)}</Row>
                        <Row label="Batch">{fallback(selected.academic.batchId)}</Row>
                        <Row label="Section">
                          {selected.academic.sectionId ? (
                            <Value>{selected.academic.sectionId}</Value>
                          ) : (
                            <Muted>Not allocated</Muted>
                          )}
                        </Row>
                      </Group>

                      {open && mayRun('map_academics') && (
                        <Casework
                          title="Update academic mapping"
                          hint="Resolve the required academic fields before allocating a section."
                        >
                          {academicDeskFields.length >= 4 ? (
                            <DynamicAcademicMappingEditor
                              key={selected.id}
                              fields={academicDeskFields}
                              current={selected.academic}
                              disabled={busy}
                              onSave={(academic) =>
                                void act('map_academics', 'Academic mapping updated', { academic })
                              }
                            />
                          ) : (
                            <AcademicMappingEditor
                              key={selected.id}
                              current={selected.academic}
                              disabled={busy}
                              onSave={(academic) =>
                                void act('map_academics', 'Academic mapping updated', { academic })
                              }
                            />
                          )}
                        </Casework>
                      )}

                      {open && mayRun('allocate_section') && (
                        <Casework
                          title="Allocate section"
                          hint="Capacity and allocation rules stay with Academic Management; the desk records the result."
                        >
                          {sectionDeskField ? (
                            <DynamicSectionAllocator
                              field={sectionDeskField}
                              current={selected.academic.sectionId}
                              disabled={busy}
                              onAllocate={(sectionId) =>
                                void act('allocate_section', `Section ${sectionId} allocated`, { sectionId })
                              }
                            />
                          ) : (
                            <SectionAllocator
                              current={selected.academic.sectionId}
                              disabled={busy}
                              onAllocate={(sectionId) =>
                                void act('allocate_section', `Section ${sectionId} allocated`, { sectionId })
                              }
                            />
                          )}
                        </Casework>
                      )}
                    </div>
                  )}

                  {tab === 'approvals' && (
                    <ul className="divide-y divide-[var(--crm-border)]">
                      {[...selected.approvals]
                        .sort((a, b) => a.step - b.step)
                        .map((entry, index, chain) => {
                          // Chains are ordered: a step opens only once every
                          // earlier step is signed.
                          const blockedBy = chain
                            .slice(0, index)
                            .find((earlier) => earlier.state !== 'APPROVED');
                          const signable =
                            open && entry.state !== 'APPROVED' && !blockedBy && mayRun('approve');
                          return (
                            <li key={entry.step} className="flex items-center justify-between gap-3 py-2.5">
                              <span className="flex min-w-0 items-center gap-2">
                                <span
                                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${
                                    entry.state === 'APPROVED'
                                      ? 'bg-emerald-500/15 text-emerald-700'
                                      : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'
                                  }`}
                                >
                                  {entry.state === 'APPROVED' ? <CheckCircle2 size={11} /> : entry.step}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-[var(--crm-text)]">
                                    {humanize(entry.role)}
                                  </span>
                                  <span className="block truncate text-[10px] text-[var(--crm-muted)]">
                                    {entry.actedBy
                                      ? `${entry.actedBy}${entry.actedAt ? ` Ã‚Â· ${relativeTime(entry.actedAt)}` : ''}`
                                      : blockedBy
                                        ? `Waiting for step ${blockedBy.step}`
                                        : 'Awaiting signature'}
                                  </span>
                                </span>
                              </span>
                              {signable ? (
                                <Chip
                                  label="Approve"
                                  tone="primary"
                                  disabled={busy}
                                  onClick={() =>
                                    void act('approve', `Approved by ${actorName}`, {
                                      approval: { step: entry.step },
                                    })
                                  }
                                />
                              ) : (
                                <Pill tone={approvalTone(entry.state)}>{humanize(entry.state)}</Pill>
                              )}
                            </li>
                          );
                        })}
                      {selected.approvals.length === 0 && (
                        <li className="py-2.5 text-[var(--crm-muted)]">No approval required.</li>
                      )}
                    </ul>
                  )}

                  {tab === 'activity' && (
                    <ul className="space-y-3">
                      {snapshot.audit
                        .filter((entry) => entry.caseId === selected.id)
                        .map((entry, index) => (
                          <li
                            key={`${entry.timestamp}-${index}`}
                            className="border-l-2 border-[var(--crm-border)] pl-3"
                          >
                            <p className="text-[var(--crm-text)]">{humanize(entry.action)}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--crm-muted)]">
                              {humanize(entry.fromStage)} Ã¢â€ â€™ {humanize(entry.toStage)}
                            </p>
                            <p className="text-[10px] text-[var(--crm-muted)]">
                              {entry.actor} Ã‚Â· {relativeTime(entry.timestamp)}
                            </p>
                          </li>
                        ))}
                      {snapshot.audit.filter((entry) => entry.caseId === selected.id).length === 0 && (
                        <li className="text-[var(--crm-muted)]">No activity recorded yet.</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Actions ------------------------------------------------- */}
                <div className="sticky bottom-0 z-10 shrink-0 space-y-2.5 border-t border-[var(--crm-border)] bg-[var(--crm-card)]/95 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
                  {blockedReason && selected.status === 'ACTIVE' && (
                    <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-800">
                        Required before advancing
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{blockedReason}</p>

                      {selected.stage === 'IDENTITY_VERIFICATION' && mayRun('record_identity') && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          {(['NO_MATCH', 'CONFIRMED_MATCH', 'POSSIBLE_MATCH', 'DUPLICATE'] as IdentityMatchKind[]).map(
                            (match) => (
                              <Chip
                                key={match}
                                label={humanize(match)}
                                active={selected.identityMatch === match}
                                disabled={busy}
                                tone={match === 'DUPLICATE' ? 'danger' : undefined}
                                onClick={() =>
                                  void act('record_identity', `Identity recorded as ${match}`, {
                                    identityMatch: match,
                                  })
                                }
                              />
                            ),
                          )}
                        </div>
                      )}

                      {selected.stage === 'DATA_REVIEW' && snapshot.applicationForm && (
                        <button
                          type="button"
                          onClick={() => setTab('application')}
                          className="mt-2 text-[11px] font-medium text-[var(--tenant-primary)] hover:underline"
                        >
                          Complete application form
                        </button>
                      )}

                      {selected.stage === 'DOCUMENT_VERIFICATION' && (
                        <button
                          type="button"
                          onClick={() => setTab('documents')}
                          className="mt-2 text-[11px] font-medium text-[var(--tenant-primary)] hover:underline"
                        >
                          Review required documents
                        </button>
                      )}
                      {(selected.stage === 'ACADEMIC_MAPPING' || selected.stage === 'SECTION_ALLOCATION') && (
                        <button
                          type="button"
                          onClick={() => setTab('academic')}
                          className="mt-2 text-[11px] font-medium text-[var(--tenant-primary)] hover:underline"
                        >
                          Complete academic details
                        </button>
                      )}
                      {selected.stage === 'FINANCE_VERIFICATION' && (
                        <button
                          type="button"
                          onClick={() => setTab('overview')}
                          className="mt-2 text-[11px] font-medium text-[var(--tenant-primary)] hover:underline"
                        >
                          Record finance clearance
                        </button>
                      )}
                      {selected.stage === 'APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => setTab('approvals')}
                          className="mt-2 text-[11px] font-medium text-[var(--tenant-primary)] hover:underline"
                        >
                          Open approval chain
                        </button>
                      )}
                    </section>
                  )}
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--crm-muted)]">
                      {reasonDeskField?.label || 'Optional action note'}{reasonDeskField?.required && <span className="ml-1 text-rose-500">Required</span>}
                    </span>
                    <input
                      value={actionReason}
                      onChange={(event) => setActionReason(event.target.value)}
                      placeholder={reasonDeskField?.placeholder || 'Add a note saved in case history'}
                      required={reasonDeskField?.required}
                      className="min-h-10 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-text)] shadow-sm outline-none placeholder:text-[var(--crm-muted)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10"
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Action
                      label="Hold"
                      icon={PauseCircle}
                      compact
                      disabled={busy || selected.status !== 'ACTIVE' || !desk.hold}
                      onClick={() => void act('hold', actionReason.trim() || 'Held from Application Desk')}
                    />
                    <Action
                      label="Return"
                      icon={Undo2}
                      compact
                      disabled={busy || selected.status !== 'ACTIVE' || !desk.verify}
                      onClick={() => void act('return', actionReason.trim() || 'Returned for correction')}
                    />
                    <Action
                      label="Reject"
                      icon={XCircle}
                      tone="danger"
                      compact
                      disabled={busy || selected.status !== 'ACTIVE' || !desk.reject}
                      onClick={() => void act('reject', actionReason.trim() || 'Rejected at Application Desk')}
                    />
                  </div>
                  <div className="min-w-52 flex-1 sm:max-w-xs">
                    <Action
                      label={
                        blockedReason
                          ? 'Complete required checks'
                          : nextRailStage
                            ? `Advance to ${nextRailStage.short}`
                            : 'Complete onboarding'
                      }
                      icon={busy ? Loader2 : ChevronRight}
                      tone="primary"
                      spin={busy}
                      disabled={busy || selected.status !== 'ACTIVE' || !mayAdvance || !!blockedReason || !actionReasonReady}
                      onClick={() => void act('advance', actionReason.trim() || undefined)}
                    />
                  </div>
                  </div>
                  {open && desk.reject && (
                    <div className="flex flex-wrap gap-2">
                      <Action
                        label="Cancel case"
                        icon={Ban}
                        compact
                        disabled={busy}
                        onClick={() => void act('cancel', actionReason.trim() || 'Application cancelled by institution')}
                      />
                      <Action
                        label="Applicant withdrew"
                        icon={UserMinus}
                        compact
                        disabled={busy}
                        onClick={() => void act('withdraw', actionReason.trim() || 'Application withdrawn by applicant')}
                      />
                    </div>
                  )}
                  {(selected.status === 'ON_HOLD' || selected.status === 'RETURNED') && (
                    <Action
                      label={`Resume at ${STAGE_RAIL.find((s) => s.id === (selected.resumeStage ?? selected.stage))?.short ?? 'last stage'}`}
                      icon={PlayCircle}
                      disabled={busy || !desk.resume}
                      onClick={() => void act('resume')}
                    />
                  )}
                  {!mayAdvance && selected.status === 'ACTIVE' && (
                    <p className="pt-1 text-center text-[10px] text-[var(--crm-muted)]">
                      Advancing this stage needs{' '}
                      <code className="text-[var(--crm-text)]">{permissionForAdvance(selected.stage)}</code>.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>

      </div>
    </DeskShell>
  );
}

function ApplicationFormPanel({
  form,
  onboarding,
  record,
  disabled,
  onSave,
}: {
  form: NonNullable<DeskSnapshot['applicationForm']>;
  onboarding: OnboardingCase;
  record?: ApplicationRecord;
  disabled: boolean;
  onSave: (status: 'draft' | 'submitted', data: Record<string, unknown>) => void;
}) {
  const sections = applicationSections(form.schema);
  const fields = sections.flatMap((section) => section.fields);
  const initial = Object.fromEntries(fields.map((field) => {
    const key = formFieldKey(field);
    if (record?.data[key] !== undefined) return [key, record.data[key]];
    const label = `${key} ${field.label}`.toLowerCase();
    if (label.includes('email')) return [key, onboarding.applicant?.email ?? ''];
    if (label.includes('phone') || label.includes('mobile')) return [key, onboarding.applicant?.phone ?? ''];
    if (label.includes('guardian') || label.includes('parent name')) return [key, onboarding.applicant?.guardianName ?? ''];
    if (label.includes('full name') || label.includes('applicant name') || key === 'name') {
      return [key, onboarding.applicant?.fullName ?? ''];
    }
    if (label.includes('source')) return [key, attribute(onboarding, 'source') ?? ''];
    return [key, field.type === 'Checkbox' || field.type === 'Consent' ? false : ''];
  }));
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const save = (status: 'draft' | 'submitted') => {
    if (status === 'submitted') {
      const missing = fields.find((field) => {
        if (!field.required) return false;
        const value = values[formFieldKey(field)];
        return value === undefined || value === null || value === '' || value === false || (Array.isArray(value) && value.length === 0);
      });
      if (missing) {
        setError(`${missing.label} is required before submission`);
        return;
      }
    }
    setError(null);
    onSave(status, values);
  };

  if (sections.length === 0) {
    return <Muted>The published Application form has no configured fields.</Muted>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--crm-text)]">{form.name}</p>
          <p className="mt-0.5 text-[10px] text-[var(--crm-muted)]">Form v{form.version} Ã‚Â· Application {record ? `revision ${record.revision}` : 'not started'}</p>
        </div>
        <Pill tone={record?.status === 'submitted' ? 'positive' : record ? 'warning' : 'neutral'}>
          {record?.status ? humanize(record.status) : 'Not started'}
        </Pill>
      </div>

      {sections.map((section) => (
        <section key={section.section} className="space-y-3">
          <p className="border-b border-[var(--crm-border)] pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--crm-muted)]">{section.section}</p>
          <div className="grid grid-cols-2 gap-3">
            {section.fields.map((field) => {
              const key = formFieldKey(field);
              const value = values[key];
              if (field.type === 'Hidden field' || field.type === 'Automation') return null;
              if (field.type === 'Section heading' || field.type === 'Divider') {
                return <p key={key} className="col-span-2 border-b border-[var(--crm-border)] pb-1 text-[11px] font-medium text-[var(--crm-text)]">{field.label}</p>;
              }
              const wide = field.width === 'full' || ['Paragraph', 'Address', 'Guardian details', 'Education details', 'Table'].includes(field.type);
              const controlClass = 'mt-1 min-h-9 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2.5 text-[11px] text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)] disabled:opacity-60';
              let control: React.ReactNode;
              if (field.type === 'Dropdown' || field.type === 'Radio group' || field.type === 'Multi select') {
                control = (
                  <select disabled={disabled} value={String(value ?? '')} onChange={(event) => update(key, event.target.value)} className={controlClass}>
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                    {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                );
              } else if (field.type === 'Checkbox' || field.type === 'Consent') {
                control = (
                  <label className={`${controlClass} flex items-center gap-2`}>
                    <input type="checkbox" disabled={disabled} checked={value === true} onChange={(event) => update(key, event.target.checked)} />
                    {field.placeholder || `Confirm ${field.label}`}
                  </label>
                );
              } else if (field.type === 'Paragraph' || wide) {
                control = <textarea disabled={disabled} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => update(key, event.target.value)} className={`${controlClass} min-h-20 py-2`} />;
              } else if (field.type === 'Upload' || field.type === 'Image upload') {
                control = <input type="file" disabled={disabled} accept={field.type === 'Image upload' ? 'image/*' : undefined} onChange={(event) => update(key, event.target.files?.[0]?.name ?? '')} className={`${controlClass} py-1.5`} />;
              } else {
                const type = field.type === 'Email' ? 'email' : field.type === 'Phone' ? 'tel' : field.type === 'Date' ? 'date' : field.type === 'Date time' ? 'datetime-local' : field.type === 'Number' || field.type === 'Currency' ? 'number' : 'text';
                control = <input type={type} disabled={disabled} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => update(key, event.target.value)} className={controlClass} />;
              }
              return (
                <label key={key} className={wide ? 'col-span-2' : ''}>
                  <span className="text-[10px] font-medium text-[var(--crm-muted)]">{field.label}{field.required && <span className="text-rose-500"> *</span>}</span>
                  {control}
                  {field.helpText && <span className="mt-1 block text-[9px] text-[var(--crm-muted)]">{field.helpText}</span>}
                </label>
              );
            })}
          </div>
        </section>
      ))}

      {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[10px] text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-[var(--crm-border)] pt-3">
        <button type="button" disabled={disabled} onClick={() => save('draft')} className="rounded-lg border border-[var(--crm-border)] px-3 py-2 text-[10px] font-medium text-[var(--crm-text)] disabled:opacity-50">Save draft</button>
        <button type="button" disabled={disabled} onClick={() => save('submitted')} className="rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-[10px] font-medium text-white disabled:opacity-50">Submit application</button>
      </div>
    </div>
  );
}

function queueMatches(onboarding: OnboardingCase, queue: QueueKey): boolean {
  switch (queue) {
    case 'onHold':
      return onboarding.status === 'ON_HOLD' || onboarding.status === 'RETURNED';
    case 'rejected':
      return ['REJECTED', 'CANCELLED', 'WITHDRAWN', 'EXPIRED'].includes(onboarding.status);
    case 'failed':
      return onboarding.status === 'FAILED';
    case 'activated':
      return onboarding.status === 'COMPLETED';
    case 'new':
      return onboarding.status === 'ACTIVE' && ['NEW', 'DATA_REVIEW'].includes(onboarding.stage);
    case 'pendingVerification':
      return onboarding.status === 'ACTIVE' && onboarding.stage === 'IDENTITY_VERIFICATION';
    case 'documentsPending':
      return onboarding.status === 'ACTIVE' && onboarding.stage === 'DOCUMENT_VERIFICATION';
    case 'academicPending':
      return (
        onboarding.status === 'ACTIVE' &&
        ['ACADEMIC_MAPPING', 'SECTION_ALLOCATION'].includes(onboarding.stage)
      );
    case 'financePending':
      return onboarding.status === 'ACTIVE' && onboarding.stage === 'FINANCE_VERIFICATION';
    case 'approvalPending':
      return onboarding.status === 'ACTIVE' && onboarding.stage === 'APPROVAL';
    case 'readyForActivation':
      return (
        onboarding.status === 'ACTIVE' &&
        ['STUDENT_CREATION', 'ACCOUNT_PROVISIONING', 'ACCESS_PROVISIONING', 'ACTIVATION'].includes(
          onboarding.stage,
        )
      );
  }
}

/**
 * Twelve stages will not fit as readable chips in a 400px panel Ã¢â‚¬â€ the old chip
 * wall was the main source of visual noise. A segmented bar carries the same
 * information (how far along, what is next) in two lines.
 */
function StageProgress({ stage }: { stage: OnboardingCase['stage'] }) {
  const current = stageIndex(stage);
  const next = STAGE_RAIL[current + 1];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs text-[var(--crm-text)]">{STAGE_RAIL[current]?.short ?? humanize(stage)}</p>
        <p className="shrink-0 text-[10px] text-[var(--crm-muted)]">
          Step {current + 1} of {STAGE_RAIL.length}
        </p>
      </div>
      <div className="mt-2 flex gap-[3px]" role="presentation">
        {STAGE_RAIL.map((entry, index) => (
          <span
            key={entry.id}
            title={entry.short}
            className={`h-1.5 flex-1 rounded-full ${
              index < current
                ? 'bg-emerald-500/60'
                : index === current
                  ? 'bg-[var(--tenant-primary)]'
                  : 'bg-[var(--crm-border)]'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[var(--crm-muted)]">
        {next ? `Next Ã‚Â· ${next.short}` : 'Final stage'}
      </p>
    </div>
  );
}

/** Lifecycle buckets. `closed` folds rejections and failures together. */
function viewMatches(onboarding: OnboardingCase, view: ViewKey): boolean {
  switch (view) {
    case 'all':
      return true;
    case 'live':
      return onboarding.status === 'ACTIVE';
    case 'onHold':
      return onboarding.status === 'ON_HOLD' || onboarding.status === 'RETURNED';
    case 'activated':
      return onboarding.status === 'COMPLETED';
    case 'closed':
      return ['REJECTED', 'CANCELLED', 'WITHDRAWN', 'EXPIRED', 'FAILED'].includes(onboarding.status);
  }
}

/** Oldest-first by default: a work queue that reorders itself starves cases. */
function sortCases(rows: OnboardingCase[], sort: SortKey): OnboardingCase[] {
  const ordered = [...rows];
  switch (sort) {
    case 'oldest':
      return ordered.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case 'newest':
      return ordered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'stage':
      return ordered.sort(
        (a, b) => stageIndex(b.stage) - stageIndex(a.stage) || a.updatedAt.localeCompare(b.updatedAt),
      );
    case 'name':
      return ordered.sort((a, b) => applicantName(a).localeCompare(applicantName(b)));
  }
}

function ViewTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[11px] font-semibold transition ${
        active
          ? 'border-[var(--tenant-primary)] text-[var(--crm-text)]'
          : 'border-transparent text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
      }`}
    >
      {label}
      <span
        className={`rounded px-1 text-[10px] tabular-nums ${
          active
            ? 'bg-[var(--tenant-primary)]/12 text-[var(--tenant-primary)]'
            : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * Stage narrowing. Empty stages stay visible but recede Ã¢â‚¬â€ knowing Finance is
 * clear is useful, and hiding them would make the row jump around as work moves.
 */
function StageFilter({
  label,
  count,
  active,
  onClick,
  empty,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  empty?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={empty}
      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition ${
        active
          ? 'border-[var(--tenant-primary)]/20 bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]'
          : empty
            ? 'border-transparent text-[var(--crm-muted)]/40'
            : 'border-[var(--crm-border)] text-[var(--crm-muted)] hover:border-[var(--tenant-primary)]/30 hover:bg-[var(--crm-surface)] hover:text-[var(--crm-text)]'
      }`}
    >
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}

// -- detail primitives ------------------------------------------------------

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3.5 py-3">
      <h3 className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--crm-muted)]">{title}</h3>
      <dl className="mt-2 divide-y divide-[var(--crm-border)]">{children}</dl>
    </section>
  );
}

function Row({ label, children, stacked }: { label: string; children: React.ReactNode; stacked?: boolean }) {
  return stacked ? (
    <div className="py-2">
      <dt className="text-[var(--crm-muted)]">{label}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="shrink-0 text-[var(--crm-muted)]">{label}</dt>
      <dd className="min-w-0 truncate text-right">{children}</dd>
    </div>
  );
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset ${TONE_PILL[tone]}`}
    >
      {children}
    </span>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--crm-text)]">{children}</span>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] text-[var(--crm-text)]">{children}</span>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--crm-muted)]">{children}</span>;
}

/** Optional mapping ids read better as a stated absence than as an em dash. */
function fallback(value: string | undefined) {
  return value ? <Value>{value}</Value> : <Muted>Not set</Muted>;
}

/**
 * A casework block: the controls that record what a stage is waiting for. Set
 * apart from the read-only rows above it so it reads as "do something here"
 * rather than as more data.
 */
function Casework({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--tenant-primary)]/20 bg-[var(--tenant-primary)]/[0.04] p-3.5">
      <h3 className="text-[10px] uppercase tracking-[0.14em] text-[var(--crm-muted)]">{title}</h3>
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--crm-muted)]">{hint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">{children}</div>
    </section>
  );
}

function Chip({
  label,
  onClick,
  active,
  disabled,
  tone,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'danger';
}) {
  const palette = active
    ? tone === 'danger'
      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700'
      : 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]'
    : tone === 'primary'
      ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white'
      : tone === 'danger'
        ? 'border-[var(--crm-border)] bg-[var(--crm-card)] text-rose-600 hover:border-rose-500/40'
        : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)] hover:border-[var(--tenant-primary)]/40';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-lg border px-2 py-1 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40 ${palette}`}
    >
      {label}
    </button>
  );
}

function DeskFieldControl({ field, value, onChange, disabled }: { field: ApplicationField; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const choices = field.options?.filter(Boolean) ?? [];
  const type = field.type.toLowerCase();
  const common = 'mt-1 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-1.5 text-[11px] text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]';
  if (type.includes('dropdown') && choices.length > 0) return <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={common}><option value="">Select {field.label.toLowerCase()}</option>{choices.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (type.includes('radio') && choices.length > 0) return <span className="mt-1 flex flex-wrap gap-1.5">{choices.map((option) => <button key={option} type="button" disabled={disabled} onClick={() => onChange(option)} className={`rounded-md border px-2 py-1 text-[10px] ${value === option ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]' : 'border-[var(--crm-border)] text-[var(--crm-muted)]'}`}>{option}</button>)}</span>;
  if (type.includes('textarea') || type.includes('long text')) return <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={field.placeholder} className={`${common} min-h-16`} />;
  return <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={field.placeholder} className={common} />;
}

function DynamicAcademicMappingEditor({ fields, current, disabled, onSave }: { fields: ApplicationField[]; current: OnboardingCase['academic']; disabled?: boolean; onSave: (academic: NonNullable<StageInput['academic']>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({ programId: current.programId ?? '', departmentId: current.departmentId ?? '', academicYear: current.academicYear ?? '', batchId: current.batchId ?? '' });
  const semantic = (field: ApplicationField) => { const key = formFieldKey(field).toLowerCase().replace(/[^a-z0-9]/g, ''); const label = field.label.toLowerCase(); if (key.includes('department') || label.includes('department')) return 'departmentId'; if (key.includes('academic') || label.includes('academic year')) return 'academicYear'; if (key.includes('batch') || label.includes('batch')) return 'batchId'; return 'programId'; };
  const complete = fields.every((field) => !field.required || Boolean(values[semantic(field)]?.trim()));
  return <form className="grid w-full grid-cols-2 gap-2" onSubmit={(event) => { event.preventDefault(); if (complete) onSave({ programId: values.programId.trim(), departmentId: values.departmentId.trim(), academicYear: values.academicYear.trim(), batchId: values.batchId.trim() }); }}>{fields.map((field) => { const key = semantic(field); return <label key={formFieldKey(field)} className="text-[10px] text-[var(--crm-muted)]">{field.label}{field.required && <span className="ml-0.5 text-rose-500">*</span>}<DeskFieldControl field={field} value={values[key] ?? ''} disabled={disabled} onChange={(value) => setValues((previous) => ({ ...previous, [key]: value }))} /></label>; })}<button type="submit" disabled={disabled || !complete} className="col-span-2 rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-[10px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40">Save academic mapping</button></form>;
}

function DynamicSectionAllocator({ field, current, disabled, onAllocate }: { field: ApplicationField; current?: string; disabled?: boolean; onAllocate: (sectionId: string) => void }) {
  const [value, setValue] = useState(current ?? ''); const trimmed = value.trim();
  return <form className="w-full" onSubmit={(event) => { event.preventDefault(); if (trimmed) onAllocate(trimmed); }}><label className="text-[10px] text-[var(--crm-muted)]">{field.label}{field.required && <span className="ml-0.5 text-rose-500">*</span>}<span className="flex items-center gap-1.5"><DeskFieldControl field={field} value={value} disabled={disabled} onChange={setValue} /><button type="submit" disabled={disabled || !trimmed || trimmed === current} className="mt-1 shrink-0 rounded-lg border border-[var(--tenant-primary)] bg-[var(--tenant-primary)] px-2 py-1.5 text-[10px] text-white disabled:opacity-40">{current ? 'Reallocate' : 'Allocate'}</button></span></label></form>;
}

function AcademicMappingEditor({
  current,
  disabled,
  onSave,
}: {
  current: OnboardingCase['academic'];
  disabled?: boolean;
  onSave: (academic: NonNullable<StageInput['academic']>) => void;
}) {
  const [programId, setProgramId] = useState(current.programId ?? '');
  const [departmentId, setDepartmentId] = useState(current.departmentId ?? '');
  const [academicYear, setAcademicYear] = useState(current.academicYear ?? '');
  const [batchId, setBatchId] = useState(current.batchId ?? '');
  const values = { programId, departmentId, academicYear, batchId };
  const complete = Object.values(values).every((value) => value.trim());

  return (
    <form
      className="grid w-full grid-cols-2 gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        onSave({
          programId: programId.trim(),
          departmentId: departmentId.trim(),
          academicYear: academicYear.trim(),
          batchId: batchId.trim(),
        });
      }}
    >
      {([
        ['Program id', programId, setProgramId],
        ['Department id', departmentId, setDepartmentId],
        ['Academic year', academicYear, setAcademicYear],
        ['Batch id', batchId, setBatchId],
      ] as const).map(([label, value, setter]) => (
        <label key={label} className="text-[10px] text-[var(--crm-muted)]">
          {label}
          <input
            value={value}
            onChange={(event) => setter(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-1.5 text-[11px] text-[var(--crm-text)] outline-none focus:border-[var(--tenant-primary)]"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={disabled || !complete}
        className="col-span-2 rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-[10px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Save academic mapping
      </button>
    </form>
  );
}

/** Sections are owned by Academic Management; the desk records the allocation. */
function SectionAllocator({
  current,
  disabled,
  onAllocate,
}: {
  current?: string;
  disabled?: boolean;
  onAllocate: (sectionId: string) => void;
}) {
  const [value, setValue] = useState(current ?? '');
  const trimmed = value.trim();
  return (
    <form
      className="flex w-full items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed) onAllocate(trimmed);
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Section id"
        className="min-w-0 flex-1 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-2 py-1 text-[11px] text-[var(--crm-text)] outline-none placeholder:text-[var(--crm-muted)] focus:border-[var(--tenant-primary)]"
      />
      <button
        type="submit"
        disabled={disabled || !trimmed || trimmed === current}
        className="shrink-0 rounded-lg border border-[var(--tenant-primary)] bg-[var(--tenant-primary)] px-2 py-1 text-[10px] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {current ? 'Reallocate' : 'Allocate'}
      </button>
    </form>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone,
  spin,
  compact,
}: {
  label: string;
  icon: typeof Clock;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger';
  spin?: boolean;
  compact?: boolean;
}) {
  const palette =
    tone === 'primary'
      ? 'bg-[var(--tenant-primary)] text-white'
      : tone === 'danger'
        ? 'border border-rose-500/40 bg-[var(--crm-card)] text-rose-600'
        : 'border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)]';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${compact ? 'w-auto px-3 py-2 shadow-none hover:bg-[var(--crm-surface)]' : 'w-full px-4 py-2.5 shadow-sm hover:-translate-y-px hover:shadow-md disabled:hover:translate-y-0'} ${palette}`}
    >
      <Icon size={14} className={spin ? 'animate-spin' : undefined} /> {label}
    </button>
  );
}
