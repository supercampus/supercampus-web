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
const crmEventsSource = await readFile(new URL('../src/lib/crm-events.ts', import.meta.url), 'utf8');

test('first movement ownership replaces the separate unassigned pool', () => {
  assert.match(crmApiSource, /leads\/\$\{id\}\/stage\/request/);
  assert.match(crmApiSource, /move-requests\/\$\{id\}\/\$\{decision\}/);
  assert.doesNotMatch(admissionsSource, /Unassigned pool/);
  assert.doesNotMatch(admissionsSource, /handleClaimLead/);
  assert.match(admissionsSource, /first stage movement assigns an Enquiry/i);
  assert.match(kanbanSource, /response\.data\.assignedTo \?\? 'Unassigned'/);
  assert.doesNotMatch(kanbanSource, /ownerId === 'Unassigned' \? \{ name: currentUserId \}/);
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
  assert.match(admissionsSource, /next\[index\] = nextLead/);
  assert.match(admissionsSource, /silentlyRefreshBoard\(includeDashboard, !hasLeadSnapshot\)/);
  assert.match(admissionsSource, /hasLeadSnapshot \? 50 : 250/);
  assert.match(crmEventsSource, /error instanceof ApiRequestError && error\.status === 401/);
  assert.match(crmEventsSource, /error\.status >= 500 \? 5_000 : 1_000/);
});

test('movement reason confirmation closes immediately while the move persists', () => {
  assert.match(kanbanSource, /setMoveLogModal\(null\);\s*const outcome = await persistMove/);
  assert.doesNotMatch(kanbanSource, /\{ \.\.\.l, status: to, lastContact: 'just now', moveHistory:/);
});
