import { apiRequest } from './api';

export interface CrmLead {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  parentName: string | null;
  parentPhone: string | null;
  source: string;
  sourceDetail: Record<string, unknown>;
  academic: Record<string, unknown>;
  interest: Record<string, unknown>;
  stageKey: string;
  substateKey: string;
  globalStatus: string | null;
  globalStatusData: Record<string, unknown>;
  priority: string;
  assignedTo: string | null;
  followUpAt: string | null;
  feePaymentConfirmed: boolean;
  documentsVerified: boolean;
  duplicateOf: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOperationsDashboard {
  scope: 'all' | 'assigned';
  headline: {
    leadIntake: number;
    followUpsDue: number;
    campaignRoi: number;
    counselorSla: number;
  };
  operations: {
    newLeads: number;
    contactDue: number;
    qualified: number;
    applications: number;
    accepted: number;
    priorityQueue: Array<{
      leadId: string;
      fullName: string;
      course: string | null;
      city: string | null;
      source: string;
      assignedTo: string | null;
      priority: string;
      followUpAt: string | null;
    }>;
  };
  automations: Array<{
    id: string | null;
    label: string;
    stage: string;
    triggerName: string;
    action: string;
    templateKey: string | null;
    enabled: boolean;
  }>;
  sourceRoi: Array<{
    source: string;
    leads: number;
    applications: number;
    budget: number;
    spent: number;
    attributedRevenue: number;
    costPerLead: number | null;
    roi: number | null;
  }>;
  campaignSummary: {
    budgetUsedPercent: number;
    landingPages: number;
    activeUtm: number;
  };
  health: {
    score: number;
    duplicateDetection: number;
    sourceAttribution: number;
    postQualifiedWhatsapp: number;
  };
  cases: {
    open: number;
    counts: Record<'prospect' | 'deferred' | 'on_hold' | 'archive', number>;
    items: Array<{
      leadId: string;
      fullName: string;
      status: string | null;
      reason: string | null;
      due: string | null;
    }>;
  };
}

export interface CreateCampaignInput {
  name: string;
  source: string;
  budget?: number;
  spent?: number;
  attributedRevenue?: number;
  landingPages?: number;
  utmCode?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  startsOn?: string;
  endsOn?: string;
  formId?: string;
}

export interface CrmBoardStage {
  key: string;
  order: number;
  defaultSubstate?: string;
  substates: string[];
  count: number;
  leads: CrmLead[];
}

export type CrmStageCatalog = Pick<CrmBoardStage, 'key' | 'order' | 'substates'> & { defaultSubstate: string };

export interface CrmBoard {
  pipeline: { key: string; name: string };
  scope: 'all' | 'assigned' | 'collaborative';
  stages: CrmBoardStage[];
  total: number;
}

export interface CrmPermissions {
  userId: string;
  roles: string[];
  primaryRole: string;
  permissions: string[];
  scopes: Record<string, 'all' | 'assigned' | 'own'>;
}

export interface CrmForm {
  id: string;
  name: string;
  formType: string;
  status: string;
  version: number;
  schema: unknown;
  updatedAt: string;
}

export interface CreateLeadInput {
  source: string;
  student: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    parentName?: string;
    parentPhone?: string;
  };
  priority?: string;
  followUpAt?: string;
  communication?: { preferredChannel?: string; consentGiven: boolean };
  academic?: Record<string, unknown>;
  interest?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
}

export interface CreateFormInput {
  name: string;
  formType: string;
  programId?: string;
  intakeYear?: number;
  schema: unknown;
}

const CRM_ROOT = '/v1/crm';

export function getCrmBoard(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiRequest<{ data: CrmBoard }>(`${CRM_ROOT}/kanban/board${query}`);
}

export interface CrmLeadMoveRequest {
  id: string;
  leadId: string;
  leadName: string;
  requestedBy: string;
  ownerId: string;
  fromStage: string;
  fromSubstate: string;
  toStage: string;
  toSubstate: string;
  reason: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'stale' | 'expired';
  decisionReason: string | null;
  expiresAt: string;
  createdAt: string;
  decidedAt: string | null;
}

