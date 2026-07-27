'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { stepper, MESS_MENU } from '@/lib/data';
import { Card, SectionTitle, AppNotice, Stepper } from '@/components/ui/primitives';

export default function HostelPage() {
  const { state, dispatch, toast } = useApp();
  const hosteller = state.persona === 'hosteller';
  const leaveStepper = stepper(['Applied', 'Warden', 'Parent notified', 'Approved'], state.hostelLeave);

  if (!hosteller) {
    return (
      <div className="sc-page">
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Not applicable</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 6 }}>You are registered as a day scholar.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="sc-page">
      <div className="sc-grid-2col">
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 16 }}>Room allotment</div>
          <div style={{ fontWeight: 800, fontSize: 26, fontFamily: "'JetBrains Mono'", color: '#776cf5' }}>Data Unavailable</div>
          <div style={{ fontSize: 11, color: '#9096a4', fontWeight: 600 }}>Data Unavailable</div>
          <div style={{ fontSize: 11, color: '#9096a4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 16, marginBottom: 8 }}>Roommates</div>
          {['Data Unavailable'].map(r => (
            <div key={r} style={{ fontSize: 13, color: '#3a3d4a', padding: '4px 0' }}>{r}</div>
          ))}
        </Card>
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 14 }}>Night attendance</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(251,191,36,.12)', color: '#d97706', padding: '9px 15px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
            Not Yet Marked
          </div>
          <div style={{ fontSize: 11.5, color: '#9096a4', marginTop: 10 }}>Marked by warden before 10:00 PM curfew.</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(25,20,60,.07)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Mess opt-in</div>
              <div style={{ fontSize: 11, color: '#9096a4' }}>Data Unavailable</div>
            </div>
            <button
              onClick={() => { dispatch({ type: 'TOGGLE_MESS' }); toast('Mess preference updated'); }}
              style={{ position: 'relative', width: 44, height: 26, borderRadius: 20, border: 'none', cursor: 'pointer', background: state.mess ? '#776cf5' : '#c7cad4' }}
            >
              <span style={{ position: 'absolute', top: 3, left: state.mess ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 18 }}>
        <div className="sc-card__title" style={{ marginBottom: 14 }}>Mess menu — Today</div>
        <div className="sc-grid-2col">
          {MESS_MENU.map(m => (
            <div key={m.m} style={{ background: '#f5f6fa', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#9096a4', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{m.m}</div>
              <div style={{ fontSize: 13, color: '#3a3d4a' }}>{m.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 18 }}>
        <div className="sc-card__title" style={{ marginBottom: 14 }}>Leave / Out-pass</div>
        {state.hostelLeave > 0 && (
          <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', marginBottom: 14 }}>
            {leaveStepper.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div className={`sc-stepper-h__dot sc-stepper-h__dot--${s.state}`}>{s.num}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, color: s.state === 'active' ? '#141527' : s.state === 'done' ? '#6c7280' : '#9096a4', textAlign: 'center', maxWidth: 70 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: '#3a3d4a', marginBottom: 12 }}>
          {state.hostelLeave === 0 ? 'No active out-pass request.' : state.hostelLeave >= 4 ? 'Leave approved ✓' : 'Awaiting approval…'}
        </div>
        {state.hostelLeave < 4 && (
          <button className="sc-btn sc-btn--primary" onClick={() => dispatch({ type: 'ADVANCE_LEAVE' })}>
            {state.hostelLeave === 0 ? 'Apply for leave' : 'Advance approval →'}
          </button>
        )}
        <AppNotice>Leave / out-pass is requested from the mobile app (Warden + parent approval).</AppNotice>
      </Card>

      <Card style={{ marginTop: 18 }}>
        <div className="sc-card__title" style={{ marginBottom: 14 }}>Complaints</div>
        {state.hostelTickets.map(t => (
          <div key={t.id} className="sc-list-row">
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#9096a4', width: 78 }}>{t.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.text}</div>
              <div style={{ fontSize: 11, color: '#9096a4' }}>{t.cat}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 11, color: t.status === 'Resolved' ? '#10b981' : t.status === 'In Progress' ? '#d97706' : '#3b82f6' }}>{t.status}</span>
            {t.status !== 'Resolved' && (
              <button className="sc-btn sc-btn--small" onClick={() => { dispatch({ type: 'RESOLVE_TICKET' }); toast('Marked resolved'); }}>Resolve</button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
