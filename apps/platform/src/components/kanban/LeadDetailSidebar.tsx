'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  AlertTriangle, Archive, ArrowLeft, ArrowRight, ArrowRightLeft, CalendarClock, Check, CheckCircle2, ChevronDown, ClipboardCheck, FileCheck2, FileText, LoaderCircle,
  MessageSquare, PauseCircle, Pencil, Phone, Plus, Save, Send, Trash2, UserRound, X,
} from 'lucide-react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS } from '@/lib/kanban/kanban-data';
import type { CrmForm, CrmLeadTask, CrmLeadTimeline } from '@/lib/crm-api';
import { addCrmLeadNote, addCrmLeadTask, getCrmFormSubmissions, getCrmLeadTimeline, logCrmCall } from '@/lib/crm-api';
import { LEAD_SOURCES, pipelineValueLabel } from '@/lib/crm-catalog';
import PublishedApplicationForm, { applicationValuePresent } from '@/components/forms/PublishedApplicationForm';

interface LeadDetailSidebarProps {
  lead: Lead;
  onClose: () => void;
  onApplicationDecision: (lead: Lead, decision: 'accept' | 'deny' | 'hold') => Promise<void>;
  onCompleteApplicationReview: (lead: Lead) => Promise<void>;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onShowToast: (message: string) => void;
  canUpdateLead: boolean;
  canMoveLeadStage: boolean;
  canHoldLead: boolean;
  canTransferLead: boolean;
  canLogCall: boolean;
  canDeleteLead: boolean;
  onDeleteLead: (lead: Lead, reason: string) => Promise<void>;
  onRejectLead: (lead: Lead, reason: string) => Promise<void>;
  onRestoreLead: (lead: Lead, stage: string, reason: string) => Promise<void>;
  onTransferLead: (lead: Lead) => void;
  stageSubstates: string[];
  allStageSubstates: string[];
  onChangeSubstate: (lead: Lead, substate: string) => Promise<void>;
  leadForm?: CrmForm | null;
  applicationForm?: CrmForm | null;
  onSendApplication: (channel: 'whatsapp' | 'sms') => Promise<string>;
  onSubmitOfflineApplication: (data: Record<string, unknown>) => Promise<void>;
  onUploadApplicationFile: (file: File) => Promise<unknown>;
}

type WorkspaceTab = 'application' | 'activity' | 'notes' | 'tasks';
type PublishedField = { key?: string; label: string; type: string; required?: boolean; options?: string[] };
type PublishedSection = { section: string; fields: PublishedField[] };

const REJECTION_REASONS = [
  'Academic Ineligibility', 'Age Criteria Not Met', 'Calls Not Answered', 'Duplicate Lead', 'Education Gap', 'Education Loan Rejected', 'Fake Documents', 'Financial Ineligibility', 'Full Scholarship Required', 'Health Issues', 'Insufficient Documents', 'Intake Deadline Passed', 'Interview No Show', 'Invalid Number', 'Lost to Competitor', 'Low Score', 'No Offer', 'No Offer from Preferred Choice', 'No Revenue Potential', 'Not Happy with Service', 'Not Interested in Engineering', 'Not Reachable', 'Not Satisfied with Offering', 'Offer Expired', 'Others', 'Program Full/Closed', 'Program Not Available', 'Program Not Offered', 'Refund Initiated', 'Spam', 'Student Opted Out',
] as const;

function LeadDetailsDisclosure({ collapsible, children }: { collapsible: boolean; children: React.ReactNode }) {
  if (!collapsible) return <>{children}</>;
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[var(--crm-text)] marker:content-none">
        <span>Application details</span>
        <ChevronDown size={17} className="text-[var(--crm-muted)] transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[var(--crm-border)] p-5">{children}</div>
    </details>
  );
}

const stageLabel = (value: string | null | undefined) =>
  COLUMNS.find((column) => column.id === value?.replaceAll('_', '-'))?.title
  ?? value?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  ?? 'Unknown';

const activityDate = (value: string) => new Date(value).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});

function noteText(content: Record<string, unknown>) {
  const text = content.text ?? content.message ?? content.body;
  return typeof text === 'string' ? text : 'Note added';
}

const fieldKey = (field: PublishedField) => field.key
  ?? field.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function publishedSections(form: CrmForm | null | undefined): PublishedSection[] {
  if (!form?.schema) return [];
  const sections = Array.isArray(form.schema)
    ? form.schema
    : typeof form.schema === 'object' && Array.isArray((form.schema as { sections?: unknown }).sections)
      ? (form.schema as { sections: unknown[] }).sections
      : [];
  return (sections as PublishedSection[]).map((section) => ({
    ...section,
    fields: (section.fields ?? []).filter((field) => !['Hidden field', 'Automation', 'Section heading', 'Divider'].includes(field.type)),
  })).filter((section) => section.fields.length > 0);
}

function recordValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

function rawPublishedValue(lead: Lead, field: PublishedField): unknown {
  const key = fieldKey(field);
  const customValues = lead.customFields?.values && typeof lead.customFields.values === 'object'
    ? lead.customFields.values as Record<string, unknown>
    : undefined;
  return customValues?.[key] ?? lead.customFields?.[key] ?? lead.interest?.[key] ?? lead.academic?.[key] ?? publishedValue(lead, field);
}

function publishedValue(lead: Lead, field: PublishedField) {
  const key = fieldKey(field);
  const customValues = lead.customFields?.values && typeof lead.customFields.values === 'object'
    ? lead.customFields.values as Record<string, unknown>
    : undefined;
  const stored = recordValue(customValues, key)
    || recordValue(lead.customFields, key)
    || recordValue(lead.interest, key)
    || recordValue(lead.academic, key);
  if (stored) return stored;

  const semantic = `${key} ${field.label}`.toLowerCase();
  const contains = (...terms: string[]) => terms.some((term) => semantic.includes(term));
  if (contains('parent name', 'guardian name')) return lead.parent.name;
  if (contains('parent phone', 'guardian phone')) return lead.parent.phone;
  if (contains('student name', 'full name', 'applicant name') || (contains('name') && !contains('parent', 'guardian'))) return lead.name;
  if (contains('whatsapp')) return lead.whatsapp ?? '';
  if (contains('email')) return lead.email;
  if (contains('phone', 'mobile')) return lead.phone;
  if (contains('course', 'program')) return lead.course;
  if (contains('intake')) return lead.intake;
  if (contains('city')) return lead.city;
  if (contains('source')) return lead.source;
  if (contains('priority')) return lead.tags?.[0] ?? '';
  return '';
}

