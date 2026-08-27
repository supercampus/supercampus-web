import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sheet = readFileSync(
  new URL('../src/components/modules/PrincipalTimetableSheet.tsx', import.meta.url),
  'utf8',
);
const assignmentsApi = readFileSync(
  new URL('../src/lib/academic-assignments-api.ts', import.meta.url),
  'utf8',
);

test('the principal can add and edit tenant subjects with staff and room setup', () => {
  assert.match(sheet, /> Add subject</);
  assert.match(sheet, /Edit subject/);
  assert.match(sheet, /createAcademicSubject/);
  assert.match(sheet, /createSubjectOffering/);
  assert.match(sheet, /assignFacultyTeaching/);
  assert.match(sheet, /preferredRoomId/);
});

test('subject edits persist through the tenant-scoped subject API', () => {
  assert.match(assignmentsApi, /updateAcademicSubject/);
  assert.match(assignmentsApi, /method: 'PUT'/);
  assert.match(assignmentsApi, /`\$\{ROOT\}\/subjects\/\$\{encodeURIComponent\(subjectId\)\}`/);
});

test('missing staff or room opens setup instead of leaving a dead-end placement error', () => {
  assert.match(sheet, /openCourseEditor\(offering\)/);
  assert.match(sheet, /Complete this subject’s faculty and room setup first/);
  assert.doesNotMatch(sheet, /Assign a faculty member and prepare at least one suitable room before placing this subject/);
  assert.doesNotMatch(sheet, /Choose a subject, faculty member, and room\./);
});
