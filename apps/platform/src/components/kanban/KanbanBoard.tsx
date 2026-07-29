'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Lead } from '@/lib/kanban/kanban-data';
import { COLUMNS, COLUMN_IDS } from '@/lib/kanban/kanban-data';
import { canMoveLead, isKeyStageMove, getColumnTitle } from '@/lib/kanban/kanban-actions';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import LeadDetailSidebar from './LeadDetailSidebar';
import ArchiveModal from './ArchiveModal';
import MoveLogModal from './MoveLogModal';
import ActivityFeed from './ActivityFeed';
import SpecialBuckets from './SpecialBuckets';
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
  const [archiveModal, setArchiveModal] = useState<{ lead: Lead; from: string } | null>(null);
  const [moveLogModal, setMoveLogModal] = useState<{ lead: Lead; from: string; to: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [showNewLeadForm, setShowNewLeadForm] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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
      if (filterPriority && lead.priority !== filterPriority) return;

      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads, searchQuery, filterSource, filterCourse, filterPriority]);

  // Derive filter options from data
  const filterOptions = useMemo(() => {
    const sources = new Set<string>();
    const courses = new Set<string>();
    const priorities = new Set<string>();
    leads.forEach((l) => {
      sources.add(l.source);
      courses.add(l.course);
      priorities.add(l.priority);
    });
    return {
      sources: Array.from(sources).sort(),
      courses: Array.from(courses).sort(),
      priorities: Array.from(priorities),
    };
  }, [leads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const lead = leads.find((l) => l.id === id);
    if (lead) setActiveLead(lead);
  }, [leads]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // For highlighting purposes only
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // Determine target column
    let toColumn = over.id as string;
    // If dropped on a card, get its column
    if (!COLUMN_IDS.includes(toColumn)) {
      const overLead = leads.find((l) => l.id === toColumn);
      if (overLead) toColumn = overLead.status;
    }
    if (!COLUMN_IDS.includes(toColumn)) return;

    const fromColumn = lead.status;
    if (fromColumn === toColumn) return;

    // Permission check
    const permission = canMoveLead(roleId, fromColumn, toColumn);
    if (!permission.allowed) {
      onShowToast(permission.reason ?? 'Permission denied');
      return;
    }

    // Archive check
    if (toColumn === 'archived') {
      setArchiveModal({ lead, from: fromColumn });
      return;
    }

    // Key stage move check
    if (isKeyStageMove(fromColumn, toColumn)) {
      setMoveLogModal({ lead, from: fromColumn, to: toColumn });
      return;
    }

    // Perform move
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: toColumn, lastContact: 'just now' } : l))
    );
    onShowToast(`Moved ${lead.name} to ${getColumnTitle(toColumn)}`);
  }, [leads, roleId, setLeads, onShowToast]);

  function handleLeadClick(lead: Lead) {
    setSelectedLead(lead);
    setSidebarOpen(true);
  }

  function handleArchiveConfirm(reason: string, notes: string) {
    if (!archiveModal) return;
    const { lead, from } = archiveModal;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, status: 'archived', lastContact: 'just now', moveHistory: [...l.moveHistory, { id: `m-${Date.now()}`, from, to: 'archived', by: roleId, byName: roleId, timestamp: new Date().toISOString(), note: `${reason}: ${notes}` }] }
          : l
      )
    );
    setArchiveModal(null);
    onShowToast(`Archived ${lead.name}`);
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
    setMoveLogModal(null);
    onShowToast(`Moved ${lead.name} to ${getColumnTitle(to)}`);
  }

  function handleAddLead(columnId: string) {
    setShowNewLeadForm(columnId);
  }

  function handleCreateLead(name: string, phone: string, course: string, source: string) {
    if (!showNewLeadForm) return;
    const newLead: Lead = {
      id: `L-${Date.now()}`,
      name,
      initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      phone,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      course,
      intake: '2026',
      source,
      city: 'Chennai',
      assignedTo: { name: 'You' },
      priority: 'warm',
      status: showNewLeadForm,
      documents: { uploaded: 0, required: 4 },
      communicationCount: 0,
      nextFollowUp: null,
      lastContact: 'just now',
      parent: { name: '', phone: '', relation: '' },
      moveHistory: [{ id: `m-${Date.now()}`, from: '', to: showNewLeadForm, by: roleId, byName: roleId, timestamp: new Date().toISOString(), note: 'New lead created' }],
    };
    setLeads((prev) => [...prev, newLead]);
    setShowNewLeadForm(null);
    onShowToast(`Added ${name} to ${getColumnTitle(showNewLeadForm)}`);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Search & Filters */}
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

        {/* Filter dropdowns */}
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
          <select
            value={filterPriority ?? ''}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="px-2.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-xs text-[var(--crm-text)] focus:outline-none"
          >
            <option value="">Priority: All</option>
            {filterOptions.priorities.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {(searchQuery || filterSource || filterCourse || filterPriority) && (
            <button
              onClick={() => { setSearchQuery(''); setFilterSource(null); setFilterCourse(null); setFilterPriority(null); }}
              className="p-2 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="inline-flex gap-4 h-full pb-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={leadsByColumn[column.id] ?? []}
              onLeadClick={handleLeadClick}
              onAddLead={handleAddLead}
            />
          ))}
        </div>
      </div>

      {/* Special Buckets */}
      <SpecialBuckets onDrop={(bucketId, lead) => {
        // Handle dropping into special buckets
        if (lead) {
          if (bucketId === 'archive') {
            setArchiveModal({ lead, from: lead.status });
          }
        }
      }} />

      {/* New Lead Form Modal */}
      {showNewLeadForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-border)] p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--crm-text)]">New Lead</h3>
              <button onClick={() => setShowNewLeadForm(null)} className="p-1 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)]">
                <X size={18} />
              </button>
            </div>
            <NewLeadForm
              onSubmit={handleCreateLead}
              onCancel={() => setShowNewLeadForm(null)}
            />
          </div>
        </div>
      )}

      {/* Lead Detail Sidebar */}
      {sidebarOpen && selectedLead && (
        <LeadDetailSidebar
          lead={selectedLead}
          onClose={() => { setSidebarOpen(false); setSelectedLead(null); }}
          onArchive={(lead) => setArchiveModal({ lead, from: lead.status })}
          onMove={(lead, to) => {
            if (isKeyStageMove(lead.status, to)) {
              setMoveLogModal({ lead, from: lead.status, to });
            } else {
              setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: to } : l));
              onShowToast(`Moved ${lead.name}`);
            }
          }}
        />
      )}

      {/* Archive Modal */}
      {archiveModal && (
        <ArchiveModal
          leadName={archiveModal.lead.name}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchiveModal(null)}
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLead ? (
          <div className="rotate-2 opacity-90 shadow-xl" style={{ width: 300 }}>
            <LeadCard
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

function NewLeadForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, phone: string, course: string, source: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('B.Tech CSE');
  const [source, setSource] = useState('Walk-in');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit(name.trim(), phone.trim(), course, source);
  };

  const courseOptions = ['B.Tech CSE', 'B.Tech ECE', 'BBA', 'BCA', 'B.Com Hons', 'B.Sc Physics', 'MBA', 'MBA Marketing', 'MBA Finance', 'MBA HR'];
  const sourceOptions = ['Facebook Ad', 'Google Ads', 'Walk-in', 'Referral', 'School Visit', 'Education Fair'];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">Full Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Kumar"
          required
          className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">Phone *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91-98765 43210"
          required
          className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">Course</label>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] focus:outline-none"
        >
          {courseOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] focus:outline-none"
        >
          {sourceOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-[var(--crm-border)] text-sm font-medium text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
        >
          Add Lead
        </button>
      </div>
    </form>
  );
}