export interface CrmPipelineTransferCandidate {
  userId: string;
  name: string;
  email: string;
}

export interface CrmActivity {
  cursor: number;
  eventType: string;
  aggregateId: string;
  leadName: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Unassigned Enquiry leads available for explicit self-claim. */
export function getCrmUnassignedLeads(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiRequest<{ data: CrmLead[] }>(`${CRM_ROOT}/leads/unassigned${query}`);
}

export interface BulkImportLeadRow extends CreateLeadInput {
  rowNumber: number;
}

export interface BulkImportLeadResult {
  rowNumber: number;
  status: 'created' | 'skipped' | 'failed';
  leadId: string | null;
  duplicateOf: string | null;
  message: string | null;
}

export interface BulkImportLeadsResponse {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  rows: BulkImportLeadResult[];
}

export function getCrmOperationsDashboard() {
  return apiRequest<{ data: CrmOperationsDashboard }>(`${CRM_ROOT}/dashboard/operations`);
}

export function createCrmCampaign(input: CreateCampaignInput) {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/campaigns`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCrmPermissions() {
  return apiRequest<{ data: CrmPermissions }>(`${CRM_ROOT}/permissions/effective`);
}

export function getCrmForms() {
  return apiRequest<{ data: CrmForm[] }>(`${CRM_ROOT}/forms`);
}

export function getPublishedCrmLeadCaptureForm() {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms/published/lead-capture`);
}

/** Every form the tenant administrator has published, whatever types they created. */
export function getPublishedCrmForms() {
  return apiRequest<{ data: CrmForm[] }>(`${CRM_ROOT}/forms/published`);
}

/**
 * The published form of one type, for example `application` or `document_checklist`.
 * Lets the workspace render an admin-defined form without knowing it at build time.
 */
export function getPublishedCrmFormByType(formType: string) {
  return apiRequest<{ data: CrmForm }>(
    `${CRM_ROOT}/forms/published/type/${encodeURIComponent(formType)}`,
  );
}


export function getCrmConfiguration() {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/configuration`);
}

export function createCrmLead(input: CreateLeadInput) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads`, {
    method: 'POST',
    body: JSON.stringify({
      source: input.source,
      sourceDetail: {},
      student: input.student,
      academic: input.academic ?? {},
      interest: input.interest ?? {},
      communication: input.communication ?? { consentGiven: false },
      priority: input.priority ?? 'medium',
      followUpAt: input.followUpAt,
      customFields: input.customFields ?? {},
    }),
  });
}

export function moveCrmLead(id: string, toStage: string, reason = 'Updated from the SuperCampus web workspace', toSubstate?: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/move`, {
    method: 'POST',
    body: JSON.stringify({ toStage, toSubstate, reason }),
  });
}

export function updateCrmLead(id: string, input: Record<string, unknown>) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function createCrmForm(input: CreateFormInput) {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishCrmForm(id: string) {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms/${id}/publish`, { method: 'POST' });
}

export function bulkImportCrmLeads(
  rows: BulkImportLeadRow[],
  duplicateStrategy: 'skip' | 'flag' = 'skip',
) {
  return apiRequest<{ data: BulkImportLeadsResponse }>(`${CRM_ROOT}/leads/import`, {
    method: 'POST',
    body: JSON.stringify({
      duplicateStrategy,
      rows: rows.map(({ rowNumber, ...input }) => ({
        rowNumber,
        source: input.source,
        sourceDetail: { imported: true },
        student: input.student,
        academic: input.academic ?? {},
        interest: input.interest ?? {},
        communication: input.communication ?? { consentGiven: false },
        priority: input.priority ?? 'medium',
        followUpAt: input.followUpAt,
        customFields: input.customFields ?? {},
      })),
    }),
  });
}