export default function LeadDetailSidebar({
  lead, onClose, onApplicationDecision, onCompleteApplicationReview, onUpdate, onShowToast,
  canUpdateLead, canMoveLeadStage, canHoldLead, canTransferLead, canLogCall, canDeleteLead,
  onTransferLead, onDeleteLead, onRejectLead, onRestoreLead,
  stageSubstates, allStageSubstates, onChangeSubstate, leadForm,
  applicationForm, onSendApplication, onSubmitOfflineApplication, onUploadApplicationFile,
}: LeadDetailSidebarProps) {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<WorkspaceTab>(lead.status === 'application' ? 'application' : 'activity');
  const [editing, setEditing] = useState(false);
  const [composer, setComposer] = useState<'note' | 'task' | 'call' | null>(null);
  const [timeline, setTimeline] = useState<CrmLeadTimeline | null>(null);
  const [receivedSubmission, setReceivedSubmission] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState<'accept' | 'deny' | 'hold' | null>(null);
  const [substateBusy, setSubstateBusy] = useState(false);
  const [applicationAction, setApplicationAction] = useState<'send' | 'offline' | null>(null);
  const [applicationBusy, setApplicationBusy] = useState<'whatsapp' | 'sms' | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectBusy, setRejectBusy] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreStage, setRestoreStage] = useState('enquiry');
  const [restoreReason, setRestoreReason] = useState('');
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [note, setNote] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callNotes, setCallNotes] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<CrmLeadTask['priority']>('medium');
  const [taskDueAt, setTaskDueAt] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const closeTimer = useRef<number | null>(null);
  const formSections = useMemo(() => publishedSections(leadForm), [leadForm]);
  const formFields = useMemo(() => formSections.flatMap((section) => section.fields), [formSections]);
  const formValues = useMemo(() => Object.fromEntries(
    formFields.map((field) => [fieldKey(field), publishedValue(lead, field)]),
  ), [formFields, lead]);
  const receivedApplicationSections = useMemo(() => {
    const snapshotSchema = receivedSubmission?.formSchema;
    return snapshotSchema ? publishedSections({ schema: snapshotSchema } as CrmForm) : publishedSections(applicationForm);
  }, [applicationForm, receivedSubmission]);
  const receivedApplicationValues = useMemo(() => {
    const submissionData = receivedSubmission?.data && typeof receivedSubmission.data === 'object'
      ? receivedSubmission.data as Record<string, unknown>
      : {};
    const submittedValues = submissionData.values && typeof submissionData.values === 'object'
      ? submissionData.values as Record<string, unknown>
      : submissionData;
    return Object.fromEntries(receivedApplicationSections.flatMap((section) => section.fields.map((field) => {
      const key = fieldKey(field);
      return [key, submittedValues[key] ?? rawPublishedValue(lead, field)];
    })));
  }, [lead, receivedApplicationSections, receivedSubmission]);
  const missingRequiredApplicationFields = useMemo(() => receivedApplicationSections
    .flatMap((section) => section.fields)
    .filter((field) => field.required && !applicationValuePresent(receivedApplicationValues[fieldKey(field)])),
  [receivedApplicationSections, receivedApplicationValues]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const sendApplication = async (channel: 'whatsapp' | 'sms') => {
    setApplicationBusy(channel);
    try {
      const url = await onSendApplication(channel);
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setApplicationAction(null);
    } catch (reason) {
      onShowToast(reason instanceof Error ? reason.message : 'Unable to send application');
    } finally {
      setApplicationBusy(null);
    }
  };

  const requestClose = useCallback(() => {
    if (saving || closeTimer.current !== null) return;
    setVisible(false);
    closeTimer.current = window.setTimeout(onClose, 260);
  }, [onClose, saving]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => {
      window.cancelAnimationFrame(frame);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const loadTimeline = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getCrmLeadTimeline(lead.id);
      setTimeline(response.data);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to load lead activity');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [lead.id, onShowToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTimeline(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTimeline]);

  useEffect(() => {
    if (lead.status !== 'application' || !applicationForm?.id) {
      return;
    }
    let cancelled = false;
    void getCrmFormSubmissions(applicationForm.id)
      .then((response) => {
        if (cancelled) return;
        const match = response.data.find((submission) => String(submission.leadId ?? '') === lead.id) ?? null;
        setReceivedSubmission(match);
      })
      .catch((reason) => {
        if (!cancelled) onShowToast(reason instanceof Error ? reason.message : 'Unable to load the submitted application');
      });
    return () => { cancelled = true; };
  }, [applicationForm?.id, lead.id, lead.status, onShowToast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (composer && !saving) setComposer(null);
      else requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composer, requestClose, saving]);

  const notes = useMemo(
    () => timeline?.communications.filter((item) => item.channel === 'note') ?? [],
    [timeline],
  );
  const calls = useMemo(
    () => timeline?.communications.filter((item) => item.channel === 'call') ?? [],
    [timeline],
  );
  const tasks = useMemo(() => timeline?.tasks ?? [], [timeline]);
  const activity = useMemo(() => {
    const stageItems = (timeline?.stageHistory ?? []).map((item) => ({
      id: `stage-${item.id}`, at: item.createdAt, icon: 'stage' as const,
      title: `${stageLabel(item.fromStage)} → ${stageLabel(item.toStage)}`,
      detail: item.reason || item.notes || 'Pipeline stage updated',
    }));
    const noteItems = notes.map((item) => ({
      id: `note-${item.id}`, at: item.createdAt, icon: 'note' as const,
      title: 'Note added', detail: noteText(item.content),
    }));
    const callItems = calls.map((item) => ({
      id: `call-${item.id}`, at: item.createdAt, icon: 'call' as const,
      title: 'Call logged', detail: String(item.content.notes ?? item.content.outcome ?? 'Call activity recorded'),
    }));
    const taskItems = tasks.map((item) => ({
      id: `task-${item.id}`, at: item.createdAt, icon: 'task' as const,
      title: 'Task created', detail: `${item.title} · due ${activityDate(item.dueAt)}`,
    }));
    return [...stageItems, ...noteItems, ...callItems, ...taskItems]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [calls, notes, tasks, timeline]);

  async function saveCall() {
    setSaving(true);
    try {
      const response = await logCrmCall({
        leadId: lead.id,
        outcome: callOutcome,
        content: { outcome: callOutcome, notes: callNotes.trim() },
      });
      setTimeline((current) => current ? {
        ...current,
        communications: [response.data, ...current.communications.filter((item) => item.id !== response.data.id)],
      } : current);
      setCallNotes(''); setComposer(null); setTab('activity');
      await loadTimeline(false);
      onShowToast('Call logged in lead activity');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to log call');
    } finally { setSaving(false); }
  }

  function saveEdits() {
    const valueFor = (includes: string[], excludes: string[] = []) => {
      const field = formFields.find((candidate) => {
        const semantic = `${fieldKey(candidate)} ${candidate.label}`.toLowerCase();
        return includes.some((term) => semantic.includes(term)) && !excludes.some((term) => semantic.includes(term));
      });
      return field ? editValues[fieldKey(field)]?.trim() : undefined;
    };
    const name = valueFor(['student name', 'full name', 'applicant name', 'name'], ['parent', 'guardian']) || lead.name;
    if (!name) { onShowToast('Student name is required'); return; }
    const whatsapp = valueFor(['whatsapp']) ?? lead.whatsapp;
    const phone = valueFor(['phone', 'mobile'], ['parent', 'guardian', 'whatsapp']) ?? lead.phone;
    const email = valueFor(['email']) ?? lead.email;
    const course = valueFor(['course', 'program']) ?? lead.course;
    const source = valueFor(['source']) ?? lead.source;
    const intake = valueFor(['intake']) ?? lead.intake;
    const city = valueFor(['city']) ?? lead.city;
    const parentName = valueFor(['parent name', 'guardian name']) ?? lead.parent.name;
    const parentPhone = valueFor(['parent phone', 'guardian phone']) ?? lead.parent.phone;
    const existingValues = lead.customFields?.values && typeof lead.customFields.values === 'object'
      ? lead.customFields.values as Record<string, unknown>
      : {};
    onUpdate(lead.id, {
      name, phone, email, whatsapp, course, intake, city, source,
      parent: { ...lead.parent, name: parentName, phone: parentPhone },
      interest: { ...lead.interest, programName: course, intake },
      customFields: { ...lead.customFields, city, values: { ...existingValues, ...editValues } },
      lastContact: 'just now',
    });
    setEditing(false);
    onShowToast('Lead details saved');
  }

  async function saveNote() {
    if (!note.trim()) { onShowToast('Enter a note first'); return; }
    setSaving(true);
    try {
      const response = await addCrmLeadNote(lead.id, note.trim());
      setTimeline((current) => current ? {
        ...current,
        communications: [response.data, ...current.communications.filter((item) => item.id !== response.data.id)],
      } : current);
      setNote(''); setComposer(null); setTab('notes');
      await loadTimeline(false);
      onShowToast('Note added to the lead');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to add note');
    } finally { setSaving(false); }
  }

  async function saveTask() {
    if (!taskTitle.trim() || !taskDueAt) { onShowToast('Task title and due time are required'); return; }
    setSaving(true);
    try {
      const response = await addCrmLeadTask(lead.id, {
        title: taskTitle.trim(), dueAt: new Date(taskDueAt).toISOString(), priority: taskPriority,
      });
      setTimeline((current) => current ? {
        ...current,
        tasks: [response.data, ...current.tasks.filter((item) => item.id !== response.data.id)],
      } : current);
      setTaskTitle(''); setComposer(null); setTab('tasks');
      await loadTimeline(false);
      onShowToast('Follow-up task created');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to add task');
    } finally { setSaving(false); }
  }

  async function decideApplication(decision: 'accept' | 'deny' | 'hold') {
    if (decisionBusy) return;
    setDecisionBusy(decision);
    try {
      await onApplicationDecision(lead, decision);
      await loadTimeline(false);
    } finally {
      setDecisionBusy(null);
    }
  }

  const inputClass = 'w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tenant-primary)_18%,transparent)]';
  const currentStage = stageLabel(lead.status);

  return (
    <div className="fixed inset-0 z-[120]">
      <button type="button" aria-label="Close lead details" onClick={requestClose} className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} />
      <section role="dialog" aria-modal="true" aria-label={`${lead.name} details`} className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-2xl transition-transform duration-300 ease-out ${lead.status === 'application' ? 'lg:w-3/4' : 'lg:w-1/2'} ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--tenant-primary)] font-bold text-white">{lead.initials}</div>
            <div className="min-w-0"><h2 className="truncate text-lg font-bold text-[var(--crm-text)]">{lead.name}</h2><p className="text-xs text-[var(--crm-muted)]">Lead workspace · {lead.id.slice(0, 8)}</p></div>
          </div>
          <button type="button" onClick={requestClose} aria-label="Close lead details" className="rounded-xl p-2 text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]"><X size={21} /></button>
        </header>

        <div className={`grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto bg-[var(--crm-panel)] p-4 ${lead.status === 'application' ? 'xl:grid-cols-1 xl:overflow-y-auto' : 'xl:grid-cols-[minmax(250px,0.42fr)_minmax(300px,0.58fr)] xl:overflow-hidden'}`}>
          <aside className={`rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] kanban-scroll-hidden ${lead.status === 'application' ? 'overflow-visible p-0' : 'overflow-y-auto p-5'}`}>
            <LeadDetailsDisclosure collapsible={lead.status === 'application'}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Pipeline stage</p><div className="mt-2 flex flex-wrap gap-2"><span className="inline-flex rounded-full bg-[var(--tenant-surface)] px-3 py-1 text-xs font-bold text-[var(--tenant-primary)]">{currentStage}</span>{lead.globalStatus === 'on_hold' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"><PauseCircle size={12} />On hold</span>}</div></div>
              <span className="rounded-lg border border-[var(--crm-border)] px-2 py-1 text-[10px] font-semibold text-[var(--crm-muted)]">{lead.assignedTo.name === 'Unassigned' ? 'Unassigned' : 'Owned'}</span>
            </div>

            {lead.duplicateOf && (
              <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <p className="flex items-center gap-2 text-xs font-bold"><AlertTriangle size={15} />Duplicate lead detected</p>
                <p className="mt-1 text-[11px] leading-5">Phone or email matches lead {lead.duplicateOf.slice(0, 8)}. Review both records before merging or advancing this card.</p>
              </div>
            )}

            {lead.status === 'archived' && (
              <div className="mb-5 rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-700">
                <p className="flex items-center gap-2 text-xs font-bold"><Archive size={15} />Archived — recoverable</p>
                <p className="mt-1 text-[11px] leading-5">This record is retained with its history. It is not permanently deleted and can only be restored by a user with restore permission.</p>
              </div>
            )}

            <div className="mb-5 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Card owner</p>
              <p className="mt-1.5 flex items-center gap-2 break-all text-xs font-semibold text-[var(--crm-text)]"><UserRound size={14} className="shrink-0" />{lead.assignedTo.name}</p>
            </div>

            {lead.status !== 'application' && <label className="mb-5 block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Current substage</span>
              <select
                value={lead.substate ?? ''}
                disabled={!canMoveLeadStage || substateBusy || stageSubstates.length === 0}
                onChange={async (event) => {
                  const next = event.target.value;
                  if (!next || next === lead.substate) return;
                  setSubstateBusy(true);
                  try { await onChangeSubstate(lead, next); } finally { setSubstateBusy(false); }
                }}
                className={inputClass}
              >
                {allStageSubstates.map((substate) => (
                  <option key={substate} value={substate} disabled={!stageSubstates.includes(substate)}>
                    {pipelineValueLabel(substate)}{stageSubstates.includes(substate) ? '' : ' — unavailable from current substage'}
                  </option>
                ))}
              </select>
              {!canMoveLeadStage && <span className="mt-1 block text-[10px] text-[var(--crm-muted)]">Stage-move permission is required.</span>}
              {canMoveLeadStage && lead.status === 'application' && lead.substate === 'technical_issue' && (
                <span className="mt-1.5 block text-[10px] leading-4 text-[var(--crm-muted)]">
                  Application Submitted is available after moving to To Do, then Application In Progress.
                </span>
              )}
            </label>}

            {lead.status === 'application' ? (
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--crm-border)] pt-4">
                <Detail label="Received" value={lead.createdAt ? activityDate(lead.createdAt) : 'Not available'} />
                <Detail label="Last updated" value={lead.lastContact} />
              </div>
            ) : formSections.length ? (
              <div className="space-y-5">
                {lead.status !== 'application' && <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--tenant-primary)]">Published form</p><p className="mt-1 truncate text-sm font-bold text-[var(--crm-text)]">{leadForm?.name}</p></div>}
                {formSections.map((section) => (
                  <section key={section.section} className="space-y-3 border-t border-[var(--crm-border)] pt-4 first:border-0 first:pt-0">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">{section.section}</h3>
                    {section.fields.map((field) => {
                      const key = fieldKey(field);
                      return editing
                        ? <PublishedFieldInput key={key} field={field} value={editValues[key] ?? ''} onChange={(value) => setEditValues((current) => ({ ...current, [key]: value }))} inputClass={inputClass} />
                        : <PublishedFieldValue key={key} field={field} value={formValues[key] ?? ''} />;
                    })}
                  </section>
                ))}
                <div className="grid grid-cols-2 gap-3 border-t border-[var(--crm-border)] pt-4"><Detail label="Created" value={lead.createdAt ? activityDate(lead.createdAt) : 'Not available'} /><Detail label="Updated" value={lead.lastContact} /></div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                No published CRM lead capture form is available. Publish a form to define the fields shown on every lead card.
              </div>
            )}
            </LeadDetailsDisclosure>
            {lead.status === 'application' && (
              <label className="block border-t border-[var(--crm-border)] px-5 py-4">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Application substage</span>
                <select
                  value={lead.substate ?? ''}
                  disabled={!canMoveLeadStage || substateBusy || stageSubstates.length === 0}
                  onChange={async (event) => {
                    const next = event.target.value;
                    if (!next || next === lead.substate) return;
                    setSubstateBusy(true);
                    try { await onChangeSubstate(lead, next); } finally { setSubstateBusy(false); }
                  }}
                  className={inputClass}
                >
                  {allStageSubstates.map((substate) => (
                    <option key={substate} value={substate} disabled={!stageSubstates.includes(substate)}>
                      {pipelineValueLabel(substate)}{stageSubstates.includes(substate) ? '' : ' — unavailable from current substage'}
                    </option>
                  ))}
                </select>
                {!canMoveLeadStage && <span className="mt-1 block text-[10px] text-[var(--crm-muted)]">Stage-move permission is required.</span>}
                {canMoveLeadStage && lead.substate === 'technical_issue' && (
                  <span className="mt-1.5 block text-[10px] leading-4 text-[var(--crm-muted)]">
                    Application Submitted is available after moving to To Do, then Application In Progress.
                  </span>
                )}
              </label>
            )}
          </aside>

          <main className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)]">
            <nav className="flex shrink-0 gap-1 border-b border-[var(--crm-border)] px-4 pt-3">
              {([
                ...(lead.status === 'application' ? [['application', 'Application received', FileCheck2, receivedApplicationSections.length] as const] : []),
                ['activity', 'Activity', CalendarClock, activity.length],
                ['notes', 'Notes', FileText, notes.length],
                ['tasks', 'Tasks', ClipboardCheck, tasks.length],
              ] as const).map(([id, label, Icon, count]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold ${tab === id ? 'bg-[var(--tenant-surface)] text-[var(--tenant-primary)]' : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'}`}><Icon size={16} />{label}<span className="rounded-full bg-[var(--crm-panel)] px-1.5 text-[10px]">{count}</span></button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-6 kanban-scroll-hidden">
              {tab === 'application' ? (
                <ReceivedApplicationReview sections={receivedApplicationSections} values={receivedApplicationValues} />
              ) : loading ? <Empty kind="loading" text="Loading lead history…" /> : tab === 'activity' ? (
                activity.length ? <div className="space-y-1">{activity.map((item) => <TimelineRow key={item.id} title={item.title} detail={item.detail} at={item.at} kind={item.icon} />)}</div> : <Empty kind="activity" text="No activity has been recorded for this lead yet." />
              ) : tab === 'notes' ? (
                notes.length ? <div className="space-y-3">{notes.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-4"><p className="text-sm leading-6 text-[var(--crm-text)]">{noteText(item.content)}</p><p className="mt-2 text-[11px] text-[var(--crm-muted)]">{activityDate(item.createdAt)}</p></article>)}</div> : <Empty kind="notes" text="No notes yet. Add context the next person can act on." />
              ) : tasks.length ? (
                <div className="space-y-3">{tasks.map((task) => <article key={task.id} className="flex items-start gap-3 rounded-2xl border border-[var(--crm-border)] p-4"><CheckCircle2 size={18} className={task.status === 'completed' ? 'text-emerald-500' : 'text-[var(--crm-muted)]'} /><div className="min-w-0 flex-1"><p className="font-semibold text-[var(--crm-text)]">{task.title}</p><p className="mt-1 text-xs text-[var(--crm-muted)]">Due {activityDate(task.dueAt)}</p></div><span className="rounded-full bg-[var(--crm-panel)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--crm-muted)]">{task.priority}</span></article>)}</div>
              ) : <Empty kind="tasks" text="No follow-up tasks. Create one to make the next action explicit." />}
            </div>
          </main>
        </div>

        {composer === 'note' && (
          <ComposerDialog
            title="Add note"
            description="Capture an update, conversation, or decision for this lead."
            icon={<MessageSquare size={18} />}
            onCancel={() => setComposer(null)}
            onSave={() => void saveNote()}
            saving={saving}
            saveDisabled={!note.trim()}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Note</span>
              <textarea autoFocus rows={5} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record a useful update, conversation, or decision…" className={`${inputClass} min-h-32 resize-y`} />
              <span className="mt-1.5 block text-right text-[10px] text-[var(--crm-muted)]">{note.length}/2000</span>
            </label>
          </ComposerDialog>
        )}

        {composer === 'task' && (
          <ComposerDialog
            title="Create follow-up task"
            description="Set a clear next action and when it needs attention."
            icon={<ClipboardCheck size={18} />}
            onCancel={() => setComposer(null)}
            onSave={() => void saveTask()}
            saving={saving}
            saveDisabled={!taskTitle.trim() || !taskDueAt}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Task</span><input autoFocus maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Call parent about missing documents" className={inputClass} /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Due date and time</span><input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} className={inputClass} /></label>
              <label><span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Priority</span><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as CrmLeadTask['priority'])} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            </div>
          </ComposerDialog>
        )}

        {composer === 'call' && (
          <ComposerDialog
            title="Log call"
            description="Save the call outcome and notes to the authoritative lead activity history."
            icon={<Phone size={18} />}
            onCancel={() => setComposer(null)}
            onSave={() => void saveCall()}
            saving={saving}
            saveDisabled={!callOutcome}
          >
            <div className="grid gap-4">
              <label><span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Outcome</span><select value={callOutcome} onChange={(event) => setCallOutcome(event.target.value)} className={inputClass}><option value="connected">Connected</option><option value="not-answered">Not answered</option><option value="wrong-number">Wrong number</option><option value="callback-requested">Callback requested</option></select></label>
              <label><span className="mb-2 block text-xs font-semibold text-[var(--crm-muted)]">Call notes</span><textarea rows={4} maxLength={2000} value={callNotes} onChange={(event) => setCallNotes(event.target.value)} className={`${inputClass} resize-y`} placeholder="What was discussed?" /></label>
            </div>
          </ComposerDialog>
        )}

        {applicationAction === 'send' && (
          <ComposerDialog
            title="Send application"
            description="Send the published form and a one-time verification code to this applicant."
            icon={<Send size={18} />}
            onCancel={() => setApplicationAction(null)}
            onSave={() => void sendApplication('whatsapp')}
            saving={applicationBusy !== null}
            saveDisabled={!applicationForm}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={applicationBusy !== null || !applicationForm} onClick={() => void sendApplication('whatsapp')} className="rounded-lg border border-[var(--crm-border)] p-4 text-left hover:bg-[var(--crm-panel)] disabled:opacity-40"><span className="block text-sm font-bold">WhatsApp</span><span className="mt-1 block text-xs text-[var(--crm-muted)]">{lead.whatsapp || lead.phone || 'No number available'}</span></button>
              <button type="button" disabled={applicationBusy !== null || !applicationForm} onClick={() => void sendApplication('sms')} className="rounded-lg border border-[var(--crm-border)] p-4 text-left hover:bg-[var(--crm-panel)] disabled:opacity-40"><span className="block text-sm font-bold">SMS</span><span className="mt-1 block text-xs text-[var(--crm-muted)]">{lead.phone || 'No number available'}</span></button>
            </div>
          </ComposerDialog>
        )}

        {applicationAction === 'offline' && applicationForm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label="Fill application for applicant">
            <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white text-black shadow-2xl">
              <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4"><div><h2 className="font-bold">{applicationForm.name}</h2><p className="text-xs text-neutral-500">Offline entry for {lead.name}</p></div><button type="button" onClick={() => setApplicationAction(null)} className="p-2" aria-label="Close"><X size={19} /></button></header>
              <div className="overflow-y-auto p-5"><PublishedApplicationForm schema={applicationForm.schema} initialValues={{ name: lead.name, email: lead.email, phone: lead.phone, whatsapp: lead.whatsapp }} submitLabel="Submit application" onUpload={onUploadApplicationFile} onSubmit={onSubmitOfflineApplication} /></div>
            </section>
          </div>
        )}

        {lead.status === 'application-status' && !editing && (
          <section aria-label="Application decision" className="shrink-0 border-t border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--crm-text)]">Management decision</p>
                <p className="mt-1 text-xs text-[var(--crm-muted)]">Approve starts Admission Desk onboarding. Rejected and held applications remain available in the outcome register.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={!canMoveLeadStage || decisionBusy !== null} onClick={() => void decideApplication('accept')} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                  {decisionBusy === 'accept' ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={16} />}Approve
                </button>
                <button type="button" disabled={!canDeleteLead || decisionBusy !== null} onClick={() => setRejectOpen(true)} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                  <Archive size={16} />Reject
                </button>
                <button type="button" disabled={!canHoldLead || decisionBusy !== null || lead.globalStatus === 'on_hold'} onClick={() => void decideApplication('hold')} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                  {decisionBusy === 'hold' ? <LoaderCircle size={15} className="animate-spin" /> : <PauseCircle size={16} />}{lead.globalStatus === 'on_hold' ? 'On hold' : 'Hold'}
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
          {lead.status === 'qualified' && (applicationForm ? <><button type="button" onClick={() => setApplicationAction('send')} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white"><Send size={15} />Send application</button><button type="button" onClick={() => setApplicationAction('offline')} className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border)] px-4 py-2.5 text-sm font-semibold"><FileText size={15} />Fill offline</button></> : <p role="status" className="max-w-md text-xs leading-5 text-amber-700">Publish an Application form in Admissions Settings before sending or entering an application.</p>)}
          {lead.status !== 'application' && (editing ? <button type="button" onClick={saveEdits} className="inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white"><Save size={15} />Save changes</button> : <button type="button" disabled={!canUpdateLead || !formSections.length} onClick={() => { setEditValues(formValues); setEditing(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Pencil size={15} />Edit</button>)}
          {lead.status === 'application' && (
            <button
              type="button"
              disabled={!canMoveLeadStage || missingRequiredApplicationFields.length > 0}
              onClick={() => void onCompleteApplicationReview(lead)}
              aria-label="Complete review"
              title={missingRequiredApplicationFields.length ? `${missingRequiredApplicationFields.length} required field(s) are missing` : 'Complete review'}
              className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileCheck2 size={18} />
            </button>
          )}
          <button type="button" disabled={!canUpdateLead} onClick={() => { setComposer('note'); setTab('notes'); }} aria-label="Add note" title="Add note" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--crm-border)] hover:bg-[var(--crm-panel)] disabled:opacity-40"><MessageSquare size={18} /></button>
          <button type="button" disabled={!canLogCall} onClick={() => { setComposer('call'); setTab('activity'); }} aria-label="Log call" title="Log call" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--crm-border)] hover:bg-[var(--crm-panel)] disabled:opacity-40"><Phone size={18} /></button>
          <button type="button" disabled={!canUpdateLead} onClick={() => { setComposer('task'); setTab('tasks'); }} aria-label="Add task" title="Add task" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--crm-border)] hover:bg-[var(--crm-panel)] disabled:opacity-40"><Plus size={18} /></button>
          <button type="button" disabled={!canTransferLead} onClick={() => onTransferLead(lead)} aria-label="Transfer card" title="Transfer card" className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--crm-border)] hover:bg-[var(--crm-panel)] disabled:opacity-40"><ArrowRightLeft size={18} /></button>
          {canDeleteLead && lead.status !== 'archived' && <button type="button" onClick={() => setRejectOpen(true)} aria-label="Reject lead" title="Reject lead" className="grid h-11 w-11 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"><Archive size={18} /></button>}
          {canDeleteLead && lead.status === 'archived' && <button type="button" onClick={() => setRestoreOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><ArrowLeft size={16} />Restore lead</button>}
          {canDeleteLead && <button type="button" onClick={() => setDeleteOpen(true)} aria-label="Delete lead" title="Delete lead" className="grid h-11 w-11 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={18} /></button>}
          <button type="button" onClick={requestClose} className="ml-auto rounded-xl border border-[var(--crm-border)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--crm-panel)]">Close</button>
        </footer>

        {deleteOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={`Delete ${lead.name}`}>
            <section className="w-full max-w-md overflow-hidden rounded-xl bg-white text-black shadow-2xl">
              <header className="flex items-start gap-3 border-b border-neutral-200 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Trash2 size={19} /></span>
                <div><h2 className="font-bold">Delete {lead.name}?</h2><p className="mt-1 text-xs leading-5 text-neutral-500">The lead will leave the pipeline. The actor, reason, timestamp, and lead snapshot remain in the audit log.</p></div>
              </header>
              <div className="p-5">
                <label className="block text-xs font-semibold text-neutral-700">Deletion reason<textarea autoFocus rows={3} maxLength={500} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Why is this lead being deleted?" className="mt-2 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-rose-500" /></label>
              </div>
              <footer className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4">
                <button type="button" disabled={deleteBusy} onClick={() => { setDeleteOpen(false); setDeleteReason(''); }} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold">Cancel</button>
                <button type="button" disabled={deleteBusy || deleteReason.trim().length < 3} onClick={async () => { setDeleteBusy(true); try { await onDeleteLead(lead, deleteReason.trim()); } finally { setDeleteBusy(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{deleteBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}Delete lead</button>
              </footer>
            </section>
          </div>
        )}
        {rejectOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={`Reject ${lead.name}`}>
            <section className="w-full max-w-md overflow-hidden rounded-xl bg-white text-black shadow-2xl">
              <header className="flex items-start gap-3 border-b border-neutral-200 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Archive size={19} /></span><div><h2 className="font-bold">Reject {lead.name}?</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Choose a rejection reason. It will be retained in the lead&apos;s history.</p></div></header>
              <div className="p-5"><label className="block text-xs font-semibold text-neutral-700">Rejection reason<select autoFocus value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-500"><option value="">Select a reason</option>{REJECTION_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label></div>
              <footer className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4"><button type="button" disabled={rejectBusy} onClick={() => { setRejectOpen(false); setRejectionReason(''); }} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" disabled={rejectBusy || !rejectionReason} onClick={async () => { setRejectBusy(true); try { await onRejectLead(lead, rejectionReason); setRejectOpen(false); setRejectionReason(''); } finally { setRejectBusy(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{rejectBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Archive size={15} />}Reject lead</button></footer>
            </section>
          </div>
        )}
        {restoreOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={`Restore ${lead.name}`}>
            <section className="w-full max-w-md overflow-hidden rounded-xl bg-white text-black shadow-2xl">
              <header className="flex items-start gap-3 border-b border-neutral-200 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><ArrowLeft size={19} /></span><div><h2 className="font-bold">Restore {lead.name}</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Choose where to return this lead and record why it is being recovered.</p></div></header>
              <div className="space-y-4 p-5"><label className="block text-xs font-semibold text-neutral-700">Restore to stage<select value={restoreStage} onChange={(event) => setRestoreStage(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="enquiry">Enquiry</option><option value="contact_attempted">Contact Attempted</option><option value="contacted">Contacted</option><option value="nurture">Nurture</option><option value="qualified">Qualified</option><option value="application">Application</option><option value="application_status">Application Status</option><option value="offer_status">Offer Status</option></select></label><label className="block text-xs font-semibold text-neutral-700">Recovery reason<textarea autoFocus rows={3} maxLength={500} value={restoreReason} onChange={(event) => setRestoreReason(event.target.value)} placeholder="Why is this lead being restored?" className="mt-2 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" /></label></div>
              <footer className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4"><button type="button" disabled={restoreBusy} onClick={() => { setRestoreOpen(false); setRestoreReason(''); }} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" disabled={restoreBusy || restoreReason.trim().length < 3} onClick={async () => { setRestoreBusy(true); try { await onRestoreLead(lead, restoreStage, restoreReason.trim()); setRestoreOpen(false); setRestoreReason(''); } finally { setRestoreBusy(false); } }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{restoreBusy ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowLeft size={15} />}Restore lead</button></footer>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function reviewValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.originalFilename ?? record.fileName ?? record.name ?? record.secureUrl ?? record.url ?? 'Uploaded document');
  }
  return String(value ?? '').trim();
}

function reviewFileUrl(value: unknown) {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) return value;
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  const url = record.secureUrl ?? record.secure_url ?? record.url;
  return typeof url === 'string' ? url : '';
}

function ReceivedApplicationReview({ sections, values }: { sections: PublishedSection[]; values: Record<string, unknown> }) {
  const [activeSection, setActiveSection] = useState(0);
  const section = sections[activeSection];
  const allFields = sections.flatMap((item) => item.fields);
  const requiredFields = allFields.filter((field) => field.required);
  const suppliedRequired = requiredFields.filter((field) => applicationValuePresent(values[fieldKey(field)])).length;

  if (!sections.length) return (
    <div className="flex min-h-80 flex-col items-center justify-center text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700"><FileCheck2 size={21} /></span>
      <h3 className="font-bold text-[var(--crm-text)]">Application schema unavailable</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--crm-muted)]">The submission was received, but its published application form is not available for structured review.</p>
    </div>
  );

  return (
    <div className="min-h-full">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--crm-border)] pb-5">
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Received application</p><h3 className="mt-1 text-lg font-bold text-[var(--crm-text)]">Review submitted information</h3><p className="mt-1 text-xs text-[var(--crm-muted)]">Check each section and supporting document before moving the application forward.</p></div>
        <div className="text-right"><p className="text-sm font-bold text-[var(--crm-text)]">{suppliedRequired}/{requiredFields.length}</p><p className="text-[10px] uppercase tracking-wide text-[var(--crm-muted)]">required fields received</p></div>
      </header>

      <div className="grid gap-6 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Submitted application sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((item, index) => {
            const required = item.fields.filter((field) => field.required);
            const complete = required.filter((field) => applicationValuePresent(values[fieldKey(field)])).length;
            return <button key={`${item.section}-${index}`} type="button" onClick={() => setActiveSection(index)} className={`flex min-w-48 items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors lg:min-w-0 ${activeSection === index ? 'bg-[var(--tenant-primary)] text-white' : 'bg-[var(--crm-panel)] text-[var(--crm-text)] hover:bg-[var(--tenant-surface)]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${activeSection === index ? 'bg-white/15' : 'bg-[var(--crm-card)]'}`}>{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.section}</strong><span className={`mt-0.5 block text-[10px] ${activeSection === index ? 'text-white/70' : 'text-[var(--crm-muted)]'}`}>{required.length ? `${complete}/${required.length} required` : `${item.fields.length} fields`}</span></span></button>;
          })}
        </nav>

        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--crm-border)] pb-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--crm-muted)]">Section {activeSection + 1} of {sections.length}</p><h4 className="mt-1 font-bold text-[var(--crm-text)]">{section.section}</h4></div><FileCheck2 size={20} className="text-[var(--tenant-primary)]" /></div>
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {section.fields.map((field) => {
              const key = fieldKey(field); const value = values[key]; const shown = reviewValue(value); const fileUrl = reviewFileUrl(value); const missing = !applicationValuePresent(value);
              return <div key={key} className={`border-b border-[var(--crm-border)] py-4 ${field.type.toLowerCase().includes('address') || field.type.toLowerCase().includes('paragraph') ? 'sm:col-span-2' : ''}`}><dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--crm-muted)]">{field.label}{field.required && <span className="text-rose-500">*</span>}</dt><dd className={`mt-1.5 break-words text-sm font-medium leading-6 ${missing ? 'text-amber-700' : 'text-[var(--crm-text)]'}`}>{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-[var(--tenant-primary)] hover:underline"><FileText size={15} />{shown}</a> : shown || 'Not provided'}</dd></div>;
            })}
          </dl>
          <footer className="mt-5 flex items-center justify-between gap-3"><button type="button" disabled={activeSection === 0} onClick={() => setActiveSection((current) => Math.max(0, current - 1))} className="inline-flex items-center gap-2 rounded-lg border border-[var(--crm-border)] px-3 py-2 text-xs font-semibold disabled:opacity-35"><ArrowLeft size={14} />Previous</button><button type="button" disabled={activeSection === sections.length - 1} onClick={() => setActiveSection((current) => Math.min(sections.length - 1, current + 1))} className="inline-flex items-center gap-2 rounded-lg bg-[var(--tenant-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-35">Next section<ArrowRight size={14} /></button></footer>
        </section>
      </div>
    </div>
  );
}

