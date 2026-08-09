'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, X } from 'lucide-react';
import {
  decideCrmLeadMoveRequest,
  getCrmLeadMoveRequests,
  type CrmLeadMoveRequest,
} from '@/lib/crm-api';

interface MoveRequestsPanelProps {
  currentUserId: string;
  onChanged: () => void;
  onShowToast: (message: string) => void;
}

const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function MoveRequestsPanel({ currentUserId, onChanged, onShowToast }: MoveRequestsPanelProps) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<CrmLeadMoveRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await getCrmLeadMoveRequests();
      setRequests(response.data);
    } catch {
      // The button remains usable for users whose grants are added later in-session.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  const incoming = useMemo(
    () => requests.filter((request) => request.ownerId === currentUserId && request.status === 'pending'),
    [currentUserId, requests],
  );
  const outgoing = useMemo(
    () => requests.filter((request) => request.requestedBy === currentUserId).slice(0, 10),
    [currentUserId, requests],
  );

  async function decide(request: CrmLeadMoveRequest, decision: 'approve' | 'reject') {
    setBusyId(request.id);
    try {
      await decideCrmLeadMoveRequest(request.id, decision);
      onShowToast(decision === 'approve' ? `${request.leadName} was moved` : 'Movement request rejected');
      await refresh();
      onChanged();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to decide movement request');
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((value) => !value); void refresh(); }}
        className="relative inline-flex items-center gap-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs font-semibold text-[var(--crm-text)]">
        <Clock3 size={14} /> Move requests
        {incoming.length > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">{incoming.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[390px] max-w-[85vw] rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Movement approvals</h3><button onClick={() => setOpen(false)}><X size={16} /></button></div>
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {incoming.length === 0 && <p className="rounded-xl bg-[var(--crm-panel)] p-3 text-xs text-[var(--crm-muted)]">No movement requests need your approval.</p>}
            {incoming.map((request) => (
              <div key={request.id} className="rounded-xl border border-[var(--crm-border)] p-3">
                <div className="text-sm font-semibold">{request.leadName}</div>
                <div className="mt-1 text-xs text-[var(--crm-muted)]">{label(request.fromStage)} → {label(request.toStage)} · requested by {request.requestedBy}</div>
                {request.reason && <p className="mt-2 text-xs">{request.reason}</p>}
                <div className="mt-3 flex gap-2">
                  <button disabled={busyId === request.id} onClick={() => void decide(request, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><Check size={13} /> Approve</button>
                  <button disabled={busyId === request.id} onClick={() => void decide(request, 'reject')} className="rounded-lg border border-[var(--crm-border)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Reject</button>
                </div>
              </div>
            ))}
            {outgoing.length > 0 && <div className="pt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--crm-muted)]">Your requests</div>}
            {outgoing.map((request) => <div key={`out-${request.id}`} className="flex justify-between rounded-lg bg-[var(--crm-panel)] p-2 text-xs"><span>{request.leadName} → {label(request.toStage)}</span><span className="font-semibold">{label(request.status)}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
