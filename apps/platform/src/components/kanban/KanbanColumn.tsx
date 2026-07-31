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
}

export default function KanbanColumn({
  column,
  leads,
  onLeadClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className="crm-kanban-column flex flex-col rounded-2xl border border-white/10 bg-[#111827] w-[280px] shrink-0 overflow-hidden"
      style={{
        width: column.id === 'application' || column.id === 'application-status' ? 320 : column.id === 'archived' ? 240 : 280,
        boxShadow: isOver
          ? `0 0 0 2px ${column.accent}42, 0 18px 40px rgba(20, 24, 40, 0.12)`
          : '0 18px 44px rgba(0, 0, 0, 0.18)',
        transform: isOver ? 'translateY(-2px)' : 'translateY(0)',
        background: `linear-gradient(180deg, ${column.accent}18, #111827 92px)`,
      }}
    >
      {/* Column Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xs uppercase tracking-wide text-white">{column.title}</h3>
            <p className="mt-2 text-[11px] text-white/45">{leads.length} leads</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10" aria-label={`Add lead to ${column.title}`}>
              <Plus size={14} />
            </button>
            <button type="button" className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10" aria-label={`${column.title} column menu`}>
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        <div className="mt-3 h-1 rounded-full bg-white/10">
          <span className="block h-full rounded-full" style={{ width: '46%', background: column.accent }} />
        </div>
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
              <p className="text-xs text-white/45">Drop a lead here</p>
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
