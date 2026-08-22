import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const accessSource = await readFile(
  new URL('../src/lib/staff-access.ts', import.meta.url),
  'utf8',
);
const sidebarSource = await readFile(
  new URL('../src/components/modules/AdmissionsSidebar.tsx', import.meta.url),
  'utf8',
);
const admissionsSource = await readFile(
  new URL('../src/app/(staff)/dashboard/admissions/page.tsx', import.meta.url),
  'utf8',
);
const authorizationApiSource = await readFile(
  new URL('../src/lib/authorization-api.ts', import.meta.url),
  'utf8',
);
const kanbanSource = await readFile(
  new URL('../src/components/kanban/KanbanBoard.tsx', import.meta.url),
  'utf8',
);
const leadCardSource = await readFile(
  new URL('../src/components/kanban/LeadCard.tsx', import.meta.url),
  'utf8',
);
const leadSidebarSource = await readFile(
  new URL('../src/components/kanban/LeadDetailSidebar.tsx', import.meta.url),
  'utf8',
);

test('staff navigation is derived from effective permissions', () => {
  assert.match(accessSource, /crm\.dashboard\.read/);
  assert.match(accessSource, /crm\.leads\.read/);
  assert.match(accessSource, /authorization\.users\.read/);
  assert.match(accessSource, /case 'academics':[\s\S]*hasModulePermission\(permissions, 'timetable'\)/);
  assert.match(sidebarSource, /availableStaffNavigation\(permissions\)/);
  assert.match(sidebarSource, /visibleItems\.map/);
  assert.match(accessSource, /case 'application-desk':[\s\S]*application-desk\.view/);
});

test('application desk never requests protected cases without an authenticated view grant', async () => {
  const deskSource = await readFile(
    new URL('../src/components/modules/ApplicationDeskWorkspace.tsx', import.meta.url),
    'utf8',
  );
  assert.match(deskSource, /authStatus === 'authenticated' && grantedView/);
});

test('application desk cannot remain in an infinite loading state', async () => {
  const [deskSource, apiSource] = await Promise.all([
    readFile(new URL('../src/components/modules/ApplicationDeskWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(apiSource, /REQUEST_TIMEOUT_MS = 12_000/);
  assert.match(apiSource, /controller\.abort\('request-timeout'\)/);
  assert.match(deskSource, /Application Desk could not load/);
  assert.match(deskSource, /onClick=\{refresh\}/);
});

test('staff page avoids unauthorized configuration requests and actions', () => {
  assert.match(admissionsSource, /canReadPermissionCatalog\s*\?\s*getAuthorizationPermissions\(\)/);
  assert.match(admissionsSource, /canReadRoles\s*\?\s*getAuthorizationRoles\(\)/);
  assert.match(admissionsSource, /canReadUsers\s*\?\s*getTenantUsers\(\)/);
  assert.match(admissionsSource, /canImportLeads\s*&&/);
  assert.match(admissionsSource, /canCreateLeads\s*&&/);
  assert.match(admissionsSource, /canPublishForms\s*&&/);
});

test('access setup groups admissions modules into one workspace card', () => {
  assert.match(admissionsSource, /ADMISSIONS_WORKSPACE_MODULE_IDS/);
  assert.match(admissionsSource, /Admissions workspace/);
  assert.match(admissionsSource, /admissionsWorkspaceModules\.map/);
  assert.match(admissionsSource, /contained modules/);
  assert.match(admissionsSource, /permissionKeys\.includes\(permission\.key\)/);
});

test('tenant administrators choose the password when creating a user', () => {
  assert.match(authorizationApiSource, /password: string/);
  assert.doesNotMatch(authorizationApiSource, /temporaryPassword/);
  assert.match(admissionsSource, /const \[newUserPassword, setNewUserPassword\]/);
  assert.match(admissionsSource, /type="password"/);
  assert.match(admissionsSource, /autoComplete="new-password"/);
  assert.match(admissionsSource, /password\.length < 12/);
  assert.match(admissionsSource, /createTenantUser\(\{[\s\S]*password,[\s\S]*roleIds/);
  assert.doesNotMatch(admissionsSource, /Temporary password:/);
});

test('pipeline mutations use dynamic effective permissions', () => {
  assert.equal(admissionsSource.includes('canUpdateLeads={canUpdateLeads}'), true);
  assert.equal(admissionsSource.includes('canMoveLeadStage={canMoveLeadStage}'), true);
  assert.equal(kanbanSource.includes('if (!canUpdateLeads)'), true);
  assert.equal(kanbanSource.includes('if (!canMoveLeadStage)'), true);
  assert.equal(kanbanSource.includes('canMoveLead(roleId'), false);
  assert.equal(leadCardSource.includes('disabled: !canDrag'), true);
  assert.equal(leadSidebarSource.includes('disabled={!canUpdateLead}'), true);
  assert.equal(leadSidebarSource.includes('editing ?'), true);
});

test('lead drawer follows the published form schema and animates from the right', () => {
  assert.match(leadSidebarSource, /publishedSections\(leadForm\)/);
  assert.match(leadSidebarSource, /formSections\.map/);
  assert.match(leadSidebarSource, /leadForm\?\.name/);
  assert.match(leadSidebarSource, /lg:w-1\/2/);
  assert.match(leadSidebarSource, /translate-x-full/);
  assert.match(leadSidebarSource, /window\.setTimeout\(onClose, 260\)/);
});

test('application status drawer provides accept deny and hold decisions', () => {
  assert.match(leadSidebarSource, /lead\.status === 'application-status'/);
  assert.match(leadSidebarSource, /decideApplication\('accept'\)/);
  assert.match(leadSidebarSource, /decideApplication\('deny'\)/);
  assert.match(leadSidebarSource, /decideApplication\('hold'\)/);
  assert.match(kanbanSource, /holdCrmLead/);
  assert.match(kanbanSource, /decision === 'accept' \? 'offer-status' : 'archived'/);
});
