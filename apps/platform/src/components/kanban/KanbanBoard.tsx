'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  defaultDropAnimationSideEffects,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import type { Column, Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS, COLUMN_IDS } from '@/lib/kanban/kanban-data';
import { getColumnTitle } from '@/lib/kanban/kanban-actions';
import type { CrmForm, CrmPipelineTransferCandidate, CrmStageCatalog } from '@/lib/crm-api';
import { getCrmPipelineTransferCandidates, getCrmStages, getPublishedCrmLeadCaptureForm, holdCrmLead, moveCrmLead, transferCrmLead, updateCrmLead } from '@/lib/crm-api';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LeadDetailSidebar from './LeadDetailSidebar';
import MoveLogModal from './MoveLogModal';
import { ArrowRightLeft, Filter, LoaderCircle, Search, X } from 'lucide-react';
import { availableCurrentStageSubstates } from '@/lib/crm-catalog';

interface KanbanBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  roleId: string;
  currentUserId: string;
  currentUserName: string;
  canUpdateLeads: boolean;
  canMoveLeadStage: boolean;
  canHoldLeads: boolean;
  canLogCalls: boolean;
  canMoveLeadBackward: boolean;
  onCreateLead?: (column: Column) => void;
  onShowToast: (msg: string) => void;
  onRefresh: () => void;
}

