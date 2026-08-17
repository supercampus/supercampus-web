'use client';

import React, { useEffect, useRef, useState } from 'react';
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, ExternalLink, Mail, MoreHorizontal, Phone } from 'lucide-react';
import type { Lead } from '@/lib/kanban/kanban-data';

interface LeadCardProps {
  lead: Lead;
  columnAccent: string;
  onClick: (lead: Lead) => void;
  canDrag: boolean;
  isOverdue?: boolean;
}

const PRIORITY_STYLES: Record<string, { label: string; dot: string }> = {
  urgent: { label: 'Urgent priority', dot: 'bg-red-500' },
  high: { label: 'High priority', dot: 'bg-orange-500' },
  medium: { label: 'Medium priority', dot: 'bg-amber-400' },
  low: { label: 'Low priority', dot: 'bg-sky-500' },
};

function LeadCardContent({ lead, columnAccent, onClick, canDrag, isOverdue, className = '', style }: LeadCardProps & { className?: string; style?: React.CSSProperties }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const metadata = [lead.course, lead.intake]
    .filter((value): value is string => Boolean(value && value !== 'Not provided'));
  const secondaryText = metadata.length > 0 ? metadata.join(' · ') : lead.source || 'Lead details pending';
  const priorityKey = String(lead.priority ?? lead.tags?.[0] ?? 'medium').toLowerCase();
  const priority = PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES.medium;
  const cardContext = lead.nextFollowUp
    ? formatFollowUp(lead.nextFollowUp, isOverdue)
    : formatLeadContext(lead);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const stopCardInteraction = (event: React.SyntheticEvent) => event.stopPropagation();

  const copyContact = async () => {
    const contact = lead.phone || lead.email;
    if (!contact) return;
    await navigator.clipboard.writeText(contact);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      style={style}
      onClick={() => onClick(lead)}
      className={`crm-lead-card group relative mb-3 rounded-[28px] bg-white p-5 text-black shadow-[0_8px_22px_rgba(20,24,40,0.06)] transition-transform hover:-translate-y-0.5 ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${className}`}
      onMouseEnter={(event) => { event.currentTarget.style.borderColor = columnAccent; }}
      onMouseLeave={(event) => { event.currentTarget.style.borderColor = 'var(--crm-border)'; }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate pr-2 text-[21px] font-medium leading-tight">{lead.name}</h4>
          <p className="mt-1 truncate text-[13px] text-black/75">{secondaryText}</p>
        </div>
        <div ref={menuRef} className="relative shrink-0" onPointerDown={stopCardInteraction} onClick={stopCardInteraction}>
          <button type="button" aria-label={`More actions for ${lead.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-full p-1 text-black transition-colors hover:bg-black/10">
            <MoreHorizontal size={21} strokeWidth={2.5} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-lg border border-black/10 bg-white py-1 text-[13px] shadow-xl">
              <button type="button" onClick={() => { setMenuOpen(false); onClick(lead); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5">
                <ExternalLink size={15} /> Open details
              </button>
              {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5"><Phone size={15} /> Call applicant</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 px-3 py-2 hover:bg-black/5"><Mail size={15} /> Send email</a>}
              {(lead.phone || lead.email) && (
                <button type="button" onClick={copyContact} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5"><Copy size={15} /> {copied ? 'Copied' : 'Copy contact'}</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-black/85">
        <span className="truncate">{cardContext}</span>
        <span className={`h-3 w-3 shrink-0 rounded-full ${priority.dot}`} title={priority.label} aria-label={priority.label} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/80 bg-black text-xs font-semibold text-white" title={lead.assignedTo.name}>
          {lead.assignedTo.avatar ? <img src={lead.assignedTo.avatar} alt="" className="h-full w-full object-cover" /> : lead.assignedTo.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="text-right text-[12px] leading-5 text-black/50">
          <p>updated</p>
          <p>{formatUpdatedAt(lead.updatedAt ?? lead.createdAt ?? lead.lastContact)}</p>
        </div>
      </div>
    </div>
  );
}

function formatFollowUp(value?: string | null, isOverdue?: boolean) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (isOverdue || date.getTime() < Date.now()) return `Overdue · ${time}`;
  if (isToday) return `Today · ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${time}`;
}

function formatLeadContext(lead: Lead) {
  const source = lead.source?.trim();
  if (source && source.toLowerCase() !== 'unknown') return `Source - ${source}`;
  if (lead.city?.trim()) return `Location - ${lead.city.trim()}`;
  if (lead.assignedTo.name && lead.assignedTo.name !== 'Unassigned') return `Owner - ${lead.assignedTo.name}`;
  return `Last activity - ${formatUpdatedAt(lead.updatedAt ?? lead.createdAt ?? lead.lastContact)}`;
}

function formatUpdatedAt(value?: string) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function LeadCard({ lead, columnAccent, onClick, canDrag, isOverdue }: LeadCardProps) {
  const animateLayoutChanges: AnimateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
    <div ref={setNodeRef} {...(canDrag ? attributes : {})} {...(canDrag ? listeners : {})}>
      <LeadCardContent lead={lead} columnAccent={columnAccent} onClick={onClick} canDrag={canDrag} isOverdue={isOverdue} className={isDragging ? 'crm-lead-card--dragging' : ''} style={style} />
    </div>
  );
}

function LeadCardPreview(props: LeadCardProps) {
  return <LeadCardContent {...props} className="crm-lead-card--preview" />;
}

LeadCard.Preview = LeadCardPreview;

export default LeadCard;
