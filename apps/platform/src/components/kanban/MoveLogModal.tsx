'use client';

import React, { useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';

interface MoveLogModalProps {
  leadName: string;
  fromColumn: string;
  toColumn: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export default function MoveLogModal({ leadName, fromColumn, toColumn, onConfirm, onCancel }: MoveLogModalProps) {
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onConfirm(note.trim());
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-border)] p-6 w-full max-w-md shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[var(--crm-soft-blue)]/10 flex items-center justify-center mb-4 mx-auto">
          <FileText size={24} style={{ color: 'var(--crm-soft-blue)' }} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--crm-text)] text-center mb-1">Update Lead Status</h3>
        <p className="text-sm text-[var(--crm-muted)] text-center mb-5">
          Moving <span className="font-semibold text-[var(--crm-text)]">{leadName}</span>
        </p>

        {/* From → To display */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="px-3 py-1.5 rounded-lg bg-[var(--crm-panel)] text-xs font-medium text-[var(--crm-text)]">{fromColumn}</span>
          <ArrowRight size={18} className="text-[var(--crm-soft-blue)] shrink-0" />
          <span className="px-3 py-1.5 rounded-lg font-medium text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
          >
            {toColumn}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1.5">
              Add a note <span className="text-[var(--crm-danger)]">*</span>
              <span className="text-[var(--crm-muted)] font-normal ml-1">(required for audit log)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Discussed fee structure, student confirmed interest..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] placeholder:text-[var(--crm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30 resize-none"
              required
            />
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
              disabled={!note.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{
                background: !note.trim() ? 'var(--crm-muted)' : 'linear-gradient(135deg, #1400ff, #a600ff)',
              }}
            >
              Confirm Move
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
