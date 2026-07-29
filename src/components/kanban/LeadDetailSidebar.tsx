'use client';

import React, { useState } from 'react';
import type { Lead, Communication } from '@/lib/kanban/kanban-data';
import { COLUMNS } from '@/lib/kanban/kanban-data';
import { X, Phone, Mail, MessageSquare, Calendar, Paperclip, Edit3, Archive, Send, ChevronDown, Clock, User, FileText } from 'lucide-react';

interface LeadDetailSidebarProps {
  lead: Lead;
  onClose: () => void;
  onArchive: (lead: Lead) => void;
  onMove: (lead: Lead, to: string) => void;
}

export default function LeadDetailSidebar({ lead, onClose, onArchive, onMove }: LeadDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'moves' | 'calls' | 'notes' | 'documents'>('all');
  const [commTab, setCommTab] = useState<'calls' | 'emails' | 'sms' | 'whatsapp' | 'notes'>('calls');

  const priorityLabel = lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1);
  const priorityColor = lead.priority === 'hot' ? '#ff005c' : lead.priority === 'warm' ? '#de6cf5' : '#776cf5';

  const currentColumn = COLUMNS.find((c) => c.id === lead.status);

  const activityFeed = [...lead.moveHistory]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const priorityClasses = {
    hot: 'bg-[#ff005c]/10 text-[#ff005c] border-[#ff005c]',
    warm: 'bg-[#de6cf5]/10 text-[#de6cf5] border-[#de6cf5]',
    cold: 'bg-[#776cf5]/10 text-[#776cf5] border-[#776cf5]',
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]" onClick={onClose} />

      {/* Sidebar */}
      <aside
        className="fixed right-0 top-0 h-full w-[420px] bg-[var(--crm-surface)] border-l border-[var(--crm-border)] z-[110] shadow-2xl flex flex-col overflow-hidden animate-slide-in"
        style={{ animation: 'slideIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--crm-border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-[var(--crm-text)] text-sm">Lead Details</h3>
            <p className="text-[10px] text-[var(--crm-muted)] font-medium uppercase tracking-wider">{lead.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Profile section */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
            >
              {lead.initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--crm-text)]">{lead.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityClasses[lead.priority]}`}>
                  {priorityLabel}
                </span>
                <span className="text-xs text-[var(--crm-muted)]">{lead.course} | {lead.intake}</span>
              </div>
              {currentColumn && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColumn.accent }} />
                  <span className="text-[11px] text-[var(--crm-muted)]">{currentColumn.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
              onClick={() => onMove(lead, 'contact-attempted')}
            >
              <Phone size={14} /> Call
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-surface-container)] hover:bg-[var(--crm-panel)] border border-[var(--crm-border)] transition-colors">
              <Mail size={14} /> Email
            </button>
            <button
              onClick={() => onArchive(lead)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[var(--crm-muted)] bg-[var(--crm-panel)] hover:bg-red-50 hover:text-[var(--crm-danger)] transition-colors"
            >
              <Archive size={14} /> Archive
            </button>
          </div>

          {/* Contact info */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider mb-3">Contact</h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-sm text-[var(--crm-text)]">
                <Phone size={14} className="text-[var(--crm-muted)] shrink-0" />
                <a href={`tel:${lead.phone}`} className="hover:text-[var(--crm-soft-blue)] transition-colors">{lead.phone}</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[var(--crm-text)]">
                <Mail size={14} className="text-[var(--crm-muted)] shrink-0" />
                <a href={`mailto:${lead.email}`} className="hover:text-[var(--crm-soft-blue)] truncate transition-colors">{lead.email}</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[var(--crm-text)]">
                <MessageSquare size={14} className="text-[var(--crm-muted)] shrink-0" />
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">WhatsApp</a>
              </div>
            </div>

            {/* Parent info */}
            {lead.parent.name && (
              <div className="mt-4 pt-3 border-t border-[var(--crm-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--crm-muted)] mb-1">
                  <User size={12} />
                  <span className="font-semibold">{lead.parent.relation}</span>
                </div>
                <p className="text-sm font-medium text-[var(--crm-text)]">{lead.parent.name}</p>
                <p className="text-xs text-[var(--crm-muted)]">{lead.parent.phone}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider">Documents</h4>
              <span className="text-xs font-semibold" style={{ color: lead.documents.uploaded === lead.documents.required ? '#10b981' : 'var(--crm-soft-blue)' }}>
                {lead.documents.uploaded}/{lead.documents.required}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-[var(--crm-panel)] mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(lead.documents.uploaded / Math.max(lead.documents.required, 1)) * 100}%`,
                  background: 'linear-gradient(90deg, #1400ff, #a600ff)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {['10th Grade Marksheet', '12th Grade Marksheet', 'Identity Proof', 'Migration Certificate', 'Character Certificate'].slice(0, lead.documents.required).map((doc, i) => {
                const isVerified = i < lead.documents.uploaded;
                return (
                  <div key={doc} className="flex items-center gap-2 text-xs">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-100 text-green-600' : 'bg-[var(--crm-panel)] text-[var(--crm-muted)]'}`}>
                      {isVerified ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                      )}
                    </span>
                    <span className={isVerified ? 'text-[var(--crm-text)] font-medium' : 'text-[var(--crm-muted)]'}>{doc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity History */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider mb-3">Activity History</h4>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto">
              {(['all', 'moves', 'calls', 'notes', 'documents'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[var(--crm-panel)] text-[var(--crm-text)]'
                      : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Timeline */}
            <div className="relative pl-5 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-[1.5px] before:bg-[var(--crm-border)]">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-[var(--crm-muted)] py-2">No activity recorded yet.</p>
              ) : (
                activityFeed.map((entry, i) => {
                  const dotColor = entry.to === 'archived' ? '#ff005c' : entry.from ? '#776cf5' : '#10b981';
                  const icon = entry.to === 'archived' ? Archive : entry.from ? ChevronDown : Plus;
                  const Icon = icon;
                  return (
                    <div key={entry.id} className="relative pb-4 last:pb-0">
                      <div
                        className="absolute left-[-15px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: dotColor, backgroundColor: 'var(--crm-card)' }}
                      >
                        <Icon size={8} style={{ color: dotColor }} />
                      </div>
                      <p className="text-xs font-semibold text-[var(--crm-text)]">
                        {entry.from ? `${entry.from.charAt(0).toUpperCase() + entry.from.slice(1)} → ${entry.to.charAt(0).toUpperCase() + entry.to.slice(1)}` : `Added to pipeline`}
                      </p>
                      {entry.note && (
                        <p className="text-[11px] text-[var(--crm-muted)] mt-0.5">{entry.note}</p>
                      )}
                      <p className="text-[10px] text-[var(--crm-muted)] mt-0.5 font-medium">
                        {entry.byName} · {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Communication */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider">Communication</h4>
              <button className="text-xs font-semibold text-[var(--crm-soft-blue)] hover:underline">+ Log Activity</button>
            </div>

            {/* Comm tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto">
              {(['calls', 'emails', 'sms', 'whatsapp', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCommTab(tab)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors whitespace-nowrap ${
                    commTab === tab
                      ? 'bg-[var(--crm-panel)] text-[var(--crm-text)]'
                      : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {lead.communications && lead.communications.filter((c) => c.type === commTab || commTab === 'calls').length > 0 ? (
              <div className="flex flex-col gap-2">
                {lead.communications.filter((c) => c.type === commTab || commTab === 'calls').slice(0, 3).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-[var(--crm-panel)]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-[var(--crm-text)]">{c.subject}</span>
                      {c.duration && <span className="text-[10px] text-[var(--crm-muted)]">· {c.duration}</span>}
                    </div>
                    <p className="text-[11px] text-[var(--crm-muted)]">{c.summary}</p>
                    <p className="text-[10px] text-[var(--crm-muted)] mt-0.5">{c.byName} · {new Date(c.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageSquare size={20} className="mx-auto text-[var(--crm-muted)] mb-1" />
                <p className="text-xs text-[var(--crm-muted)]">No {commTab} logged yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors">
              <Calendar size={14} /> Schedule Follow-up
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors">
              <Send size={14} /> Send Reminder
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors">
              <User size={14} /> Assign Counselor
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors">
              <FileText size={14} /> Generate Offer
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--crm-border)] bg-[var(--crm-surface)] shrink-0">
          <button className="w-full py-2.5 rounded-xl border border-[var(--crm-border)] text-xs font-medium text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors">
            Edit Lead Data
          </button>
        </div>
      </aside>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// Icon component for the fabricated Plus used in activity
function Plus({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size ?? 8} height={size ?? 8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
