'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, Pause, X } from 'lucide-react';
import type { Lead } from '@/lib/kanban/kanban-data';

interface OutcomeRegisterColumnProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

type Outcome = 'approved' | 'rejected' | 'hold';

const OUTCOMES = [
  { id: 'approved', label: 'Approved', icon: Check, color: '#16a34a', surface: '#f0fdf4' },
  { id: 'rejected', label: 'Rejected', icon: X, color: '#dc2626', surface: '#fef2f2' },
  { id: 'hold', label: 'On Hold', icon: Pause, color: '#d97706', surface: '#fffbeb' },
] as const;

function outcomeFor(lead: Lead): Outcome | null {
  if (lead.globalStatus === 'on_hold' || (lead.status === 'offer-status' && lead.substate === 'to_do')) return 'hold';
  if (lead.status === 'offer-status' && lead.substate === 'accepted') return 'approved';
  if (lead.status === 'archived' || (lead.status === 'offer-status' && lead.substate === 'rejected')) return 'rejected';
  return null;
}

export default function OutcomeRegisterColumn({ leads, onLeadClick }: OutcomeRegisterColumnProps) {
  const [selected, setSelected] = useState<Outcome>('approved');
  const grouped = useMemo(() => {
    const result: Record<Outcome, Lead[]> = { approved: [], rejected: [], hold: [] };
    leads.forEach((lead) => {
      const outcome = outcomeFor(lead);
      if (outcome) result[outcome].push(lead);
    });
    return result;
  }, [leads]);

  return (
    <section className="crm-kanban-column flex w-[350px] shrink-0 flex-col overflow-hidden rounded-t-xl bg-[#f0f0f0]" aria-label="Offer and application outcomes">
      <header className="px-5 pb-4 pt-5">
        <h3 className="text-[15px] font-semibold uppercase tracking-[0.03em] text-[var(--kanban-column-text)]">Offer / Status</h3>
      </header>
      <div aria-hidden="true" className="h-1 w-full bg-black" />

      <div className="grid grid-cols-3 gap-2 p-4">
        {OUTCOMES.map(({ id, label, icon: Icon, color, surface }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className="flex min-h-24 flex-col items-start justify-between rounded-lg border p-3 text-left transition-transform hover:-translate-y-0.5"
              style={{ borderColor: active ? color : 'var(--crm-border)', backgroundColor: surface }}
              aria-pressed={active}
            >
              <Icon size={16} style={{ color }} />
              <span className="text-2xl font-semibold text-black">{grouped[id].length}</span>
              <span className="text-[11px] font-semibold text-black/65">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-4 border-t border-[var(--crm-border)]" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 kanban-scroll-hidden">
        {grouped[selected].length === 0 ? (
          <p className="py-8 text-center text-xs text-[var(--crm-muted)]">No {OUTCOMES.find((item) => item.id === selected)?.label.toLowerCase()} applications</p>
        ) : (
          <div className="divide-y divide-[var(--crm-border)]">
            {grouped[selected].map((lead) => (
              <button key={lead.id} type="button" onClick={() => onLeadClick(lead)} className="flex w-full items-center gap-3 py-3 text-left hover:opacity-70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">{lead.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--crm-text)]">{lead.name}</span>
                  <span className="block truncate text-[11px] text-[var(--crm-muted)]">{lead.course || lead.source || 'Application record'}</span>
                </span>
                <ChevronRight size={15} className="shrink-0 text-[var(--crm-muted)]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
