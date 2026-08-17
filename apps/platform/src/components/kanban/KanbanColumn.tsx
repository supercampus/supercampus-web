'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Lead, Column } from '@/lib/kanban/kanban-data';
import LeadCard from './LeadCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onCreateLead?: (column: Column) => void;
  canDrag: boolean;
}

export default function KanbanColumn({
  column,
  leads,
  onLeadClick,
  onCreateLead,
  canDrag,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: !canDrag });

  return (
    <div
      className="crm-kanban-column flex w-[320px] shrink-0 flex-col overflow-hidden rounded-t-xl"
      style={{
        backgroundColor: '#f0f0f0',
        boxShadow: isOver ? `0 0 0 3px ${column.accent}55, 0 18px 40px rgba(20, 24, 40, 0.12)` : 'none',
        transform: isOver ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-5 pb-4 pt-5"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-[var(--kanban-column-text)]">
            {column.title}
          </h3>
          <span
            className="inline-flex min-w-6 items-center justify-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-[var(--kanban-column-text)]"
            style={{
              display: leads.length ? undefined : 'none',
            }}
          >
            {leads.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onCreateLead && (
            <button
              type="button"
              onClick={() => onCreateLead(column)}
              className="rounded-full p-1 text-[var(--kanban-column-text)]/60 transition-colors hover:bg-black/10 hover:text-[var(--kanban-column-text)]"
              aria-label={`Create lead from ${column.title}`}
              title={`Create lead from ${column.title}`}
            >
              <Plus size={18} />
            </button>
          )}
          <button
            type="button"
            className="rounded-full p-1 text-[var(--kanban-column-text)]/60 transition-colors hover:bg-black/10 hover:text-[var(--kanban-column-text)]"
            aria-label={`More options for ${column.title}`}
            title={`More options for ${column.title}`}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="h-1 w-full" style={{ backgroundColor: column.accent }} />

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-[220px] overflow-y-auto px-5 pb-5 pt-1 kanban-scroll-hidden"
      >
        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={column.accent} strokeWidth="2">
                  <path d="M4 7h16M4 12h10M4 17h7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-[var(--kanban-column-text)]/55">{canDrag ? 'Drop a lead here' : 'No leads'}</p>
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} columnAccent={column.accent} onClick={onLeadClick} canDrag={canDrag} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}
