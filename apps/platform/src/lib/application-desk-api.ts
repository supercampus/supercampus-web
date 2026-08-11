/**
 * Application Desk data layer.
 *
 * The onboarding API is not deployed yet, so this module talks to it when it is
 * reachable and otherwise falls back to an in-process demo store driven by the
 * *real* workflow engine. The fallback is reported through `source` so the desk
 * can say plainly that it is showing demo data rather than silently inventing
 * students.
 */

import {
  applyAction,
  createCase,
  defaultWorkflow,
  evaluateIntake,
  formatStudentNumber,
  inMemoryAllocator,
  sequenceScope,
  summariseQueues,
  type AdmissionTrigger,
  type ActionKind,
  type AuditEntry,
  type OnboardingCase,
  type OnboardingEvent,
  type OnboardingServices,
  type StageInput,
  type WorkflowDefinition,
} from '@supercampus/application-desk';
import { ApiRequestError, apiRequest } from './api';

/** Matches the `/v1/<module>` namespacing used by the CRM and authorization clients. */
const DESK_ROOT = '/v1/application-desk';

/** Statuses that mean "no real desk data exists here", not "you are forbidden". */
const FALLBACK_STATUSES = [401, 404, 503];

export type DeskSource = 'api' | 'demo';

export interface DeskSnapshot {
  source: DeskSource;
  definition: WorkflowDefinition;
  cases: OnboardingCase[];
  audit: AuditEntry[];
  events: OnboardingEvent[];
  queues: ReturnType<typeof summariseQueues>;
}

const TENANT = 'demo-tenant';

// -- demo store -------------------------------------------------------------

const allocator = inMemoryAllocator();

const DEMO_TRIGGERS: AdmissionTrigger[] = [
  {
    tenantId: TENANT, applicantId: 'APP-2026-00891', applicationId: 'APL-2026-00891',
    admissionId: 'ADM-2026-00452', admissionStatus: 'CONFIRMED', academicYear: '2026',
    admissionCategory: 'GENERAL', programId: 'prog-btech-cse', departmentId: 'dept-cse',
    campusId: 'campus-main', batchId: 'batch-2026', feePaid: true,
  },
  {
    tenantId: TENANT, applicantId: 'APP-2026-00892', applicationId: 'APL-2026-00892',
    admissionId: 'ADM-2026-00453', admissionStatus: 'CONFIRMED', academicYear: '2026',
    admissionCategory: 'GENERAL', programId: 'prog-btech-ece', departmentId: 'dept-ece',
    campusId: 'campus-main', batchId: 'batch-2026',
  },
  {
    tenantId: TENANT, applicantId: 'APP-2026-00893', applicationId: 'APL-2026-00893',
    admissionId: 'ADM-2026-00454', admissionStatus: 'CONFIRMED', academicYear: '2026',
    admissionCategory: 'INTERNATIONAL', programId: 'prog-btech-cse', departmentId: 'dept-cse',
    campusId: 'campus-main', batchId: 'batch-2026', feePaid: true,
  },
  {
    tenantId: TENANT, applicantId: 'APP-2026-00894', applicationId: 'APL-2026-00894',
    admissionId: 'ADM-2026-00455', admissionStatus: 'CONFIRMED', academicYear: '2026',
    admissionCategory: 'GENERAL', programId: 'prog-bba', departmentId: 'dept-mgmt',
    campusId: 'campus-main', batchId: 'batch-2026', feePaid: true,
  },
];

/** Applicant display names live in Admissions; mirrored here for the demo only. */
export const DEMO_APPLICANT_NAMES: Record<string, string> = {
  'APP-2026-00891': 'Aarav Menon',
  'APP-2026-00892': 'Fatima Rahman',
  'APP-2026-00893': 'Chen Wei',
  'APP-2026-00894': 'Divya Nair',
};

interface DemoStore {
  cases: OnboardingCase[];
  audit: AuditEntry[];
  events: OnboardingEvent[];
  definition: WorkflowDefinition;
  sequence: number;
}

let store: DemoStore | null = null;

