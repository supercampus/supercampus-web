'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  Archive, CalendarClock, Check, CheckCircle2, ClipboardCheck, FileText, LoaderCircle,
  MessageSquare, PauseCircle, Pencil, Plus, Save, UserRound, X,
} from 'lucide-react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS } from '@/lib/kanban/kanban-data';
import type { CrmForm, CrmLeadTask, CrmLeadTimeline } from '@/lib/crm-api';
import { addCrmLeadNote, addCrmLeadTask, getCrmLeadTimeline } from '@/lib/crm-api';

interface LeadDetailSidebarProps {
  lead: Lead;
  onClose: () => void;
  onApplicationDecision: (lead: Lead, decision: 'accept' | 'deny' | 'hold') => Promise<void>;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onShowToast: (message: string) => void;
  canUpdateLead: boolean;
  canMoveLeadStage: boolean;
  canHoldLead: boolean;
  leadForm?: CrmForm | null;
}

type WorkspaceTab = 'activity' | 'notes' | 'tasks';
type PublishedField = { key?: string; label: string; type: string; required?: boolean; options?: string[] };
type PublishedSection = { section: string; fields: PublishedField[] };

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
  lead, onClose, onApplicationDecision, onUpdate, onShowToast,
  canUpdateLead, canMoveLeadStage, canHoldLead, leadForm,
}: LeadDetailSidebarProps) {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<WorkspaceTab>('activity');
  const [editing, setEditing] = useState(false);
  const [composer, setComposer] = useState<'note' | 'task' | null>(null);
  const [timeline, setTimeline] = useState<CrmLeadTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState<'accept' | 'deny' | 'hold' | null>(null);
  const [note, setNote] = useState('');
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
  const [editValues, setEditValues] = useState<Record<string, string>>({});

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
    const taskItems = tasks.map((item) => ({
      id: `task-${item.id}`, at: item.createdAt, icon: 'task' as const,
      title: 'Task created', detail: `${item.title} · due ${activityDate(item.dueAt)}`,
    }));
    return [...stageItems, ...noteItems, ...taskItems]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [notes, tasks, timeline]);

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
    const intake = valueFor(['intake']) ?? lead.intake;
    const city = valueFor(['city']) ?? lead.city;
    const parentName = valueFor(['parent name', 'guardian name']) ?? lead.parent.name;
    const parentPhone = valueFor(['parent phone', 'guardian phone']) ?? lead.parent.phone;
    const existingValues = lead.customFields?.values && typeof lead.customFields.values === 'object'
      ? lead.customFields.values as Record<string, unknown>
      : {};
    onUpdate(lead.id, {
      name, phone, email, whatsapp, course, intake, city,
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
      <section role="dialog" aria-modal="true" aria-label={`${lead.name} details`} className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-2xl transition-transform duration-300 ease-out lg:w-1/2 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--tenant-primary)] font-bold text-white">{lead.initials}</div>
            <div className="min-w-0"><h2 className="truncate text-lg font-bold text-[var(--crm-text)]">{lead.name}</h2><p className="text-xs text-[var(--crm-muted)]">Lead workspace · {lead.id.slice(0, 8)}</p></div>
          </div>
          <button type="button" onClick={requestClose} aria-label="Close lead details" className="rounded-xl p-2 text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]"><X size={21} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto bg-[var(--crm-panel)] p-4 xl:grid-cols-[minmax(250px,0.42fr)_minmax(300px,0.58fr)] xl:overflow-hidden">
          <aside className="overflow-y-auto rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 kanban-scroll-hidden">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Pipeline stage</p><div className="mt-2 flex flex-wrap gap-2"><span className="inline-flex rounded-full bg-[var(--tenant-surface)] px-3 py-1 text-xs font-bold text-[var(--tenant-primary)]">{currentStage}</span>{lead.globalStatus === 'on_hold' && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"><PauseCircle size={12} />On hold</span>}</div></div>
              <span className="rounded-lg border border-[var(--crm-border)] px-2 py-1 text-[10px] font-semibold text-[var(--crm-muted)]">{lead.assignedTo.name === 'Unassigned' ? 'Unassigned' : 'Owned'}</span>
            </div>

            <div className="mb-5 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--crm-muted)]">Card owner</p>
              <p className="mt-1.5 flex items-center gap-2 break-all text-xs font-semibold text-[var(--crm-text)]"><UserRound size={14} className="shrink-0" />{lead.assignedTo.name}</p>
            </div>

            {formSections.length ? (
              <div className="space-y-5">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--tenant-primary)]">Published form</p><p className="mt-1 truncate text-sm font-bold text-[var(--crm-text)]">{leadForm?.name}</p></div>
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
          </aside>

          <main className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)]">
            <nav className="flex shrink-0 gap-1 border-b border-[var(--crm-border)] px-4 pt-3">
              {([
                ['activity', 'Activity', CalendarClock, activity.length],
                ['notes', 'Notes', FileText, notes.length],
                ['tasks', 'Tasks', ClipboardCheck, tasks.length],
              ] as const).map(([id, label, Icon, count]) => (
                <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold ${tab === id ? 'bg-[var(--tenant-surface)] text-[var(--tenant-primary)]' : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'}`}><Icon size={16} />{label}<span className="rounded-full bg-[var(--crm-panel)] px-1.5 text-[10px]">{count}</span></button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto p-6 kanban-scroll-hidden">
              {loading ? <Empty kind="loading" text="Loading lead history…" /> : tab === 'activity' ? (
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

        {lead.status === 'application-status' && !editing && (
          <section aria-label="Application decision" className="shrink-0 border-t border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--crm-text)]">Application decision</p>
                <p className="mt-1 text-xs text-[var(--crm-muted)]">Accept advances to Offer / Status, Deny archives the lead, and Hold keeps it here.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={!canMoveLeadStage || decisionBusy !== null} onClick={() => void decideApplication('accept')} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                  {decisionBusy === 'accept' ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={16} />}Accept
                </button>
                <button type="button" disabled={!canMoveLeadStage || decisionBusy !== null} onClick={() => void decideApplication('deny')} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                  {decisionBusy === 'deny' ? <LoaderCircle size={15} className="animate-spin" /> : <Archive size={16} />}Deny
                </button>
                <button type="button" disabled={!canHoldLead || decisionBusy !== null || lead.globalStatus === 'on_hold'} onClick={() => void decideApplication('hold')} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                  {decisionBusy === 'hold' ? <LoaderCircle size={15} className="animate-spin" /> : <PauseCircle size={16} />}{lead.globalStatus === 'on_hold' ? 'On hold' : 'Hold'}
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-4">
          {editing ? <button type="button" onClick={saveEdits} className="inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white"><Save size={15} />Save changes</button> : <button type="button" disabled={!canUpdateLead || !formSections.length} onClick={() => { setEditValues(formValues); setEditing(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Pencil size={15} />Edit</button>}
          <button type="button" disabled={!canUpdateLead} onClick={() => { setComposer('note'); setTab('notes'); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border)] px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><MessageSquare size={15} />Add note</button>
          <button type="button" disabled={!canUpdateLead} onClick={() => { setComposer('task'); setTab('tasks'); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border)] px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><Plus size={15} />Add task</button>
          <button type="button" onClick={requestClose} className="ml-auto rounded-xl border border-[var(--crm-border)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--crm-panel)]">Close</button>
        </footer>
      </section>
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
  const label = <span className="mb-1 block text-[11px] font-semibold text-[var(--crm-muted)]">{field.label}{field.required ? ' *' : ''}</span>;
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

function TimelineRow({ title, detail, at, kind }: { title: string; detail: string; at: string; kind: 'stage' | 'note' | 'task' }) {
  const Icon = kind === 'note' ? MessageSquare : kind === 'task' ? ClipboardCheck : CalendarClock;
  return <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-[var(--crm-border)] py-4 last:border-0"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tenant-surface)] text-[var(--tenant-primary)]"><Icon size={15} /></span><div><p className="text-sm font-semibold text-[var(--crm-text)]">{title}</p><p className="mt-1 text-xs leading-5 text-[var(--crm-muted)]">{detail}</p></div><time className="text-[11px] text-[var(--crm-muted)]">{activityDate(at)}</time></div>;
}
