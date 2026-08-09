/**
 * Case intake (§9, §10) and the dashboard queue projection (§4).
 */

import type {
  DocumentRecord,
  OnboardingCase,
  OnboardingStage,
  OnboardingStatus,
} from "./types.ts";
import type { WorkflowDefinition } from "./workflow.ts";

/** The admission facts the desk copies in; source records stay authoritative. */
export interface AdmissionTrigger {
  tenantId: string;
  applicantId: string;
  applicationId: string;
  admissionId: string;
  crmLeadId?: string;
  admissionStatus: string;
  academicYear?: string;
  admissionCategory?: string;
  programId?: string;
  departmentId?: string;
  campusId?: string;
  batchId?: string;
  feePaid?: boolean;
}

export type IntakeTriggerMode = "on_confirmed" | "on_fee_paid" | "manual";

export interface IntakeDecision {
  create: boolean;
  reason: string;
  duplicateOf?: string;
}

/**
 * Decide whether a trigger should open a case.
 *
 * Duplicate protection checks applicant, application and admission ids against
 * live cases, and refuses if the applicant is already a student (§9).
 */
export function evaluateIntake(
  trigger: AdmissionTrigger,
  existing: readonly OnboardingCase[],
  mode: IntakeTriggerMode = "on_confirmed",
): IntakeDecision {
  if (mode === "on_confirmed" && trigger.admissionStatus !== "CONFIRMED") {
    return { create: false, reason: `Admission is ${trigger.admissionStatus}, not CONFIRMED` };
  }
  if (mode === "on_fee_paid" && !trigger.feePaid) {
    return { create: false, reason: "Admission fee has not been paid" };
  }

  const duplicate = existing.find(
    (entry) =>
      entry.applicantId === trigger.applicantId ||
      entry.applicationId === trigger.applicationId ||
      entry.admissionId === trigger.admissionId,
  );
  if (duplicate) {
    // A closed case must not block a legitimate re-admission.
    const closed: OnboardingStatus[] = ["REJECTED", "CANCELLED", "WITHDRAWN", "EXPIRED"];
    if (!closed.includes(duplicate.status)) {
      return {
        create: false,
        reason: `Applicant already has onboarding case ${duplicate.id} (${duplicate.status})`,
        duplicateOf: duplicate.id,
      };
    }
  }

  return { create: true, reason: "Eligible for onboarding" };
}

export interface CreateCaseOptions {
  id: string;
  now: string;
  assignedTo?: string;
}

/** Build a NEW case seeded from admission data (§10). */
export function createCase(
  trigger: AdmissionTrigger,
  definition: WorkflowDefinition,
  options: CreateCaseOptions,
): OnboardingCase {
  const documents: DocumentRecord[] = definition.documentChecklist.map((requirement) => ({
    type: requirement.type,
    state: "NOT_SUBMITTED",
  }));

  return {
    id: options.id,
    tenantId: trigger.tenantId,
    applicantId: trigger.applicantId,
    applicationId: trigger.applicationId,
    admissionId: trigger.admissionId,
    crmLeadId: trigger.crmLeadId,
    stage: "DATA_REVIEW",
    status: "ACTIVE",
    workflowId: definition.id,
    workflowVersion: definition.version,
    assignedTo: options.assignedTo,
    academicYear: trigger.academicYear,
    admissionCategory: trigger.admissionCategory,
    documents,
    academic: {
      campusId: trigger.campusId,
      departmentId: trigger.departmentId,
      programId: trigger.programId,
      academicYear: trigger.academicYear,
      batchId: trigger.batchId,
    },
    finance: trigger.feePaid ? "CLEARED" : "PENDING",
    approvals: definition.approvalChain.map((step) => ({
      step: step.step,
      role: step.role,
      state: "PENDING",
    })),
    createdAt: options.now,
    updatedAt: options.now,
    appliedEffects: {},
    attributes: {},
  };
}

export type QueueKey =
  | "new"
  | "pendingVerification"
  | "documentsPending"
  | "academicPending"
  | "financePending"
  | "approvalPending"
  | "readyForActivation"
  | "activated"
  | "onHold"
  | "rejected"
  | "failed";

/** Which dashboard bucket a case belongs to (§4). */
export function queueOf(onboarding: OnboardingCase): QueueKey {
  switch (onboarding.status) {
    case "ON_HOLD":
    case "RETURNED":
      return "onHold";
    case "REJECTED":
    case "CANCELLED":
    case "WITHDRAWN":
    case "EXPIRED":
      return "rejected";
    case "FAILED":
      return "failed";
    case "COMPLETED":
      return "activated";
    default:
      break;
  }

  const byStage: Partial<Record<OnboardingStage, QueueKey>> = {
    NEW: "new",
    DATA_REVIEW: "new",
    IDENTITY_VERIFICATION: "pendingVerification",
    DOCUMENT_VERIFICATION: "documentsPending",
    ACADEMIC_MAPPING: "academicPending",
    SECTION_ALLOCATION: "academicPending",
    FINANCE_VERIFICATION: "financePending",
    APPROVAL: "approvalPending",
  };
  return byStage[onboarding.stage] ?? "readyForActivation";
}

export function summariseQueues(cases: readonly OnboardingCase[]): Record<QueueKey, number> {
  const counts: Record<QueueKey, number> = {
    new: 0,
    pendingVerification: 0,
    documentsPending: 0,
    academicPending: 0,
    financePending: 0,
    approvalPending: 0,
    readyForActivation: 0,
    activated: 0,
    onHold: 0,
    rejected: 0,
    failed: 0,
  };
  for (const entry of cases) counts[queueOf(entry)] += 1;
  return counts;
}

/** Average completed-onboarding duration in hours (§4 metrics). */
export function averageOnboardingHours(cases: readonly OnboardingCase[]): number | null {
  const completed = cases.filter((entry) => entry.completedAt);
  if (completed.length === 0) return null;
  const total = completed.reduce((sum, entry) => {
    const started = Date.parse(entry.createdAt);
    const finished = Date.parse(entry.completedAt as string);
    return sum + Math.max(0, finished - started);
  }, 0);
  return Math.round((total / completed.length / 3_600_000) * 10) / 10;
}
