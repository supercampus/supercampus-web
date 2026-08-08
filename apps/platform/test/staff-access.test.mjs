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
  assert.match(sidebarSource, /availableStaffNavigation\(permissions\)/);
  assert.match(sidebarSource, /visibleItems\.map/);
});

test('staff page avoids unauthorized configuration requests and actions', () => {
  assert.match(admissionsSource, /canReadPermissionCatalog\s*\?\s*getAuthorizationPermissions\(\)/);
  assert.match(admissionsSource, /canReadRoles\s*\?\s*getAuthorizationRoles\(\)/);
  assert.match(admissionsSource, /canReadUsers\s*\?\s*getTenantUsers\(\)/);
  assert.match(admissionsSource, /canImportLeads\s*&&/);
  assert.match(admissionsSource, /canCreateLeads\s*&&/);
  assert.match(admissionsSource, /canPublishForms\s*&&/);
});

test('pipeline mutations use dynamic effective permissions', () => {
  assert.equal(admissionsSource.includes('canUpdateLeads={canUpdateLeads}'), true);
  assert.equal(admissionsSource.includes('canMoveLeadStage={canMoveLeadStage}'), true);
  assert.equal(kanbanSource.includes('if (!canUpdateLeads)'), true);
  assert.equal(kanbanSource.includes('if (!canMoveLeadStage)'), true);
  assert.equal(kanbanSource.includes('canMoveLead(roleId'), false);
  assert.equal(leadCardSource.includes('disabled: !canDrag'), true);
  assert.equal(leadSidebarSource.includes('{canUpdateLead && ('), true);
  assert.equal(leadSidebarSource.includes('isEditing && canUpdateLead'), true);
});