function seedStore(): DemoStore {
  const definition = defaultWorkflow(TENANT);
  const cases: OnboardingCase[] = [];
  const createdAt = '2026-08-06T09:00:00.000Z';

  DEMO_TRIGGERS.forEach((trigger, index) => {
    const decision = evaluateIntake(trigger, cases);
    if (!decision.create) return;
    const onboarding = createCase(trigger, definition, {
      id: `ONB-2026-${String(145 + index).padStart(6, '0')}`,
      now: createdAt,
      assignedTo: 'officer-1',
    });

    // Spread the seeded cases across the queue so the dashboard is meaningful.
    switch (index) {
      case 0:
        cases.push({ ...onboarding, stage: 'DATA_REVIEW' });
        break;
      case 1:
        cases.push({
          ...onboarding,
          stage: 'DOCUMENT_VERIFICATION',
          identityMatch: 'NO_MATCH',
          documents: onboarding.documents.map((doc, position) => ({
            ...doc,
            state: position < 4 ? 'VERIFIED' : 'NOT_SUBMITTED',
          })),
        });
        break;
      case 2:
        cases.push({
          ...onboarding,
          stage: 'IDENTITY_VERIFICATION',
          identityMatch: 'POSSIBLE_MATCH',
        });
        break;
      default:
        cases.push({
          ...onboarding,
          stage: 'APPROVAL',
          identityMatch: 'NO_MATCH',
          documents: onboarding.documents.map((doc) => ({ ...doc, state: 'VERIFIED' })),
          academic: { ...onboarding.academic, sectionId: 'sec-a' },
          finance: 'CLEARED',
        });
    }
  });

  return { cases, audit: [], events: [], definition, sequence: 0 };
}

function demoStore(): DemoStore {
  store ??= seedStore();
  return store;
}

/**
 * Demo integration services. Student numbers still come from the shared
 * allocator + formatter, so the demo exercises the same numbering path as
 * production rather than a shortcut.
 */
function demoServices(): OnboardingServices {
  return {
    async generateStudentNumber(onboarding) {
      const department = (onboarding.academic.departmentId ?? 'gen').replace('dept-', '').toUpperCase();
      const year = onboarding.academicYear ?? '2026';
      const sequence = await allocator.next(sequenceScope(onboarding.tenantId, year, department));
      return formatStudentNumber({ year, departmentCode: department, sequence });
    },
    async createStudent(onboarding) {
      return `STU-${onboarding.id.slice(-6)}`;
    },
    async createUserAccount(onboarding) {
      return `USR-${onboarding.id.slice(-6)}`;
    },
    async provisionAccess() {},
    async notify() {},
  };
}

// -- public surface ---------------------------------------------------------

function snapshotOf(source: DeskSource, data: Omit<DeskSnapshot, 'source' | 'queues'>): DeskSnapshot {
  return { source, ...data, queues: summariseQueues(data.cases) };
}

export async function loadDesk(): Promise<DeskSnapshot> {
  try {
    const response = await apiRequest<{ data: Omit<DeskSnapshot, 'source' | 'queues'> }>(
      `${DESK_ROOT}/cases`,
    );
    return snapshotOf('api', response.data);
  } catch (error) {
    // 404/503: the onboarding API is not deployed yet. 401: no session at all.
    // Both mean "there is nothing real to show", so fall back to the demo store.
    // 403 is deliberately excluded — that is a genuine authorization answer from a
    // live endpoint and must surface as an error, not be papered over with demo data.
    if (error instanceof ApiRequestError && FALLBACK_STATUSES.includes(error.status)) {
      return snapshotOf('demo', demoStore());
    }
    throw error;
  }
}

export interface ActOnCaseInput {
  caseId: string;
  action: ActionKind;
  actor: string;
  reason?: string;
  /** Payload for casework actions — the identity result, document decision, … */
  input?: StageInput;
}

export interface ActOnCaseResult {
  ok: boolean;
  error?: string;
  snapshot: DeskSnapshot;
}

/**
 * Apply a workflow action. Against the demo store the engine runs in-process;
 * against the API the server runs the same engine and returns the new state.
 */
export async function actOnCase(input: ActOnCaseInput, source: DeskSource): Promise<ActOnCaseResult> {
  if (source === 'api') {
    const response = await apiRequest<{ data: Omit<DeskSnapshot, 'source' | 'queues'>; ok: boolean; error?: string }>(
      `${DESK_ROOT}/cases/${encodeURIComponent(input.caseId)}/actions`,
      {
        method: 'POST',
        body: JSON.stringify({ action: input.action, reason: input.reason, input: input.input }),
      },
    );
    return { ok: response.ok, error: response.error, snapshot: snapshotOf('api', response.data) };
  }

  const data = demoStore();
  const target = data.cases.find((entry) => entry.id === input.caseId);
  if (!target) return { ok: false, error: 'Case not found', snapshot: snapshotOf('demo', data) };

  const result = await applyAction(data.definition, target, input.action, {
    actor: input.actor,
    now: new Date().toISOString(),
    reason: input.reason,
    input: input.input,
    services: demoServices(),
  });

  data.cases = data.cases.map((entry) => (entry.id === result.case.id ? result.case : entry));
  data.audit = [...result.audit, ...data.audit];
  data.events = [...result.events, ...data.events];

  return { ok: result.ok, error: result.error, snapshot: snapshotOf('demo', data) };
}

/** Reset the demo store — used by the desk's "reseed" action. */
export function resetDemoDesk() {
  store = seedStore();
}
