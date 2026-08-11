'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  IdCard,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  runGuards,
  stageById,
  type ActionKind,
  type OnboardingCase,
} from '@supercampus/application-desk';
import { useApp } from '@/lib/context';
import { applicationDeskCapabilities, hasPermission } from '@/lib/staff-access';
import {
  DEMO_APPLICANT_NAMES,
  actOnCase,
  loadDesk,
  resetDemoDesk,
  type DeskSnapshot,
} from '@/lib/application-desk-api';

type QueueKey = keyof DeskSnapshot['queues'];

const QUEUES: Array<{ key: QueueKey; label: string }> = [
  { key: 'new', label: 'New' },
  { key: 'pendingVerification', label: 'Identity' },
  { key: 'documentsPending', label: 'Documents' },
  { key: 'academicPending', label: 'Academic' },
  { key: 'financePending', label: 'Finance' },
  { key: 'approvalPending', label: 'Approval' },
  { key: 'readyForActivation', label: 'Ready' },
  { key: 'activated', label: 'Activated' },
  { key: 'onHold', label: 'On hold' },
  { key: 'rejected', label: 'Closed' },
  { key: 'failed', label: 'Failed' },
];

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

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-[var(--tenant-primary)]/12 text-[var(--tenant-primary)]',
  ON_HOLD: 'bg-amber-500/15 text-amber-600',
  RETURNED: 'bg-amber-500/15 text-amber-600',
  COMPLETED: 'bg-emerald-500/15 text-emerald-600',
  FAILED: 'bg-rose-500/15 text-rose-600',
  REJECTED: 'bg-rose-500/15 text-rose-600',
  CANCELLED: 'bg-rose-500/15 text-rose-600',
  WITHDRAWN: 'bg-rose-500/15 text-rose-600',
  EXPIRED: 'bg-rose-500/15 text-rose-600',
};

function applicantName(onboarding: OnboardingCase) {
  return DEMO_APPLICANT_NAMES[onboarding.applicantId] ?? onboarding.applicantId;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Clock }) {
  return (
    <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4">
      <Icon size={16} className="text-[var(--tenant-primary)]" />
      <p className="mt-3 text-2xl text-[var(--crm-text)]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--crm-muted)]">{label}</p>
    </div>
  );
}

