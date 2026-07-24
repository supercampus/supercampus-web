'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { TIMETABLE_HEAD, TIMETABLE_GRID } from '@/lib/data';
import { Card } from '@/components/ui/primitives';

export default function TimetablePage() {
  const { state, dispatch } = useApp();

  return (
    <div className="sc-page">
      {state.changeNotice && (
        <div className="sc-alert sc-alert--blue" style={{ marginBottom: 18 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <div style={{ flex: 1, fontSize: 12.5, color: '#3a3d4a' }}>
            <b>Timetable updated:</b> Friday 14:00 Antennas slot cancelled this week.
          </div>
          <button onClick={() => dispatch({ type: 'SET_CHANGE_NOTICE', val: false })} style={{ background: 'none', border: 'none', color: '#9096a4', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}
      <Card style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5,1fr)', gap: 8, minWidth: 640 }}>
          {TIMETABLE_HEAD.map((h, i) => (
            <div key={i} style={{ fontWeight: 700, fontSize: 11, color: '#9096a4', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center', padding: '6px 0' }}>{h}</div>
          ))}
          {TIMETABLE_GRID.map((row, ri) => (
            <React.Fragment key={ri}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#9096a4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row[0] as string}</div>
              {(row.slice(1) as { s: string; lab: boolean }[]).map((c, ci) => (
                <div key={ci} style={{
                  padding: '11px 10px', borderRadius: 9, textAlign: 'center',
                  fontWeight: 600, fontSize: 11.5,
                  ...(c.s === '—'
                    ? { color: '#c7cad4' }
                    : c.lab
                      ? { background: 'rgba(63,140,255,.14)', color: '#3b82f6', border: '1px solid rgba(63,140,255,.28)' }
                      : { background: '#f5f6fa', color: '#3a3d4a' }),
                }}>
                  {c.s}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 11.5, fontWeight: 600 }}>
          <span style={{ color: '#3a3d4a' }}>■ Theory</span>
          <span style={{ color: '#3b82f6' }}>■ Lab / Practical</span>
        </div>
      </Card>
      <div style={{ fontSize: 11.5, color: '#9096a4', marginTop: 14 }}>
        Attendance-marking window opens at each class start time and closes at end time.
      </div>
    </div>
  );
}
