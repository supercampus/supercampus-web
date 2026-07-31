'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Lead, Column } from '@/lib/kanban/kanban-data';
import LeadCard from './LeadCard';
import { MoreHorizontal } from 'lucide-react';

interface KanbanColumnProps {
  column: Column;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export default function KanbanColumn({
  column,
  leads,
  onLeadClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className="crm-kanban-column flex flex-col rounded-xl border bg-[var(--crm-card)] border-[var(--crm-border)] w-[300px] shrink-0 overflow-hidden"
      style={{
        boxShadow: isOver
          ? `0 0 0 2px ${column.accent}42, 0 18px 40px rgba(20, 24, 40, 0.12)`
          : '0 8px 24px rgba(20, 24, 40, 0.05)',
        transform: isOver ? 'translateY(-2px)' : 'translateY(0)',
        background: `linear-gradient(180deg, ${column.accent}12, var(--crm-card) 78px)`,
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
        className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 min-h-[200px] kanban-scroll-hidden"
        style={{
          backgroundColor: isOver ? `${column.accent}08` : 'transparent',
        }}
      >
        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${column.accent}12` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={column.accent} strokeWidth="2">
                  <path d="M4 7h16M4 12h10M4 17h7" />
                </svg>
              </div>
              <p className="text-xs text-[var(--crm-muted)] font-medium">Drop a lead here</p>
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
    </div>
  );
}
