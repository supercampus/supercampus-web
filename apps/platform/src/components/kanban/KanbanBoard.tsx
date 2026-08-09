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
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS, COLUMN_IDS } from '@/lib/kanban/kanban-data';
import { getColumnTitle } from '@/lib/kanban/kanban-actions';
import type { CrmForm } from '@/lib/crm-api';
import { getPublishedCrmLeadCaptureForm, holdCrmLead, moveCrmLead, requestCrmLeadMove, updateCrmLead } from '@/lib/crm-api';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LeadDetailSidebar from './LeadDetailSidebar';
import MoveLogModal from './MoveLogModal';
import MoveRequestsPanel from './MoveRequestsPanel';
import { X, Filter, Search } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  roleId: string;
  currentUserId: string;
  canUpdateLeads: boolean;
  canMoveLeadStage: boolean;
  canHoldLeads: boolean;
  onShowToast: (msg: string) => void;
  onRefresh: () => void;
}

export default function KanbanBoard({
  leads,
  setLeads,
  roleId,
  currentUserId,
  canUpdateLeads,
  canMoveLeadStage,
  canHoldLeads,
  onShowToast,
  onRefresh,
}: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveLogModal, setMoveLogModal] = useState<{ lead: Lead; from: string; to: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  // The lead editor is built from whatever the administrator published, so it is
  // fetched once here and handed to the detail sidebar.
  const [leadForm, setLeadForm] = useState<CrmForm | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getPublishedCrmLeadCaptureForm();
        if (!cancelled) setLeadForm(data);
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

  const persistMove = useCallback(async (lead: Lead, toColumn: string, note?: string) => {
    const stageKey = toColumn.replaceAll('-', '_');
    let targetSubstate: string | undefined;
    if (stageKey === 'application_status') {
      targetSubstate = 'awaiting_decision';
    }

    const ownerId = lead.assignedTo.name;
    if (ownerId !== 'Unassigned' && ownerId !== currentUserId) {
      try {
        await requestCrmLeadMove(lead.id, stageKey, note, targetSubstate);
        onShowToast(`Permission requested from ${ownerId} to move ${lead.name}`);
        return 'requested' as const;
      } catch (error) {
        onShowToast(error instanceof Error ? error.message : 'Unable to request owner permission');
        return 'failed' as const;
      }
    }

    // Move the card straight away. The API is a multi-transaction round trip, so
    // waiting for it leaves the card sitting in its old column for a noticeable pause.
    const previousStatus = lead.status;
    const optimisticStatus = toColumn;
    setLeads((previous) => previous.map((item) => item.id === lead.id
      ? { ...item, status: optimisticStatus, lastContact: 'just now' }
      : item));
    setSelectedLead((current) => current?.id === lead.id
      ? { ...current, status: optimisticStatus, lastContact: 'just now' }
      : current);

    try {
      const response = await moveCrmLead(lead.id, stageKey, note, targetSubstate);
      // Reconcile with what the server actually decided; a transition rule may have
      // landed the lead somewhere other than the drop target. Ownership must also
      // come from the locked server transaction, never from client-side inference.
      const nextStatus = response.data.stageKey.replaceAll('_', '-');
      const assignedTo = { name: response.data.assignedTo ?? 'Unassigned' };
      setLeads((previous) => previous.map((item) => item.id === lead.id
        ? { ...item, status: nextStatus, assignedTo, lastContact: 'just now' }
        : item));
      setSelectedLead((current) => current?.id === lead.id
        ? { ...current, status: nextStatus, assignedTo, lastContact: 'just now' }
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
  }, [currentUserId, onShowToast, setLeads]);

  const moveLead = useCallback((lead: Lead, toColumn: string) => {
    if (!canMoveLeadStage) {
      onShowToast('You do not have permission to move leads');
      return;
    }

    const fromColumn = lead.status;
    if (fromColumn === toColumn) return;

    setMoveLogModal({ lead, from: fromColumn, to: toColumn });
  }, [canMoveLeadStage, onShowToast]);

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

  async function handleMoveConfirm(note: string) {
    if (!moveLogModal) return;
    const { lead, from, to } = moveLogModal;
    // Dismiss on intent, not after the network round trip. persistMove updates the
    // card optimistically and rolls it back with a toast if the server refuses it.
    setMoveLogModal(null);
    const outcome = await persistMove(lead, to, note);
    if (outcome === 'requested') return;
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
          <MoveRequestsPanel currentUserId={currentUserId} onChanged={onRefresh} onShowToast={onShowToast} />
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
              canDrag={canMoveLeadStage}
            />
          ))}
        </div>
      </div>

      {/* Lead Detail Sidebar */}
      {sidebarOpen && selectedLead && (
        <LeadDetailSidebar
          key={selectedLead.id}
          lead={selectedLead}
          leadForm={leadForm}
          onClose={() => { setSidebarOpen(false); setSelectedLead(null); }}
          onApplicationDecision={decideApplication}
          onUpdate={updateLead}
          onShowToast={onShowToast}
          canUpdateLead={canUpdateLeads}
          canMoveLeadStage={canMoveLeadStage}
          canHoldLead={canHoldLeads}
        />
      )}

      {/* Move Log Modal */}
      {moveLogModal && (
        <MoveLogModal
          leadName={moveLogModal.lead.name}
          fromColumn={getColumnTitle(moveLogModal.from)}
          toColumn={getColumnTitle(moveLogModal.to)}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveLogModal(null)}
        />
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
