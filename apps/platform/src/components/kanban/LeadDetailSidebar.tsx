'use client';

import React, { useMemo, useState } from 'react';
import type { Lead, OfferDecision, Communication } from '@/lib/kanban/kanban-data';
import { COLUMNS } from '@/lib/kanban/kanban-data';
import { X, Phone, Mail, MessageSquare, Calendar, Send, User, FileText, Save, Pencil, History, Smartphone } from 'lucide-react';

interface LeadDetailSidebarProps {
  lead: Lead;
  onClose: () => void;
  onOfferDecision: (lead: Lead, decision: OfferDecision) => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
  canUpdateLead: boolean;
  canMoveLeadStage: boolean;
}

type EditDraft = Pick<Lead, 'name' | 'phone' | 'email' | 'course' | 'intake' | 'city'> & {
  assignedToName: string;
  parentName: string;
  parentPhone: string;
  parentRelation: string;
};

const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

export default function LeadDetailSidebar({
  lead,
  onClose,
  onOfferDecision,
  onUpdate,
  canUpdateLead,
  canMoveLeadStage,
}: LeadDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'moves' | 'notes'>('all');
  const [commTab, setCommTab] = useState<'call' | 'email' | 'sms' | 'whatsapp' | 'note'>('call');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(() => ({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    course: lead.course,
    intake: lead.intake,
    city: lead.city,
    assignedToName: lead.assignedTo.name,
    parentName: lead.parent.name,
    parentPhone: lead.parent.phone,
    parentRelation: lead.parent.relation,
  }));

  const currentColumn = COLUMNS.find((c) => c.id === lead.status);
  const visibleActivity = useMemo(() => {
    const entries = [...lead.moveHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (activeTab === 'moves') return entries.filter((entry) => entry.from);
    if (activeTab === 'notes') return entries.filter((entry) => entry.note);
    return entries;
  }, [activeTab, lead.moveHistory]);

  const communications = lead.communications ?? [];
  const visibleCommunications = communications.filter((item) => item.type === commTab).slice(0, 4);

  const offerOptions: { id: OfferDecision; label: string; className: string }[] = [
    { id: 'accepted', label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'rejected', label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'on-hold', label: 'On Hold', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'pending', label: 'Pending', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ];

  const formatStage = (stage: string) => COLUMNS.find((c) => c.id === stage)?.title ?? stage;

  function handleDraftChange(field: keyof EditDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSaveLead() {
    if (!canUpdateLead) return;
    const nextName = draft.name.trim() || lead.name;
    onUpdate(lead.id, {
      name: nextName,
      initials: nextName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      course: draft.course.trim(),
      intake: draft.intake.trim(),
      city: draft.city.trim(),
      assignedTo: { ...lead.assignedTo, name: draft.assignedToName.trim() || lead.assignedTo.name },
      parent: {
        name: draft.parentName.trim(),
        phone: draft.parentPhone.trim(),
        relation: draft.parentRelation.trim() || 'Parent',
      },
      lastContact: 'just now',
    });
    setIsEditing(false);
  }

  function logCommunication(type: Communication['type'], subject: string, summary: string) {
    const entry: Communication = {
      id: `c-${Date.now()}`,
      type,
      direction: 'outbound',
      subject,
      summary,
      by: 'current-user',
      byName: 'Admission Team',
      timestamp: new Date().toISOString(),
      duration: type === 'call' ? 'Direct call' : undefined,
    };

    onUpdate(lead.id, {
      communications: [entry, ...communications],
      communicationCount: lead.communicationCount + 1,
      lastContact: 'just now',
    });
    setCommTab(type);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]" onClick={onClose} />

      <aside
        className="campus-lead-sidebar fixed right-0 top-0 h-full w-full max-w-[440px] bg-[var(--crm-surface)] border-l border-[var(--crm-border)] z-[110] shadow-2xl flex flex-col overflow-hidden animate-slide-in"
        style={{ animation: 'slideIn 0.25s ease-out' }}
      >
        <div className="px-5 py-4 border-b border-[var(--crm-border)] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-[var(--crm-text)] text-sm">Lead Details</h3>
            <p className="text-[10px] text-[var(--crm-muted)] font-medium uppercase tracking-wider">{lead.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 kanban-scroll-hidden">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'var(--primary-grad)' }}
            >
              {lead.initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--crm-text)]">{lead.name}</h2>
              <p className="text-xs text-[var(--crm-muted)] mt-0.5">{lead.course} | {lead.intake}</p>
              {currentColumn && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColumn.accent }} />
                  <span className="text-[11px] text-[var(--crm-muted)]">{currentColumn.title}</span>
                </div>
              )}
            </div>
            {canUpdateLead && (
              <button
                type="button"
                onClick={() => setIsEditing((editing) => !editing)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] text-[11px] font-bold text-[var(--crm-muted)] hover:text-[var(--crm-text)]"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>

          {isEditing && canUpdateLead && (
            <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider mb-3">Edit Lead Data</h4>
              <div className="campus-lead-form-grid grid grid-cols-2 gap-3">
                {[
                  ['name', 'Student name'],
                  ['phone', 'Phone'],
                  ['email', 'Email'],
                  ['course', 'Course'],
                  ['intake', 'Intake'],
                  ['city', 'City'],
                  ['assignedToName', 'Assigned to'],
                  ['parentName', 'Parent name'],
                  ['parentPhone', 'Parent phone'],
                  ['parentRelation', 'Relation'],
                ].map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="block text-[10px] font-bold uppercase text-[var(--crm-muted)] mb-1">{label}</span>
                    <input
                      value={draft[field as keyof EditDraft]}
                      onChange={(event) => handleDraftChange(field as keyof EditDraft, event.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs text-[var(--crm-text)] outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/25"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveLead}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'var(--primary-grad)' }}
              >
                <Save size={14} />
                Save lead data
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${lead.phone}`}
              onClick={() => logCommunication('call', 'Direct call started', `Called ${lead.name} on ${lead.phone}`)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--primary-grad)' }}
            >
              <Phone size={14} /> Call
            </a>
            <a href={`mailto:${lead.email}`} onClick={() => logCommunication('email', 'Email opened', `Opened email composer for ${lead.email}`)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-surface-container)] hover:bg-[var(--crm-panel)] border border-[var(--crm-border)] transition-colors">
              <Mail size={14} /> Email
            </a>
            <a href={`https://wa.me/${cleanPhone(lead.phone)}`} target="_blank" rel="noopener noreferrer" onClick={() => logCommunication('whatsapp', 'WhatsApp opened', `Opened WhatsApp chat with ${lead.name}`)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-surface-container)] hover:bg-[var(--crm-panel)] border border-[var(--crm-border)] transition-colors">
              <MessageSquare size={14} /> WhatsApp
            </a>
          </div>

          {lead.status === 'offer-status' && canMoveLeadStage && (
            <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider mb-3">Offer Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {offerOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onOfferDecision(lead, option.id)}
                    className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all ${
                      (lead.offerDecision ?? 'pending') === option.id
                        ? option.className
                        : 'bg-[var(--crm-surface)] text-[var(--crm-muted)] border-[var(--crm-border)] hover:text-[var(--crm-text)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                <Smartphone size={14} className="text-[var(--crm-muted)] shrink-0" />
                <a href={`sms:${lead.phone}`} onClick={() => logCommunication('sms', 'SMS opened', `Opened SMS composer for ${lead.phone}`)} className="hover:text-[var(--crm-soft-blue)] transition-colors">Send SMS</a>
              </div>
            </div>

            {lead.parent.name && (
              <div className="mt-4 pt-3 border-t border-[var(--crm-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--crm-muted)] mb-1">
                  <User size={12} />
                  <span className="font-semibold">{lead.parent.relation}</span>
                </div>
                <p className="text-sm font-medium text-[var(--crm-text)]">{lead.parent.name}</p>
                <a href={`tel:${lead.parent.phone}`} className="text-xs text-[var(--crm-muted)] hover:text-[var(--crm-soft-blue)]">{lead.parent.phone}</a>
              </div>
            )}
          </div>

          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider">Documents</h4>
              <span className="text-xs font-semibold" style={{ color: lead.documents.uploaded === lead.documents.required ? '#10b981' : 'var(--crm-soft-blue)' }}>
                {lead.documents.uploaded}/{lead.documents.required}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--crm-panel)] mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(lead.documents.uploaded / Math.max(lead.documents.required, 1)) * 100}%`,
                  background: 'linear-gradient(90deg, var(--tenant-primary), var(--tenant-secondary))',
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

          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider">Activity History</h4>
              <History size={14} className="text-[var(--crm-muted)]" />
            </div>

            <div className="flex gap-1 mb-4 overflow-x-auto kanban-scroll-hidden">
              {(['all', 'moves', 'notes'] as const).map((tab) => (
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

            <div className="space-y-3">
              {visibleActivity.length === 0 ? (
                <p className="text-xs text-[var(--crm-muted)] py-2">No activity recorded yet.</p>
              ) : (
                visibleActivity.map((entry) => {
                  const isMove = Boolean(entry.from);
                  return (
                    <div key={entry.id} className="grid grid-cols-[22px_1fr] gap-3">
                      <div className="relative flex justify-center">
                        <span className="absolute top-6 bottom-[-12px] w-px bg-[var(--crm-border)] last:hidden" />
                        <span className="relative z-10 w-5 h-5 rounded-full border-2 bg-[var(--crm-card)] flex items-center justify-center" style={{ borderColor: isMove ? '#776cf5' : '#10b981' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isMove ? '#776cf5' : '#10b981' }} />
                        </span>
                      </div>
                      <div className="min-w-0 pb-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-bold text-[var(--crm-text)]">
                            {isMove ? `${formatStage(entry.from)} to ${formatStage(entry.to)}` : 'Added to pipeline'}
                          </p>
                          <span className="shrink-0 text-[10px] text-[var(--crm-muted)] font-semibold">
                            {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {entry.note && <p className="text-[11px] text-[var(--crm-muted)] mt-1 leading-relaxed">{entry.note}</p>}
                        <p className="text-[10px] text-[var(--crm-muted)] mt-1 font-medium">{entry.byName}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[var(--crm-muted)] uppercase tracking-wider">Communication</h4>
              <button
                type="button"
                onClick={() => logCommunication('note', 'Manual note added', 'Follow-up note added from lead sidebar')}
                className="text-xs font-semibold text-[var(--crm-soft-blue)] hover:underline"
              >
                Log note
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1 mb-3">
              {(['call', 'email', 'sms', 'whatsapp', 'note'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCommTab(tab)}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-semibold transition-colors whitespace-nowrap ${
                    commTab === tab
                      ? 'bg-[var(--crm-panel)] text-[var(--crm-text)]'
                      : 'text-[var(--crm-muted)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <a href={`tel:${lead.phone}`} onClick={() => logCommunication('call', 'Direct call started', `Called ${lead.name} from CRM`)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: 'var(--primary-grad)' }}>
                <Phone size={13} /> Call student
              </a>
              <a href={`tel:${lead.parent.phone}`} onClick={() => logCommunication('call', 'Parent call started', `Called ${lead.parent.relation}: ${lead.parent.name}`)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[11px] font-bold text-[var(--crm-text)]">
                <Phone size={13} /> Call parent
              </a>
              <a href={`https://wa.me/${cleanPhone(lead.phone)}`} target="_blank" rel="noopener noreferrer" onClick={() => logCommunication('whatsapp', 'WhatsApp follow-up', `Opened WhatsApp for ${lead.name}`)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[11px] font-bold text-[var(--crm-text)]">
                <MessageSquare size={13} /> WhatsApp
              </a>
            </div>

            {visibleCommunications.length > 0 ? (
              <div className="flex flex-col gap-2">
                {visibleCommunications.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-[var(--crm-panel)]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[var(--crm-text)] truncate">{item.subject}</span>
                      {item.duration && <span className="text-[10px] text-[var(--crm-muted)] shrink-0">{item.duration}</span>}
                    </div>
                    <p className="text-[11px] text-[var(--crm-muted)] leading-relaxed">{item.summary}</p>
                    <p className="text-[10px] text-[var(--crm-muted)] mt-1">{item.byName} | {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
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