export function updateCrmForm(id: string, input: { name?: string; formType?: string; schema: unknown }) {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function unpublishCrmForm(id: string) {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms/${id}/unpublish`, {
    method: 'POST',
  });
}

export function submitCrmForm(
  id: string,
  data: Record<string, unknown>,
  leadId?: string,
  attribution?: { campaignId?: string; idempotencyKey?: string },
) {
  return apiRequest<{
    data: {
      id: string;
      formId: string;
      formVersion: number;
      leadId: string | null;
      createdLeadId?: string;
      campaignId: string | null;
      idempotencyKey: string | null;
      processingStatus: string;
      replayed: boolean;
      data: Record<string, unknown>;
      createdAt: string;
    };
  }>(`${CRM_ROOT}/forms/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ data, leadId, ...attribution }),
  });
}

/* ------------------------------------------------------------------------- *
 * Remaining CRM operations.
 *
 * Every route mounted by `modules/crm` now has a typed client. Several backend
 * routes are aliases of one handler (`/leads/{id}/hold` and
 * `/leads/{id}/stage/hold` hit the same code); the `/stage/` form is used
 * throughout for consistency with `moveCrmLead`.
 * ------------------------------------------------------------------------- */

/** A single CRM lead. */
export function getCrmLead(id: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}`);
}

/** Soft-deletes a lead. Responds 204 with no body. */
export function deleteCrmLead(id: string) {
  return apiRequest<void>(`${CRM_ROOT}/leads/${id}`, { method: 'DELETE' });
}

/** Stage, assignment and communication history for a lead. */
export function getCrmLeadTimeline(id: string) {
  return apiRequest<{ data: CrmLeadTimeline }>(`${CRM_ROOT}/leads/${id}/timeline`);
}

export interface CrmTimelineCommunication {
  id: string;
  channel: 'whatsapp' | 'email' | 'call' | 'sms' | 'note';
  subject: string | null;
  content: Record<string, unknown>;
  actorId: string;
  createdAt: string;
}

export interface CrmLeadTask {
  id: string;
  title: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt: string;
  status: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLeadTimeline {
  stageHistory: Array<{ id: string; fromStage: string | null; toStage: string; actorId: string; reason: string | null; notes: string | null; createdAt: string }>;
  communications: CrmTimelineCommunication[];
  assignments: Array<Record<string, unknown>>;
  formSubmissions: Array<Record<string, unknown>>;
  automationRuns: Array<Record<string, unknown>>;
  tasks: CrmLeadTask[];
}

export function addCrmLeadNote(id: string, content: string) {
  return apiRequest<{ data: CrmTimelineCommunication }>(`${CRM_ROOT}/leads/${id}/notes`, {
    method: 'POST', body: JSON.stringify({ content }),
  });
}

export function addCrmLeadTask(id: string, input: { title: string; dueAt: string; priority?: string }) {
  return apiRequest<{ data: CrmLeadTask }>(`${CRM_ROOT}/leads/${id}/tasks`, {
    method: 'POST', body: JSON.stringify(input),
  });
}

/* --- Assignment --- */

export function assignCrmLead(id: string, userId: string, reason?: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ userId, reason }),
  });
}

export function getCrmPipelineTransferCandidates() {
  return apiRequest<{ data: CrmPipelineTransferCandidate[] }>(
    `${CRM_ROOT}/pipeline/transfer-candidates`,
  );
}

export function transferCrmLead(id: string, userId: string, reason: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ userId, reason }),
  });
}

export function requestCrmLeadMove(id: string, toStage: string, reason?: string, toSubstate?: string) {
  return apiRequest<{ data: CrmLeadMoveRequest }>(`${CRM_ROOT}/leads/${id}/stage/request`, {
    method: 'POST',
    body: JSON.stringify({ toStage, toSubstate, reason }),
  });
}

export function getCrmLeadMoveRequests() {
  return apiRequest<{ data: CrmLeadMoveRequest[] }>(`${CRM_ROOT}/move-requests`);
}

export function decideCrmLeadMoveRequest(id: string, decision: 'approve' | 'reject', reason?: string) {
  return apiRequest<{ data: CrmLeadMoveRequest }>(`${CRM_ROOT}/move-requests/${id}/${decision}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getCrmLeadApplication(id: string) {
  return apiRequest<{ data: null | {
    leadId: string;
    caseId: string;
    applicationId: string;
    admissionId: string;
    applicationStage: string;
    applicationStatus: string;
    createdAt: string;
    updatedAt: string;
    applications: Array<{
      caseId: string;
      applicationId: string;
      admissionId: string;
      applicationStage: string;
      applicationStatus: string;
      relationshipCreatedAt: string;
      createdAt: string;
      updatedAt: string;
    }>;
    applicationHistory: Array<{
      action: string;
      fromStage: string;
      toStage: string;
      fromStatus: string;
      toStatus: string;
      reason?: string | null;
      actor: string;
      createdAt: string;
    }>;
  } }>(`${CRM_ROOT}/leads/${id}/application`);
}

