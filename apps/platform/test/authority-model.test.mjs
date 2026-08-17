import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/lib/authority-model.ts', import.meta.url), 'utf8');
const portalAccessSource = await readFile(new URL('../src/lib/portal-access.ts', import.meta.url), 'utf8');
const governanceSource = await readFile(new URL('../src/lib/governance-policy.ts', import.meta.url), 'utf8');

test('college authorities reuse stable portal families', () => {
  for (const role of ['management', 'principal', 'academic_administrator', 'hod', 'accountant', 'admissions_officer', 'faculty']) {
    assert.match(source, new RegExp(`key: '${role}'[\\s\\S]*?portalFamily: 'staff'`));
  }
  assert.match(source, /key: 'tenant_admin'[\s\S]*?portalFamily: 'admin'/);
});

test('sensitive approvals follow confirmed separation of duties', () => {
  assert.match(governanceSource, /capability: 'fees\.refunds\.approve'[\s\S]*?allowedRoles: \['management'\]/);
  assert.match(governanceSource, /capability: 'fees\.refunds\.approve'[\s\S]*?deniedRoles: \['principal', 'accountant'\]/);
  assert.match(governanceSource, /capability: 'application-desk\.approve'[\s\S]*?deniedRoles: \['principal'\]/);
  assert.match(governanceSource, /capability: 'examination\.publishing\.approve'[\s\S]*?allowedRoles: \['principal'\]/);
  assert.match(governanceSource, /capability: 'students\.status\.suspend'[\s\S]*?allowedRoles: \['principal'\]/);
});

test('academic assignment and HOD visibility policies are explicit', () => {
  assert.match(governanceSource, /assigners: \['principal', 'academic_administrator'\]/);
  assert.match(governanceSource, /hodAssignments: \['department'\]/);
  assert.match(governanceSource, /facultyAssignments: \['class', 'subject'\]/);
  assert.match(governanceSource, /includeCrossDepartmentTeachingByDepartmentStaff: true/);
});

test('platform super admin is not tenant assignable', () => {
  assert.match(source, /key: 'platform_super_admin'[\s\S]*?portalFamily: 'platform-control'/);
  assert.match(source, /key: 'platform_super_admin'[\s\S]*?tenantAssignable: false/);
});

test('tenant role templates include operational defaults without permission grants', () => {
  assert.match(source, /key: 'principal'[\s\S]*?team: 'Leadership'/);
  assert.match(source, /key: 'hod'[\s\S]*?team: 'Academics'/);
  assert.match(source, /key: 'accountant'[\s\S]*?team: 'Finance'/);
  assert.doesNotMatch(source, /recommendedPermissions/);
});

test('authority scopes follow organisational responsibility', () => {
  assert.match(source, /key: 'principal'[\s\S]*?defaultScope: 'institution'/);
  assert.match(source, /key: 'hod'[\s\S]*?defaultScope: 'department'/);
  assert.match(source, /key: 'faculty'[\s\S]*?defaultScope: 'assigned'/);
  assert.match(source, /key: 'student'[\s\S]*?defaultScope: 'own'/);
});

test('portal routing trusts server-issued families and keeps a legacy fallback', () => {
  assert.match(portalAccessSource, /families\.includes\('student'\)/);
  assert.match(portalAccessSource, /families\.includes\('staff'\) \|\| families\.includes\('admin'\)/);
  assert.match(portalAccessSource, /families\.includes\('parent'\)/);
  assert.match(portalAccessSource, /LEGACY_STUDENT_ROLES/);
});
