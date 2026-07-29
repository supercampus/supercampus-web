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
  onAddLead: (columnId: string) => void;
  isHighlighted?: boolean;
}

export default function KanbanColumn({
  column,
  leads,
  onLeadClick,
  onAddLead,
  isHighlighted,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className="flex flex-col rounded-xl border bg-[var(--crm-card)] border-[var(--crm-border)] w-[300px] shrink-0"
      style={{
        boxShadow: isOver
          ? `0 0 0 2px ${column.accent}44, 0 4px 12px rgba(0,0,0,0.06)`
          : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[var(--crm-border)]"
        style={{ borderLeft: `4px solid ${column.accent}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-[var(--crm-text)] uppercase tracking-wide">
            {column.title}
          </h3>
          <span
            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold"
            style={{
              backgroundColor: `${column.accent}18`,
              color: column.accent,
            }}
          >
            {leads.length}
          </span>
        </div>
        <button className="p-1 rounded-md hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors">
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 min-h-[200px]"
        style={{
          backgroundColor: isOver ? `${column.accent}08` : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${column.accent}12` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={column.accent} strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-xs text-[var(--crm-muted)] font-medium">Drop leads here</p>
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                columnAccent={column.accent}
                onClick={onLeadClick}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--crm-border)]">
        <button
          onClick={() => onAddLead(column.id)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[var(--crm-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors"
        >
          <Plus size={14} />
          Quick Add
        </button>
      </div>
    </div>
  );
}
