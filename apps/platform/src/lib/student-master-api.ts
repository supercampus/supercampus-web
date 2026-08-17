import { apiRequest } from './api';

export type StudentMasterRow = {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  mobileNumber: string;
  email: string;
  status: string;
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
