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
  deleteTimetableWorkloadRequirement,
  generateTimetableVersion,
  getTimetableContext,
  publishTimetableVersion,
  replaceTimetableSlots,
  updateTimetableEntry,
  upsertTimetableWorkloadRequirement,
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
const DISPLAY_COLUMNS = [
  { kind: 'period' as const, sequence: 1, label: 'Period I', time: '8.30–9.20' },
  { kind: 'period' as const, sequence: 2, label: 'Period II', time: '9.20–10.10' },
  { kind: 'break' as const, label: 'Break', time: '10.10–10.30' },
  { kind: 'period' as const, sequence: 3, label: 'Period III', time: '10.30–11.20' },
  { kind: 'period' as const, sequence: 4, label: 'Period IV', time: '11.20–12.10' },
  { kind: 'break' as const, label: 'Lunch', time: '12.10–1.00' },
  { kind: 'period' as const, sequence: 5, label: 'Period V', time: '1.00–1.50' },
  { kind: 'period' as const, sequence: 6, label: 'Period VI', time: '1.50–2.40' },
  { kind: 'period' as const, sequence: 7, label: 'Period VII', time: '2.40–3.30' },
];

const MEC_ROOMS: Array<Parameters<typeof createTimetableRoomsBulk>[0][number]> = [
  ...['AIDS', 'CSBS', 'CSE', 'AIML', 'CYBER', 'IT'].map((code) => ({ departmentCode: code, code: `${code}-CR`, name: `${code} Classroom`, roomType: 'classroom' as const, capacity: 60 })),
  { code: 'CL-01', name: 'Computer Lab 1', roomType: 'computer_lab', capacity: 60 },
  { code: 'CL-02', name: 'Computer Lab 2', roomType: 'computer_lab', capacity: 60 },
  { code: 'PHY-LAB', name: 'Physics Laboratory', roomType: 'physics_lab', capacity: 60 },
  { code: 'CHEM-LAB', name: 'Chemistry Laboratory', roomType: 'chemistry_lab', capacity: 60 },
  { code: 'SEMINAR', name: 'Seminar Hall', roomType: 'seminar_hall', capacity: 200 },
];