function PublishedFieldValue({ field, value }: { field: PublishedField; value: string }) {
  const shown = value === 'true' ? 'Yes' : value === 'false' ? 'No' : value || 'Not provided';
  const kind = field.type.toLowerCase();
  const content = kind.includes('email') && value
    ? <a href={`mailto:${value}`} className="break-all text-[var(--tenant-primary)] hover:underline">{shown}</a>
    : kind.includes('phone') && value
      ? <a href={`tel:${value}`} className="break-all text-[var(--tenant-primary)] hover:underline">{shown}</a>
      : <span className="break-words">{shown}</span>;
  return <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--crm-muted)]">{field.label}</p><div className="text-sm font-medium leading-5 text-[var(--crm-text)]">{content}</div></div>;
}

function PublishedFieldInput({ field, value, onChange, inputClass }: {
  field: PublishedField; value: string; onChange: (value: string) => void; inputClass: string;
}) {
  const kind = field.type.toLowerCase();
  const isSourceField = `${fieldKey(field)} ${field.label}`.toLowerCase().includes('source');
  const label = <span className="mb-1 block text-[11px] font-semibold text-[var(--crm-muted)]">{field.label}{field.required ? ' *' : ''}</span>;
  if (isSourceField) {
    return <label>{label}<select required={field.required} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">Select lead source</option>{LEAD_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}</select></label>;
  }
  if (kind.includes('checkbox') || kind.includes('consent')) {
    return <label className="flex items-center gap-2 rounded-xl border border-[var(--crm-border)] p-3 text-xs font-semibold text-[var(--crm-text)]"><input type="checkbox" checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} />{field.label}</label>;
  }
  if (kind.includes('dropdown') || kind.includes('radio')) {
    return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  }
  if (kind.includes('paragraph') || kind.includes('address')) {
    return <label>{label}<textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} resize-y`} /></label>;
  }
  const type = kind.includes('email') ? 'email' : kind.includes('phone') ? 'tel' : kind === 'date' ? 'date' : kind.includes('number') || kind.includes('currency') ? 'number' : 'text';
  return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function Detail({ label, value, icon, href }: { label: string; value: string; icon?: React.ReactNode; href?: string }) {
  const content = <span className="flex items-center gap-2 text-sm font-medium text-[var(--crm-text)]">{icon}{value || 'Not provided'}</span>;
  return <div><p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--crm-muted)]">{label}</p>{href && value ? <a href={href} className="hover:text-[var(--tenant-primary)]">{content}</a> : content}</div>;
}

function Empty({ text, kind }: { text: string; kind: 'loading' | 'activity' | 'notes' | 'tasks' }) {
  const Icon = kind === 'loading' ? LoaderCircle : kind === 'notes' ? MessageSquare : kind === 'tasks' ? ClipboardCheck : CalendarClock;
  return <div className="flex min-h-56 flex-col items-center justify-center text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)]"><Icon size={20} className={kind === 'loading' ? 'animate-spin' : ''} /></span><p className="max-w-sm text-sm leading-6 text-[var(--crm-muted)]">{text}</p></div>;
}

function ComposerDialog({ title, description, icon, children, onCancel, onSave, saving, saveDisabled }: {
  title: string; description: string; icon: React.ReactNode; children: React.ReactNode;
  onCancel: () => void; onSave: () => void; saving: boolean; saveDisabled: boolean;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]" onMouseDown={(event) => { if (event.currentTarget === event.target && !saving) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
          <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)]">{icon}</span><div><h3 className="font-bold text-[var(--crm-text)]">{title}</h3><p className="mt-1 text-xs leading-5 text-[var(--crm-muted)]">{description}</p></div></div>
          <button type="button" disabled={saving} onClick={onCancel} aria-label={`Close ${title}`} className="rounded-lg p-1.5 text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] disabled:opacity-40"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-[var(--crm-border)] bg-[var(--crm-panel)] px-5 py-4">
          <button type="button" disabled={saving} onClick={onCancel} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Cancel</button>
          <button type="button" disabled={saving || saveDisabled} onClick={onSave} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{saving && <LoaderCircle size={15} className="animate-spin" />}{saving ? 'Saving…' : 'Save'}</button>
        </footer>
      </section>
    </div>
  );
}

function TimelineRow({ title, detail, at, kind }: { title: string; detail: string; at: string; kind: 'stage' | 'note' | 'call' | 'task' }) {
  const Icon = kind === 'note' ? MessageSquare : kind === 'call' ? Phone : kind === 'task' ? ClipboardCheck : CalendarClock;
  return <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-[var(--crm-border)] py-4 last:border-0"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tenant-surface)] text-[var(--tenant-primary)]"><Icon size={15} /></span><div><p className="text-sm font-semibold text-[var(--crm-text)]">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--crm-muted)]">{detail}</p></div><time className="text-[11px] text-[var(--crm-muted)]">{activityDate(at)}</time></div>;
}
