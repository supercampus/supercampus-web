import { apiRequest } from './api';

export type TimetableScope = 'own' | 'assigned' | 'department' | 'institution' | 'all';
export type TimetableSlotType = 'instructional' | 'break' | 'lunch';
export type TimetableVersionStatus = 'draft' | 'published' | 'superseded' | 'archived';
export type TimetableDeliveryType = 'class' | 'laboratory' | 'tutorial' | 'project' | 'activity';
export type SubstitutionStatus =
  | 'awaiting_acknowledgements'
  | 'awaiting_principal'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface TimetableConfiguration {
  id: string;
  academicYearId: string;
  termId: string | null;
  name: string;
  timezone: string;
  workingDays: number[];
  maxFacultyPeriodsPerDay: number;
  maxConsecutiveFacultyPeriods: number;
  rules: Record<string, unknown>;
}

export interface TimetableSlot {
  id: string;
  configurationId: string;
  dayOfWeek: number;
  sequence: number;
  label: string;
  slotType: TimetableSlotType;
  startsAt: string;
  endsAt: string;
}

export interface TimetableRoom {
  id: string;
  campusId: string | null;
  departmentId: string | null;
  code: string;
  name: string;
  roomType:
    | 'classroom'
    | 'tutorial_room'
    | 'laboratory'
    | 'computer_lab'
    | 'chemistry_lab'
    | 'physics_lab'
    | 'workshop'
    | 'library'
    | 'staff_room'
    | 'seminar_hall'
    | 'auditorium'
    | 'sports'
    | 'other';
  capacity: number;
  features: unknown[];
}

export interface TimetableWorkloadRequirement {
  id: string;
  subjectOfferingId: string;
  deliveryType: TimetableDeliveryType;
  periodsPerWeek: number;
  blockSize: number;
  maxBlocksPerDay: number;
  requiredRoomTypes: TimetableRoom['roomType'][];
  metadata: Record<string, unknown>;
}

export interface ElectiveGroup {
  id: string;
  academicYearId: string;
  termId: string | null;
  code: string;
  name: string;
  sectionIds: string[];
  studentCount: number;
}

export interface TimetableVersion {
  id: string;
  configurationId: string;
  versionNumber: number;
  label: string;
  status: TimetableVersionStatus;
  publishedAt: string | null;
}

export interface TimetableEntry {
  id: string;
  versionId: string;
  slotId: string;
  subjectOfferingId: string;
  subjectCode: string;
  subjectName: string;
  sectionId: string;
  sectionName: string;
  teachingAssignmentId: string;
  facultyUserId: string;
  facultyName: string;
  roomId: string;
  roomCode: string;
  electiveGroupId: string | null;
  deliveryType: TimetableDeliveryType;
  sessionBlockId: string;
  blockSequence: number;
  blockLength: number;
  combinedClassCode: string | null;
  combinedClassName: string | null;
}

export interface FacultySubstitution {
  id: string;
  timetableEntryId: string;
  serviceDate: string;
  originalFacultyUserId: string;
  substituteFacultyUserId: string;
  reason: string;
  status: SubstitutionStatus;
  acknowledgements: Array<{
    facultyUserId: string;
    party: 'original' | 'substitute';
    acknowledgedAt: string;
  }>;
}

export interface TimetableContext {
  scope: TimetableScope;
  canManage: boolean;
  latestRevision: number;
  academicYears: Array<{ id: string; code: string; name: string; status: string }>;
  terms: Array<{ id: string; academicYearId: string; code: string; name: string; sequence: number; status: string }>;
  departments: Array<{ id: string; code: string; name: string }>;
  sections: Array<{ id: string; code: string; name: string; departmentId: string; programmeName: string; batchName: string; capacity: number | null }>;
  subjectOfferings: Array<{ id: string; subjectId: string; code: string; name: string; credits: number; academicYearId: string; termId: string | null; sectionId: string; sectionName: string; departmentId: string }>;
  teachingAssignments: Array<{ id: string; subjectOfferingId: string; facultyUserId: string; facultyName: string; assignmentType: string }>;
  configurations: TimetableConfiguration[];
  slots: TimetableSlot[];
  rooms: TimetableRoom[];
  workloadRequirements: TimetableWorkloadRequirement[];
  electiveGroups: ElectiveGroup[];
  versions: TimetableVersion[];
  entries: TimetableEntry[];
  substitutions: FacultySubstitution[];
}

