import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(
  new URL('../src/app/(staff)/dashboard/admissions/page.tsx', import.meta.url),
  'utf8',
);
const apiSource = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');

test('role creation reports success only after the API response', () => {
  const request = pageSource.indexOf('const response = await createAuthorizationRole');
  const success = pageSource.indexOf('showToast(`Role "${name}" added', request);

  assert.notEqual(request, -1);
  assert.ok(success > request);
});

test('role creation enables both surfaces independently of portal family', () => {
  assert.match(pageSource, /portalFamily: newRolePortalFamily,[\s\S]*surfaces: \['website', 'app'\]/);
  assert.match(pageSource, /added to WEB and APP access/);
  assert.doesNotMatch(pageSource, /portalFamily === 'student'/);
});

test('duplicate role keys select the existing role without calling the API', () => {
  const duplicateCheck = pageSource.indexOf('const existingRole = collegeRoles.find((role) => role.key === roleKey)');
  const request = pageSource.indexOf('const response = await createAuthorizationRole', duplicateCheck);

  assert.notEqual(duplicateCheck, -1);
  assert.ok(request > duplicateCheck);
  assert.match(
    pageSource.slice(duplicateCheck, request),
    /setSelectedAccessRoleId\(existingRole\.id\)[\s\S]*already exists/,
  );
});

test('roles and permission modules are not filtered through hardcoded surface lists', () => {
  assert.match(pageSource, /\{filteredCollegeRoles\.map\(\(role\) =>/);
  assert.match(pageSource, /const surfaceOperationModules = operationModules;/);
  assert.doesNotMatch(pageSource, /\['student-app', 'parent', 'canteen'/);
});

test('web requests identify the website authorization surface', () => {
  assert.match(apiSource, /headers\.set\('x-client-surface', 'website'\)/);
});
