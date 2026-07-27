'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { stepper } from '@/lib/data';
import { Card, AppNotice } from '@/components/ui/primitives';

export default function TransportPage() {
  const { state, dispatch, toast } = useApp();
  const hosteller = state.persona === 'hosteller';
  const tripStepper = stepper(['Scheduled', 'En Route', 'Boarded', 'Dropped'], state.tripStep);

  if (hosteller) {
    return (
      <div className="sc-page">
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Not applicable</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 6 }}>You are a hosteller. See Hostel for room and leave.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="sc-page">
      {state.breakdown && (
        <div className="sc-alert sc-alert--red" style={{ marginBottom: 18 }}>
          <span className="sc-alert__dot" style={{ background: '#ef4444' }} />
          <div style={{ flex: 1, fontSize: 12.5, color: '#3a3d4a' }}><b>Data Unavailable</b></div>
          <button onClick={() => dispatch({ type: 'SET_BREAKDOWN', val: false })} style={{ background: 'none', border: 'none', color: '#9096a4', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}
      <div className="sc-grid-2col">
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 14 }}>Current booking</div>
          <div style={{ fontWeight: 800, fontSize: 22, fontFamily: "'JetBrains Mono'", color: '#3b82f6' }}>Data Unavailable</div>
          <div style={{ fontSize: 12.5, color: '#3a3d4a', marginTop: 6 }}>Data Unavailable</div>
          <div style={{ fontSize: 11.5, color: '#9096a4', marginTop: 2 }}>Data Unavailable</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div className="sc-card__title">Live tracking</div>
            <span className="sc-badge" style={{ marginLeft: 'auto', color: '#10b981', background: 'rgba(52,211,153,.12)' }}>● Active</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#6c7280' }}>ETA at your stop</div>
          <div style={{ fontWeight: 800, fontSize: 30, fontFamily: "'JetBrains Mono'", color: '#10b981', marginTop: 2 }}>Data Unavailable</div>
        </Card>
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="sc-card__title" style={{ marginBottom: 18 }}>Today&apos;s trip</div>
        <div style={{ display: 'flex', gap: 34, alignItems: 'flex-start', marginBottom: 16 }}>
          {tripStepper.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div className={`sc-stepper-h__dot sc-stepper-h__dot--${s.state}`}>{s.num}</div>
              <div style={{ fontWeight: 600, fontSize: 11, color: s.state === 'active' ? '#141527' : s.state === 'done' ? '#6c7280' : '#9096a4' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button className="sc-btn sc-btn--primary" onClick={() => dispatch({ type: 'ADVANCE_TRIP' })}>Advance trip →</button>
        <AppNotice>Trip status updates automatically from the vehicle GPS.</AppNotice>
      </Card>
    </div>
  );
}
