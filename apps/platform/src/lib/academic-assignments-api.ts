import { apiRequest } from './api';

export type AcademicAssignmentScope = 'own' | 'assigned' | 'department' | 'institution' | 'all';
export type TeachingAssignmentType = 'primary' | 'co_faculty' | 'substitute';

export interface AcademicDepartment {
  id: string;
  code: string;
  name: string;
}

export interface AcademicSubject {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  credits: number | null;
}

export interface AcademicYear {
  id: string;
  code: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: 'draft' | 'active' | 'closed';
}

export interface AcademicTerm {
  id: string;
  academicYearId: string;
  code: string;
  name: string;
  sequence: number;
  status: 'draft' | 'active' | 'closed';
}

export interface AcademicSection {
  id: string;
  code: string;
  name: string;
  batchId: string;
  batchName: string;
  programmeId: string;
  programmeName: string;
  departmentId: string;
}

export interface AcademicAssignmentCandidate {
  id: string;
  name: string;
  email: string;
  departmentId?: string | null;
}

export interface SubjectOffering {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  academicYearId: string;
  termId: string | null;
  sectionId: string;
  sectionName: string;
  programmeId: string;
  programmeName: string;
  departmentId: string;
}

export interface DepartmentAuthorityAssignment {
  id: string;
  departmentId: string;
  userId: string;
  name: string;
  email: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface FacultyTeachingAssignment {
  id: string;
  subjectOfferingId: string;
  facultyUserId: string;
  facultyName: string;
  facultyEmail: string;
  facultyDepartmentId: string | null;
  assignmentType: TeachingAssignmentType;
}

export interface AcademicAssignmentContext {
  scope: AcademicAssignmentScope;
  institutionWide: boolean;
  includesCrossDepartmentStaffTeaching: boolean;
  canManage: boolean;
  academicYears: AcademicYear[];
  terms: AcademicTerm[];
  departments: AcademicDepartment[];
  sections: AcademicSection[];
  subjects: AcademicSubject[];
  offerings: SubjectOffering[];
  departmentAuthorities: DepartmentAuthorityAssignment[];
  teachingAssignments: FacultyTeachingAssignment[];
  eligibleHods: AcademicAssignmentCandidate[];
  eligibleFaculty: AcademicAssignmentCandidate[];
}

const ROOT = '/v1/academic-assignments';

export function getAcademicAssignmentContext() {
  return apiRequest<{ data: AcademicAssignmentContext }>(`${ROOT}/context`);
}

export function createAcademicSubject(input: {
  departmentId: string;
  code: string;
  name: string;
  credits?: number | null;
}) {
  return apiRequest<{ data: AcademicSubject }>(`${ROOT}/subjects`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAcademicSubject(subjectId: string, input: {
  departmentId: string;
  code: string;
  name: string;
  credits?: number | null;
}) {
  return apiRequest<{ data: AcademicSubject }>(`${ROOT}/subjects/${encodeURIComponent(subjectId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function createSubjectOffering(input: {
  subjectId: string;
  academicYearId: string;
  termId?: string | null;
  sectionId: string;
}) {
  return apiRequest<{ data: { id: string } }>(`${ROOT}/offerings`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function assignDepartmentHod(input: {
  userId: string;
  departmentId: string;
  startsOn?: string | null;
  endsOn?: string | null;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/hod`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removeDepartmentHod(assignmentId: string) {
  return apiRequest<void>(`${ROOT}/hod/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
  });
}

export function assignFacultyTeaching(input: {
  facultyUserId: string;
  facultyDepartmentId: string;
  subjectOfferingId: string;
  assignmentType?: TeachingAssignmentType;
}) {
  return apiRequest<{ data: Record<string, unknown> }>(`${ROOT}/teaching`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removeFacultyTeaching(assignmentId: string) {
  return apiRequest<void>(`${ROOT}/teaching/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE',
  });
}
