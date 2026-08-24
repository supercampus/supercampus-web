'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  GripVertical,
  GraduationCap,
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
  createTimetableClass,
  createTimetableDepartment,
  createTimetableEntry,
  createTimetableVersion,
  deleteTimetableEntry,
  deleteTimetableWorkloadRequirement,
  clearTimetableDraftEntries,
  generateTimetableVersion,
  getTimetableContext,
  publishTimetableVersion,
  replaceTimetableSlots,
  updateTimetableConfiguration,
  updateTimetableEntry,
  upsertTimetableWorkloadRequirement,
  type TimetableContext,
  type TimetableDeliveryType,
  type TimetableEntry,
} from '@/lib/timetable-api';

const DAY_OPTIONS = [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [7, 'Sunday']] as const;

type LayoutSlot = { key: string; label: string; slotType: 'instructional' | 'break' | 'lunch'; startsAt: string; endsAt: string };
const INITIAL_LAYOUT: LayoutSlot[] = [
  { key: 'initial-1', label: 'Period 1', slotType: 'instructional', startsAt: '08:30', endsAt: '09:20' },
  { key: 'initial-2', label: 'Period 2', slotType: 'instructional', startsAt: '09:20', endsAt: '10:10' },
  { key: 'initial-3', label: 'Break', slotType: 'break', startsAt: '10:10', endsAt: '10:30' },
  { key: 'initial-4', label: 'Period 3', slotType: 'instructional', startsAt: '10:30', endsAt: '11:20' },
];

type DragItem = { kind: 'subject'; offeringId: string } | { kind: 'entry'; entryId: string };
type DeliveryPlan = { periods: number; blockSize: number; maxBlocksPerDay: number };
type CourseRule = { deliveries: Partial<Record<TimetableDeliveryType, DeliveryPlan>> };