type DragItem = { kind: 'subject'; offeringId: string } | { kind: 'entry'; entryId: string };
type CourseRule = { courseType: 'T' | 'LIT' | 'ACT'; workload: number; theory: number; lab: number };

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
  const [showRules, setShowRules] = useState(true);
  const [courseRules, setCourseRules] = useState<Record<string, CourseRule>>({});

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
  useEffect(() => {
    setCourseRules((current) => {
      const next = { ...current };
      for (const offering of offerings) {
        if (next[offering.id]) continue;
        const requirements = (data?.workloadRequirements ?? []).filter((item) => item.subjectOfferingId === offering.id);
        const theory = requirements.filter((item) => item.deliveryType === 'class' || item.deliveryType === 'tutorial').reduce((sum, item) => sum + item.periodsPerWeek, 0);
        const lab = requirements.filter((item) => item.deliveryType === 'laboratory').reduce((sum, item) => sum + item.periodsPerWeek, 0);
        const activity = requirements.filter((item) => item.deliveryType === 'activity').reduce((sum, item) => sum + item.periodsPerWeek, 0);
        if (requirements.length) {
          next[offering.id] = { courseType: activity ? 'ACT' : lab ? 'LIT' : 'T', workload: theory + lab + activity, theory, lab };
          continue;
        }
        const name = offering.name.toLowerCase();
        const workload = Math.max(1, Math.round(offering.credits || (name.includes('library') ? 1 : name.includes('club') ? 2 : 5)));
        if (name.includes('library') || name.includes('club') || name.includes('activity')) next[offering.id] = { courseType: 'ACT', workload, theory: 0, lab: 0 };
        else if (name.includes('laboratory') || name.includes(' lab')) next[offering.id] = { courseType: 'LIT', workload: Math.max(3, workload), theory: 0, lab: Math.max(3, workload) };
        else if (name.includes('mathematics')) next[offering.id] = { courseType: 'T', workload, theory: workload, lab: 0 };
        else {
          const labHours = workload >= 7 ? 3 : workload >= 5 ? 2 : 0;
          next[offering.id] = { courseType: labHours ? 'LIT' : 'T', workload, theory: workload - labHours, lab: labHours };
        }
      }
      return next;
    });
  }, [data?.workloadRequirements, offerings]);

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

  const updateCourseRule = (offeringId: string, patch: Partial<CourseRule>) => {
    setCourseRules((current) => {
      const existing = current[offeringId] ?? { courseType: 'T', workload: 5, theory: 5, lab: 0 };
      const next = { ...existing, ...patch };
      if (patch.courseType === 'T') { next.theory = next.workload; next.lab = 0; }
      if (patch.courseType === 'ACT') { next.theory = 0; next.lab = 0; }
      if (patch.workload !== undefined && next.courseType === 'T') next.theory = patch.workload;
      return { ...current, [offeringId]: next };
    });
  };

  const applyRulesAndGenerate = () => run(async () => {
    if (!versionId || !sectionId) throw new Error('Choose a section and a draft timetable.');
    const total = offerings.reduce((sum, offering) => sum + (courseRules[offering.id]?.workload ?? 0), 0);
    if (total !== 35) throw new Error(`Weekly workload is ${total}. It must equal the 35 available periods.`);
    for (const offering of offerings) {
      const rule = courseRules[offering.id];
      if (!rule || rule.workload < 1 || rule.theory + rule.lab > rule.workload) throw new Error(`${offering.code} has an invalid workload split.`);
      if (rule.courseType === 'ACT') {
        await deleteTimetableWorkloadRequirement(offering.id, 'class');
        await deleteTimetableWorkloadRequirement(offering.id, 'laboratory');
        await upsertTimetableWorkloadRequirement({ subjectOfferingId: offering.id, deliveryType: 'activity', periodsPerWeek: rule.workload, blockSize: Math.min(2, rule.workload), maxBlocksPerDay: 1 });
      } else {
        await deleteTimetableWorkloadRequirement(offering.id, 'activity');
        if (rule.theory > 0) await upsertTimetableWorkloadRequirement({ subjectOfferingId: offering.id, deliveryType: 'class', periodsPerWeek: rule.theory, blockSize: 1, maxBlocksPerDay: 1, requiredRoomTypes: ['classroom'] });
        else await deleteTimetableWorkloadRequirement(offering.id, 'class');
        if (rule.lab > 0) await upsertTimetableWorkloadRequirement({ subjectOfferingId: offering.id, deliveryType: 'laboratory', periodsPerWeek: rule.lab, blockSize: rule.lab, maxBlocksPerDay: 1 });
        else await deleteTimetableWorkloadRequirement(offering.id, 'laboratory');
      }
    }
    await generateTimetableVersion(versionId, { preserveExisting: false, prioritizeHighCredits: true });
    setShowRules(false);
  }, 'Timetable generated from the course workload rules.');

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
        {selectedVersion?.status === 'draft' && <button type="button" onClick={() => setShowRules((visible) => !visible)} className={`inline-flex h-9 items-center gap-2 rounded border px-3 text-xs ${showRules ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}><Sparkles size={14} /> Course workload</button>}
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

    {showRules && <section className="border-b border-slate-300 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-700">Generator input</p><h2 className="mt-1 text-base font-semibold text-slate-900">Course workload rules</h2><p className="mt-1 text-[11px] text-slate-500">Theory is distributed across the week. Lab hours stay together and never cross break or lunch.</p></div><div className="flex items-center gap-3"><span className={`rounded px-3 py-2 text-xs font-semibold ${offerings.reduce((sum, item) => sum + (courseRules[item.id]?.workload ?? 0), 0) === 35 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>Weekly total: {offerings.reduce((sum, item) => sum + (courseRules[item.id]?.workload ?? 0), 0)} / 35</span><button type="button" disabled={busy || selectedVersion?.status !== 'draft' || data.rooms.length === 0 || offerings.length === 0} onClick={() => void applyRulesAndGenerate()} className="inline-flex h-10 items-center gap-2 rounded bg-violet-700 px-4 text-xs text-white disabled:opacity-40"><Sparkles size={14} /> Generate timetable</button></div></div>
      <div className="overflow-x-auto border-l border-t border-slate-300">
        <div className="grid min-w-[1050px] grid-cols-[56px_110px_minmax(220px,1fr)_100px_minmax(190px,1fr)_100px_100px_100px] bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          {['S.No', 'Course code', 'Course name', 'Type', 'Faculty name', 'Work load', 'Theory', 'Lab block'].map((heading) => <div key={heading} className="border-b border-r border-slate-300 px-3 py-3">{heading}</div>)}
        </div>
        {offerings.map((offering, index) => {
          const rule = courseRules[offering.id] ?? { courseType: 'T' as const, workload: 5, theory: 5, lab: 0 };
          const faculty = data.teachingAssignments.find((item) => item.subjectOfferingId === offering.id)?.facultyName ?? 'Not assigned';
          return <div key={offering.id} className="grid min-w-[1050px] grid-cols-[56px_110px_minmax(220px,1fr)_100px_minmax(190px,1fr)_100px_100px_100px] text-xs text-slate-700">
            <div className="border-b border-r border-slate-300 px-3 py-3 text-center">{index + 1}</div>
            <div className="border-b border-r border-slate-300 px-3 py-3 font-semibold">{offering.code}</div>
            <div className="border-b border-r border-slate-300 px-3 py-3">{offering.name}</div>
            <div className="border-b border-r border-slate-300 p-1.5"><select value={rule.courseType} onChange={(event) => updateCourseRule(offering.id, { courseType: event.target.value as CourseRule['courseType'] })} className="h-8 w-full border border-slate-200 bg-white px-2"><option value="T">T</option><option value="LIT">LIT</option><option value="ACT">Activity</option></select></div>
            <div className="border-b border-r border-slate-300 px-3 py-3">{faculty}</div>
            <RuleNumber value={rule.workload} onChange={(workload) => updateCourseRule(offering.id, { workload })} />
            <RuleNumber value={rule.theory} disabled={rule.courseType === 'ACT'} onChange={(theory) => updateCourseRule(offering.id, { theory })} />
            <RuleNumber value={rule.lab} disabled={rule.courseType !== 'LIT'} onChange={(lab) => updateCourseRule(offering.id, { lab })} />
          </div>;
        })}
      </div>
    </section>}

    {!showRules && <section className="border-b border-slate-300 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Subject tray</h2><span className="text-[10px] text-slate-400">Higher-credit subjects appear first</span></div>
      <div className="flex min-h-16 gap-2 overflow-x-auto pb-1">
        {offerings.map((offering) => {
          const faculty = data.teachingAssignments.find((item) => item.subjectOfferingId === offering.id)?.facultyName ?? 'Faculty not assigned';
          const selected = dragItem?.kind === 'subject' && dragItem.offeringId === offering.id;
          return <button key={offering.id} type="button" draggable={selectedVersion?.status === 'draft'} onClick={() => selectedVersion?.status === 'draft' && setDragItem(selected ? null : { kind: 'subject', offeringId: offering.id })} onDragStart={() => setDragItem({ kind: 'subject', offeringId: offering.id })} onDragEnd={() => setDropSlotId(null)} className={`flex w-52 shrink-0 cursor-grab items-center gap-2 rounded border px-3 py-2 text-left shadow-sm active:cursor-grabbing ${selected ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-300 bg-white'}`}><GripVertical size={14} className="shrink-0 text-slate-400" /><span className="min-w-0"><strong className="block truncate text-xs text-slate-800">{offering.code} · {offering.name}</strong><small className="mt-1 block truncate text-[10px] text-slate-500">{faculty} · {offering.credits || '—'} credits</small></span></button>;
        })}
        {sectionId && offerings.length === 0 && <p className="py-4 text-xs text-slate-500">No subject offerings are assigned to this section yet.</p>}
      </div>
    </section>}

    <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
      <div className="min-w-[1320px] border-l border-t border-slate-400 bg-white">
        <div className="grid grid-cols-[120px_repeat(2,minmax(125px,1fr))_64px_repeat(2,minmax(125px,1fr))_64px_repeat(3,minmax(125px,1fr))]">
          <div className="sticky left-0 top-0 z-30 flex items-center justify-center border-b border-r border-slate-400 bg-slate-100 px-3 text-xs font-semibold text-slate-700">DAY / TIME</div>
          {DISPLAY_COLUMNS.map((column) => <div key={`${column.label}-head`} className={`sticky top-0 z-20 border-b border-r border-slate-400 bg-slate-100 px-2 py-3 text-center ${column.kind === 'break' ? 'text-[9px]' : ''}`}><strong className="block text-[10px] uppercase text-slate-700">{column.label}</strong><span className="mt-1 block text-[9px] text-slate-500">{column.time}</span></div>)}
          {DAYS.flatMap(([day, dayName]) => [
            <div key={`${day}-name`} className="sticky left-0 z-10 flex min-h-24 items-center border-b border-r border-slate-400 bg-slate-100 px-3 text-xs font-semibold uppercase text-slate-700">{dayName}</div>,
            ...DISPLAY_COLUMNS.map((column) => {
              if (column.kind === 'break') return <div key={`${day}-${column.label}`} className="flex min-h-24 items-center justify-center border-b border-r border-slate-400 bg-slate-50"><span className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[.18em] text-slate-400">{column.label}</span></div>;
              const slot = slots.find((item) => item.dayOfWeek === day && item.sequence === column.sequence);
              const entry = slot && entries.find((item) => item.slotId === slot.id);
              const activeDrop = slot?.id === dropSlotId;
              return <button key={`${day}-${column.sequence}`} type="button" disabled={!slot || !sectionId} draggable={Boolean(entry) && selectedVersion?.status === 'draft'} onDragStart={() => entry && setDragItem({ kind: 'entry', entryId: entry.id })} onDragEnd={() => { setDragItem(null); setDropSlotId(null); }} onDragOver={(event) => { if (selectedVersion?.status === 'draft') { event.preventDefault(); if (slot) setDropSlotId(slot.id); } }} onDragLeave={() => setDropSlotId((current) => current === slot?.id ? null : current)} onDrop={(event) => { event.preventDefault(); if (slot) dropOnCell(slot.id); }} onClick={() => { if (!slot || selectedVersion?.status !== 'draft') return; if (dragItem?.kind === 'subject') dropOnCell(slot.id); else openEditor(slot.id, entry); }} className={`group min-h-24 border-b border-r p-1.5 text-left transition ${activeDrop ? 'border-emerald-500 bg-emerald-50 ring-2 ring-inset ring-emerald-500' : entry ? 'border-slate-400 bg-white hover:bg-emerald-50/40' : 'border-slate-400 bg-white hover:bg-slate-50'} disabled:cursor-default`} title={entry ? `Drag or click to edit ${entry.subjectName}` : 'Drop a subject here'}>
                {entry ? <div className={`flex h-full flex-col justify-center border-l-4 px-2 py-1.5 ${entry.deliveryType === 'laboratory' ? 'border-violet-600 bg-violet-50' : entry.deliveryType === 'activity' ? 'border-amber-500 bg-amber-50' : 'border-emerald-600 bg-emerald-50'}`}><div className="flex items-start justify-between gap-1"><strong className="text-xs text-slate-900">{entry.subjectCode}{entry.deliveryType === 'laboratory' ? ' · Lab' : ''}</strong><GripVertical size={12} className="text-slate-400 opacity-0 group-hover:opacity-100" /></div><p className="mt-1 truncate text-[9px] text-slate-600">{entry.facultyName}</p><p className="mt-1 text-[9px] text-slate-500">{entry.roomCode}</p></div> : <span className="flex h-full items-center justify-center text-[10px] text-slate-300 group-hover:text-slate-500">Drop</span>}
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

function RuleNumber({ value, disabled = false, onChange }: { value: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <div className="border-b border-r border-slate-300 p-1.5"><input type="number" min={0} max={35} value={value} disabled={disabled} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} className="h-8 w-full border border-slate-200 bg-white px-2 text-center text-xs outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-400" /></div>;
}

function EditorSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="text-xs text-slate-500">{label}<span className="relative mt-1 block"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 outline-none focus:border-emerald-600">{children}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-slate-400" /></span></label>;
}
