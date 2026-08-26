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

export function generateTimetableVersion(versionId: string, input: {
  sectionId?: string;
  preserveExisting?: boolean;
  prioritizeHighCredits?: boolean;
} = {}) {
  return apiRequest<{ data: { versionId: string; scheduledPeriods: number; unscheduled: Array<{ subjectOfferingId: string; remainingPeriods: number }>; engine: string; aiStatus: 'applied' | 'fallback' | 'not_configured' } }>(
    `${ROOT}/versions/${encodeURIComponent(versionId)}/generate`,
    { method: 'POST', body: JSON.stringify(input) },
  );
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
