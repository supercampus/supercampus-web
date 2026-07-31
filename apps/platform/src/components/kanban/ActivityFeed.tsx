'use client';

import React, { useState } from 'react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { Bell, X, ArrowRight, MessageSquare } from 'lucide-react';

interface ActivityFeedProps {
  leads: Lead[];
}

export default function ActivityFeed({ leads }: ActivityFeedProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Build activity feed from all leads' moveHistory
  const allActivity = leads
    .flatMap((lead) =>
      lead.moveHistory.map((m) => ({
        ...m,
        leadName: lead.name,
        leadId: lead.id,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-[var(--crm-panel)] transition-colors relative"
      >
        <Bell size={18} className="text-[var(--crm-text)]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--crm-danger)] rounded-full border-2 border-[var(--crm-surface)]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-[380px] bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-2xl shadow-xl z-50 overflow-hidden"
            style={{ animation: 'dropIn 0.15s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--crm-border)]">
              <h3 className="text-sm font-semibold text-[var(--crm-text)]">Activity</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-[var(--crm-panel)] text-[var(--crm-muted)]">
                <X size={14} />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-1 px-4 py-2 border-b border-[var(--crm-border)] overflow-x-auto kanban-scroll-hidden">
              {['All', 'Moves', 'Calls', 'Notes'].map((f) => (
                <button
                  key={f}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-[var(--crm-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Feed */}
            <div className="max-h-[320px] overflow-y-auto kanban-scroll-hidden">
              {allActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Bell size={24} className="mx-auto text-[var(--crm-muted)] mb-2" />
                  <p className="text-xs text-[var(--crm-muted)]">No recent activity</p>
                </div>
              ) : (
                allActivity.map((entry) => {
                  const isMove = entry.from && entry.to;
                  const iconColor = isMove ? '#776cf5' : '#10b981';
                  const Icon = isMove ? ArrowRight : MessageSquare;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--crm-panel)] transition-colors border-b border-[var(--crm-border)] last:border-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${iconColor}14` }}
                      >
                        <Icon size={13} style={{ color: iconColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[var(--crm-text)]">
                          <span className="font-semibold">{entry.byName}</span>
                          {isMove
                            ? ` moved ${entry.leadName}`
                            : ` added ${entry.leadName}`}
                        </p>
                        {entry.note && (
                          <p className="text-[11px] text-[var(--crm-muted)] mt-0.5 truncate">{entry.note}</p>
                        )}
                        <p className="text-[10px] text-[var(--crm-muted)] mt-0.5 font-medium">
                          {new Date(entry.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
