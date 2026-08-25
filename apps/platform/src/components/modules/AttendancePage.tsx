'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/primitives';
import { getAttendanceSessions, getMyAttendanceSummary, type AttendanceSession } from '@/lib/campus-operations-api';

type Summary = Awaited<ReturnType<typeof getMyAttendanceSummary>>['data'];

export default function AttendancePage() {
  const { roles, nav } = useApp();
  const isStaff = roles.some((role) => role === 'staff' || role === 'class_advisor');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const request = isStaff ? getAttendanceSessions() : getMyAttendanceSummary();
    request.then((response) => {
      if (isStaff) setSessions((response as Awaited<ReturnType<typeof getAttendanceSessions>>).data.sessions);
      else setSummary((response as Awaited<ReturnType<typeof getMyAttendanceSummary>>).data);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Attendance could not be loaded')).finally(() => setLoading(false));
  }, [isStaff]);

  if (loading) return <div className="sc-page"><Card><div style={{ padding: 30, textAlign: 'center' }}>Loading attendance…</div></Card></div>;

  if (isStaff) return <div className="sc-page">
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}><div><div style={{ color: '#776cf5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12 }}>Faculty attendance</div><h2 style={{ margin: '5px 0 0' }}>Published attendance</h2><p style={{ color: '#6c7280', margin: '5px 0 0' }}>Attendance starts from a class in your published timetable.</p></div><div style={{ flex: 1 }} /><button onClick={() => nav('timetable')} style={{ border: 0, borderRadius: 9, background: '#181a25', color: '#fff', padding: '10px 15px', fontWeight: 800 }}>Open timetable</button></div>
    {error && <div className="sc-alert sc-alert--red" style={{ marginBottom: 16 }}>{error}</div>}
    <Card style={{ padding: 0, overflow: 'hidden' }}>{sessions.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#6c7280' }}>No attendance has been published yet.</div> : sessions.map((session, index) => <div key={session.id} style={{ padding: '15px 18px', borderTop: index ? '1px solid #eef0f5' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 44, height: 44, borderRadius: 10, background: '#776cf514', color: '#5b4fe4', display: 'grid', placeItems: 'center', fontWeight: 900 }}>✓</div><div><b>{session.subjectName}</b><div style={{ color: '#6c7280', fontSize: 12, marginTop: 4 }}>{new Date(`${session.heldOn}T00:00:00`).toLocaleDateString()} · {session.periodLabel}</div></div><div style={{ flex: 1 }} /><span className="sc-badge" style={{ background: session.status === 'draft' ? '#f59e0b18' : '#10b98118', color: session.status === 'draft' ? '#b45309' : '#047857' }}>{session.status === 'draft' ? 'Draft' : 'Published'}</span></div>)}</Card>
  </div>;

  const percentage = summary?.percentage ?? 0;
  const color = percentage >= 75 ? '#10b981' : percentage >= 65 ? '#d97706' : '#ef4444';
  return <div className="sc-page">
    <div style={{ marginBottom: 18 }}><div style={{ color: '#776cf5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12 }}>My academics</div><h2 style={{ margin: '5px 0 0' }}>Attendance</h2><p style={{ color: '#6c7280', margin: '5px 0 0' }}>Live records published by your faculty.</p></div>
    {error && <div className="sc-alert sc-alert--red" style={{ marginBottom: 16 }}>{error}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 18 }}>
      <Card><div style={{ color: '#6c7280', fontSize: 12 }}>Overall</div><div style={{ fontSize: 34, fontWeight: 900, color, marginTop: 6 }}>{percentage}%</div></Card>
      <Card><div style={{ color: '#6c7280', fontSize: 12 }}>Classes attended</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 9 }}>{summary?.attendedClasses ?? 0}<span style={{ color: '#9096a4', fontSize: 15 }}> / {summary?.totalClasses ?? 0}</span></div></Card>
      <Card><div style={{ color: '#6c7280', fontSize: 12 }}>Absences</div><div style={{ fontSize: 28, fontWeight: 900, marginTop: 9 }}>{summary?.absences ?? 0}</div></Card>
    </div>
    <Card style={{ padding: 0, overflow: 'hidden' }}><div style={{ padding: '14px 18px', background: '#f7f8fb', fontWeight: 800 }}>Recent classes</div>{(summary?.records ?? []).length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#6c7280' }}>Your published attendance will appear here.</div> : summary?.records.map((record, index) => <div key={`${record.sessionId}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: '1px solid #eef0f5' }}><div><b>{record.subjectName}</b><div style={{ color: '#6c7280', fontSize: 12, marginTop: 4 }}>{new Date(`${record.heldOn}T00:00:00`).toLocaleDateString()} · {record.periodLabel}</div></div><div style={{ flex: 1 }} /><span className="sc-badge" style={{ textTransform: 'capitalize', background: record.status === 'present' ? '#10b98118' : record.status === 'absent' ? '#ef444418' : '#3b82f618', color: record.status === 'present' ? '#047857' : record.status === 'absent' ? '#b91c1c' : '#1d4ed8' }}>{record.status}</span></div>)}</Card>
  </div>;
}
