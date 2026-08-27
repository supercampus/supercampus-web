'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/primitives';
import { PublishedTimetableSkeleton, RosterSkeleton } from '@/components/ui/skeletons';
import { getTimetableContext, type TimetableContext, type TimetableEntry, type TimetableSlot } from '@/lib/timetable-api';
import { createAttendanceSession, getAttendanceRoster, publishAttendanceSession, saveAttendanceEntries, type AttendanceStudent } from '@/lib/campus-operations-api';

const DAYS: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };
type AttendanceStatus = 'present' | 'absent' | 'od' | 'leave';
const shortTime = (value: string) => value?.slice(0, 5) ?? '';
const todayIso = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };

export default function TimetablePage() {
  const { roles, toast } = useApp();
  const isStaff = roles.some((role) => role === 'staff' || role === 'class_advisor');
  const [context, setContext] = useState<TimetableContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ entry: TimetableEntry; slot: TimetableSlot } | null>(null);
  const [roster, setRoster] = useState<AttendanceStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTimetableContext()
      .then(({ data }) => { if (!cancelled) setContext(data); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Timetable could not be loaded'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const slotById = useMemo(() => new Map((context?.slots ?? []).map((slot) => [slot.id, slot])), [context]);
  const days = useMemo(() => {
    const grouped = new Map<number, Array<{ entry: TimetableEntry; slot: TimetableSlot }>>();
    for (const entry of context?.entries ?? []) {
      const slot = slotById.get(entry.slotId);
      if (!slot || slot.slotType !== 'instructional') continue;
      grouped.set(slot.dayOfWeek, [...(grouped.get(slot.dayOfWeek) ?? []), { entry, slot }]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b).map(([day, classes]) => ({ day, classes: classes.sort((a, b) => a.slot.sequence - b.slot.sequence) }));
  }, [context, slotById]);

  async function openAttendance(entry: TimetableEntry, slot: TimetableSlot) {
    setRosterLoading(true); setError(''); setSelected({ entry, slot });
    try {
      const { data } = await getAttendanceRoster(entry.sectionId);
      setRoster(data.students);
      setStatuses(Object.fromEntries(data.students.map((student) => [student.studentUserId, 'present'])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The class roster could not be loaded'); setSelected(null);
    } finally { setRosterLoading(false); }
  }

  async function publishAttendance() {
    if (!selected || roster.length === 0) return;
    setPublishing(true); setError('');
    try {
      const { data: session } = await createAttendanceSession({ timetableEntryId: selected.entry.id, subjectOfferingId: selected.entry.subjectOfferingId, sectionId: selected.entry.sectionId, subjectName: selected.entry.subjectName, heldOn: todayIso(), periodLabel: `${selected.slot.label} · ${shortTime(selected.slot.startsAt)}–${shortTime(selected.slot.endsAt)}` });
      await saveAttendanceEntries(session.id, roster.map((student) => ({ studentUserId: student.studentUserId, studentName: student.studentName, status: statuses[student.studentUserId] ?? 'present' })));
      await publishAttendanceSession(session.id);
      toast(`Attendance published for ${selected.entry.subjectCode}`); setSelected(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Attendance could not be published'); }
    finally { setPublishing(false); }
  }

  return <div className="sc-page">
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
      <div><div style={{ fontSize: 12, color: '#776cf5', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Published schedule</div><h2 style={{ margin: '5px 0 0', fontSize: 24 }}>{isStaff ? 'My teaching timetable' : 'My class timetable'}</h2><div style={{ color: '#6c7280', fontSize: 13, marginTop: 4 }}>{isStaff ? 'Open a scheduled class to mark its attendance.' : 'Subjects, faculty, rooms, and periods published by your principal.'}</div></div>
      <div style={{ flex: 1 }} />
      {context?.versions[0]?.publishedAt && <span className="sc-badge" style={{ background: '#10b98118', color: '#047857' }}>Live · published {new Date(context.versions[0].publishedAt).toLocaleDateString()}</span>}
    </div>
    {error && <div className="sc-alert sc-alert--red" style={{ marginBottom: 16 }}>{error}</div>}
    {loading && <PublishedTimetableSkeleton />}
    {!loading && days.length === 0 && <Card><div style={{ padding: 30, textAlign: 'center' }}><b>No published classes yet</b><div style={{ color: '#6c7280', marginTop: 7 }}>The schedule will appear here immediately after the principal publishes it.</div></div></Card>}
    <div style={{ display: 'grid', gap: 14 }}>{days.map(({ day, classes }) => <Card key={day} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '13px 17px', background: day === new Date().getDay() ? '#776cf512' : '#f7f8fb', borderBottom: '1px solid #e8eaf1', fontWeight: 800 }}>{DAYS[day]}</div>
      {classes.map(({ entry, slot }, index) => <div key={entry.id} className="sc-timetable-row" style={{ display: 'grid', gridTemplateColumns: '88px minmax(160px,1fr) minmax(120px,.7fr) auto', gap: 14, alignItems: 'center', padding: '15px 17px', borderTop: index ? '1px solid #eef0f5' : 'none' }}>
        <div><div style={{ fontWeight: 800, fontSize: 13 }}>{shortTime(slot.startsAt)}</div><div style={{ color: '#9096a4', fontSize: 11, marginTop: 3 }}>{shortTime(slot.endsAt)} · {slot.label}</div></div>
        <div><div style={{ fontWeight: 800 }}>{entry.subjectName}</div><div style={{ color: '#776cf5', fontWeight: 700, fontSize: 12, marginTop: 4 }}>{entry.subjectCode} · {entry.deliveryType === 'laboratory' ? 'Lab' : 'Class'}</div></div>
        <div style={{ fontSize: 12.5, color: '#5f6572' }}><div>{isStaff ? entry.sectionName : entry.facultyName}</div><div style={{ marginTop: 4, color: '#9096a4' }}>Room {entry.roomCode}</div></div>
        {isStaff && <button onClick={() => openAttendance(entry, slot)} style={{ border: 0, borderRadius: 9, padding: '9px 13px', background: '#181a25', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Mark attendance</button>}
      </div>)}
    </Card>)}</div>

    {(selected || rosterLoading) && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d102080', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}><div style={{ width: 'min(760px, 100%)', maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px #11142b44' }}>
      <div style={{ padding: 20, borderBottom: '1px solid #e8eaf1', display: 'flex', gap: 12 }}><div><div style={{ fontSize: 20, fontWeight: 800 }}>Mark attendance</div><div style={{ color: '#6c7280', marginTop: 4 }}>{selected?.entry.subjectName} · {selected?.entry.sectionName} · {selected?.slot.label}</div></div><div style={{ flex: 1 }} /><button onClick={() => setSelected(null)} style={{ border: 0, background: 'transparent', fontSize: 25, cursor: 'pointer' }}>×</button></div>
      {rosterLoading ? <RosterSkeleton /> : <><div style={{ padding: '12px 20px', background: '#f7f8fb', fontSize: 12 }}><b>{roster.length} students</b><span style={{ color: '#6c7280' }}> · Everyone starts as present. Change only exceptions.</span></div>
        <div style={{ padding: '0 20px' }}>{roster.map((student) => <div key={student.studentUserId} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eef0f5' }}><div><b>{student.studentName}</b><div style={{ color: '#9096a4', fontSize: 11.5, marginTop: 3 }}>{student.studentNumber}</div></div><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{(['present', 'absent', 'od', 'leave'] as AttendanceStatus[]).map((status) => <button key={status} onClick={() => setStatuses((current) => ({ ...current, [student.studentUserId]: status }))} style={{ border: '1px solid', borderColor: statuses[student.studentUserId] === status ? '#776cf5' : '#dfe2ea', background: statuses[student.studentUserId] === status ? '#776cf514' : '#fff', color: statuses[student.studentUserId] === status ? '#5b4fe4' : '#6c7280', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', textTransform: 'capitalize', fontWeight: 700 }}>{status === 'od' ? 'OD' : status}</button>)}</div></div>)}</div>
        <div style={{ padding: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button onClick={() => setSelected(null)} style={{ border: '1px solid #dfe2ea', background: '#fff', borderRadius: 9, padding: '10px 16px' }}>Cancel</button><button disabled={publishing || roster.length === 0} onClick={publishAttendance} style={{ border: 0, background: '#181a25', color: '#fff', borderRadius: 9, padding: '10px 18px', fontWeight: 800, opacity: publishing || roster.length === 0 ? .55 : 1 }}>{publishing ? 'Publishing…' : 'Publish attendance'}</button></div></>}
    </div></div>}
  </div>;
}