export interface TimetableChange {
  revision: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

const ROOT = '/v1/timetable';

export function getTimetableContext() {
  return apiRequest<{ data: TimetableContext }>(`${ROOT}/context`);
}

export function getTimetableChanges(after: number, limit = 100) {
  return apiRequest<{ data: { events: TimetableChange[]; latestRevision: number } }>(
    `${ROOT}/changes?after=${after}&limit=${limit}`,
  );
}

export function createTimetableConfiguration(input: {
  academicYearId: string;
  termId?: string | null;
  name: string;
  timezone?: string;
  workingDays?: number[];
  maxFacultyPeriodsPerDay?: number;
  maxConsecutiveFacultyPeriods?: number;
  rules?: Record<string, unknown>;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/configurations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTimetableDepartment(input: { code: string; name: string }) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/departments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTimetableClass(input: {
  departmentId: string;
  academicYearId: string;
  programmeCode: string;
  programmeName: string;
  batchCode: string;
  batchName: string;
  sectionCode: string;
  sectionName: string;
  capacity?: number | null;
}) {
  return apiRequest<{ data: { section: Record<string, unknown> } }>(`${ROOT}/classes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTimetableConfiguration(configurationId: string, input: {
  name: string;
  timezone: string;
  workingDays: number[];
  maxFacultyPeriodsPerDay: number;
  maxConsecutiveFacultyPeriods: number;
  rules?: Record<string, unknown>;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(
    `${ROOT}/configurations/${encodeURIComponent(configurationId)}`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

export function replaceTimetableSlots(configurationId: string, slots: Array<{
  dayOfWeek: number;
  sequence: number;
  label: string;
  slotType: TimetableSlotType;
  startsAt: string;
  endsAt: string;
}>) {
  return apiRequest<{ data: { configurationId: string; slotCount: number } }>(
    `${ROOT}/configurations/${encodeURIComponent(configurationId)}/slots`,
    { method: 'PUT', body: JSON.stringify({ slots }) },
  );
}

export function createTimetableRoom(input: {
  campusId?: string | null;
  departmentId?: string | null;
  departmentCode?: string | null;
  code: string;
  name: string;
  roomType: TimetableRoom['roomType'];
  capacity: number;
  features?: unknown[];
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/rooms`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTimetableRoomsBulk(
  rooms: Array<{
    campusId?: string | null;
    departmentId?: string | null;
    departmentCode?: string | null;
    code: string;
    name: string;
    roomType: TimetableRoom['roomType'];
    capacity: number;
    features?: unknown[];
  }>,
) {
  return apiRequest<{ data: { rooms: TimetableRoom[]; count: number } }>(`${ROOT}/rooms/bulk`, {
    method: 'POST',
    body: JSON.stringify({ rooms }),
  });
}

export function upsertTimetableWorkloadRequirement(input: {
  subjectOfferingId: string;
  deliveryType?: TimetableDeliveryType;
  periodsPerWeek: number;
  blockSize?: number;
  maxBlocksPerDay?: number;
  requiredRoomTypes?: TimetableRoom['roomType'][];
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<{ data: TimetableWorkloadRequirement }>(`${ROOT}/workload-requirements`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function clearTimetableDraftEntries(configurationId: string) {
  return apiRequest<{ data: { configurationId: string; removedEntries: number } }>(
    `${ROOT}/configurations/${encodeURIComponent(configurationId)}/draft-entries`,
    { method: 'DELETE' },
  );
}

export function deleteTimetableWorkloadRequirement(subjectOfferingId: string, deliveryType: TimetableDeliveryType) {
  return apiRequest<{ data: { deleted: boolean } }>(
    `${ROOT}/workload-requirements/${encodeURIComponent(subjectOfferingId)}/${encodeURIComponent(deliveryType)}`,
    { method: 'DELETE' },
  );
}

export function createElectiveGroup(input: {
  academicYearId: string;
  termId?: string | null;
  code: string;
  name: string;
  sectionIds: string[];
  studentIds?: string[];
}) {
  return apiRequest<{ data: { id: string; sectionIds: string[]; studentIds: string[] } }>(
    `${ROOT}/elective-groups`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export async function createTimetableVersion(configurationId: string, label: string, sourceVersionId?: string) {
  try {
    return await apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/versions`, {
      method: 'POST',
      body: JSON.stringify({ configurationId, label, sourceVersionId }),
    });
  } catch (error) {
    // Older API revisions can create versions but do not yet accept the clone
    // field. Keep Edit timetable usable during a rolling deployment by copying
    // the source entries through the stable entry endpoint.
    if (!sourceVersionId || !(error instanceof Error) || !error.message.includes('sourceVersionId')) throw error;
    const created = await apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/versions`, {
      method: 'POST',
      body: JSON.stringify({ configurationId, label }),
    });
    const versionId = String(created.data.id ?? '');
    if (!versionId) throw new Error('The editable timetable could not be created.');
    const context = (await getTimetableContext()).data;
    const sourceEntries = context.entries.filter((entry) => entry.versionId === sourceVersionId);
    for (const entry of sourceEntries) {
      await createTimetableEntry({
        versionId,
        slotId: entry.slotId,
        subjectOfferingId: entry.subjectOfferingId,
        teachingAssignmentId: entry.teachingAssignmentId,
        roomId: entry.roomId,
        electiveGroupId: entry.electiveGroupId,
        deliveryType: entry.deliveryType,
        sessionBlockId: entry.sessionBlockId,
        blockSequence: entry.blockSequence,
        blockLength: entry.blockLength,
        ...(entry.combinedClassCode ? { combinedClassCode: entry.combinedClassCode } : {}),
        ...(entry.combinedClassName ? { combinedClassName: entry.combinedClassName } : {}),
      });
    }
    return created;
  }
}

export function createTimetableEntry(input: {
  versionId: string;
  slotId: string;
  subjectOfferingId: string;
  teachingAssignmentId: string;
  roomId: string;
  electiveGroupId?: string | null;
  deliveryType?: TimetableDeliveryType;
  sessionBlockId?: string;
  blockSequence?: number;
  blockLength?: number;
  combinedClassCode?: string | null;
  combinedClassName?: string | null;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/entries`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTimetableEntry(entryId: string, input: {
  versionId: string;
  slotId: string;
  subjectOfferingId: string;
  teachingAssignmentId: string;
  roomId: string;
  electiveGroupId?: string | null;
  deliveryType?: TimetableDeliveryType;
  sessionBlockId?: string;
  blockSequence?: number;
  blockLength?: number;
  combinedClassCode?: string | null;
  combinedClassName?: string | null;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/entries/${encodeURIComponent(entryId)}`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}

export function deleteTimetableEntry(entryId: string) {
  return apiRequest<{ data: { id: string; deleted: boolean } }>(`${ROOT}/entries/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
  });
}

type GenerateResult = { versionId: string; scheduledPeriods: number; unscheduled: Array<{ subjectOfferingId: string; remainingPeriods: number }>; engine: string; aiStatus: 'applied' | 'fallback' | 'not_configured' };

async function generateSelectedSectionWithLegacyApi(versionId: string, sectionId: string, prioritizeHighCredits: boolean) {
  const context = (await getTimetableContext()).data;
  const version = context.versions.find((item) => item.id === versionId);
  const configuration = context.configurations.find((item) => item.id === version?.configurationId);
  const section = context.sections.find((item) => item.id === sectionId);
  if (!version || !configuration || !section) throw new Error('The selected timetable or class is no longer available.');

  const slots = context.slots
    .filter((item) => item.configurationId === configuration.id && item.slotType === 'instructional')
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sequence - b.sequence);
  const oldEntries = context.entries.filter((entry) => entry.versionId === versionId && entry.sectionId === sectionId);
  const fixedEntries = context.entries.filter((entry) => entry.versionId === versionId && entry.sectionId !== sectionId);
  const offerings = context.subjectOfferings.filter((offering) => offering.sectionId === sectionId);
  const requirements = offerings.flatMap((offering) => {
    const saved = context.workloadRequirements.filter((item) => item.subjectOfferingId === offering.id);
    return (saved.length ? saved : [{ deliveryType: 'class' as const, periodsPerWeek: Math.max(2, Math.ceil(offering.credits || 3)), blockSize: 1, maxBlocksPerDay: 1, requiredRoomTypes: [] as TimetableRoom['roomType'][] }])
      .map((requirement) => ({ offering, requirement }));
  }).sort((a, b) => prioritizeHighCredits
    ? b.requirement.blockSize - a.requirement.blockSize || b.offering.credits - a.offering.credits || b.requirement.periodsPerWeek - a.requirement.periodsPerWeek
    : a.offering.code.localeCompare(b.offering.code));

  const facultyBusy = new Set(fixedEntries.map((entry) => `${entry.facultyUserId}:${entry.slotId}`));
  const roomBusy = new Set(fixedEntries.map((entry) => `${entry.roomId}:${entry.slotId}`));
  const facultyDaily = new Map<string, number>();
  for (const entry of fixedEntries) {
    const day = slots.find((slot) => slot.id === entry.slotId)?.dayOfWeek;
    if (day == null) continue;
    const key = `${entry.facultyUserId}:${day}`;
    facultyDaily.set(key, (facultyDaily.get(key) ?? 0) + 1);
  }
  const subjectDayBlocks = new Map<string, number>();
  const planned: Array<Parameters<typeof createTimetableEntry>[0]> = [];

  for (const { offering, requirement } of requirements) {
    const assignment = context.teachingAssignments.find((item) => item.subjectOfferingId === offering.id);
    if (!assignment) throw new Error(`${offering.code} needs a faculty assignment before generation.`);
    let remaining = requirement.periodsPerWeek;
    while (remaining > 0) {
      const length = Math.min(requirement.blockSize, remaining);
      let chosen: { window: TimetableSlot[]; room: TimetableRoom } | null = null;
      const days = [...new Set(slots.map((slot) => slot.dayOfWeek))]
        .sort((a, b) => (subjectDayBlocks.get(`${offering.id}:${a}`) ?? 0) - (subjectDayBlocks.get(`${offering.id}:${b}`) ?? 0) || a - b);
      for (const day of days) {
        if ((subjectDayBlocks.get(`${offering.id}:${day}`) ?? 0) >= requirement.maxBlocksPerDay) continue;
        const daySlots = slots.filter((slot) => slot.dayOfWeek === day);
        for (let start = 0; start <= daySlots.length - length; start += 1) {
          const window = daySlots.slice(start, start + length);
          if (!window.slice(1).every((slot, index) => slot.sequence === window[index].sequence + 1 && window[index].endsAt === slot.startsAt)) continue;
          const dailyKey = `${assignment.facultyUserId}:${day}`;
          if ((facultyDaily.get(dailyKey) ?? 0) + length > configuration.maxFacultyPeriodsPerDay) continue;
          if (window.some((slot) => facultyBusy.has(`${assignment.facultyUserId}:${slot.id}`))) continue;
          const room = context.rooms.find((candidate) => candidate.capacity >= (section.capacity ?? 0)
            && (!requirement.requiredRoomTypes.length || requirement.requiredRoomTypes.includes(candidate.roomType))
            && window.every((slot) => !roomBusy.has(`${candidate.id}:${slot.id}`)));
          if (room) { chosen = { window, room }; break; }
        }
        if (chosen) break;
      }
      if (!chosen) throw new Error(`${offering.code} has ${remaining} periods that cannot be placed without a faculty or room conflict.`);
      const blockId = crypto.randomUUID();
      chosen.window.forEach((slot, index) => {
        planned.push({ versionId, slotId: slot.id, subjectOfferingId: offering.id, teachingAssignmentId: assignment.id, roomId: chosen!.room.id, deliveryType: requirement.deliveryType, sessionBlockId: blockId, blockSequence: index + 1, blockLength: length });
        facultyBusy.add(`${assignment.facultyUserId}:${slot.id}`);
        roomBusy.add(`${chosen!.room.id}:${slot.id}`);
      });
      const day = chosen.window[0].dayOfWeek;
      facultyDaily.set(`${assignment.facultyUserId}:${day}`, (facultyDaily.get(`${assignment.facultyUserId}:${day}`) ?? 0) + length);
      subjectDayBlocks.set(`${offering.id}:${day}`, (subjectDayBlocks.get(`${offering.id}:${day}`) ?? 0) + 1);
      remaining -= length;
    }
  }

  for (const entry of oldEntries) await deleteTimetableEntry(entry.id);
  for (const entry of planned) await createTimetableEntry(entry);
  return { data: { versionId, scheduledPeriods: planned.length, unscheduled: [], engine: 'browser-constraint-optimizer-v1', aiStatus: 'fallback' as const } satisfies GenerateResult };
}

export async function generateTimetableVersion(versionId: string, input: {
  sectionId?: string;
  preserveExisting?: boolean;
  prioritizeHighCredits?: boolean;
} = {}) {
  try {
    return await apiRequest<{ data: GenerateResult }>(`${ROOT}/versions/${encodeURIComponent(versionId)}/generate`, { method: 'POST', body: JSON.stringify(input) });
  } catch (error) {
    if (!input.sectionId || !(error instanceof Error) || !error.message.includes('sectionId')) throw error;
    return generateSelectedSectionWithLegacyApi(versionId, input.sectionId, input.prioritizeHighCredits ?? true);
  }
}

export function publishTimetableVersion(versionId: string) {
  return apiRequest<{ data: { revision: number; version: Record<string, unknown> } }>(
    `${ROOT}/versions/${encodeURIComponent(versionId)}/publish`,
    { method: 'POST' },
  );
}

export function requestFacultySubstitution(input: {
  timetableEntryId: string;
  serviceDate: string;
  substituteFacultyUserId: string;
  reason: string;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/substitutions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function acknowledgeFacultySubstitution(requestId: string, evidence: Record<string, unknown> = {}) {
  return apiRequest<{ data: Record<string, unknown> }>(
    `${ROOT}/substitutions/${encodeURIComponent(requestId)}/acknowledge`,
    { method: 'POST', body: JSON.stringify({ evidence }) },
  );
}

export function decideFacultySubstitution(
  requestId: string,
  decision: 'approved' | 'rejected',
  note?: string,
) {
  return apiRequest<{ data: { revision: number; substitution: Record<string, unknown> } }>(
    `${ROOT}/substitutions/${encodeURIComponent(requestId)}/decision`,
    { method: 'POST', body: JSON.stringify({ decision, note }) },
  );
}
