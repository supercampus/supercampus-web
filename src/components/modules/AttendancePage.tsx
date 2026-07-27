'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { THEORY_BARS, LAB_BARS, buildCalendar, stepper, attPct as getAttPct } from '@/lib/data';
import { Card, SectionTitle, AppNotice, Stepper } from '@/components/ui/primitives';

export default function AttendancePage() {
  const { state, dispatch, toast } = useApp();
  const pct = getAttPct();
  const R = 52; const circ = 2 * Math.PI * R;
  const attColor = pct >= 75 ? '#10b981' : pct >= 65 ? '#d97706' : '#ef4444';
  const attLabel = pct >= 75 ? 'Eligible' : pct >= 65 ? 'Warning' : 'Critical — condonation required';
  const offset = (circ * (1 - pct / 100)).toFixed(1);
  const thrOffset = (circ * (1 - 0.75)).toFixed(1);
  const cond = state.condonation;
  const calendar = buildCalendar();

  const calColors: Record<string, { bg: string; c: string }> = {
    p: { bg: 'rgba(52,211,153,.16)', c: '#10b981' },
    a: { bg: 'rgba(248,113,113,.16)', c: '#ef4444' },
    od: { bg: 'rgba(96,165,250,.18)', c: '#3b82f6' },
    off: { bg: '#15171d', c: '#c7cad4' },
  };

  return (
    <div className="sc-page">
      <div className="sc-grid-2col-narrow">
        {/* Donut */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ alignSelf: 'flex-start', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Overall</div>
          <div className="sc-donut" style={{ width: 170, height: 170, margin: '8px 0' }}>
            <svg width="170" height="170" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eceef4" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={attColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circ.toFixed(1)} strokeDashoffset={offset} />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#141527" strokeWidth="12"
                strokeDasharray={`2 ${circ.toFixed(1)}`} strokeDashoffset={thrOffset} opacity="0.55" />
            </svg>
            <div className="sc-donut__center">
              <div className="sc-donut__val" style={{ color: attColor }}>{pct}%</div>
              <div className="sc-donut__sub">0 classes</div>
            </div>
          </div>
          <div className="sc-badge" style={{ background: attColor + '22', color: attColor, fontWeight: 700, fontSize: 12, padding: '5px 13px', borderRadius: 20 }}>{attLabel}</div>
          <div className="sc-empty__sub" style={{ marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>Dark tick = 75% threshold.<br />Approved OD/Leave counts as attended.</div>
        </Card>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="sc-card__title" style={{ marginBottom: 16 }}>Theory / Classroom</div>
            {THEORY_BARS.map(b => (
              <div key={b.name} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3a3d4a' }}>{b.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono'", color: b.color }}>{b.label}</span>
                </div>
                <div style={{ height: 8, background: '#eceef4', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: b.w, background: b.color, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div className="sc-card__title" style={{ marginBottom: 16 }}>Lab / Practical</div>
            {LAB_BARS.map(b => (
              <div key={b.name} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3a3d4a' }}>{b.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono'", color: b.color }}>{b.label}</span>
                </div>
                <div style={{ height: 8, background: '#eceef4', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: b.w, background: b.color, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Calendar */}
      <Card style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="sc-card__title">Data Unavailable</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 16, fontSize: 11.5, fontWeight: 600 }}>
            <span style={{ color: '#10b981' }}>● Present</span>
            <span style={{ color: '#ef4444' }}>● Absent</span>
            <span style={{ color: '#3b82f6' }}>● OD / Leave</span>
          </div>
        </div>
        <div className="sc-calendar">
          {calendar.map(({ d, state }) => {
            const cs = calColors[state];
            return (
              <div key={d} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, font: "600 12px 'JetBrains Mono'", background: cs.bg, color: cs.c }}>
                {d}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Condonation */}
      <div className="sc-alert sc-alert--red" style={{ marginTop: 18 }}>
        <div className="sc-alert__icon" style={{ background: 'rgba(248,113,113,.16)' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Condonation required</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 3 }}>Attendance is below 65%. Submit a condonation request with supporting documents to remain eligible.</div>
          {cond === 'none' && (
            <AppNotice>Submit a condonation request from the Super Campus mobile app.</AppNotice>
          )}
          {cond === 'pending' && (
            <div style={{ marginTop: 14 }}>
              <span style={{ display: 'inline-flex', font: "700 11px 'Plus Jakarta Sans'", padding: '5px 12px', borderRadius: 20, background: 'rgba(251,191,36,.14)', color: '#d97706' }}>Pending review</span>
            </div>
          )}
          {cond === 'approved' && (
            <div style={{ marginTop: 14, fontSize: 12.5, color: '#10b981', fontWeight: 600 }}>✓ Condonation approved — attendance recalculated for eligibility.</div>
          )}
        </div>
      </div>
    </div>
  );
}
