'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { TimetableSheetSkeleton } from '@/components/ui/skeletons';
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
  upsertTimetableWorkloadRequirement,
  type TimetableContext,
  type TimetableDeliveryType,
  type TimetableRoom,
} from '@/lib/timetable-api';

type AllocatorTab = 'schedule' | 'workload' | 'spaces' | 'releases';

const DAYS = [
  [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'],
] as const;

const PERIODS = [
  ['P1', '08:30', '09:20'], ['P2', '09:20', '10:10'], ['P3', '10:30', '11:20'],
  ['P4', '11:20', '12:10'], ['P5', '13:00', '13:50'], ['P6', '13:50', '14:40'],
  ['P7', '14:40', '15:30'],
] as const;

const MEC_ROOMS: Array<Parameters<typeof createTimetableRoomsBulk>[0][number]> = [
  ...['AIDS', 'CSBS', 'CSE', 'AIML', 'CYBER', 'IT'].map((code) => ({ departmentCode: code, code: `${code}-CR`, name: `${code} Department Room`, roomType: 'classroom' as const, capacity: 60 })),
  { code: 'TR-01', name: 'Tutorial Room 1', roomType: 'tutorial_room', capacity: 50 },
  { code: 'TR-02', name: 'Tutorial Room 2', roomType: 'tutorial_room', capacity: 50 },
  { code: 'CL-01', name: 'Computer Lab 1', roomType: 'computer_lab', capacity: 50 },
  { code: 'CL-02', name: 'Computer Lab 2', roomType: 'computer_lab', capacity: 50 },
  { code: 'CHEM-LAB', name: 'Chemistry Lab', roomType: 'chemistry_lab', capacity: 25 },
  { code: 'PHY-LAB', name: 'Physics Lab', roomType: 'physics_lab', capacity: 25 },
  { code: 'MECH-WS', name: 'Mechanical Workshop', roomType: 'workshop', capacity: 100 },
  { code: 'LIB', name: 'Library', roomType: 'library', capacity: 48 },
  { code: 'STAFF-01', name: 'Staff Room 1', roomType: 'staff_room', capacity: 20 },
  { code: 'STAFF-02', name: 'Staff Room 2', roomType: 'staff_room', capacity: 20 },
  { code: 'SEMINAR-01', name: 'Seminar Hall 1', roomType: 'seminar_hall', capacity: 200 },
  { code: 'SEMINAR-02', name: 'Seminar Hall 2', roomType: 'seminar_hall', capacity: 200 },
];

const control = 'h-10 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none focus:border-[var(--tenant-primary)]';

export function TimetableAllocatorWorkspace() {
  const [context, setContext] = useState<TimetableContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<AllocatorTab>('schedule');
  const [configurationId, setConfigurationId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignmentSlotId, setAssignmentSlotId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState('');
  const [teachingAssignmentId, setTeachingAssignmentId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [deliveryType, setDeliveryType] = useState<TimetableDeliveryType>('class');
  const [setupName, setSetupName] = useState('MEC Odd Semester 2026-27');
  const [setupYearId, setSetupYearId] = useState('');
  const [setupTermId, setSetupTermId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTimetableContext();
      const next = response.data;
      setContext(next);
      setConfigurationId((current) => next.configurations.some((item) => item.id === current) ? current : next.configurations[0]?.id ?? '');
      setSetupYearId((current) => current || next.academicYears.find((item) => item.status === 'active')?.id || next.academicYears[0]?.id || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Timetable data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const configurations = context?.configurations ?? [];
  const versions = useMemo(() => (context?.versions ?? []).filter((item) => item.configurationId === configurationId), [context, configurationId]);
  useEffect(() => {
    setVersionId((current) => versions.some((item) => item.id === current) ? current : versions.find((item) => item.status === 'draft')?.id ?? versions[0]?.id ?? '');
  }, [versions]);

  const visibleSections = useMemo(() => (context?.sections ?? []).filter((item) => !departmentId || item.departmentId === departmentId), [context, departmentId]);
  useEffect(() => {
    setSectionId((current) => visibleSections.some((item) => item.id === current) ? current : visibleSections[0]?.id ?? '');
  }, [visibleSections]);

  const slots = useMemo(() => (context?.slots ?? []).filter((item) => item.configurationId === configurationId && item.slotType === 'instructional'), [context, configurationId]);
  const entries = useMemo(() => (context?.entries ?? []).filter((item) => item.versionId === versionId && (!sectionId || item.sectionId === sectionId)), [context, versionId, sectionId]);
  const selectedVersion = versions.find((item) => item.id === versionId);
  const offerings = useMemo(() => (context?.subjectOfferings ?? []).filter((item) => (!sectionId || item.sectionId === sectionId)), [context, sectionId]);
  const assignments = useMemo(() => (context?.teachingAssignments ?? []).filter((item) => item.subjectOfferingId === offeringId), [context, offeringId]);
  const selectedSlot = slots.find((item) => item.id === assignmentSlotId);
  const selectedSection = visibleSections.find((item) => item.id === sectionId);

  const run = async (task: () => Promise<void>, success: string) => {
    setBusy(true); setError(null); setNotice(null);
    try { await task(); setNotice(success); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The timetable action failed.'); }
    finally { setBusy(false); }
  };

  const createSetup = () => run(async () => {
    if (!setupYearId) throw new Error('Create an academic year before configuring the timetable.');
    const response = await createTimetableConfiguration({ academicYearId: setupYearId, termId: setupTermId || null, name: setupName, maxFacultyPeriodsPerDay: 7, maxConsecutiveFacultyPeriods: 3 });
    const id = String(response.data.id ?? '');
    if (!id) throw new Error('The timetable configuration was created without an identifier.');
    await replaceTimetableSlots(id, DAYS.flatMap(([day]) => PERIODS.map(([label, startsAt, endsAt], index) => ({ dayOfWeek: day, sequence: index + 1, label, slotType: 'instructional' as const, startsAt, endsAt }))));
    await createTimetableVersion(id, 'Working draft');
  }, 'Seven-period MEC timetable created.');

  const saveAssignment = () => run(async () => {
    if (!versionId || !assignmentSlotId || !offeringId || !teachingAssignmentId || !roomId) throw new Error('Choose a subject, faculty member, and room.');
    const input = { versionId, slotId: assignmentSlotId, subjectOfferingId: offeringId, teachingAssignmentId, roomId, deliveryType };
    if (editingEntryId) await updateTimetableEntry(editingEntryId, input);
    else await createTimetableEntry(input);
    setAssignmentSlotId(null); setEditingEntryId(null); setOfferingId(''); setTeachingAssignmentId(''); setRoomId('');
  }, editingEntryId ? 'Period updated and conflict checks passed.' : 'Period assigned and conflict checks passed.');

  const openCell = (slotId: string, entry?: TimetableContext['entries'][number]) => {
    setAssignmentSlotId(slotId);
    setEditingEntryId(entry?.id ?? null);
    setOfferingId(entry?.subjectOfferingId ?? '');
    setTeachingAssignmentId(entry?.teachingAssignmentId ?? '');
    setRoomId(entry?.roomId ?? '');
    setDeliveryType(entry?.deliveryType ?? 'class');
  };

  if (loading && !context) return <div className="mt-4"><TimetableSheetSkeleton /></div>;

  return (
    <div className="mt-4 min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--crm-border)] pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">Academic operations / Web</p>
          <h2 className="mt-1 text-2xl">Timetable allocator</h2>
          <p className="mt-1 text-xs text-[var(--crm-muted)]">Principal-only spreadsheet playground with credit-aware automatic scheduling and controlled publishing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" title="Refresh timetable" onClick={() => void refresh()} className="grid h-10 w-10 place-items-center rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)]"><RefreshCw size={16} /></button>
          {selectedVersion?.status === 'draft' && <button type="button" disabled={busy || !versionId || (context?.rooms.length ?? 0) === 0} onClick={() => void run(async () => {
            await generateTimetableVersion(versionId, { preserveExisting: true, prioritizeHighCredits: true });
          }, 'AI timetable generated. Existing principal edits were preserved.')} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--tenant-primary)] px-4 text-xs text-[var(--tenant-primary)] disabled:opacity-40"><Sparkles size={15} /> Auto-generate</button>}
          {selectedVersion?.status === 'draft' && <button type="button" disabled={busy} onClick={() => void run(async () => { await publishTimetableVersion(versionId); }, 'Timetable published to students and staff.')} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--tenant-primary)] px-4 text-xs text-white disabled:opacity-50"><Rocket size={15} /> Publish</button>}
        </div>
      </header>

      {(error || notice) && <div className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertTriangle size={15} /> : <Check size={15} />}{error ?? notice}</div>}

      {!context?.canManage && <div className="mt-4 border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 text-sm">This account can view published schedules but does not have timetable management permission.</div>}

      {context?.canManage && configurations.length === 0 ? (
        <section className="mt-5 max-w-3xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
          <h3 className="text-base">Create the timetable workspace</h3>
          <p className="mt-1 text-xs text-[var(--crm-muted)]">This creates Monday-Friday with seven MEC periods. Break and lunch remain protected gaps.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input value={setupName} onChange={(event) => setSetupName(event.target.value)} className={control} aria-label="Configuration name" />
            <select value={setupYearId} onChange={(event) => { setSetupYearId(event.target.value); setSetupTermId(''); }} className={control} aria-label="Academic year"><option value="">Academic year</option>{context.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select value={setupTermId} onChange={(event) => setSetupTermId(event.target.value)} className={control} aria-label="Term"><option value="">Whole year</option>{context.terms.filter((item) => item.academicYearId === setupYearId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </div>
          <button type="button" disabled={busy || !setupName.trim()} onClick={() => void createSetup()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[var(--tenant-primary)] px-4 text-xs text-white disabled:opacity-50"><Plus size={15} /> Create workspace</button>
        </section>
      ) : context?.canManage && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(['schedule', 'workload', 'spaces', 'releases'] as AllocatorTab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`h-9 px-3 text-xs capitalize ${tab === item ? 'border-b-2 border-[var(--tenant-primary)] text-[var(--tenant-primary)]' : 'text-[var(--crm-muted)]'}`}>{item}</button>)}
            <span className="mx-1 h-5 w-px bg-[var(--crm-border)]" />
            <select value={configurationId} onChange={(event) => setConfigurationId(event.target.value)} className={control} aria-label="Timetable configuration">{configurations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select value={versionId} onChange={(event) => setVersionId(event.target.value)} className={control} aria-label="Timetable version">{versions.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.status})</option>)}</select>
          </div>

          {tab === 'schedule' && <section className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={control} aria-label="Department"><option value="">All departments</option>{context.departments.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className={control} aria-label="Section"><option value="">Choose section</option>{visibleSections.map((item) => <option key={item.id} value={item.id}>{item.programmeName} / {item.batchName} / {item.name}</option>)}</select>
              <span className="inline-flex h-10 items-center gap-2 px-2 text-xs text-[var(--crm-muted)]"><Users size={15} /> {selectedSection?.capacity ?? 0} seats</span>
              <span className="text-[10px] text-[var(--crm-muted)]">Click any cell to add or edit. Automatic generation preserves your manual cells.</span>
            </div>
            <div className="mt-3 overflow-x-auto border border-[var(--crm-border)] bg-[var(--crm-card)]">
              <div className="grid min-w-[1080px] grid-cols-[120px_repeat(7,minmax(130px,1fr))]">
                <div className="border-b border-r border-[var(--crm-border)] p-3 text-[10px] uppercase text-[var(--crm-muted)]">Day</div>
                {PERIODS.map(([label, start, end]) => <div key={label} className="border-b border-r border-[var(--crm-border)] p-3 last:border-r-0"><p className="text-xs">{label}</p><p className="mt-1 text-[9px] text-[var(--crm-muted)]">{start}-{end}</p></div>)}
                {DAYS.flatMap(([day, dayName]) => [
                  <div key={`${day}-name`} className="border-b border-r border-[var(--crm-border)] p-3 text-xs last:border-b-0">{dayName}</div>,
                  ...PERIODS.map(([label], periodIndex) => {
                    const slot = slots.find((item) => item.dayOfWeek === day && item.sequence === periodIndex + 1);
                    const entry = slot && entries.find((item) => item.slotId === slot.id);
                    return <button key={`${day}-${label}`} type="button" disabled={!slot || !sectionId || selectedVersion?.status !== 'draft'} onClick={() => slot && openCell(slot.id, entry)} title={entry ? `Edit ${entry.subjectName}, ${entry.facultyName}, ${entry.roomCode}` : 'Assign this period'} className="min-h-24 border-b border-r border-[var(--crm-border)] p-3 text-left last:border-r-0 hover:bg-[var(--crm-surface)] disabled:cursor-default">
                      {entry ? <><p className="text-xs">{entry.subjectCode}</p><p className="mt-1 line-clamp-2 text-[10px] text-[var(--crm-muted)]">{entry.subjectName}</p><p className="mt-2 text-[9px] text-[var(--tenant-primary)]">{entry.facultyName}</p><p className="mt-1 text-[9px] text-[var(--crm-muted)]">{entry.roomCode} / {entry.deliveryType}</p></> : <span className="flex items-center gap-1 text-[10px] text-[var(--crm-muted)]"><Plus size={13} /> Assign</span>}
                    </button>;
                  }),
                ])}
              </div>
            </div>
          </section>}

          {tab === 'workload' && <section className="mt-4 border border-[var(--crm-border)] bg-[var(--crm-card)]">
            <div className="grid grid-cols-[1fr_150px_110px_110px_90px] border-b border-[var(--crm-border)] px-4 py-3 text-[10px] uppercase text-[var(--crm-muted)]"><span>Subject / section</span><span>Faculty</span><span>Periods</span><span>Block</span><span>Action</span></div>
            {context.subjectOfferings.map((offering) => {
              const requirement = context.workloadRequirements.find((item) => item.subjectOfferingId === offering.id);
              const faculty = context.teachingAssignments.find((item) => item.subjectOfferingId === offering.id)?.facultyName ?? 'Unassigned';
              return <WorkloadRow key={offering.id} offering={offering} faculty={faculty} periods={requirement?.periodsPerWeek ?? 5} blockSize={requirement?.blockSize ?? 1} disabled={busy} onSave={(periods, blockSize) => run(async () => { await upsertTimetableWorkloadRequirement({ subjectOfferingId: offering.id, periodsPerWeek: periods, blockSize, maxBlocksPerDay: blockSize > 1 ? 1 : 3 }); }, `${offering.code} workload saved.`)} />;
            })}
          </section>}

          {tab === 'spaces' && <section className="mt-4">
            <div className="flex items-center justify-between"><div><h3 className="text-base">Rooms and teaching spaces</h3><p className="mt-1 text-xs text-[var(--crm-muted)]">Capacity is enforced during allocation.</p></div><button type="button" disabled={busy} onClick={() => void run(async () => { await createTimetableRoomsBulk(MEC_ROOMS); }, 'MEC spaces imported.')} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--tenant-primary)] px-4 text-xs text-white disabled:opacity-50"><Building2 size={15} /> Import MEC spaces</button></div>
            <div className="mt-4 grid grid-cols-[110px_1fr_170px_100px] border border-[var(--crm-border)] bg-[var(--crm-card)] text-xs"><div className="contents text-[10px] uppercase text-[var(--crm-muted)]"><span className="border-b p-3">Code</span><span className="border-b p-3">Space</span><span className="border-b p-3">Type</span><span className="border-b p-3">Capacity</span></div>{context.rooms.map((room) => <div key={room.id} className="contents"><span className="border-b p-3">{room.code}</span><span className="border-b p-3">{room.name}</span><span className="border-b p-3 text-[var(--crm-muted)]">{room.roomType.replaceAll('_', ' ')}</span><span className="border-b p-3">{room.capacity}</span></div>)}</div>
          </section>}

          {tab === 'releases' && <section className="mt-4 max-w-4xl">
            <div className="flex items-center justify-between"><div><h3 className="text-base">Timetable releases</h3><p className="mt-1 text-xs text-[var(--crm-muted)]">Only published versions appear in student and staff schedules.</p></div><button type="button" disabled={busy || !configurationId} onClick={() => void run(async () => { await createTimetableVersion(configurationId, `Draft ${versions.length + 1}`); }, 'New timetable draft created.')} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 text-xs"><Plus size={15} /> New draft</button></div>
            <div className="mt-4 border border-[var(--crm-border)] bg-[var(--crm-card)]">{versions.map((version) => <div key={version.id} className="flex items-center justify-between border-b border-[var(--crm-border)] px-4 py-3 last:border-b-0"><div><p className="text-sm">{version.label}</p><p className="mt-1 text-[10px] uppercase text-[var(--crm-muted)]">Version {version.versionNumber} / {version.status}</p></div><span className={`rounded-full px-2 py-1 text-[9px] uppercase ${version.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--crm-surface)] text-[var(--crm-muted)]'}`}>{version.publishedAt ? `Published ${new Date(version.publishedAt).toLocaleDateString()}` : 'Working copy'}</span></div>)}</div>
          </section>}
        </>
      )}

      {assignmentSlotId && <div className="fixed inset-0 z-[120] flex items-center justify-end bg-black/30" onMouseDown={(event) => { if (event.currentTarget === event.target) setAssignmentSlotId(null); }}>
        <aside className="h-full w-full max-w-md overflow-y-auto bg-[var(--crm-card)] p-6 shadow-xl">
          <div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-widest text-[var(--tenant-primary)]">{editingEntryId ? 'Edit period' : 'Assign period'}</p><h3 className="mt-1 text-xl">{DAYS.find(([day]) => day === selectedSlot?.dayOfWeek)?.[1]} / {selectedSlot?.label}</h3></div><button type="button" title="Close" onClick={() => { setAssignmentSlotId(null); setEditingEntryId(null); }} className="grid h-9 w-9 place-items-center"><X size={18} /></button></div>
          <div className="mt-6 grid gap-4">
            <label className="text-xs text-[var(--crm-muted)]">Subject<select value={offeringId} onChange={(event) => { setOfferingId(event.target.value); setTeachingAssignmentId(''); }} className={`${control} mt-1 w-full text-[var(--crm-text)]`}><option value="">Choose subject</option>{offerings.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></label>
            <label className="text-xs text-[var(--crm-muted)]">Faculty<select value={teachingAssignmentId} onChange={(event) => setTeachingAssignmentId(event.target.value)} className={`${control} mt-1 w-full text-[var(--crm-text)]`}><option value="">Choose assigned faculty</option>{assignments.map((item) => <option key={item.id} value={item.id}>{item.facultyName} ({item.assignmentType})</option>)}</select></label>
            <label className="text-xs text-[var(--crm-muted)]">Room<select value={roomId} onChange={(event) => setRoomId(event.target.value)} className={`${control} mt-1 w-full text-[var(--crm-text)]`}><option value="">Choose room</option>{context?.rooms.map((item: TimetableRoom) => <option key={item.id} value={item.id}>{item.code} - {item.name} ({item.capacity})</option>)}</select></label>
            <label className="text-xs text-[var(--crm-muted)]">Delivery<select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value as TimetableDeliveryType)} className={`${control} mt-1 w-full text-[var(--crm-text)]`}>{['class', 'laboratory', 'tutorial', 'project', 'activity'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          <div className="mt-6 flex gap-2">
            {editingEntryId && <button type="button" disabled={busy} onClick={() => void run(async () => { await deleteTimetableEntry(editingEntryId); setAssignmentSlotId(null); setEditingEntryId(null); }, 'Period cleared.')} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-200 px-4 text-xs text-red-700 disabled:opacity-50"><Trash2 size={15} /> Clear</button>}
            <button type="button" disabled={busy} onClick={() => void saveAssignment()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[var(--tenant-primary)] text-xs text-white disabled:opacity-50"><Save size={15} /> {editingEntryId ? 'Update cell' : 'Save assignment'}</button>
          </div>
        </aside>
      </div>}
    </div>
  );
}

function WorkloadRow({ offering, faculty, periods: initialPeriods, blockSize: initialBlockSize, disabled, onSave }: { offering: TimetableContext['subjectOfferings'][number]; faculty: string; periods: number; blockSize: number; disabled: boolean; onSave: (periods: number, blockSize: number) => Promise<void> | void }) {
  const [periods, setPeriods] = useState(initialPeriods);
  const [blockSize, setBlockSize] = useState(initialBlockSize);
  return <div className="grid grid-cols-[1fr_150px_110px_110px_90px] items-center border-b border-[var(--crm-border)] px-4 py-3 text-xs last:border-b-0"><span>{offering.code} - {offering.name}<small className="mt-1 block text-[10px] text-[var(--crm-muted)]">{offering.sectionName}</small></span><span className="truncate text-[var(--crm-muted)]">{faculty}</span><input type="number" min={1} max={14} value={periods} onChange={(event) => setPeriods(Number(event.target.value))} className="h-9 w-20 rounded-md border border-[var(--crm-border)] bg-[var(--crm-surface)] px-2" /><input type="number" min={1} max={4} value={blockSize} onChange={(event) => setBlockSize(Number(event.target.value))} className="h-9 w-20 rounded-md border border-[var(--crm-border)] bg-[var(--crm-surface)] px-2" /><button type="button" title="Save workload" disabled={disabled} onClick={() => void onSave(periods, blockSize)} className="grid h-9 w-9 place-items-center rounded-md bg-[var(--crm-surface)] disabled:opacity-50"><Save size={14} /></button></div>;
}
