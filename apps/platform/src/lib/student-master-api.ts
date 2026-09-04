import { apiRequest, uploadMedia } from './api';

export type StudentMasterRow = {
  id: string;
  userId: string | null;
  name: string;
  rollNo: string;
  department: string;
  mobileNumber: string;
  email: string;
  status: string;
  photoUrl: string | null;
  residency: 'day_scholar' | 'hosteller';
  createdAt: string;
  updatedAt: string;
};

export type StudentImportRow = Pick<StudentMasterRow, 'name' | 'rollNo' | 'department' | 'mobileNumber' | 'email'>;

export function listStudentMaster() {
  return apiRequest<{ data: StudentMasterRow[] }>('/v1/student-master', { timeoutMs: 30_000 });
}

export function importStudentMaster(rows: StudentImportRow[]) {
  return apiRequest<{ data: { imported: number; inserted: number; updated: number } }>('/v1/student-master/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

// Sets or clears a student's photograph. Passing null removes it. Only a URL
// crosses this boundary — the file itself goes to the tenant's own media
// folder first.
export function setStudentPhoto(studentId: string, photoUrl: string | null) {
  return apiRequest<{ data: { id: string; name: string; photoUrl: string | null } }>(
    `/v1/student-master/${encodeURIComponent(studentId)}/photo`,
    { method: 'PUT', body: JSON.stringify({ photoUrl }) },
  );
}

export function setStudentResidency(
  studentId: string,
  residency: StudentMasterRow['residency'],
) {
  return apiRequest<{ data: { id: string; name: string; residency: StudentMasterRow['residency'] } }>(
    `/v1/student-master/${encodeURIComponent(studentId)}/residency`,
    { method: 'PUT', body: JSON.stringify({ residency }) },
  );
}

// Uploads the image, then attaches the URL it returns to the student. Two steps
// rather than one multipart endpoint: the upload is already tenant-scoped and
// reusable, and keeping the attach step as plain JSON means a photograph can
// also be pointed at an existing asset without re-uploading it.
export async function uploadStudentPhoto(studentId: string, file: File) {
  const uploaded = await uploadMedia(file);
  return setStudentPhoto(studentId, uploaded.data.secureUrl);
}
