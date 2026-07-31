'use client';

import React from 'react';
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/lib/kanban/kanban-data';
import { Clock, MessageSquare, Paperclip } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  columnAccent: string;
  onClick: (lead: Lead) => void;
  isOverdue?: boolean;
}

function LeadCardContent({ lead, columnAccent, onClick, isOverdue, className = '', style }: LeadCardProps & { className?: string; style?: React.CSSProperties }) {
  const sourceLower = lead.source.toLowerCase();
  const sourceDot = sourceLower.includes('google') || sourceLower.includes('search')
    ? '#3b82f6'
    : sourceLower.includes('facebook') || sourceLower.includes('instagram') || sourceLower.includes('social')
      ? '#ec4899'
      : sourceLower.includes('college') || sourceLower.includes('education')
        ? '#8b5cf6'
        : sourceLower.includes('referral')
          ? '#22c55e'
          : sourceLower.includes('walk') || sourceLower.includes('fair') || sourceLower.includes('event') || sourceLower.includes('school')
            ? '#f97316'
            : sourceLower.includes('call') || sourceLower.includes('whatsapp') || sourceLower.includes('sms')
              ? '#14b8a6'
              : '#94a3b8';
  const maskedPhone = lead.phone.replace(/(\+91-?\s?)?(\d{2})\d{3}\s?(\d{2})\d{3}/, '+91 $2XXX $3XXX');
  const followUpLabel = lead.nextFollowUp ? 'Today' : 'Not set';

  return (
    <div
      style={style}
      onClick={() => onClick(lead)}
      className={`crm-lead-card rounded-xl border border-white/10 bg-[#161d29] p-3 shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-lg ${className}`}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = columnAccent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--crm-border)';
      }}
    >
      <h4 className="text-sm text-white leading-tight mb-1 pr-2">
        {lead.name}
      </h4>

      <p className="text-xs text-white/45 mb-3">
        {maskedPhone}
      </p>

      <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
        <span className="h-2 w-2 rounded-full" style={{ background: sourceDot }} />
        <span className="truncate">{lead.source}</span>
      </div>

      <div className="mb-3 grid gap-1.5 text-[11px] text-white/55">
        <div className="flex justify-between gap-2">
          <span>Assigned</span>
          <span className="truncate text-white/75">{lead.assignedTo.name}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Follow-up</span>
          <span className={isOverdue ? 'text-red-300' : 'text-white/75'}>{followUpLabel}</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-2.5 mt-1" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white"
            style={{
              background: 'var(--primary-grad)',
            }}
          >
            {lead.assignedTo.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/50">
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

        <div className="flex items-center gap-1 text-[10px]">
          {isOverdue && <Clock size={10} className="text-red-400" />}
          <span
            className={isOverdue ? 'text-red-400' : 'text-white/45'}
            style={{ color: isOverdue ? '#ff005c' : undefined }}
          >
            {lead.lastContact}
          </span>
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, columnAccent, onClick, isOverdue }: LeadCardProps) {
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
      {...attributes}
      {...listeners}
    >
      <LeadCardContent
        lead={lead}
        columnAccent={columnAccent}
        onClick={onClick}
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