/**
 * Dev-only escape hatch. There is no backend in local development, so no staff
 * session can exist and the desk would be permanently unreachable. When — and
 * only when — this is a development build, there is no session, and the data
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
    <section className="flex-1 overflow-y-auto kanban-scroll-hidden bg-[var(--crm-panel)] p-6">{children}</section>
  ) : (
    <main className="min-h-screen bg-[var(--crm-panel)] p-6">{children}</main>
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
  const [queue, setQueue] = useState<QueueKey | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'documents' | 'academic' | 'approvals' | 'activity'>('overview');

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
        setLoadError(error instanceof Error ? error.message : 'Unable to load the Application Desk');
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
  const selected = cases.find((entry) => entry.id === selectedId) ?? null;

  const visible = useMemo(
    () => (queue === 'all' ? cases : cases.filter((entry) => queueMatches(entry, queue))),
    [cases, queue],
  );

  /** Why `advance` is currently refused — shown before the operator clicks. */
  const blockedReason = useMemo(() => {
    if (!snapshot || !selected || selected.status !== 'ACTIVE') return null;
    const stage = stageById(snapshot.definition, selected.stage);
    if (!stage) return null;
    const guard = runGuards(selected, snapshot.definition, stage.guards);
    return guard.ok ? null : guard.reason ?? 'Stage guards failed';
  }, [selected, snapshot]);

  const actorName = student?.name ?? 'officer';
  const source = snapshot?.source;
  const selectedCaseId = selected?.id;

  const act = useCallback(
    async (action: ActionKind, reason?: string) => {
      if (!source || !selectedCaseId) return;
      setBusy(true);
      setActionError(null);
      try {
        const result = await actOnCase({ caseId: selectedCaseId, action, actor: actorName, reason }, source);
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

  if (authStatus === 'checking' || (mayLoad && !snapshot && !loadError)) {
    return (
      <DeskShell embedded={embedded}>
        <p className="grid min-h-[40vh] place-items-center text-sm text-[var(--crm-muted)]">Loading the desk…</p>
      </DeskShell>
    );
  }

  if (!canView) {
    return (
      <DeskShell embedded={embedded}>
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-6 text-center">
          <ShieldCheck size={22} className="mx-auto text-[var(--crm-muted)]" />
          <h1 className="mt-3 text-lg text-[var(--crm-text)]">Application Desk</h1>
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
          <h1 className="mt-3 text-lg text-[var(--crm-text)]">Application Desk could not load</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--crm-muted)]">{loadError}</p>
          <button type="button" onClick={refresh} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white">
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </DeskShell>
    );
  }

  const completedToday = cases.filter((entry) => entry.status === 'COMPLETED').length;

  return (
    <DeskShell embedded={embedded}>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-[var(--crm-muted)]">Admissions</p>
            <h1 className="mt-2 text-2xl text-[var(--crm-text)]">Application Desk</h1>
            <p className="mt-1 text-xs text-[var(--crm-muted)]">
              Confirmed admissions become SuperCampus students here — identity, documents, mapping, approval, then
              provisioning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* When the banner is up it already says this; badge is for a signed-in user. */}
            {snapshot?.source === 'demo' && !demoAccess && (
              <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] text-amber-600">
                Demo data — onboarding API not connected
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (snapshot?.source === 'demo') resetDemoDesk();
                refresh();
              }}
              className="flex items-center gap-2 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs text-[var(--crm-text)]"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </header>

        {demoAccess && (
          <p className="flex items-start gap-2 rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              <strong>Demo mode — no signed-in user.</strong> This development build has no backend session, so the desk
              is showing seeded cases with all Application Desk permissions granted. Nothing here is a real applicant,
              and this branch does not exist in a production build.
            </span>
          </p>
        )}

        {loadError && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{loadError}</p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Awaiting onboarding" value={cases.filter((c) => c.status === 'ACTIVE').length} icon={Clock} />
          <Metric label="Documents pending" value={snapshot?.queues.documentsPending ?? 0} icon={FileText} />
          <Metric label="Approvals pending" value={snapshot?.queues.approvalPending ?? 0} icon={ShieldCheck} />
          <Metric label="Students activated" value={completedToday} icon={GraduationCap} />
        </section>

        <div className="flex flex-wrap gap-2">
          <QueueChip label="All" count={cases.length} active={queue === 'all'} onClick={() => setQueue('all')} />
          {QUEUES.map((entry) => (
            <QueueChip
              key={entry.key}
              label={entry.label}
              count={snapshot?.queues[entry.key] ?? 0}
              active={queue === entry.key}
              onClick={() => setQueue(entry.key)}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_auto] bg-[var(--crm-surface)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
              <span>Applicant</span>
              <span>Stage</span>
              <span>Status</span>
              <span />
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {visible.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-[var(--crm-muted)]">No cases in this queue.</p>
              )}
              {visible.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={`grid w-full grid-cols-[1.3fr_1fr_1fr_auto] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs transition hover:bg-[var(--crm-surface)] ${
                    entry.id === selectedId ? 'bg-[var(--crm-surface)]' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[var(--crm-text)]">{applicantName(entry)}</span>
                    <span className="block truncate text-[10px] text-[var(--crm-muted)]">{entry.id}</span>
                  </span>
                  <span className="text-[var(--crm-muted)]">
                    {(snapshot && stageById(snapshot.definition, entry.stage)?.label) ?? entry.stage}
                  </span>
                  <span>
                    <span className={`rounded-full px-2 py-1 text-[10px] ${STATUS_TONE[entry.status] ?? ''}`}>
                      {entry.status}
                    </span>
                  </span>
                  <ChevronRight size={14} className="text-[var(--crm-muted)]" />
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
            {!selected && (
              <p className="py-16 text-center text-sm text-[var(--crm-muted)]">
                Select a case to review its onboarding record.
              </p>
            )}

            {selected && snapshot && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg text-[var(--crm-text)]">{applicantName(selected)}</h2>
                  <p className="text-[11px] text-[var(--crm-muted)]">
                    {selected.id} · admission {selected.admissionId}
                  </p>
                </div>

                <ol className="flex flex-wrap gap-1">
                  {STAGE_RAIL.map((stage) => {
                    const currentIndex = STAGE_RAIL.findIndex((s) => s.id === selected.stage);
                    const index = STAGE_RAIL.findIndex((s) => s.id === stage.id);
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    return (
                      <li
                        key={stage.id}
                        className={`rounded-md px-2 py-1 text-[9px] uppercase tracking-wide ${
                          active
                            ? 'bg-[var(--tenant-primary)] text-white'
                            : done
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'
                        }`}
                      >
                        {stage.short}
                      </li>
                    );
                  })}
                </ol>

                {blockedReason && (
                  <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
                    <AlertTriangle size={14} className="mt-px shrink-0" />
                    <span>{blockedReason}</span>
                  </p>
                )}
                {actionError && (
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-600">
                    {actionError}
                  </p>
                )}

                <nav className="flex gap-1 border-b border-[var(--crm-border)] text-[11px]">
                  {(['overview', 'documents', 'academic', 'approvals', 'activity'] as const).map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setTab(entry)}
                      className={`px-2 py-2 capitalize ${
                        tab === entry
                          ? 'border-b-2 border-[var(--tenant-primary)] text-[var(--crm-text)]'
                          : 'text-[var(--crm-muted)]'
                      }`}
                    >
                      {entry}
                    </button>
                  ))}
                </nav>

                <div className="max-h-[280px] overflow-y-auto text-xs text-[var(--crm-muted)]">
                  {tab === 'overview' && (
                    <dl className="space-y-2">
                      <Row label="Status" value={selected.status} />
                      <Row label="Identity" value={selected.identityMatch ?? 'Not run'} />
                      <Row label="Finance" value={selected.finance} />
                      <Row label="Student number" value={selected.studentNumber ?? '—'} />
                      <Row label="Student record" value={selected.studentId ?? '—'} />
                      <Row label="User account" value={selected.userAccountId ?? '—'} />
                      {selected.holdReason && <Row label="Hold reason" value={selected.holdReason} />}
                    </dl>
                  )}

                  {tab === 'documents' && (
                    <ul className="space-y-1">
                      {snapshot.definition.documentChecklist.map((requirement) => {
                        const record = selected.documents.find((doc) => doc.type === requirement.type);
                        const satisfied = record?.state === 'VERIFIED' || record?.state === 'WAIVED';
                        return (
                          <li key={requirement.type} className="flex items-center justify-between gap-2 py-1">
                            <span className="flex items-center gap-2">
                              {satisfied ? (
                                <CheckCircle2 size={13} className="text-emerald-600" />
                              ) : (
                                <XCircle size={13} className="text-[var(--crm-muted)]" />
                              )}
                              {requirement.label}
                              {requirement.required && <span className="text-rose-500">*</span>}
                            </span>
                            <span className="text-[10px]">{record?.state ?? 'NOT_SUBMITTED'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {tab === 'academic' && (
                    <dl className="space-y-2">
                      <Row label="Campus" value={selected.academic.campusId ?? '—'} />
                      <Row label="Department" value={selected.academic.departmentId ?? '—'} />
                      <Row label="Program" value={selected.academic.programId ?? '—'} />
                      <Row label="Academic year" value={selected.academic.academicYear ?? '—'} />
                      <Row label="Batch" value={selected.academic.batchId ?? '—'} />
                      <Row label="Section" value={selected.academic.sectionId ?? 'Not allocated'} />
                    </dl>
                  )}

                  {tab === 'approvals' && (
                    <ul className="space-y-1">
                      {selected.approvals.map((entry) => (
                        <li key={entry.step} className="flex items-center justify-between py-1">
                          <span>
                            {entry.step}. {entry.role}
                          </span>
                          <span className="text-[10px]">{entry.state}</span>
                        </li>
                      ))}
                      {selected.approvals.length === 0 && <li>No approval required.</li>}
                    </ul>
                  )}

                  {tab === 'activity' && (
                    <ul className="space-y-2">
                      {snapshot.audit
                        .filter((entry) => entry.caseId === selected.id)
                        .map((entry, index) => (
                          <li key={`${entry.timestamp}-${index}`} className="border-l-2 border-[var(--crm-border)] pl-3">
                            <p className="text-[var(--crm-text)]">{entry.action}</p>
                            <p className="text-[10px]">
                              {entry.fromStage} → {entry.toStage} · {entry.actor}
                            </p>
                          </li>
                        ))}
                      {snapshot.audit.filter((entry) => entry.caseId === selected.id).length === 0 && (
                        <li>No activity recorded yet.</li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-[var(--crm-border)] pt-4">
                  <Action
                    label="Advance"
                    icon={busy ? Loader2 : ChevronRight}
                    tone="primary"
                    disabled={busy || selected.status !== 'ACTIVE' || !desk.verify}
                    onClick={() => void act('advance')}
                  />
                  <Action
                    label="Hold"
                    icon={PauseCircle}
                    disabled={busy || selected.status !== 'ACTIVE' || !desk.hold}
                    onClick={() => void act('hold', 'Held from Application Desk')}
                  />
                  <Action
                    label="Resume"
                    icon={PlayCircle}
                    disabled={busy || !(selected.status === 'ON_HOLD' || selected.status === 'RETURNED') || !desk.resume}
                    onClick={() => void act('resume')}
                  />
                  <Action
                    label="Reject"
                    icon={XCircle}
                    tone="danger"
                    disabled={busy || selected.status !== 'ACTIVE' || !desk.reject}
                    onClick={() => void act('reject', 'Rejected at Application Desk')}
                  />
                </div>
                {!desk.verify && (
                  <p className="text-[10px] text-[var(--crm-muted)]">
                    Actions are limited by your Application Desk permissions.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>

        <p className="flex items-center gap-2 text-[10px] text-[var(--crm-muted)]">
          <IdCard size={12} />
          Student numbers, Student Master records and user accounts are created only at their workflow stages, and each
          effect is idempotent — retrying never produces a second student.
          <Wallet size={12} className="ml-2" />
          Fee structures stay owned by Fees &amp; Finance.
        </p>
      </div>
    </DeskShell>
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

function QueueChip({
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
      className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
        active
          ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white'
          : 'border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)]'
      }`}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="truncate text-[var(--crm-text)]">{value}</dd>
    </div>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  icon: typeof Clock;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger';
}) {
  const palette =
    tone === 'primary'
      ? 'bg-[var(--tenant-primary)] text-white'
      : tone === 'danger'
        ? 'border border-rose-500/40 text-rose-600'
        : 'border border-[var(--crm-border)] text-[var(--crm-text)]';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${palette}`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
