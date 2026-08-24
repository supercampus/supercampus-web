'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  GripVertical,
  LoaderCircle,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  createTimetableConfiguration,
  createTimetableEntry,
  createTimetableRoomsBulk,
  createTimetableVersion,
  deleteTimetableEntry,
  generateTimetableVersion,
  getTimetableContext,
  publishTimetableVersion,
  replaceTimetableSlots,
  updateTimetableEntry,
  type TimetableContext,
  type TimetableDeliveryType,
  type TimetableEntry,
} from '@/lib/timetable-api';

const DAYS = [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday']] as const;
const PERIODS = [
  ['P1', '08:30', '09:20'], ['P2', '09:20', '10:10'], ['P3', '10:30', '11:20'],
  ['P4', '11:20', '12:10'], ['P5', '13:00', '13:50'], ['P6', '13:50', '14:40'],
  ['P7', '14:40', '15:30'],
] as const;

const MEC_ROOMS: Array<Parameters<typeof createTimetableRoomsBulk>[0][number]> = [
  ...['AIDS', 'CSBS', 'CSE', 'AIML', 'CYBER', 'IT'].map((code) => ({ departmentCode: code, code: `${code}-CR`, name: `${code} Classroom`, roomType: 'classroom' as const, capacity: 60 })),
  { code: 'CL-01', name: 'Computer Lab 1', roomType: 'computer_lab', capacity: 60 },
  { code: 'CL-02', name: 'Computer Lab 2', roomType: 'computer_lab', capacity: 60 },
  { code: 'PHY-LAB', name: 'Physics Laboratory', roomType: 'physics_lab', capacity: 60 },
  { code: 'CHEM-LAB', name: 'Chemistry Laboratory', roomType: 'chemistry_lab', capacity: 60 },
  { code: 'SEMINAR', name: 'Seminar Hall', roomType: 'seminar_hall', capacity: 200 },
];

type DragItem = { kind: 'subject'; offeringId: string } | { kind: 'entry'; entryId: string };

const selectClass = 'h-9 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-600';

export function PrincipalTimetableSheet() {
  const [data, setData] = useState<TimetableContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [configurationId, setConfigurationId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropSlotId, setDropSlotId] = useState<string | null>(null);
  const [editorSlotId, setEditorSlotId] = useState<string | null>(null);
  const [editorEntryId, setEditorEntryId] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [deliveryType, setDeliveryType] = useState<TimetableDeliveryType>('class');
  const [setupName, setSetupName] = useState('MEC Semester Timetable 2026-27');
  const [setupYearId, setSetupYearId] = useState('');
  const [setupTermId, setSetupTermId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = (await getTimetableContext()).data;
      setData(next);
      setConfigurationId((current) => next.configurations.some((item) => item.id === current) ? current : next.configurations[0]?.id ?? '');
      setSetupYearId((current) => current || next.academicYears.find((item) => item.status === 'active')?.id || next.academicYears[0]?.id || '');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The timetable could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const configurations = data?.configurations ?? [];
  const versions = useMemo(() => (data?.versions ?? []).filter((item) => item.configurationId === configurationId), [data, configurationId]);
  const selectedVersion = versions.find((item) => item.id === versionId);
  const departments = data?.departments ?? [];
  const sections = useMemo(() => (data?.sections ?? []).filter((item) => !departmentId || item.departmentId === departmentId), [data, departmentId]);
  const selectedSection = sections.find((item) => item.id === sectionId);
  const slots = useMemo(() => (data?.slots ?? []).filter((item) => item.configurationId === configurationId && item.slotType === 'instructional'), [data, configurationId]);
  const entries = useMemo(() => (data?.entries ?? []).filter((item) => item.versionId === versionId && item.sectionId === sectionId), [data, versionId, sectionId]);
  const offerings = useMemo(() => (data?.subjectOfferings ?? []).filter((item) => item.sectionId === sectionId).sort((a, b) => b.credits - a.credits || a.code.localeCompare(b.code)), [data, sectionId]);
  const assignments = useMemo(() => (data?.teachingAssignments ?? []).filter((item) => item.subjectOfferingId === offeringId), [data, offeringId]);

  useEffect(() => {
    setVersionId((current) => versions.some((item) => item.id === current) ? current : versions.find((item) => item.status === 'draft')?.id ?? versions[0]?.id ?? '');
  }, [versions]);
  useEffect(() => {
    setSectionId((current) => sections.some((item) => item.id === current) ? current : sections[0]?.id ?? '');
  }, [sections]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setError(null); setNotice(null);
    try { await action(); setNotice(success); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The timetable change could not be saved.'); }
    finally { setBusy(false); }
  };

  const createWorkspace = () => run(async () => {
    if (!setupYearId) throw new Error('Choose an academic year first.');
    const created = await createTimetableConfiguration({ academicYearId: setupYearId, termId: setupTermId || null, name: setupName, maxFacultyPeriodsPerDay: 7, maxConsecutiveFacultyPeriods: 3 });
    const id = String(created.data.id ?? '');
    if (!id) throw new Error('The timetable configuration was not created.');
    await replaceTimetableSlots(id, DAYS.flatMap(([day]) => PERIODS.map(([label, startsAt, endsAt], index) => ({ dayOfWeek: day, sequence: index + 1, label, startsAt, endsAt, slotType: 'instructional' as const }))));
    await createTimetableVersion(id, 'Principal working sheet');
  }, 'Editable timetable sheet created.');

  const entryInput = (entry: TimetableEntry, slotId: string) => ({
    versionId: entry.versionId, slotId, subjectOfferingId: entry.subjectOfferingId,
    teachingAssignmentId: entry.teachingAssignmentId, roomId: entry.roomId,
    electiveGroupId: entry.electiveGroupId, deliveryType: entry.deliveryType,
    sessionBlockId: entry.sessionBlockId, blockSequence: entry.blockSequence, blockLength: entry.blockLength,
  });

  const automaticRoom = (offering: TimetableContext['subjectOfferings'][number]) => {
    const requirement = data?.workloadRequirements.find((item) => item.subjectOfferingId === offering.id);
    const capacity = selectedSection?.capacity ?? 0;
    return data?.rooms.find((room) => room.capacity >= capacity && (!requirement?.requiredRoomTypes.length || requirement.requiredRoomTypes.includes(room.roomType)))
      ?? data?.rooms.find((room) => room.capacity >= capacity)
      ?? data?.rooms[0];
  };

  const dropOnCell = (slotId: string) => {
    if (!dragItem || busy || selectedVersion?.status !== 'draft') return;
    const target = entries.find((entry) => entry.slotId === slotId);
    if (dragItem.kind === 'entry') {
      const source = entries.find((entry) => entry.id === dragItem.entryId);
      if (!source || source.slotId === slotId) { setDragItem(null); setDropSlotId(null); return; }
      if (target) { setError('That cell already contains a subject. Clear it first or drag a subject from the tray to replace it.'); setDragItem(null); setDropSlotId(null); return; }
      void run(async () => { await updateTimetableEntry(source.id, entryInput(source, slotId)); }, `${source.subjectCode} moved.`);
    } else {
      const offering = offerings.find((item) => item.id === dragItem.offeringId);
      const assignment = data?.teachingAssignments.find((item) => item.subjectOfferingId === offering?.id);
      const room = offering && automaticRoom(offering);
      if (!offering || !assignment || !room) { setError('Assign a faculty member and prepare at least one suitable room before placing this subject.'); setDragItem(null); setDropSlotId(null); return; }
      const input = { versionId, slotId, subjectOfferingId: offering.id, teachingAssignmentId: assignment.id, roomId: room.id, deliveryType: 'class' as const };
      void run(async () => {
        if (target) await updateTimetableEntry(target.id, input); else await createTimetableEntry(input);
      }, `${offering.code} placed in the sheet.`);
    }
    setDragItem(null); setDropSlotId(null);
  };

  const openEditor = (slotId: string, entry?: TimetableEntry) => {
    setEditorSlotId(slotId); setEditorEntryId(entry?.id ?? null);
    setOfferingId(entry?.subjectOfferingId ?? ''); setAssignmentId(entry?.teachingAssignmentId ?? '');
    setRoomId(entry?.roomId ?? ''); setDeliveryType(entry?.deliveryType ?? 'class');
  };

  const saveEditor = () => run(async () => {
    if (!editorSlotId || !versionId || !offeringId || !assignmentId || !roomId) throw new Error('Choose a subject, faculty member, and room.');
    const input = { versionId, slotId: editorSlotId, subjectOfferingId: offeringId, teachingAssignmentId: assignmentId, roomId, deliveryType };
    if (editorEntryId) await updateTimetableEntry(editorEntryId, input); else await createTimetableEntry(input);
    setEditorSlotId(null); setEditorEntryId(null);
  }, 'Cell saved.');

  if (loading && !data) return <div className="grid min-h-[70vh] flex-1 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading timetable sheet…</span></div>;
  if (!data?.canManage) return <div className="m-auto rounded border border-slate-300 bg-white p-8 text-sm text-slate-600">Only the principal can edit the timetable.</div>;

  if (configurations.length === 0) return <div className="m-auto w-full max-w-2xl border border-slate-300 bg-white p-8 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Principal timetable</p>
    <h1 className="mt-2 text-2xl text-slate-900">Create the editable sheet</h1>
    <p className="mt-2 text-sm text-slate-500">This creates a Monday–Friday grid with seven periods per day.</p>
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <input value={setupName} onChange={(event) => setSetupName(event.target.value)} className={selectClass} aria-label="Timetable name" />
      <select value={setupYearId} onChange={(event) => { setSetupYearId(event.target.value); setSetupTermId(''); }} className={selectClass} aria-label="Academic year"><option value="">Academic year</option>{data.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={setupTermId} onChange={(event) => setSetupTermId(event.target.value)} className={selectClass} aria-label="Term"><option value="">Whole year</option>{data.terms.filter((item) => item.academicYearId === setupYearId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </div>
    {(error || notice) && <Message error={error} notice={notice} />}
    <button type="button" disabled={busy || !setupName.trim()} onClick={() => void createWorkspace()} className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-5 text-xs text-white disabled:opacity-40"><Plus size={15} /> Create timetable sheet</button>
  </div>;

  return <div className="flex min-h-[calc(100vh-2rem)] w-full min-w-0 flex-col overflow-hidden border border-slate-300 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-4 py-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-700">Principal workspace</p><h1 className="text-xl text-slate-900">Timetable</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={configurationId} onChange={(event) => setConfigurationId(event.target.value)} className={selectClass} aria-label="Configuration">{configurations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={versionId} onChange={(event) => setVersionId(event.target.value)} className={selectClass} aria-label="Version">{versions.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.status}</option>)}</select>
        {versions.length === 0 && <button type="button" disabled={busy} onClick={() => void run(async () => { await createTimetableVersion(configurationId, 'Principal working sheet'); }, 'Draft created.')} className="h-9 rounded border border-slate-300 px-3 text-xs"><Plus size={14} className="inline" /> Draft</button>}
        {(data.rooms.length === 0) && <button type="button" disabled={busy} onClick={() => void run(async () => { await createTimetableRoomsBulk(MEC_ROOMS); }, 'MEC rooms prepared.')} className="h-9 rounded border border-amber-300 bg-amber-50 px-3 text-xs text-amber-800">Prepare rooms</button>}
        {selectedVersion?.status === 'draft' && <button type="button" disabled={busy || !versionId || data.rooms.length === 0} onClick={() => void run(async () => { await generateTimetableVersion(versionId, { preserveExisting: true, prioritizeHighCredits: true }); }, 'Timetable automatically arranged.')} className="inline-flex h-9 items-center gap-2 rounded border border-violet-300 bg-violet-50 px-3 text-xs text-violet-800 disabled:opacity-40"><Sparkles size={14} /> Auto arrange</button>}
        {selectedVersion?.status === 'draft' && <button type="button" disabled={busy || entries.length === 0} onClick={() => void run(async () => { await publishTimetableVersion(versionId); }, 'Timetable published.')} className="inline-flex h-9 items-center gap-2 rounded bg-emerald-700 px-4 text-xs text-white disabled:opacity-40"><Rocket size={14} /> Publish</button>}
        <button type="button" onClick={() => void refresh()} className="grid h-9 w-9 place-items-center rounded border border-slate-300" aria-label="Refresh"><RefreshCw size={14} /></button>
      </div>
    </header>

    <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-2">
      <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={selectClass} aria-label="Department"><option value="">All departments</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>
      <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className={`${selectClass} min-w-64`} aria-label="Section"><option value="">Select a class / section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.programmeName} · {item.batchName} · {item.name}</option>)}</select>
      <span className="text-[11px] text-slate-500">Drag subjects into cells. Drag a filled cell to move it. Click any cell for detailed editing.</span>
    </div>

    {(error || notice) && <div className="px-4"><Message error={error} notice={notice} /></div>}

    <section className="border-b border-slate-300 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Subject tray</h2><span className="text-[10px] text-slate-400">Higher-credit subjects appear first</span></div>
      <div className="flex min-h-16 gap-2 overflow-x-auto pb-1">
        {offerings.map((offering) => {
          const faculty = data.teachingAssignments.find((item) => item.subjectOfferingId === offering.id)?.facultyName ?? 'Faculty not assigned';
          const selected = dragItem?.kind === 'subject' && dragItem.offeringId === offering.id;
          return <button key={offering.id} type="button" draggable={selectedVersion?.status === 'draft'} onClick={() => selectedVersion?.status === 'draft' && setDragItem(selected ? null : { kind: 'subject', offeringId: offering.id })} onDragStart={() => setDragItem({ kind: 'subject', offeringId: offering.id })} onDragEnd={() => setDropSlotId(null)} className={`flex w-52 shrink-0 cursor-grab items-center gap-2 rounded border px-3 py-2 text-left shadow-sm active:cursor-grabbing ${selected ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-300 bg-white'}`}><GripVertical size={14} className="shrink-0 text-slate-400" /><span className="min-w-0"><strong className="block truncate text-xs text-slate-800">{offering.code} · {offering.name}</strong><small className="mt-1 block truncate text-[10px] text-slate-500">{faculty} · {offering.credits || '—'} credits</small></span></button>;
        })}
        {sectionId && offerings.length === 0 && <p className="py-4 text-xs text-slate-500">No subject offerings are assigned to this section yet.</p>}
      </div>
    </section>

    <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
      <div className="min-w-[960px] border-l border-t border-slate-300 bg-white">
        <div className="grid grid-cols-[120px_repeat(5,minmax(160px,1fr))]">
          <div className="sticky left-0 top-0 z-30 flex items-center border-b border-r border-slate-300 bg-slate-100 px-3 text-[10px] font-semibold uppercase text-slate-500">Time / day</div>
          {DAYS.map(([, day]) => <div key={day} className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100 px-3 py-3 text-center text-xs font-semibold text-slate-700">{day}</div>)}
          {PERIODS.flatMap(([label, start, end], periodIndex) => [
            <div key={`${label}-heading`} className="sticky left-0 z-10 border-b border-r border-slate-300 bg-slate-100 px-3 py-4"><strong className="block text-xs text-slate-700">{label}</strong><span className="mt-1 block text-[9px] text-slate-500">{start}–{end}</span></div>,
            ...DAYS.map(([day]) => {
              const slot = slots.find((item) => item.dayOfWeek === day && item.sequence === periodIndex + 1);
              const entry = slot && entries.find((item) => item.slotId === slot.id);
              const activeDrop = slot?.id === dropSlotId;
              return <button key={`${day}-${label}`} type="button" disabled={!slot || !sectionId} draggable={Boolean(entry) && selectedVersion?.status === 'draft'} onDragStart={() => entry && setDragItem({ kind: 'entry', entryId: entry.id })} onDragEnd={() => { setDragItem(null); setDropSlotId(null); }} onDragOver={(event) => { if (selectedVersion?.status === 'draft') { event.preventDefault(); if (slot) setDropSlotId(slot.id); } }} onDragLeave={() => setDropSlotId((current) => current === slot?.id ? null : current)} onDrop={(event) => { event.preventDefault(); if (slot) dropOnCell(slot.id); }} onClick={() => { if (!slot || selectedVersion?.status !== 'draft') return; if (dragItem?.kind === 'subject') dropOnCell(slot.id); else openEditor(slot.id, entry); }} className={`group min-h-28 border-b border-r p-2 text-left transition ${activeDrop ? 'border-emerald-500 bg-emerald-50 ring-2 ring-inset ring-emerald-500' : entry ? 'border-slate-300 bg-white hover:bg-emerald-50/40' : 'border-slate-300 bg-white hover:bg-slate-50'} disabled:cursor-default`} title={entry ? `Drag or click to edit ${entry.subjectName}` : 'Drop a subject here'}>
                {entry ? <div className="h-full rounded border-l-4 border-emerald-600 bg-emerald-50 px-2 py-2"><div className="flex items-start justify-between gap-1"><strong className="text-xs text-slate-900">{entry.subjectCode}</strong><GripVertical size={13} className="text-slate-400 opacity-0 group-hover:opacity-100" /></div><p className="mt-1 line-clamp-2 text-[10px] text-slate-700">{entry.subjectName}</p><p className="mt-3 truncate text-[9px] text-emerald-800">{entry.facultyName}</p><p className="mt-1 text-[9px] text-slate-500">{entry.roomCode}</p></div> : <span className="flex h-full items-center justify-center text-[10px] text-slate-300 group-hover:text-slate-500">Drop subject</span>}
              </button>;
            }),
          ])}
        </div>
      </div>
    </div>

    {editorSlotId && <div className="fixed inset-0 z-[150] flex justify-end bg-black/30" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorSlotId(null); }}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Cell editor</p><h2 className="mt-1 text-xl">Customize period</h2></div><button type="button" onClick={() => setEditorSlotId(null)} className="grid h-9 w-9 place-items-center"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4">
          <EditorSelect label="Subject" value={offeringId} onChange={(value) => { setOfferingId(value); setAssignmentId(''); }}><option value="">Choose subject</option>{offerings.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</EditorSelect>
          <EditorSelect label="Faculty" value={assignmentId} onChange={setAssignmentId}><option value="">Choose faculty</option>{assignments.map((item) => <option key={item.id} value={item.id}>{item.facultyName}</option>)}</EditorSelect>
          <EditorSelect label="Room" value={roomId} onChange={setRoomId}><option value="">Choose room</option>{data.rooms.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} ({item.capacity})</option>)}</EditorSelect>
          <EditorSelect label="Delivery type" value={deliveryType} onChange={(value) => setDeliveryType(value as TimetableDeliveryType)}>{['class', 'laboratory', 'tutorial', 'project', 'activity'].map((item) => <option key={item} value={item}>{item}</option>)}</EditorSelect>
        </div>
        <div className="mt-6 flex gap-2">{editorEntryId && <button type="button" disabled={busy} onClick={() => void run(async () => { await deleteTimetableEntry(editorEntryId); setEditorSlotId(null); setEditorEntryId(null); }, 'Cell cleared.')} className="inline-flex h-11 items-center gap-2 rounded border border-red-200 px-4 text-xs text-red-700"><Trash2 size={14} /> Clear</button>}<button type="button" disabled={busy} onClick={() => void saveEditor()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded bg-slate-900 text-xs text-white"><Save size={14} /> Save cell</button></div>
      </aside>
    </div>}
  </div>;
}

function Message({ error, notice }: { error: string | null; notice: string | null }) {
  return <div className={`mt-3 flex items-center gap-2 border px-3 py-2 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error ?? notice}</div>;
}

function EditorSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-xs text-slate-500">{label}<span className="relative mt-1 block"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 outline-none focus:border-emerald-600">{children}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" /></span></label>;
}
