'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/lib/kanban/kanban-data';
import { Phone, Mail, MapPin, Paperclip, MessageSquare, Clock } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  columnAccent: string;
  onClick: (lead: Lead) => void;
  isOverdue?: boolean;
}

export default function LeadCard({ lead, columnAccent, onClick, isOverdue }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead, columnId: lead.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    rotate: isDragging ? '2deg' : '0deg',
    zIndex: isDragging ? 50 : 1,
  };

  const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    hot: { bg: 'rgba(255,0,92,0.08)', text: '#ff005c', border: '#ff005c' },
    warm: { bg: 'rgba(222,108,245,0.08)', text: '#de6cf5', border: '#de6cf5' },
    cold: { bg: 'rgba(119,108,245,0.08)', text: '#776cf5', border: '#776cf5' },
  };

  const pc = priorityColors[lead.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-3 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = columnAccent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--crm-border)';
      }}
    >
      {/* Top row: priority badge + more */}
      <div className="flex items-start justify-between mb-1.5">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border"
          style={{
            backgroundColor: pc.bg,
            color: pc.text,
            borderColor: pc.border,
          }}
        >
          {lead.priority.toUpperCase()}
        </span>
        <div className="flex gap-1.5">
          {lead.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-[var(--crm-panel)] text-[var(--crm-muted)] rounded text-[9px] font-semibold leading-none"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Name */}
      <h4 className="font-semibold text-sm text-[var(--crm-text)] leading-tight mb-1">
        {lead.name}
      </h4>

      {/* Course & Intake */}
      <p className="text-xs text-[var(--crm-on-surface-variant)] mb-2.5">
        {lead.course} | {lead.intake}
      </p>

      {/* Contact info */}
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

      {/* Divider */}
      <div className="border-t border-[var(--crm-border)] pt-2.5 mt-1" />

      {/* Bottom row: indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Assigned counselor avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #1400ff, #a600ff)',
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
