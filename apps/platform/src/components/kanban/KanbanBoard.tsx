'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
import { canMoveLead, isKeyStageMove, getColumnTitle } from '@/lib/kanban/kanban-actions';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LeadDetailSidebar from './LeadDetailSidebar';
import MoveLogModal from './MoveLogModal';
import { X, Filter, Search } from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  roleId: string;
  onShowToast: (msg: string) => void;
}

export default function KanbanBoard({ leads, setLeads, roleId, onShowToast }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moveLogModal, setMoveLogModal] = useState<{ lead: Lead; from: string; to: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
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

  const moveLead = useCallback((lead: Lead, toColumn: string) => {
    const fromColumn = lead.status;
    if (fromColumn === toColumn) return;

    const fromIndex = COLUMN_IDS.indexOf(fromColumn);
    const toIndex = COLUMN_IDS.indexOf(toColumn);
    if (fromIndex < 0 || toIndex < 0) {
      onShowToast('Invalid pipeline stage');
      return;
    }
    if (toIndex <= fromIndex) {
      onShowToast('Leads can only move forward in the pipeline');
      return;
    }

    const permission = canMoveLead(roleId, fromColumn, toColumn);
    if (!permission.allowed) {
      onShowToast(permission.reason ?? 'Permission denied');
      return;
    }

    if (isKeyStageMove(fromColumn, toColumn)) {
      setMoveLogModal({ lead, from: fromColumn, to: toColumn });
      return;
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: toColumn, lastContact: 'just now' } : l))
    );
    setSelectedLead((current) => (current?.id === lead.id ? { ...current, status: toColumn, lastContact: 'just now' } : current));
    onShowToast(`Moved ${lead.name} to ${getColumnTitle(toColumn)}`);
  }, [roleId, setLeads, onShowToast]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const lead = leads.find((item) => item.id === event.active.id);
    setActiveLead(lead ?? null);
  }, [leads]);

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

  const updateLead = useCallback((leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead))
    );
    setSelectedLead((current) => (current?.id === leadId ? { ...current, ...updates } : current));
    onShowToast('Lead data updated');
  }, [setLeads, onShowToast]);

  function handleLeadClick(lead: Lead) {
    setSelectedLead(lead);
    setSidebarOpen(true);
  }

  function handleMoveConfirm(note: string) {
    if (!moveLogModal) return;
    const { lead, from, to } = moveLogModal;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, status: to, lastContact: 'just now', moveHistory: [...l.moveHistory, { id: `m-${Date.now()}`, from, to, by: roleId, byName: roleId, timestamp: new Date().toISOString(), note }] }
          : l
      )
    );
    setSelectedLead((current) =>
      current?.id === lead.id
        ? { ...current, status: to, lastContact: 'just now', moveHistory: [...current.moveHistory, { id: `m-${Date.now()}`, from, to, by: roleId, byName: roleId, timestamp: new Date().toISOString(), note }] }
        : current
    );
    setMoveLogModal(null);
    onShowToast(`Moved ${lead.name} to ${getColumnTitle(to)}`);
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
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-muted)]" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30"
          />
        </div>

        <div className="flex items-center gap-2">
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
            />
          ))}
        </div>
      </div>

      {/* Lead Detail Sidebar */}
      {sidebarOpen && selectedLead && (
        <LeadDetailSidebar
          key={selectedLead.id}
          lead={selectedLead}
          onClose={() => { setSidebarOpen(false); setSelectedLead(null); }}
          onOfferDecision={(lead, decision) => {
            setLeads((prev) => prev.map((l) => (
              l.id === lead.id
                ? { ...l, status: 'offer-status', offerDecision: decision, lastContact: 'just now' }
                : l
            )));
            setSelectedLead((current) => (
              current?.id === lead.id
                ? { ...current, status: 'offer-status', offerDecision: decision, lastContact: 'just now' }
                : current
            ));
            onShowToast(`Offer status set to ${decision.replace('-', ' ')}`);
          }}
          onUpdate={updateLead}
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
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
