'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ArchiveModalProps {
  leadName: string;
  onConfirm: (reason: string, notes: string) => void;
  onCancel: () => void;
}

export default function ArchiveModal({ leadName, onConfirm, onCancel }: ArchiveModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    onConfirm(reason, notes);
  };

  const reasons = ['Not Interested', 'Not Eligible', 'Joined Competitor', 'No Response', 'Spam', 'Other'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-border)] p-6 w-full max-w-md shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle size={24} className="text-[var(--crm-danger)]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--crm-text)] text-center mb-1">Archive Lead</h3>
        <p className="text-sm text-[var(--crm-muted)] text-center mb-5">
          This will remove <span className="font-semibold text-[var(--crm-text)]">{leadName}</span> from the active pipeline.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1.5">Reason *</label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    reason === r
                      ? 'border-[var(--crm-danger)] bg-red-50 text-[var(--crm-danger)]'
                      : 'border-[var(--crm-border)] text-[var(--crm-text)] hover:bg-[var(--crm-panel)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1.5">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Add context for archiving..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ff005c]/5 border border-[#ff005c]/15">
            <AlertTriangle size={14} className="text-[var(--crm-danger)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--crm-muted)]">This removes the lead from active pipeline and moves it to archive.</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-[var(--crm-border)] text-sm font-medium text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{
                background: !reason ? 'var(--crm-muted)' : 'linear-gradient(135deg, #ff005c, #de6cf5)',
              }}
            >
              Archive Lead
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
