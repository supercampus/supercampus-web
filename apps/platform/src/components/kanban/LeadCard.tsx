'use client';

import React from 'react';
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/lib/kanban/kanban-data';
import { Phone, Mail, MapPin, Paperclip, MessageSquare, Clock } from 'lucide-react';

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
      className={`crm-lead-card bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-3 shadow-sm group ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${className}`}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = columnAccent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--crm-border)';
      }}
    >
      <h4 className="font-semibold text-sm text-[var(--crm-text)] leading-tight mb-1 pr-2">
        {lead.name}
      </h4>

      <p className="text-xs text-[var(--crm-on-surface-variant)] mb-2.5">
        {lead.course} | {lead.intake}
      </p>

      <div className="flex flex-col gap-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--crm-muted)]">
          <Phone size={11} />
          <span>{lead.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--crm-muted)]">
          <Mail size={11} />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--crm-muted)]">
          <MapPin size={11} />
          <span>{lead.city}</span>
        </div>
      </div>

      <div className="border-t border-[var(--crm-border)] pt-2.5 mt-1" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{
              background: 'var(--primary-grad)',
            }}
          >
            {lead.assignedTo.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--crm-muted)] font-medium">
            <span className="flex items-center gap-0.5">
              <Paperclip size={10} />
              {lead.documents.uploaded}/{lead.documents.required}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageSquare size={10} />
              {lead.communicationCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-medium">
          {isOverdue && <Clock size={10} className="text-[var(--crm-danger)]" />}
          <span
            className={isOverdue ? 'text-[var(--crm-danger)]' : 'text-[var(--crm-muted)]'}
            style={{ color: isOverdue ? '#ff005c' : undefined }}
          >
            {lead.lastContact}
          </span>
        </div>
      </div>
    </div>
  );
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