export function getCrmActivity() {
  return apiRequest<{ data: CrmActivity[] }>(`${CRM_ROOT}/activity`);
}

/** Claims a lead for the authenticated caller; no target user can be supplied. */
export function claimCrmLead(id: string, reason?: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function reassignCrmLead(id: string, userId: string, reason?: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/reassign`, {
    method: 'POST',
    body: JSON.stringify({ userId, reason }),
  });
}

export interface CrmCounselorInput {
  userId: string;
  displayName: string;
  active?: boolean;
  maxCapacity?: number;
  sourceCategories?: unknown;
  programIds?: unknown;
  territories?: unknown;
  averageResponseMinutes?: number;
  conversionRate?: number;
}

export function getCrmCounselors() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>(`${CRM_ROOT}/assignment/counselors`);
}

/** Creates or updates counselor capacity and routing configuration. */
export function upsertCrmCounselor(input: CrmCounselorInput) {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/assignment/counselors`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/* --- Pipeline global statuses --- */

export interface CrmIntakeInput {
  intakeYear: number;
  programId: string;
  intakeMonth?: string;
  reason?: string;
}

/** Flags a qualified lead as a future-intake prospect. */
export function markCrmLeadProspect(id: string, input: CrmIntakeInput) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/prospect`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Defers a lead to a later intake. */
export function deferCrmLead(id: string, input: CrmIntakeInput) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/defer`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface CrmHoldInput {
  reason: string;
  /** ISO date. Stored, but nothing releases the hold automatically yet. */
  holdUntil?: string;
  reminderDate?: string;
}

export function holdCrmLead(id: string, input: CrmHoldInput) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/hold`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function releaseCrmLeadHold(id: string, reason: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/release-hold`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/** Archive reason must be one of the 31 values the server accepts. */
export function archiveCrmLead(id: string, archiveReason: string, notes?: string) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/archive`, {
    method: 'POST',
    body: JSON.stringify({ archiveReason, notes }),
  });
}

export function unarchiveCrmLead(
  id: string,
  restoreToStage: string,
  reason: string,
  restoreToSubstate?: string,
) {
  return apiRequest<{ data: CrmLead }>(`${CRM_ROOT}/leads/${id}/stage/unarchive`, {
    method: 'POST',
    body: JSON.stringify({ restoreToStage, restoreToSubstate, reason }),
  });
}

/* --- Board and dashboard --- */

/** Board filtered to the leads assigned to the caller. */
export function getCrmMyBoard(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<{ data: CrmBoard }>(`${CRM_ROOT}/kanban/my-board${query}`);
}

/** Static stage and substate catalog. */
export function getCrmStages() {
  return apiRequest<{ data: CrmStageCatalog[] }>(`${CRM_ROOT}/kanban/stages`);
}

export function getCrmStageLeads(stage: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<{ data: CrmLead[] }>(
    `${CRM_ROOT}/kanban/stages/${encodeURIComponent(stage)}/leads${query}`,
  );
}

export function getCrmStageCount(stage: string) {
  return apiRequest<{ data: { stage: string; count: number } }>(
    `${CRM_ROOT}/kanban/stages/${encodeURIComponent(stage)}/count`,
  );
}

/** Board summary. Same handler as /kanban/board. */
export function getCrmDashboard() {
  return apiRequest<{ data: CrmBoard }>(`${CRM_ROOT}/dashboard`);
}

/* --- Forms --- */

export function getCrmForm(id: string) {
  return apiRequest<{ data: CrmForm }>(`${CRM_ROOT}/forms/${id}`);
}

export function deleteCrmForm(id: string) {
  return apiRequest<void>(`${CRM_ROOT}/forms/${id}`, { method: 'DELETE' });
}

export function getCrmFormSubmissions(id: string) {
  return apiRequest<{ data: Array<Record<string, unknown>> }>(`${CRM_ROOT}/forms/${id}/submissions`);
}

/**
 * Unauthenticated enquiry submission.
 *
 * The only CRM route that needs no session. It cannot infer the institution from a
 * token, so the tenant slug is supplied explicitly; in production a public hostname
 * or gateway sets this header.
 */
export function submitPublicCrmForm(
  id: string,
  data: Record<string, unknown>,
  tenantId: string,
  attribution?: { campaignId?: string; idempotencyKey?: string },
) {
  return apiRequest<{ data: Record<string, unknown> }>(
    `${CRM_ROOT}/public/forms/${id}/submit`,
    {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ data, ...attribution }),
    },
    false,
  );
}

/* --- Communications --- */

export interface CrmCommunicationInput {
  leadId: string;
  templateKey?: string;
  subject?: string;
  content?: Record<string, unknown>;
  /** For calls: connected, not-answered, wrong-number, callback-requested. */
  outcome?: string;
}

/**
 * Records an outbound message.
 *
 * These persist to `crm.communications` and the transactional outbox. No provider
 * worker drains that outbox yet, so "queued" means stored, not delivered.
 */
export function sendCrmWhatsapp(input: CrmCommunicationInput) {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/communications/whatsapp`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function sendCrmEmail(input: CrmCommunicationInput) {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/communications/email`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logCrmCall(input: CrmCommunicationInput) {
  return apiRequest<{ data: CrmTimelineCommunication }>(`${CRM_ROOT}/communications/calls`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* --- Templates --- */

export interface CrmTemplateInput {
  templateKey: string;
  channel: string;
  name: string;
  content: string;
  language?: string;
}

export function getCrmTemplates() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>(`${CRM_ROOT}/templates`);
}

export function createCrmTemplate(input: CrmTemplateInput) {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/templates`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* --- Access and configuration --- */

/** Role catalog the CRM module recognises. */
export function getCrmRoles() {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/roles`);
}

export function getCrmCampaigns() {
  return apiRequest<{ data: Array<Record<string, unknown>> }>(`${CRM_ROOT}/campaigns`);
}

export interface CrmWorkflowToggleInput {
  fromStage: string;
  toStage: string;
  allowedRoles?: unknown;
  requiresApproval?: boolean;
  approvalRole?: string;
  enabled?: boolean;
}

export function setCrmWorkflowToggle(input: CrmWorkflowToggleInput) {
  return apiRequest<{ data: Record<string, unknown> }>(
    `${CRM_ROOT}/configuration/workflow-toggles`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

export interface CrmAutomationToggleInput {
  stage: string;
  triggerName: string;
  action: string;
  templateKey?: string;
  conditions?: unknown;
  enabled?: boolean;
}

export function setCrmAutomationToggle(input: CrmAutomationToggleInput) {
  return apiRequest<{ data: Record<string, unknown> }>(
    `${CRM_ROOT}/configuration/automation-toggles`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

/** CRM module liveness. Public. */
export function getCrmHealth() {
  return apiRequest<{ data: Record<string, unknown> }>(`${CRM_ROOT}/health`, undefined, false);
}
