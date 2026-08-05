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
}

export interface CrmBoardStage {
  key: string;
  order: number;
  substates: string[];
  count: number;
  leads: CrmLead[];
}

export interface CrmBoard {
  pipeline: { key: string; name: string };
  scope: 'all' | 'assigned';
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
) {
  return apiRequest<{
    data: {
      id: string;
      formId: string;
      formVersion: number;
      leadId: string | null;
      createdLeadId?: string;
      data: Record<string, unknown>;
      createdAt: string;
    };
  }>(`${CRM_ROOT}/forms/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ data, leadId }),
  });
}
