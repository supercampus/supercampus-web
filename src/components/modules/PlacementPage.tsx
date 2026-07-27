'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { PLACEMENT_DRIVES, stepper } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui/primitives';

export default function PlacementPage() {
  const { state, dispatch, toast } = useApp();
  const placeStepper = stepper(['Applied', 'Shortlisted', 'Interview', 'Selected'], state.placeApp > 0 ? state.placeApp - 1 : -1);

  return (
    <div className="sc-page">
      <SectionTitle>Eligible drives</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLACEMENT_DRIVES.map(d => (
          <Card key={d.company} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: '#f5f6fa', border: '1px solid rgba(25,20,60,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: '#776cf5', flex: 'none' }}>{d.company[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{d.company}</div>
              <div style={{ fontSize: 12, color: '#6c7280' }}>{d.role} · {d.ctc} · Drive {d.date}</div>
            </div>
            {d.eligible ? (
              <span className="sc-badge" style={{ background: 'rgba(52,211,153,.14)', color: '#10b981' }}>Eligible</span>
            ) : (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#ef4444' }}>Not eligible</div>
                <div style={{ fontSize: 10.5, color: '#9096a4' }}>{d.reason}</div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {state.placeApp > 0 && (
        <Card style={{ marginTop: 18 }}>
          <div className="sc-card__title" style={{ marginBottom: 18 }}>Data Unavailable</div>
          <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
            {placeStepper.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div className={`sc-stepper-h__dot sc-stepper-h__dot--${s.state}`}>{s.num}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, color: s.state === 'active' ? '#141527' : s.state === 'done' ? '#6c7280' : '#9096a4' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="sc-grid-2col" style={{ marginTop: 18 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#776cf5" strokeWidth="2">
            <path d="M9 3h6l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Data Unavailable</div>
            <div style={{ fontSize: 11, color: '#9096a4' }}>Data Unavailable</div>
          </div>
          <span style={{ fontWeight: 600, fontSize: 11, color: '#9096a4' }}>Data Unavailable</span>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Training schedule</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', lineHeight: 1.9 }}>
            Data Unavailable
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="sc-btn sc-btn--primary" onClick={() => { dispatch({ type: 'APPLY_DRIVE' }); toast('Application submitted'); }}>Data Unavailable</button>
      </div>
    </div>
  );
}
