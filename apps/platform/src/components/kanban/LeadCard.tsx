'use client';

import React from 'react';
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/lib/kanban/kanban-data';
import { MoreHorizontal } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  columnAccent: string;
  onClick: (lead: Lead) => void;
  canDrag: boolean;
  isOverdue?: boolean;
}

function LeadCardContent({ lead, columnAccent, onClick, canDrag, isOverdue, className = '', style }: LeadCardProps & { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      onClick={() => onClick(lead)}
      className={`crm-lead-card group mb-3 rounded-[28px] bg-white p-5 text-black shadow-[0_8px_22px_rgba(20,24,40,0.06)] transition-transform hover:-translate-y-0.5 ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${className}`}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = columnAccent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--crm-border)';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate pr-2 text-[21px] font-medium leading-tight">{lead.name}</h4>
          <p className="mt-1 text-[13px] text-black/75">{lead.course}{lead.intake ? ` · ${lead.intake}` : ''}</p>
        </div>
        <button type="button" aria-label={`More actions for ${lead.name}`} className="shrink-0 rounded-full p-0.5 text-black hover:bg-black/10">
          <MoreHorizontal size={21} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-black/85">
        <span>Next follow-up action <span aria-hidden="true">→</span></span>
        <span className={`h-3 w-3 shrink-0 rounded-full ${isOverdue ? 'bg-red-500' : lead.nextFollowUp ? 'bg-amber-400' : 'bg-green-500'}`} title={isOverdue ? 'Overdue' : lead.nextFollowUp ? 'Follow-up scheduled' : 'No follow-up pending'} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/80 bg-black text-xs font-semibold text-white">
          {lead.assignedTo.avatar ? <img src={lead.assignedTo.avatar} alt="" className="h-full w-full object-cover" /> : lead.assignedTo.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="text-right text-[12px] leading-5 text-black/50">
          <p>updated on</p>
          <p>{formatUpdatedAt(lead.updatedAt ?? lead.createdAt ?? lead.lastContact)}</p>
        </div>
      </div>
    </div>
  );
}

function formatUpdatedAt(value?: string) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function LeadCard({ lead, columnAccent, onClick, canDrag, isOverdue }: LeadCardProps) {
  const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { lead, columnId: lead.status },
    animateLayoutChanges,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 140ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.22 : 1,
    zIndex: isDragging ? 50 : 1,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
    >
      <LeadCardContent
        lead={lead}
        columnAccent={columnAccent}
        onClick={onClick}
        canDrag={canDrag}
        isOverdue={isOverdue}
        className={isDragging ? 'crm-lead-card--dragging' : ''}
        style={style}
      />
    </div>
  );
}

function LeadCardPreview(props: LeadCardProps) {
  return <LeadCardContent {...props} className="crm-lead-card--preview" />;
}

LeadCard.Preview = LeadCardPreview;

export default LeadCard;