const DELIVERY_OPTIONS: Array<{ value: TimetableDeliveryType; label: string }> = [
  { value: 'class', label: 'Class' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'project', label: 'Project' },
  { value: 'activity', label: 'Activity' },
];

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
  const [showLayout, setShowLayout] = useState(false);
  const [layoutDays, setLayoutDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [layoutSlots, setLayoutSlots] = useState<LayoutSlot[]>(INITIAL_LAYOUT);
  const [layoutMaxDaily, setLayoutMaxDaily] = useState(6);
  const [layoutMaxConsecutive, setLayoutMaxConsecutive] = useState(3);
  const [academicSetup, setAcademicSetup] = useState<'department' | 'class' | null>(null);
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [classDepartmentId, setClassDepartmentId] = useState('');
  const [classYearId, setClassYearId] = useState('');
  const [programmeCode, setProgrammeCode] = useState('');
  const [programmeName, setProgrammeName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [batchName, setBatchName] = useState('');
  const [newSectionCode, setNewSectionCode] = useState('A');
  const [newSectionName, setNewSectionName] = useState('Section A');
  const [newSectionCapacity, setNewSectionCapacity] = useState(60);

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
  const selectedConfiguration = configurations.find((item) => item.id === configurationId);
  const versions = useMemo(() => (data?.versions ?? []).filter((item) => item.configurationId === configurationId), [data, configurationId]);
  const selectedVersion = versions.find((item) => item.id === versionId);
  const departments = data?.departments ?? [];
  const sections = useMemo(() => (data?.sections ?? []).filter((item) => !departmentId || item.departmentId === departmentId), [data, departmentId]);
  const selectedSection = sections.find((item) => item.id === sectionId);
  const allSlots = useMemo(() => (data?.slots ?? []).filter((item) => item.configurationId === configurationId), [data, configurationId]);
  const slots = useMemo(() => allSlots.filter((item) => item.slotType === 'instructional'), [allSlots]);
  const sheetDays = useMemo(() => {
    const configured = selectedConfiguration?.workingDays ?? [];
    const available = new Set(allSlots.map((item) => item.dayOfWeek));
    return (configured.length ? configured : [...available]).filter((day) => available.has(day)).sort((a, b) => a - b);
  }, [allSlots, selectedConfiguration?.workingDays]);
  const displayColumns = useMemo(() => {
    const firstDay = sheetDays[0];
    return allSlots.filter((item) => item.dayOfWeek === firstDay).sort((a, b) => a.sequence - b.sequence);
  }, [allSlots, sheetDays]);
  const weeklyCapacity = slots.length;
  const entries = useMemo(() => (data?.entries ?? []).filter((item) => item.versionId === versionId && item.sectionId === sectionId), [data, versionId, sectionId]);
  const configurationEntryCount = useMemo(() => (data?.entries ?? []).filter((entry) => versions.some((version) => version.id === entry.versionId)).length, [data, versions]);
  const offerings = useMemo(() => (data?.subjectOfferings ?? []).filter((item) => item.sectionId === sectionId).sort((a, b) => b.credits - a.credits || a.code.localeCompare(b.code)), [data, sectionId]);
  const assignments = useMemo(() => (data?.teachingAssignments ?? []).filter((item) => item.subjectOfferingId === offeringId), [data, offeringId]);

  useEffect(() => {
    setVersionId((current) => versions.some((item) => item.id === current) ? current : versions.find((item) => item.status === 'draft')?.id ?? versions[0]?.id ?? '');
  }, [versions]);
  useEffect(() => {
    setSectionId((current) => sections.some((item) => item.id === current) ? current : sections[0]?.id ?? '');
  }, [sections]);
  useEffect(() => {
    if (!selectedConfiguration) return;
    const firstDay = selectedConfiguration.workingDays[0] ?? allSlots[0]?.dayOfWeek;
    let periodNumber = 0;
    const template = allSlots
      .filter((item) => item.dayOfWeek === firstDay)
      .sort((a, b) => a.sequence - b.sequence)
      .map((item) => ({ key: item.id, label: item.slotType === 'instructional' ? `Period ${++periodNumber}` : item.slotType === 'lunch' ? 'Lunch' : 'Break', slotType: item.slotType, startsAt: item.startsAt.slice(0, 5), endsAt: item.endsAt.slice(0, 5) }));
    setLayoutDays(selectedConfiguration.workingDays);
    if (template.length) setLayoutSlots(template);
    setLayoutMaxDaily(selectedConfiguration.maxFacultyPeriodsPerDay);
    setLayoutMaxConsecutive(selectedConfiguration.maxConsecutiveFacultyPeriods);
  }, [allSlots, selectedConfiguration]);
  useEffect(() => {
    setCourseRules((current) => {
      const next = { ...current };
      for (const offering of offerings) {
        if (next[offering.id]) continue;
        const requirements = (data?.workloadRequirements ?? []).filter((item) => item.subjectOfferingId === offering.id);
        if (requirements.length) {
          next[offering.id] = { deliveries: Object.fromEntries(requirements.map((item) => [item.deliveryType, { periods: item.periodsPerWeek, blockSize: item.blockSize, maxBlocksPerDay: item.maxBlocksPerDay }])) };
          continue;
        }
        const periods = Math.max(1, Math.round(offering.credits || 1));
        next[offering.id] = { deliveries: { class: { periods, blockSize: 1, maxBlocksPerDay: 1 } } };
      }
      return next;
    });
  }, [data?.workloadRequirements, offerings]);

  const run = async <T,>(action: () => Promise<T>, success: string | ((result: T) => string)) => {
    setBusy(true); setError(null); setNotice(null);
    try { const result = await action(); setNotice(typeof success === 'function' ? success(result) : success); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The timetable change could not be saved.'); }
    finally { setBusy(false); }
  };

  const validateLayout = () => {
    if (!layoutDays.length) throw new Error('Select at least one working day.');
    if (!layoutSlots.some((item) => item.slotType === 'instructional')) throw new Error('Add at least one teaching period.');
    for (let index = 0; index < layoutSlots.length; index += 1) {
      const item = layoutSlots[index];
      if (!item.label.trim() || !item.startsAt || !item.endsAt || item.endsAt <= item.startsAt) throw new Error(`Check the name and time for row ${index + 1}.`);
      if (index > 0 && item.startsAt < layoutSlots[index - 1].endsAt) throw new Error(`Row ${index + 1} overlaps the previous row.`);
    }
    if (layoutMaxConsecutive > layoutMaxDaily) throw new Error('Maximum consecutive periods cannot exceed the daily faculty limit.');
    return layoutSlots.filter((item) => item.slotType === 'instructional').length * layoutDays.length;
  };

  const expandedLayout = () => layoutDays.flatMap((day) => {
    let periodNumber = 0;
    return layoutSlots.map((item, index) => ({
      dayOfWeek: day,
      sequence: index + 1,
      label: item.slotType === 'instructional' ? `Period ${++periodNumber}` : item.slotType === 'lunch' ? 'Lunch' : 'Break',
      slotType: item.slotType,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
    }));
  });

  const createWorkspace = () => run(async () => {
    if (!setupYearId) throw new Error('Choose an academic year first.');
    const capacity = validateLayout();
    const created = await createTimetableConfiguration({ academicYearId: setupYearId, termId: setupTermId || null, name: setupName, workingDays: layoutDays, maxFacultyPeriodsPerDay: layoutMaxDaily, maxConsecutiveFacultyPeriods: layoutMaxConsecutive, rules: { requiredSectionPeriodsPerWeek: capacity } });
    const id = String(created.data.id ?? '');
    if (!id) throw new Error('The timetable configuration was not created.');
    await replaceTimetableSlots(id, expandedLayout());
    await createTimetableVersion(id, 'Principal working sheet');
  }, 'Editable timetable sheet created.');

  const saveLayout = () => run(async () => {
    if (!selectedConfiguration) throw new Error('Choose a timetable configuration first.');
    const capacity = validateLayout();
    if (configurationEntryCount > 0) await clearTimetableDraftEntries(selectedConfiguration.id);
    await updateTimetableConfiguration(selectedConfiguration.id, {
      name: selectedConfiguration.name,
      timezone: selectedConfiguration.timezone,
      workingDays: layoutDays,
      maxFacultyPeriodsPerDay: layoutMaxDaily,
      maxConsecutiveFacultyPeriods: layoutMaxConsecutive,
      rules: { ...selectedConfiguration.rules, requiredSectionPeriodsPerWeek: capacity },
    });
    await replaceTimetableSlots(selectedConfiguration.id, expandedLayout());
    setShowLayout(false);
  }, 'Timetable structure saved. The sheet and generator now use this layout.');

  const addLayoutSlot = (slotType: LayoutSlot['slotType']) => {
    const last = layoutSlots.at(-1);
    const startsAt = last?.endsAt ?? '08:30';
    const minutes = slotType === 'instructional' ? 50 : slotType === 'lunch' ? 45 : 15;
    setLayoutSlots((current) => [...current, { key: crypto.randomUUID(), label: slotType === 'instructional' ? `Period ${current.filter((item) => item.slotType === 'instructional').length + 1}` : slotType === 'lunch' ? 'Lunch' : 'Break', slotType, startsAt, endsAt: addMinutes(startsAt, minutes) }]);
  };

  const moveLayoutSlot = (index: number, direction: -1 | 1) => setLayoutSlots((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const updateDeliveryPlan = (offeringId: string, delivery: TimetableDeliveryType, patch: Partial<DeliveryPlan>) => {
    setCourseRules((current) => {
      const rule = current[offeringId] ?? { deliveries: {} };
      const existing = rule.deliveries[delivery] ?? { periods: 0, blockSize: 1, maxBlocksPerDay: 1 };
      return { ...current, [offeringId]: { deliveries: { ...rule.deliveries, [delivery]: { ...existing, ...patch } } } };
    });
  };

  const courseTotal = (rule?: CourseRule) => Object.values(rule?.deliveries ?? {}).reduce((sum, plan) => sum + (plan?.periods ?? 0), 0);
  const plannedPeriods = offerings.reduce((sum, offering) => sum + courseTotal(courseRules[offering.id]), 0);
  const workloadDifference = weeklyCapacity - plannedPeriods;

  const removeDeliveryPlan = (offeringId: string, delivery: TimetableDeliveryType) => setCourseRules((current) => {
    const rule = current[offeringId] ?? { deliveries: {} };
    const deliveries = { ...rule.deliveries };
    delete deliveries[delivery];
    return { ...current, [offeringId]: { deliveries } };
  });

  const setCourseWeeklyTotal = (offeringId: string, total: number) => setCourseRules((current) => {
    const rule = current[offeringId] ?? { deliveries: {} };
    const active = DELIVERY_OPTIONS.filter((option) => (rule.deliveries[option.value]?.periods ?? 0) > 0);
    const primary = active.find((option) => option.value === 'class')?.value ?? active[0]?.value ?? 'class';
    const otherPeriods = active.filter((option) => option.value !== primary).reduce((sum, option) => sum + (rule.deliveries[option.value]?.periods ?? 0), 0);
    const existing = rule.deliveries[primary] ?? { periods: 1, blockSize: 1, maxBlocksPerDay: 1 };
    return { ...current, [offeringId]: { deliveries: { ...rule.deliveries, [primary]: { ...existing, periods: Math.max(1, total - otherPeriods) } } } };
  });

  const suggestBalancedWorkload = () => {
    if (!offerings.length || weeklyCapacity < offerings.length) {
      setError('The weekly layout needs at least one period for every course. Add more bell-time periods first.');
      return;
    }
    const weights = offerings.map((offering) => Math.max(1, offering.credits || 1));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const remaining = weeklyCapacity - offerings.length;
    const allocations = weights.map((weight) => 1 + Math.floor((remaining * weight) / weightTotal));
    let unallocated = weeklyCapacity - allocations.reduce((sum, value) => sum + value, 0);
    for (let index = 0; unallocated > 0; index = (index + 1) % allocations.length) {
      allocations[index] += 1;
      unallocated -= 1;
    }
    setCourseRules(Object.fromEntries(offerings.map((offering, index) => [offering.id, { deliveries: { class: { periods: allocations[index], blockSize: 1, maxBlocksPerDay: 1 } } }] as const)));
    setError(null);
    setNotice('A balanced starting point was created from the course credits. You can still adjust any course.');
  };

  const openClassSetup = () => {
    setClassDepartmentId(departmentId || departments[0]?.id || '');
    setClassYearId(selectedConfiguration?.academicYearId || data?.academicYears.find((item) => item.status === 'active')?.id || data?.academicYears[0]?.id || '');
    setAcademicSetup('class');
  };

  const saveDepartment = () => run(async () => {
    const created = await createTimetableDepartment({ code: departmentCode, name: departmentName });
    const id = String(created.data.id ?? '');
    if (id) setDepartmentId(id);
    setAcademicSetup(null);
    setDepartmentCode('');
    setDepartmentName('');
  }, 'Department saved.');

  const saveClass = () => run(async () => {
    const created = await createTimetableClass({
      departmentId: classDepartmentId,
      academicYearId: classYearId,
      programmeCode,
      programmeName,
      batchCode,
      batchName,
      sectionCode: newSectionCode,
      sectionName: newSectionName,
      capacity: newSectionCapacity || null,
    });
    const id = String(created.data.section.id ?? '');
    setDepartmentId(classDepartmentId);
    if (id) setSectionId(id);
    setAcademicSetup(null);
  }, 'Class saved and selected.');

  const applyRulesAndGenerate = () => run(async () => {
    if (!versionId || !sectionId) throw new Error('Choose a section and a draft timetable.');
    const total = offerings.reduce((sum, offering) => sum + courseTotal(courseRules[offering.id]), 0);
    if (total !== weeklyCapacity) throw new Error(`Weekly workload is ${total}. It must equal the ${weeklyCapacity} teaching periods in the principal's layout.`);
    for (const offering of offerings) {
      const rule = courseRules[offering.id];
      if (!rule || courseTotal(rule) < 1) throw new Error(`${offering.code} needs at least one delivery period.`);
      for (const option of DELIVERY_OPTIONS) {
        const plan = rule.deliveries[option.value];
        if (!plan?.periods) {
          await deleteTimetableWorkloadRequirement(offering.id, option.value);
          continue;
        }
        if (plan.blockSize < 1 || plan.blockSize > plan.periods || plan.maxBlocksPerDay < 1) throw new Error(`${offering.code} has an invalid ${option.label.toLowerCase()} plan.`);
        await upsertTimetableWorkloadRequirement({ subjectOfferingId: offering.id, deliveryType: option.value, periodsPerWeek: plan.periods, blockSize: plan.blockSize, maxBlocksPerDay: plan.maxBlocksPerDay });
      }
    }
    const generated = await generateTimetableVersion(versionId, { preserveExisting: false, prioritizeHighCredits: true });
    setShowRules(false);
    return generated.data;
  }, (result) => result.aiStatus === 'applied'
    ? 'AI planned the timetable and every placement was checked against your academic rules.'
    : result.aiStatus === 'fallback'
      ? 'AI was temporarily unavailable, so the timetable was generated safely with the built-in constraint engine.'
      : 'Timetable generated with the built-in constraint engine. Add the timetable AI settings to enable JarvisLabs.');

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
    <p className="mt-2 text-sm text-slate-500">Define the working days and every period, break, and lunch row before creating the sheet.</p>
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <input value={setupName} onChange={(event) => setSetupName(event.target.value)} className={selectClass} aria-label="Timetable name" />
      <select value={setupYearId} onChange={(event) => { setSetupYearId(event.target.value); setSetupTermId(''); }} className={selectClass} aria-label="Academic year"><option value="">Academic year</option>{data.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={setupTermId} onChange={(event) => setSetupTermId(event.target.value)} className={selectClass} aria-label="Term"><option value="">Whole year</option>{data.terms.filter((item) => item.academicYearId === setupYearId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </div>
    <div className="mt-6"><StructureEditor days={layoutDays} setDays={setLayoutDays} slots={layoutSlots} setSlots={setLayoutSlots} maxDaily={layoutMaxDaily} setMaxDaily={setLayoutMaxDaily} maxConsecutive={layoutMaxConsecutive} setMaxConsecutive={setLayoutMaxConsecutive} addSlot={addLayoutSlot} moveSlot={moveLayoutSlot} /></div>
    {(error || notice) && <Message error={error} notice={notice} />}
    <button type="button" disabled={busy || !setupName.trim()} onClick={() => void createWorkspace()} className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-5 text-xs text-white disabled:opacity-40"><Plus size={15} /> Create timetable sheet</button>
  </div>;

  return <div className="flex h-[calc(100vh-2rem)] min-h-0 w-full min-w-0 flex-col overflow-hidden border border-slate-300 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
      <div><h1 className="text-xl font-semibold text-slate-900">Build your class timetable</h1><p className="mt-1 text-xs text-slate-500">Set up the week, assign course periods, then review and publish.</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-medium text-slate-500">Plan<select value={configurationId} onChange={(event) => setConfigurationId(event.target.value)} className={`${selectClass} ml-2 min-w-56`} aria-label="Timetable plan">{configurations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-[10px] font-medium text-slate-500">Version<select value={versionId} onChange={(event) => setVersionId(event.target.value)} className={`${selectClass} ml-2 min-w-48`} aria-label="Timetable version">{versions.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.status}</option>)}</select></label>
        {versions.length === 0 && <button type="button" disabled={busy} onClick={() => void run(async () => { await createTimetableVersion(configurationId, 'Principal working sheet'); }, 'Draft created.')} className="h-9 rounded border border-slate-300 px-3 text-xs"><Plus size={14} className="inline" /> Create draft</button>}
        <button type="button" onClick={() => void refresh()} className="grid h-9 w-9 place-items-center rounded border border-slate-300" aria-label="Refresh"><RefreshCw size={14} /></button>
      </div>
    </header>

    <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-5 py-2" aria-label="Timetable steps">
      <button type="button" disabled={busy} onClick={() => setShowLayout(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-emerald-500"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">1</span><Clock3 size={13} /> Set up the week {weeklyCapacity > 0 && <Check size={13} className="text-emerald-600" />}</button>
      <span className="text-slate-300">→</span>
      <button type="button" onClick={() => setShowRules(true)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium ${showRules ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500'}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${showRules ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}>2</span><Sparkles size={13} /> Set course periods {workloadDifference === 0 && <Check size={13} className={showRules ? 'text-emerald-300' : 'text-emerald-600'} />}</button>
      <span className="text-slate-300">→</span>
      <button type="button" onClick={() => setShowRules(false)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium ${!showRules ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500'}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${!showRules ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>3</span> Review timetable</button>
      <div className="ml-auto flex items-center gap-2">{data.rooms.length === 0 && <span className="text-[11px] text-amber-700">Rooms must be added before generation</span>}{!showRules && selectedVersion?.status === 'draft' && <button type="button" disabled={busy || entries.length === 0} onClick={() => void run(async () => { await publishTimetableVersion(versionId); }, 'Timetable published.')} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-medium text-white disabled:opacity-40"><Rocket size={14} /> Publish timetable</button>}</div>
    </nav>

    <div className="flex flex-wrap items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-2">
      <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={selectClass} aria-label="Department"><option value="">All departments</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select>
      <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className={`${selectClass} min-w-64`} aria-label="Section"><option value="">Select a class / section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.programmeName} · {item.batchName} · {item.name}</option>)}</select>
      <button type="button" onClick={() => setAcademicSetup('department')} className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700"><Building2 size={13} /> New department</button>
      <button type="button" onClick={openClassSetup} className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700"><GraduationCap size={13} /> New class</button>
      <span className="text-[11px] text-slate-500">{showRules ? 'Choose the class whose weekly course periods you want to prepare.' : 'Drag subjects into cells, or click a cell to edit it.'}</span>
    </div>

    {(error || notice) && <div className="px-4"><Message error={error} notice={notice} /></div>}

    {showRules && <section className="min-h-0 flex-1 overflow-y-auto border-b border-slate-300 bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-700">Step 2 · Course periods</p><h2 className="mt-1 text-lg font-semibold text-slate-900">How many times should each course meet this week?</h2><p className="mt-1 text-xs text-slate-500">This is the total for the whole week—not the same number every day. The generator spreads these periods across the selected working days.</p><button type="button" onClick={suggestBalancedWorkload} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Sparkles size={14} /> Suggest a balanced workload from credits</button></div>
          <div className="min-w-72">
            <div className="flex items-center justify-between text-xs"><span className="font-medium text-slate-600">Planned periods</span><strong className={workloadDifference === 0 ? 'text-emerald-700' : workloadDifference > 0 ? 'text-amber-700' : 'text-red-700'}>{plannedPeriods} of {weeklyCapacity}</strong></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${workloadDifference === 0 ? 'bg-emerald-500' : workloadDifference > 0 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(100, weeklyCapacity ? (plannedPeriods / weeklyCapacity) * 100 : 0)}%` }} /></div>
            <p className={`mt-2 text-[11px] ${workloadDifference === 0 ? 'text-emerald-700' : workloadDifference > 0 ? 'text-amber-700' : 'text-red-700'}`}>{workloadDifference === 0 ? 'Ready to generate' : workloadDifference > 0 ? `${workloadDifference} periods still available` : `${Math.abs(workloadDifference)} periods over the weekly limit`}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {offerings.map((offering) => {
            const rule = courseRules[offering.id] ?? { deliveries: {} };
            const activePlans = DELIVERY_OPTIONS.filter((option) => (rule.deliveries[option.value]?.periods ?? 0) > 0);
            const faculty = data.teachingAssignments.filter((item) => item.subjectOfferingId === offering.id).map((item) => item.facultyName).join(', ') || 'Faculty not assigned';
            const unusedOptions = DELIVERY_OPTIONS.filter((option) => !activePlans.some((active) => active.value === option.value));
            return <article key={offering.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">{offering.code}</span><h3 className="font-semibold text-slate-900">{offering.name}</h3><span className="text-[11px] text-slate-400">{offering.credits || '—'} credits</span></div><p className="mt-2 text-xs text-slate-500">{faculty}</p></div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2"><button type="button" onClick={() => setCourseWeeklyTotal(offering.id, Math.max(1, courseTotal(rule) - 1))} className="grid h-8 w-8 place-items-center rounded bg-white text-lg text-emerald-800 shadow-sm" aria-label={`Reduce ${offering.code} weekly periods`}>−</button><label className="text-center"><input aria-label={`${offering.code} total periods in the whole week`} type="number" min={1} max={weeklyCapacity} value={courseTotal(rule)} onChange={(event) => setCourseWeeklyTotal(offering.id, Math.max(1, Number(event.target.value)))} className="h-8 w-14 border-0 bg-transparent text-center text-lg font-semibold text-emerald-800 outline-none" /><span className="block text-[9px] font-semibold uppercase tracking-wider text-emerald-700">in the whole week</span></label><button type="button" onClick={() => setCourseWeeklyTotal(offering.id, courseTotal(rule) + 1)} className="grid h-8 w-8 place-items-center rounded bg-white text-lg text-emerald-800 shadow-sm" aria-label={`Increase ${offering.code} weekly periods`}>+</button></div>
              </div>

              <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <summary className="cursor-pointer select-none text-xs font-medium text-slate-600">Teaching method: {activePlans.map((option) => option.label).join(' + ') || 'Not set'} <span className="ml-2 text-[10px] font-normal text-slate-400">Customize only if this course needs labs, tutorials, or consecutive periods</span></summary>
              <div className="mt-3 grid gap-2">
                {activePlans.map((option) => {
                  const plan = rule.deliveries[option.value]!;
                  return <div key={option.value} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="w-24 text-xs font-semibold text-slate-800">{option.label}</span>
                    <label className="flex items-center gap-2 text-[10px] text-slate-500">Periods in whole week<input aria-label={`${offering.code} ${option.label} periods`} type="number" min={1} max={168} value={plan.periods} onChange={(event) => updateDeliveryPlan(offering.id, option.value, { periods: Math.max(1, Number(event.target.value)) })} className="h-8 w-16 rounded border border-slate-300 bg-white px-2 text-center text-xs text-slate-800" /></label>
                    <label className="flex items-center gap-2 text-[10px] text-slate-500">Consecutive<input aria-label={`${offering.code} ${option.label} block size`} type="number" min={1} max={168} value={plan.blockSize} onChange={(event) => updateDeliveryPlan(offering.id, option.value, { blockSize: Math.max(1, Number(event.target.value)) })} className="h-8 w-16 rounded border border-slate-300 bg-white px-2 text-center text-xs text-slate-800" /></label>
                    <details className="text-[10px] text-slate-500"><summary className="cursor-pointer select-none">More</summary><label className="mt-2 flex items-center gap-2">Maximum sessions/day<input aria-label={`${offering.code} ${option.label} daily block limit`} type="number" min={1} max={24} value={plan.maxBlocksPerDay} onChange={(event) => updateDeliveryPlan(offering.id, option.value, { maxBlocksPerDay: Math.max(1, Number(event.target.value)) })} className="h-8 w-16 rounded border border-slate-300 bg-white px-2 text-center text-xs text-slate-800" /></label></details>
                    <button type="button" onClick={() => removeDeliveryPlan(offering.id, option.value)} className="ml-auto grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${option.label} from ${offering.code}`}><X size={14} /></button>
                  </div>;
                })}
                {activePlans.length === 0 && <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-xs text-amber-800">Add at least one teaching method for this course.</p>}
              </div>

              {unusedOptions.length > 0 && <label className="relative mt-3 inline-block"><span className="sr-only">Add teaching method</span><select aria-label={`Add teaching method to ${offering.code}`} value="" onChange={(event) => { const value = event.target.value as TimetableDeliveryType; if (value) updateDeliveryPlan(offering.id, value, { periods: 1, blockSize: 1, maxBlocksPerDay: 1 }); }} className="h-9 appearance-none rounded-lg border border-dashed border-slate-300 bg-white pl-3 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-emerald-500"><option value="">+ Add teaching method</option>{unusedOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-3 text-slate-400" /></label>}
              </details>
            </article>;
          })}
          {sectionId && offerings.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No courses are assigned to this section yet.</div>}
        </div>

        <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur"><p className="text-xs text-slate-500">The total must match the {weeklyCapacity} teaching periods in the weekly layout.</p><button type="button" disabled={busy || selectedVersion?.status !== 'draft' || data.rooms.length === 0 || offerings.length === 0 || weeklyCapacity === 0 || workloadDifference !== 0} onClick={() => void applyRulesAndGenerate()} className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-700 px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={14} /> Generate timetable</button></div>
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

    {!showRules && <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
      <div className="border-l border-t border-slate-400 bg-white" style={{ minWidth: `${120 + displayColumns.reduce((sum, item) => sum + (item.slotType === 'instructional' ? 145 : 68), 0)}px` }}>
        <div className="grid" style={{ gridTemplateColumns: `120px ${displayColumns.map((item) => item.slotType === 'instructional' ? 'minmax(125px,1fr)' : '64px').join(' ')}` }}>
          <div className="sticky left-0 top-0 z-30 flex items-center justify-center border-b border-r border-slate-400 bg-slate-100 px-3 text-xs font-semibold text-slate-700">DAY / TIME</div>
          {displayColumns.map((column) => <div key={`${column.id}-head`} className={`sticky top-0 z-20 border-b border-r border-slate-400 bg-slate-100 px-2 py-3 text-center ${column.slotType !== 'instructional' ? 'text-[9px]' : ''}`}><strong className="block text-[10px] uppercase text-slate-700">{column.label}</strong><span className="mt-1 block text-[9px] text-slate-500">{formatTimeRange(column.startsAt, column.endsAt)}</span></div>)}
          {sheetDays.flatMap((day) => {
            const dayName = DAY_OPTIONS.find(([value]) => value === day)?.[1] ?? `Day ${day}`;
            return [
            <div key={`${day}-name`} className="sticky left-0 z-10 flex min-h-24 items-center border-b border-r border-slate-400 bg-slate-100 px-3 text-xs font-semibold uppercase text-slate-700">{dayName}</div>,
            ...displayColumns.map((column) => {
              if (column.slotType !== 'instructional') return <div key={`${day}-${column.sequence}`} className="flex min-h-24 items-center justify-center border-b border-r border-slate-400 bg-slate-50"><span className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[.18em] text-slate-400">{column.label}</span></div>;
              const slot = slots.find((item) => item.dayOfWeek === day && item.sequence === column.sequence);
              const entry = slot && entries.find((item) => item.slotId === slot.id);
              const activeDrop = slot?.id === dropSlotId;
              return <button key={`${day}-${column.sequence}`} type="button" disabled={!slot || !sectionId} draggable={Boolean(entry) && selectedVersion?.status === 'draft'} onDragStart={() => entry && setDragItem({ kind: 'entry', entryId: entry.id })} onDragEnd={() => { setDragItem(null); setDropSlotId(null); }} onDragOver={(event) => { if (selectedVersion?.status === 'draft') { event.preventDefault(); if (slot) setDropSlotId(slot.id); } }} onDragLeave={() => setDropSlotId((current) => current === slot?.id ? null : current)} onDrop={(event) => { event.preventDefault(); if (slot) dropOnCell(slot.id); }} onClick={() => { if (!slot || selectedVersion?.status !== 'draft') return; if (dragItem?.kind === 'subject') dropOnCell(slot.id); else openEditor(slot.id, entry); }} className={`group min-h-24 border-b border-r p-1.5 text-left transition ${activeDrop ? 'border-emerald-500 bg-emerald-50 ring-2 ring-inset ring-emerald-500' : entry ? 'border-slate-400 bg-white hover:bg-emerald-50/40' : 'border-slate-400 bg-white hover:bg-slate-50'} disabled:cursor-default`} title={entry ? `Drag or click to edit ${entry.subjectName}` : 'Drop a subject here'}>
                {entry ? <div className={`flex h-full flex-col justify-center border-l-4 px-2 py-1.5 ${entry.deliveryType === 'laboratory' ? 'border-violet-600 bg-violet-50' : entry.deliveryType === 'activity' ? 'border-amber-500 bg-amber-50' : 'border-emerald-600 bg-emerald-50'}`}><div className="flex items-start justify-between gap-1"><strong className="text-xs text-slate-900">{entry.subjectCode}{entry.deliveryType === 'laboratory' ? ' · Lab' : ''}</strong><GripVertical size={12} className="text-slate-400 opacity-0 group-hover:opacity-100" /></div><p className="mt-1 truncate text-[9px] text-slate-600">{entry.facultyName}</p><p className="mt-1 text-[9px] text-slate-500">{entry.roomCode}</p></div> : <span className="flex h-full items-center justify-center text-[10px] text-slate-300 group-hover:text-slate-500">Drop</span>}
              </button>;
            }),
          ];})}
        </div>
      </div>
    </div>}

    {academicSetup && <div className="fixed inset-0 z-[170] grid place-items-center bg-black/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAcademicSetup(null); }}>
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Academic structure</p><h2 className="mt-1 text-xl">{academicSetup === 'department' ? 'Create a department' : 'Create a class'}</h2><p className="mt-2 text-xs text-slate-500">{academicSetup === 'department' ? 'The new department is created only for this tenant.' : 'A class belongs to a programme, batch, and academic year.'}</p></div><button type="button" onClick={() => setAcademicSetup(null)} className="grid h-9 w-9 place-items-center"><X size={18} /></button></div>
        {academicSetup === 'department' ? <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-slate-500">Department code<input value={departmentCode} onChange={(event) => setDepartmentCode(event.target.value.toUpperCase())} placeholder="Example: ECE" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Department name<input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="Electronics and Communication Engineering" className={`${selectClass} mt-1 w-full`} /></label>
        </div> : <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <EditorSelect label="Department" value={classDepartmentId} onChange={setClassDepartmentId}><option value="">Choose department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</EditorSelect>
          <EditorSelect label="Academic year" value={classYearId} onChange={setClassYearId}><option value="">Choose academic year</option>{data.academicYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</EditorSelect>
          <label className="text-xs text-slate-500">Programme code<input value={programmeCode} onChange={(event) => setProgrammeCode(event.target.value.toUpperCase())} placeholder="Example: BTECH-ECE" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Programme name<input value={programmeName} onChange={(event) => setProgrammeName(event.target.value)} placeholder="B.Tech Electronics and Communication" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Batch code<input value={batchCode} onChange={(event) => setBatchCode(event.target.value.toUpperCase())} placeholder="Example: 2026-2030" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Batch name<input value={batchName} onChange={(event) => setBatchName(event.target.value)} placeholder="ECE Batch of 2026-2030" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Class code<input value={newSectionCode} onChange={(event) => setNewSectionCode(event.target.value.toUpperCase())} placeholder="A" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Class name<input value={newSectionName} onChange={(event) => setNewSectionName(event.target.value)} placeholder="Section A" className={`${selectClass} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-500">Student capacity<input type="number" min={1} value={newSectionCapacity} onChange={(event) => setNewSectionCapacity(Math.max(1, Number(event.target.value)))} className={`${selectClass} mt-1 w-full`} /></label>
        </div>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAcademicSetup(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-xs text-slate-600">Cancel</button><button type="button" disabled={busy || (academicSetup === 'department' ? !departmentCode.trim() || !departmentName.trim() : !classDepartmentId || !classYearId || !programmeCode.trim() || !programmeName.trim() || !batchCode.trim() || !batchName.trim() || !newSectionCode.trim() || !newSectionName.trim())} onClick={() => void (academicSetup === 'department' ? saveDepartment() : saveClass())} className="h-10 rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white disabled:opacity-40">{academicSetup === 'department' ? 'Create department' : 'Create class'}</button></div>
      </div>
    </div>}

    {showLayout && <div className="fixed inset-0 z-[160] flex justify-end bg-black/30" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLayout(false); }}>
      <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">Step 1 · Week setup</p><h2 className="mt-1 text-xl">Working days and bell times</h2><p className="mt-2 text-xs text-slate-500">Set when each period begins and ends. Subjects are assigned later and can be different on every day.</p></div><button type="button" onClick={() => setShowLayout(false)} className="grid h-9 w-9 place-items-center"><X size={18} /></button></div>
        <div className="mt-6"><StructureEditor days={layoutDays} setDays={setLayoutDays} slots={layoutSlots} setSlots={setLayoutSlots} maxDaily={layoutMaxDaily} setMaxDaily={setLayoutMaxDaily} maxConsecutive={layoutMaxConsecutive} setMaxConsecutive={setLayoutMaxConsecutive} addSlot={addLayoutSlot} moveSlot={moveLayoutSlot} /></div>
        {configurationEntryCount > 0 && <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">This draft currently contains {configurationEntryCount} generated class placements. Saving new bell times will clear those placements and regenerate them later. Your courses, faculty assignments, and workload settings will remain saved.</div>}
        <button type="button" disabled={busy} onClick={() => void saveLayout()} className={`mt-5 inline-flex h-11 items-center gap-2 rounded px-5 text-xs text-white disabled:opacity-40 ${configurationEntryCount > 0 ? 'bg-amber-700' : 'bg-slate-900'}`}><Save size={14} /> {configurationEntryCount > 0 ? 'Clear draft and save bell times' : 'Save bell times'}</button>
      </aside>
    </div>}

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

function StructureEditor({ days, setDays, slots, setSlots, maxDaily, setMaxDaily, maxConsecutive, setMaxConsecutive, addSlot, moveSlot }: {
  days: number[];
  setDays: (days: number[]) => void;
  slots: LayoutSlot[];
  setSlots: (updater: LayoutSlot[] | ((current: LayoutSlot[]) => LayoutSlot[])) => void;
  maxDaily: number;
  setMaxDaily: (value: number) => void;
  maxConsecutive: number;
  setMaxConsecutive: (value: number) => void;
  addSlot: (type: LayoutSlot['slotType']) => void;
  moveSlot: (index: number, direction: -1 | 1) => void;
}) {
  const updateSlot = (key: string, patch: Partial<LayoutSlot>) => setSlots((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item));
  return <div>
    <h3 className="text-sm font-semibold text-slate-900">Working days</h3>
    <div className="mt-2 flex flex-wrap gap-2">{DAY_OPTIONS.map(([value, label]) => {
      const selected = days.includes(value);
      return <button key={value} type="button" onClick={() => setDays(selected ? days.filter((day) => day !== value) : [...days, value].sort((a, b) => a - b))} className={`h-9 rounded border px-3 text-xs ${selected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-600'}`}>{label}</button>;
    })}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-slate-500">Maximum faculty periods per day<input type="number" min={1} max={24} value={maxDaily} onChange={(event) => setMaxDaily(Math.max(1, Number(event.target.value)))} className={`${selectClass} mt-1 w-full`} /></label>
      <label className="text-xs text-slate-500">Maximum consecutive faculty periods<input type="number" min={1} max={24} value={maxConsecutive} onChange={(event) => setMaxConsecutive(Math.max(1, Number(event.target.value)))} className={`${selectClass} mt-1 w-full`} /></label>
    </div>
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><strong>Bell times only—do not enter subjects here.</strong> For example, Period 1 can be Maths on Monday and Data Structures on Tuesday. Subjects are placed after the workload is generated.</div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">Bell times</h3><p className="mt-1 text-[11px] text-slate-500">These times repeat on every selected working day; the subjects do not.</p></div><div className="flex gap-2"><button type="button" onClick={() => addSlot('instructional')} className="h-9 rounded border border-slate-300 px-3 text-xs"><Plus size={13} className="inline" /> Period</button><button type="button" onClick={() => addSlot('break')} className="h-9 rounded border border-slate-300 px-3 text-xs"><Plus size={13} className="inline" /> Break</button><button type="button" onClick={() => addSlot('lunch')} className="h-9 rounded border border-slate-300 px-3 text-xs"><Plus size={13} className="inline" /> Lunch</button></div></div>
    <div className="mt-3 overflow-x-auto border-l border-t border-slate-300">
      <div className="grid min-w-[650px] grid-cols-[44px_minmax(170px,1fr)_130px_120px_120px_92px] bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{['#', 'Bell-time row', 'Type', 'Start', 'End', 'Actions'].map((heading) => <div key={heading} className="border-b border-r border-slate-300 px-2 py-2">{heading}</div>)}</div>
      {slots.map((item, index) => <div key={item.key} className="grid min-w-[650px] grid-cols-[44px_minmax(170px,1fr)_130px_120px_120px_92px] text-xs">
        <div className="border-b border-r border-slate-300 px-2 py-3 text-center">{index + 1}</div>
        <div className="flex items-center border-b border-r border-slate-300 bg-slate-50 px-3 font-semibold text-slate-700">{item.slotType === 'instructional' ? `Period ${slots.slice(0, index + 1).filter((slot) => slot.slotType === 'instructional').length}` : item.slotType === 'lunch' ? 'Lunch' : 'Break'}</div>
        <div className="border-b border-r border-slate-300 p-1.5"><select value={item.slotType} onChange={(event) => { const slotType = event.target.value as LayoutSlot['slotType']; updateSlot(item.key, { slotType, label: slotType === 'instructional' ? `Period ${slots.filter((slot) => slot.slotType === 'instructional').length + (item.slotType === 'instructional' ? 0 : 1)}` : slotType === 'lunch' ? 'Lunch' : 'Break' }); }} className="h-8 w-full border border-slate-200 bg-white px-2"><option value="instructional">Period</option><option value="break">Break</option><option value="lunch">Lunch</option></select></div>
        <div className="border-b border-r border-slate-300 p-1.5"><input type="time" value={item.startsAt} onChange={(event) => updateSlot(item.key, { startsAt: event.target.value })} className="h-8 w-full border border-slate-200 px-2" /></div>
        <div className="border-b border-r border-slate-300 p-1.5"><input type="time" value={item.endsAt} onChange={(event) => updateSlot(item.key, { endsAt: event.target.value })} className="h-8 w-full border border-slate-200 px-2" /></div>
        <div className="flex items-center justify-center gap-1 border-b border-r border-slate-300"><button type="button" disabled={index === 0} onClick={() => moveSlot(index, -1)} className="grid h-7 w-7 place-items-center disabled:opacity-25" aria-label="Move row up"><ChevronUp size={14} /></button><button type="button" disabled={index === slots.length - 1} onClick={() => moveSlot(index, 1)} className="grid h-7 w-7 place-items-center disabled:opacity-25" aria-label="Move row down"><ChevronDown size={14} /></button><button type="button" onClick={() => setSlots((current) => current.filter((slot) => slot.key !== item.key))} className="grid h-7 w-7 place-items-center text-red-600" aria-label="Remove row"><Trash2 size={13} /></button></div>
      </div>)}
    </div>
    <p className="mt-3 text-xs font-semibold text-slate-700">Capacity: {slots.filter((item) => item.slotType === 'instructional').length} teaching periods/day × {days.length} days = {slots.filter((item) => item.slotType === 'instructional').length * days.length} periods/week</p>
  </div>;
}

function addMinutes(time: string, minutes: number) {
  const [hours, currentMinutes] = time.split(':').map(Number);
  const total = hours * 60 + currentMinutes + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatTimeRange(startsAt: string, endsAt: string) {
  return `${startsAt.slice(0, 5)}–${endsAt.slice(0, 5)}`;
}
