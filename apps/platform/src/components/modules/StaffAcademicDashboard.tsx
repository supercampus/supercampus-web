'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/primitives';
import { getTimetableContext, type TimetableContext } from '@/lib/timetable-api';

export default function StaffAcademicDashboard() {
  const { student, nav } = useApp();
  const [context, setContext] = useState<TimetableContext | null>(null);
  useEffect(() => { getTimetableContext().then(({ data }) => setContext(data)).catch(() => setContext(null)); }, []);
  const today = new Date().getDay();
  const slotById = useMemo(() => new Map((context?.slots ?? []).map((slot) => [slot.id, slot])), [context]);
  const classes = (context?.entries ?? []).filter((entry) => slotById.get(entry.slotId)?.dayOfWeek === today).sort((a, b) => (slotById.get(a.slotId)?.sequence ?? 0) - (slotById.get(b.slotId)?.sequence ?? 0));
  return <div className="sc-page">
    <div style={{ marginBottom: 20 }}><div style={{ color: '#776cf5', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>Academic app</div><h1 style={{ margin: '6px 0 0', fontSize: 28 }}>Welcome, {student?.name}</h1><p style={{ color: '#6c7280', margin: '6px 0 0' }}>Your schedule is synced with the timetable published by the principal.</p></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(240px,.8fr)', gap: 16 }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}><div style={{ padding: '15px 18px', background: '#f7f8fb', display: 'flex' }}><b>Today&apos;s classes</b><div style={{ flex: 1 }} /><button onClick={() => nav('timetable')} style={{ border: 0, background: 'transparent', color: '#5b4fe4', fontWeight: 800 }}>View week</button></div>{classes.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#6c7280' }}>No class is scheduled for today.</div> : classes.map((entry) => { const slot = slotById.get(entry.slotId); return <button key={entry.id} onClick={() => nav('timetable')} style={{ width: '100%', border: 0, borderTop: '1px solid #eef0f5', background: '#fff', padding: '14px 18px', display: 'flex', gap: 14, textAlign: 'left', cursor: 'pointer' }}><div style={{ minWidth: 72, fontWeight: 850 }}>{slot?.startsAt.slice(0, 5)}</div><div><b>{entry.subjectName}</b><div style={{ color: '#6c7280', fontSize: 12, marginTop: 4 }}>{entry.sectionName} · {entry.roomCode}</div></div></button>; })}</Card>
      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}><Card><div style={{ color: '#6c7280', fontSize: 12 }}>Classes today</div><div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{classes.length}</div></Card><button onClick={() => nav('timetable')} style={{ border: 0, borderRadius: 13, padding: 16, background: 'linear-gradient(135deg,#181a25,#5b4fe4)', color: '#fff', textAlign: 'left', cursor: 'pointer' }}><b style={{ fontSize: 16 }}>Mark attendance</b><div style={{ opacity: .78, marginTop: 5, fontSize: 12 }}>Choose a class from your published timetable</div></button></div>
    </div>
  </div>;
}
