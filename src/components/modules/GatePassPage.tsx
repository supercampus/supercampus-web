'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { GP_HISTORY, stepper, ICONS } from '@/lib/data';
import { Card, SectionTitle, AppNotice, Stepper } from '@/components/ui/primitives';

const BASE_TYPES = ['Day Exit', 'Medical', 'Official', 'Placement', 'Sports', 'Cultural', 'Industrial Visit', 'Internship', 'NSS / NCC'];
const HOSTEL_TYPES = ['Out-pass', 'Night Out', 'Weekend Leave', 'Home Visit', 'Emergency'];

export default function GatePassPage() {
  const { state, dispatch, toast } = useApp();
  const hosteller = state.persona === 'hosteller';
  const types = hosteller ? [...HOSTEL_TYPES, ...BASE_TYPES] : BASE_TYPES;
  const gp = state.gp;
  const steps = gp.early ? ['Student', 'Class Incharge', 'HOD', 'Security', 'Exit'] : ['Auto-approved', 'Exit QR ready'];
  const stepItems = stepper(steps, gp.step);

  function apply(type: string) {
    dispatch({ type: 'GP_APPLY', gpType: type, early: type !== 'Day Exit' });
  }
  function advance() {
    dispatch({ type: 'GP_ADVANCE' });
    const updatedStep = Math.min(gp.step + 1, steps.length - 1);
    if (updatedStep === steps.length - 1) toast('Gate pass approved — QR ready');
  }
  function reset() { dispatch({ type: 'GP_RESET' }); }

  return (
    <div className="sc-page">
      {gp.status === 'none' && (
        <>
          <Card>
            <div className="sc-empty">
              <div className="sc-empty__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9096a4" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg></div>
              <div className="sc-empty__title">No active gate pass</div>
              <div className="sc-empty__sub">You have no active gate pass request right now.</div>
            </div>
          </Card>
          <AppNotice>New gate pass requests are raised from the Super Campus mobile app.</AppNotice>
          <SectionTitle>Request type</SectionTitle>
          <div className="sc-gp-types">
            {types.map(t => (
              <button key={t} className="sc-gp-type-btn" onClick={() => apply(t)}>{t}</button>
            ))}
          </div>
        </>
      )}

      {gp.status === 'pending' && (
        <Card style={{ border: '1px solid rgba(251,191,36,.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span className="sc-badge" style={{ background: 'rgba(251,191,36,.14)', color: '#d97706' }}>Pending</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{gp.type}</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginBottom: 18 }}>
            {gp.early ? 'Early exit — full approval chain required.' : 'Day exit — auto-approved.'}
          </div>
          <Stepper steps={stepItems} direction="vertical" />
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="sc-btn sc-btn--primary" onClick={advance}>Advance →</button>
            <button className="sc-btn" onClick={reset}>Cancel</button>
          </div>
          <AppNotice>Live status — updates automatically as each approver acts.</AppNotice>
        </Card>
      )}

      {gp.status === 'approved' && (
        <Card style={{ border: '1px solid rgba(52,211,153,.32)', display: 'flex', gap: 26, alignItems: 'center' }}>
          <div style={{ width: 150, height: 150, background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff" /><g fill="#1400ff"><rect x="6" y="6" width="24" height="24" /><rect x="12" y="12" width="12" height="12" fill="#fff" /><rect x="70" y="6" width="24" height="24" /><rect x="76" y="12" width="12" height="12" fill="#fff" /><rect x="6" y="70" width="24" height="24" /><rect x="12" y="76" width="12" height="12" fill="#fff" /></g></svg>
          </div>
          <div>
            <span className="sc-badge" style={{ background: 'rgba(52,211,153,.14)', color: '#10b981' }}>Approved</span>
            <div style={{ fontWeight: 800, fontSize: 20, marginTop: 10 }}>{gp.type} — Show QR at gate</div>
            <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 6, maxWidth: 360 }}>Present this QR to security at the gate. Your parent is notified automatically on geofenced exit.</div>
            <button className="sc-btn" style={{ marginTop: 14 }} onClick={reset}>New request</button>
          </div>
        </Card>
      )}

      <SectionTitle>History</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {GP_HISTORY.map((h, i) => (
          <div key={i} className="sc-list-row">
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#9096a4', width: 52 }}>{h.date}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{h.type}</div>
              {h.reason && <div style={{ fontSize: 11.5, color: '#9096a4' }}>{h.reason}</div>}
            </div>
            <span style={{ fontWeight: 700, fontSize: 11, color: h.color }}>{h.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