export default function KanbanBoard({
  leads,
  setLeads,
  roleId,
  currentUserId,
  currentUserName,
  canUpdateLeads,
  canMoveLeadStage,
  canHoldLeads,
  canLogCalls,
  canMoveLeadBackward,
  onCreateLead,
  onShowToast,
  onRefresh,
}: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveLogModal, setMoveLogModal] = useState<{ lead: Lead; from: string; to: string } | null>(null);
  const [transferLead, setTransferLead] = useState<Lead | null>(null);
  const [transferCandidates, setTransferCandidates] = useState<CrmPipelineTransferCandidate[]>([]);
  const [transferUserId, setTransferUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  // The lead editor is built from whatever the administrator published, so it is
  // fetched once here and handed to the detail sidebar.
  const [leadForm, setLeadForm] = useState<CrmForm | null>(null);
  const [stageCatalog, setStageCatalog] = useState<CrmStageCatalog[]>([]);

  // Realtime events replace the authoritative card in `leads`. Render the open
  // workspace from that snapshot so stage, owner, and duplicate state cannot
  // remain stale, without mirroring props into state from an effect.
  const visibleSelectedLead = selectedLead
    ? leads.find((lead) => lead.id === selectedLead.id) ?? null
    : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [formResponse, stagesResponse] = await Promise.all([
          getPublishedCrmLeadCaptureForm().catch(() => null),
          getCrmStages(),
        ]);
        if (!cancelled) {
          setLeadForm(formResponse?.data ?? null);
          setStageCatalog(stagesResponse.data);
        }
      } catch {
        // No published form, or no permission to read it: the sidebar falls back to
        // its built-in field set rather than showing nothing.
        if (!cancelled) setLeadForm(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const dropAnimation: DropAnimation = {
    duration: 90,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.18',
        },
      },
    }),
  };

  // Group leads by column
  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    COLUMN_IDS.forEach((id) => { grouped[id] = []; });

    const query = searchQuery.toLowerCase();
    leads.forEach((lead) => {
      if (searchQuery) {
        const matches =
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.course.toLowerCase().includes(query) ||
          lead.city.toLowerCase().includes(query);
        if (!matches) return;
      }
      if (filterSource && lead.source !== filterSource) return;
      if (filterCourse && lead.course !== filterCourse) return;

      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads, searchQuery, filterSource, filterCourse]);

  const filterOptions = useMemo(() => {
    const sources = new Set<string>();
    const courses = new Set<string>();
    leads.forEach((l) => {
      sources.add(l.source);
      courses.add(l.course);
    });
    return {
      sources: Array.from(sources).sort(),
      courses: Array.from(courses).sort(),
    };
  }, [leads]);

  const persistMove = useCallback(async (lead: Lead, toColumn: string, note?: string, targetSubstate?: string) => {
    const stageKey = toColumn.replaceAll('-', '_');
    targetSubstate ??= stageCatalog.find((stage) => stage.key === stageKey)?.defaultSubstate;

    const ownerId = lead.assignedTo.id ?? lead.assignedTo.name;
    if (ownerId !== 'Unassigned' && ownerId !== currentUserId) {
      onShowToast('This card belongs to another user. Refresh the pipeline.');
      return 'failed' as const;
    }

    // Move the card straight away. The API is a multi-transaction round trip, so
    // waiting for it leaves the card sitting in its old column for a noticeable pause.
    const previousStatus = lead.status;
    const optimisticStatus = toColumn;
    setLeads((previous) => previous.map((item) => item.id === lead.id
      ? { ...item, status: optimisticStatus, substate: targetSubstate ?? item.substate, lastContact: 'just now' }
      : item));
    setSelectedLead((current) => current?.id === lead.id
      ? { ...current, status: optimisticStatus, substate: targetSubstate ?? current.substate, lastContact: 'just now' }
      : current);

    try {
      const response = await moveCrmLead(lead.id, stageKey, note, targetSubstate);
      // Reconcile with what the server actually decided; a transition rule may have
      // landed the lead somewhere other than the drop target. Ownership must also
      // come from the locked server transaction, never from client-side inference.
      const nextStatus = response.data.stageKey.replaceAll('_', '-');
      const ownerId = response.data.assignedTo ?? undefined;
      const assignedTo = {
        id: ownerId,
        name: ownerId === currentUserId ? currentUserName || 'Current user' : ownerId ?? 'Unassigned',
      };
      setLeads((previous) => previous.map((item) => item.id === lead.id
        ? { ...item, status: nextStatus, substate: response.data.substateKey, assignedTo, lastContact: 'just now' }
        : item));
      setSelectedLead((current) => current?.id === lead.id
        ? { ...current, status: nextStatus, substate: response.data.substateKey, assignedTo, lastContact: 'just now' }
        : current);
      onShowToast(`Moved ${lead.name} to ${getColumnTitle(nextStatus)}`);
      return 'moved' as const;
    } catch (error) {
      // Roll the card back to where it came from so the board never shows a move
      // the server rejected.
      setLeads((previous) => previous.map((item) => item.id === lead.id
        ? { ...item, status: previousStatus }
        : item));
      setSelectedLead((current) => current?.id === lead.id
        ? { ...current, status: previousStatus }
        : current);
      onShowToast(error instanceof Error ? error.message : 'Unable to move lead');
      return 'failed' as const;
    }
  }, [currentUserId, currentUserName, onShowToast, setLeads, stageCatalog]);

  const openTransfer = useCallback(async (lead: Lead) => {
    setTransferLead(lead);
    setTransferUserId('');
    setTransferReason('');
    setTransferCandidates([]);
    setTransferLoading(true);
    try {
      const response = await getCrmPipelineTransferCandidates();
      setTransferCandidates(response.data);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to load pipeline users');
      setTransferLead(null);
    } finally {
      setTransferLoading(false);
    }
  }, [onShowToast]);

  const confirmTransfer = useCallback(async () => {
    if (!transferLead || !transferUserId || !transferReason.trim() || transferBusy) return;
    setTransferBusy(true);
    try {
      const candidate = transferCandidates.find((item) => item.userId === transferUserId);
      await transferCrmLead(transferLead.id, transferUserId, transferReason.trim());
      setLeads((current) => current.filter((lead) => lead.id !== transferLead.id));
      setSelectedLead(null);
      setSidebarOpen(false);
      setTransferLead(null);
      onShowToast(`${transferLead.name} transferred to ${candidate?.name ?? 'the selected user'}`);
      onRefresh();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to transfer card');
    } finally {
      setTransferBusy(false);
    }
  }, [onRefresh, onShowToast, setLeads, transferBusy, transferCandidates, transferLead, transferReason, transferUserId]);

  const moveLead = useCallback((lead: Lead, toColumn: string) => {
    if (!canMoveLeadStage) {
      onShowToast('You do not have permission to move leads');
      return;
    }

    const fromColumn = lead.status;
    if (fromColumn === toColumn) return;
    const fromIndex = COLUMN_IDS.indexOf(fromColumn);
    const toIndex = COLUMN_IDS.indexOf(toColumn);
    if (toIndex < fromIndex && !canMoveLeadBackward) {
      onShowToast('Only administrators can move a lead backward.');
      return;
    }

    setMoveLogModal({ lead, from: fromColumn, to: toColumn });
  }, [canMoveLeadBackward, canMoveLeadStage, onShowToast]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!canMoveLeadStage) return;
    const lead = leads.find((item) => item.id === event.active.id);
    setActiveLead(lead ?? null);
  }, [canMoveLeadStage, leads]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const draggedLead = activeLead;
    setActiveLead(null);
    if (!over) return;

    const lead = draggedLead ?? leads.find((item) => item.id === active.id);
    if (!lead) return;

    let toColumn = String(over.id);
    if (!COLUMN_IDS.includes(toColumn)) {
      const overLead = leads.find((item) => item.id === over.id);
      if (overLead) toColumn = overLead.status;
    }

    if (!COLUMN_IDS.includes(toColumn)) return;
    moveLead(lead, toColumn);
  }, [activeLead, leads, moveLead]);

  const handleDragCancel = useCallback(() => {
    setActiveLead(null);
  }, []);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    if (!canUpdateLeads) {
      onShowToast('You do not have permission to update leads');
      return;
    }

    try {
      const existing = leads.find((item) => item.id === leadId);
      // Programme, intake and city live inside the lead's JSON columns rather than
      // dedicated ones. They were previously updated in local state only, so an edit
      // looked saved but was lost on the next refresh.
      const interest = updates.course !== undefined || updates.intake !== undefined
        ? {
            ...(existing?.interest ?? {}),
            ...(updates.course !== undefined ? { programName: updates.course } : {}),
            ...(updates.intake !== undefined ? { intake: updates.intake } : {}),
          }
        : undefined;
      const customFields = updates.customFields !== undefined || updates.city !== undefined
        ? {
            ...(existing?.customFields ?? {}),
            ...(updates.customFields ?? {}),
            ...(updates.city !== undefined ? { city: updates.city } : {}),
          }
        : undefined;

      await updateCrmLead(leadId, {
        source: updates.source,
        fullName: updates.name,
        email: updates.email,
        phone: updates.phone,
        whatsapp: updates.whatsapp,
        parentName: updates.parent?.name,
        parentPhone: updates.parent?.phone,
        followUpAt: updates.nextFollowUp,
        interest,
        customFields,
      });
      setLeads((previous) => previous.map((lead) => lead.id === leadId ? { ...lead, ...updates } : lead));
      setSelectedLead((current) => current?.id === leadId ? { ...current, ...updates } : current);
      onShowToast('Lead data saved');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to save lead');
    }
  }, [canUpdateLeads, leads, onShowToast, setLeads]);

  const decideApplication = useCallback(async (lead: Lead, decision: 'accept' | 'deny' | 'hold') => {
    if (decision === 'hold') {
      if (!canHoldLeads) {
        onShowToast('You do not have permission to place applications on hold');
        return;
      }
      try {
        const response = await holdCrmLead(lead.id, {
          reason: 'Application decision placed on hold',
        });
        const update = {
          globalStatus: response.data.globalStatus ?? 'on_hold',
          globalStatusData: response.data.globalStatusData,
          lastContact: 'just now',
        };
        setLeads((previous) => previous.map((item) => item.id === lead.id ? { ...item, ...update } : item));
        setSelectedLead((current) => current?.id === lead.id ? { ...current, ...update } : current);
        onShowToast(`${lead.name} is on hold in Application Status`);
      } catch (error) {
        onShowToast(error instanceof Error ? error.message : 'Unable to place application on hold');
      }
      return;
    }

    if (!canMoveLeadStage) {
      onShowToast('You do not have permission to decide applications');
      return;
    }
    const target = decision === 'accept' ? 'offer-status' : 'archived';
    const reason = decision === 'accept'
      ? 'Application accepted and moved to Offer / Status'
      : 'Application denied and moved to Archived';
    await persistMove(lead, target, reason);
  }, [canHoldLeads, canMoveLeadStage, onShowToast, persistMove, setLeads]);

  function handleLeadClick(lead: Lead) {
    setSelectedLead(lead);
    setSidebarOpen(true);
  }

  async function handleMoveConfirm(note: string, substate: string) {
    if (!moveLogModal) return;
    const { lead, from, to } = moveLogModal;
    // Dismiss on intent, not after the network round trip. persistMove updates the
    // card optimistically and rolls it back with a toast if the server refuses it.
    setMoveLogModal(null);
    const outcome = await persistMove(lead, to, note, substate);
    if (outcome !== 'moved') return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, moveHistory: [...l.moveHistory, { id: `m-${Date.now()}`, from, to, by: roleId, byName: roleId, timestamp: new Date().toISOString(), note }] }
          : l
      )
    );
    setSelectedLead((current) =>
      current?.id === lead.id
        ? { ...current, moveHistory: [...current.moveHistory, { id: `m-${Date.now()}`, from, to, by: roleId, byName: roleId, timestamp: new Date().toISOString(), note }] }
        : current
    );
  }

  const changeSubstate = useCallback(async (lead: Lead, substate: string) => {
    const outcome = await persistMove(lead, lead.status, `Substage changed to ${substate.replaceAll('_', ' ')}`, substate);
    if (outcome === 'moved') onShowToast(`${lead.name} updated`);
  }, [onShowToast, persistMove]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="campus-kanban-toolbar flex items-center gap-3 mb-4 flex-wrap">
        <div className="campus-kanban-search relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-muted)]" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30"
          />
        </div>

        <div className="campus-kanban-filters flex items-center gap-2">
          <Filter size={14} className="text-[var(--crm-muted)]" />
          <select
            value={filterSource ?? ''}
            onChange={(e) => setFilterSource(e.target.value || null)}
            className="px-2.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-xs text-[var(--crm-text)] focus:outline-none"
          >
            <option value="">Source: All</option>
            {filterOptions.sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterCourse ?? ''}
            onChange={(e) => setFilterCourse(e.target.value || null)}
            className="px-2.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-xs text-[var(--crm-text)] focus:outline-none"
          >
            <option value="">Course: All</option>
            {filterOptions.courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(searchQuery || filterSource || filterCourse) && (
            <button
              onClick={() => { setSearchQuery(''); setFilterSource(null); setFilterCourse(null); }}
              className="p-2 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 kanban-scroll-hidden">
        <div className="inline-flex gap-4 h-full pb-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={leadsByColumn[column.id] ?? []}
              onLeadClick={handleLeadClick}
              onCreateLead={column.id === 'enquiry' ? onCreateLead : undefined}
              canDrag={canMoveLeadStage}
            />
          ))}
        </div>
      </div>

      {/* Lead Detail Sidebar */}
      {sidebarOpen && visibleSelectedLead && (
        <LeadDetailSidebar
          key={visibleSelectedLead.id}
          lead={visibleSelectedLead}
          leadForm={leadForm}
          onClose={() => { setSidebarOpen(false); setSelectedLead(null); }}
          onApplicationDecision={decideApplication}
          onUpdate={updateLead}
          onShowToast={onShowToast}
          canUpdateLead={canUpdateLeads}
          canMoveLeadStage={canMoveLeadStage}
          canHoldLead={canHoldLeads}
          canLogCall={canLogCalls}
          canTransferLead={(visibleSelectedLead.assignedTo.id ?? visibleSelectedLead.assignedTo.name) === currentUserId && visibleSelectedLead.status !== 'enquiry'}
          onTransferLead={(lead) => void openTransfer(lead)}
          stageSubstates={availableCurrentStageSubstates(
            visibleSelectedLead.status,
            visibleSelectedLead.substate,
            stageCatalog.find((stage) => stage.key === visibleSelectedLead.status.replaceAll('-', '_'))?.substates ?? [],
          )}
          onChangeSubstate={changeSubstate}
        />
      )}

      {/* Move Log Modal */}
      {moveLogModal && (
        <MoveLogModal
          leadName={moveLogModal.lead.name}
          fromColumn={getColumnTitle(moveLogModal.from)}
          toColumn={getColumnTitle(moveLogModal.to)}
          substates={stageCatalog.find((stage) => stage.key === moveLogModal.to.replaceAll('-', '_'))?.substates ?? ['closed']}
          defaultSubstate={stageCatalog.find((stage) => stage.key === moveLogModal.to.replaceAll('-', '_'))?.defaultSubstate ?? 'closed'}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveLogModal(null)}
        />
      )}

      {transferLead && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <section role="dialog" aria-modal="true" aria-label="Transfer card" className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-4">
              <div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tenant-surface)] text-[var(--tenant-primary)]"><ArrowRightLeft size={18} /></span><div><h3 className="font-bold">Transfer {transferLead.name}</h3><p className="mt-1 text-xs text-[var(--crm-muted)]">Ownership changes immediately; the pipeline stage and history stay unchanged.</p></div></div>
              <button type="button" disabled={transferBusy} onClick={() => setTransferLead(null)} className="rounded-lg p-1.5 text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]"><X size={18} /></button>
            </header>
            <div className="space-y-4 p-5">
              <label className="block text-xs font-semibold text-[var(--crm-muted)]">Transfer to
                <select value={transferUserId} onChange={(event) => setTransferUserId(event.target.value)} disabled={transferLoading || transferBusy} className="mt-2 h-11 w-full rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] px-3 text-sm text-[var(--crm-text)] outline-none">
                  <option value="">{transferLoading ? 'Loading eligible users…' : 'Select a pipeline user'}</option>
                  {transferCandidates.map((candidate) => <option key={candidate.userId} value={candidate.userId}>{candidate.name} · {candidate.email}</option>)}
                </select>
              </label>
              {!transferLoading && transferCandidates.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">No other active tenant user currently has pipeline access.</p>}
              <label className="block text-xs font-semibold text-[var(--crm-muted)]">Transfer reason
                <textarea value={transferReason} onChange={(event) => setTransferReason(event.target.value)} disabled={transferBusy} rows={4} maxLength={500} placeholder="Explain why this card is being transferred" className="mt-2 w-full resize-y rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-3 text-sm text-[var(--crm-text)] outline-none" />
              </label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[var(--crm-border)] bg-[var(--crm-panel)] px-5 py-4">
              <button type="button" disabled={transferBusy} onClick={() => setTransferLead(null)} className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button type="button" disabled={transferBusy || transferLoading || !transferUserId || !transferReason.trim()} onClick={() => void confirmTransfer()} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-45">{transferBusy && <LoaderCircle size={15} className="animate-spin" />}{transferBusy ? 'Transferring…' : 'Transfer card'}</button>
            </footer>
          </section>
        </div>
      )}

      <DragOverlay dropAnimation={dropAnimation}>
        {activeLead ? (
          <div className="crm-drag-overlay" style={{ width: 300 }}>
            <LeadCard.Preview
              lead={activeLead}
              columnAccent="#776cf5"
              onClick={() => {}}
              canDrag={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
