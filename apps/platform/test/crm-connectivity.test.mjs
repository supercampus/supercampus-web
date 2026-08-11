import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const crmApiSource = await readFile(new URL('../src/lib/crm-api.ts', import.meta.url), 'utf8');
const admissionsSource = await readFile(
  new URL('../src/app/(staff)/dashboard/admissions/page.tsx', import.meta.url),
  'utf8',
);
const activitySource = await readFile(
  new URL('../src/components/kanban/ActivityFeed.tsx', import.meta.url),
  'utf8',
);
const kanbanSource = await readFile(
  new URL('../src/components/kanban/KanbanBoard.tsx', import.meta.url),
  'utf8',
);
const kanbanColumnSource = await readFile(
  new URL('../src/components/kanban/KanbanColumn.tsx', import.meta.url),
  'utf8',
);
const kanbanDataSource = await readFile(
  new URL('../src/lib/kanban/kanban-data.ts', import.meta.url),
  'utf8',
);
const sidebarSource = await readFile(
  new URL('../src/components/modules/AdmissionsSidebar.tsx', import.meta.url),
  'utf8',
);
const crmEventsSource = await readFile(new URL('../src/lib/crm-events.ts', import.meta.url), 'utf8');
const leadDetailSource = await readFile(
  new URL('../src/components/kanban/LeadDetailSidebar.tsx', import.meta.url),
  'utf8',
);

test('first movement ownership replaces the separate unassigned pool', () => {
  assert.doesNotMatch(admissionsSource, /Unassigned pool/);
  assert.doesNotMatch(admissionsSource, /handleClaimLead/);
  assert.match(admissionsSource, /first stage movement claims the card/i);
  assert.match(kanbanSource, /id: ownerId/);
  assert.match(kanbanSource, /ownerId === currentUserId \? currentUserName/);
  assert.doesNotMatch(kanbanSource, /ownerId === 'Unassigned' \? \{ name: currentUserId \}/);
  assert.doesNotMatch(kanbanSource, /requestCrmLeadMove/);
  assert.doesNotMatch(kanbanSource, /MoveRequestsPanel/);
});

test('campaign form submissions carry durable traceability and idempotency', () => {
  assert.match(crmApiSource, /campaignId\?: string; idempotencyKey\?: string/);
  assert.match(crmApiSource, /processingStatus: string/);
  assert.match(crmApiSource, /replayed: boolean/);
  assert.match(crmApiSource, /body: JSON\.stringify\(\{ data, leadId, \.\.\.attribution \}\)/);
});

test('activity feed reads backend facts instead of only local move history', () => {
  assert.match(crmApiSource, /getCrmActivity/);
  assert.match(activitySource, /await getCrmActivity\(\)/);
  assert.match(activitySource, /entry\.eventType/);
});

test('legacy auto assignment is not offered as an active CRM control', () => {
  assert.match(admissionsSource, /automation\.action !== 'auto_assign_digital_leads'/);
  assert.match(admissionsSource, /First stage movement assigns the card owner/);
});

test('pipeline overview supports monthly weekly and daily lead buckets', () => {
  assert.match(admissionsSource, /useState<'monthly' \| 'weekly' \| 'daily'>\('monthly'\)/);
  assert.match(admissionsSource, /\['monthly', 'Monthly'\]/);
  assert.match(admissionsSource, /\['weekly', 'Weekly'\]/);
  assert.match(admissionsSource, /\['daily', 'Days'\]/);
  assert.match(admissionsSource, /for \(let offset = 13; offset >= 0; offset--\)/);
});

test('pipeline movements apply websocket lead snapshots without refetching the board', () => {
  assert.match(crmEventsSource, /new WebSocket\(url\)/);
  assert.match(admissionsSource, /event\.payload\.lead as CrmLead/);
  assert.match(admissionsSource, /realtimeLead\.stageKey === 'enquiry'/);
  assert.match(admissionsSource, /realtimeLead\.assignedTo === student\?\.id/);
  assert.match(admissionsSource, /next\[index\] = nextLead/);
  assert.match(admissionsSource, /silentlyRefreshBoard\(includeDashboard, !hasLeadSnapshot\)/);
  assert.match(admissionsSource, /hasLeadSnapshot \? 50 : 250/);
  assert.match(crmEventsSource, /error instanceof ApiRequestError && error\.status === 401/);
  assert.match(crmEventsSource, /error\.status >= 500 \? 5_000 : 1_000/);
  assert.match(kanbanSource, /const current = leads\.find\(\(lead\) => lead\.id === selectedLead\.id\)/);
  assert.match(kanbanSource, /setSelectedLead\(current\)/);
});

test('card transfer only targets eligible pipeline users and removes the old owner copy', () => {
  assert.match(crmApiSource, /pipeline\/transfer-candidates/);
  assert.match(crmApiSource, /leads\/\$\{id\}\/transfer/);
  assert.match(kanbanSource, /await transferCrmLead\(transferLead\.id, transferUserId, transferReason\.trim\(\)\)/);
  assert.match(kanbanSource, /current\.filter\(\(lead\) => lead\.id !== transferLead\.id\)/);
  assert.match(kanbanSource, /Ownership changes immediately; the pipeline stage and history stay unchanged/);
});

test('movement reason confirmation closes immediately while the move persists', () => {
  assert.match(kanbanSource, /setMoveLogModal\(null\);\s*const outcome = await persistMove/);
  assert.doesNotMatch(kanbanSource, /\{ \.\.\.l, status: to, lastContact: 'just now', moveHistory:/);
});

test('admissions navigation and nurtured stage use the requested display labels', () => {
  assert.match(sidebarSource, /id: 'dashboard', label: 'Overview'/);
  assert.match(sidebarSource, /id: 'pipeline', label: 'Lead'/);
  assert.doesNotMatch(sidebarSource, /id: 'crm', label: 'CRM'/);
  assert.match(kanbanDataSource, /id: 'nurture', title: 'Nurtured'/);
});

test('only Enquiry exposes the permission-gated create lead flow', () => {
  assert.match(kanbanSource, /onCreateLead=\{column\.id === 'enquiry' \? onCreateLead : undefined\}/);
  assert.match(kanbanColumnSource, /onClick=\{\(\) => onCreateLead\(column\)\}/);
  assert.match(admissionsSource, /onCreateLead=\{canCreateLeads \? openStageLeadCreation : undefined\}/);
  assert.match(admissionsSource, /New leads enter Enquiry first/);
});

test('lead import is launched from settings instead of the CRM command center', () => {
  const settingsStart = admissionsSource.indexOf("{activeNav === 'settings'");
  const importTrigger = admissionsSource.indexOf('onClick={openLeadImport}');
  assert.ok(settingsStart >= 0);
  assert.ok(importTrigger > settingsStart);
  assert.equal(admissionsSource.match(/onClick=\{openLeadImport\}/g)?.length, 1);
});

test('flagged duplicate leads remain traceable in the lead workspace', () => {
  assert.match(admissionsSource, /duplicateOf: lead\.duplicateOf/);
  assert.match(kanbanDataSource, /duplicateOf\?: string \| null/);
  assert.match(leadDetailSource, /Duplicate lead detected/);
  assert.match(leadDetailSource, /lead\.duplicateOf\.slice\(0, 8\)/);
});
