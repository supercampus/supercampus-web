/**
 * Named guards. Each answers one question about a case and returns a reason
 * when it blocks, so the desk can show the operator *why* a stage will not
 * advance instead of a bare "not allowed".
 */

import { SATISFIED_DOCUMENT_STATES, type OnboardingCase } from "./types.ts";
import type { GuardKey, WorkflowDefinition } from "./workflow.ts";

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

const OK: GuardResult = { ok: true };

function block(reason: string): GuardResult {
  return { ok: false, reason };
}

/** Every mandatory document from the checklist is VERIFIED or WAIVED (§13). */
function mandatoryDocumentsSatisfied(
  onboarding: OnboardingCase,
  _definition: WorkflowDefinition,
): GuardResult {
  const outstanding = onboarding.documents
    .filter((record) => record.required && !SATISFIED_DOCUMENT_STATES.includes(record.state));
  if (outstanding.length === 0) return OK;
  return block(
    `${outstanding.length} mandatory document(s) outstanding: ${outstanding
      .map((record) => record.label ?? record.type)
      .join(", ")}`,
  );
}

/** A duplicate must never proceed; a possible match needs a human first (§12). */
function identityResolved(onboarding: OnboardingCase): GuardResult {
  switch (onboarding.identityMatch) {
    case "NO_MATCH":
    case "CONFIRMED_MATCH":
      return OK;
    case "POSSIBLE_MATCH":
      return block("Possible identity match awaiting manual review");
    case "DUPLICATE":
      return block("Applicant is a confirmed duplicate — onboarding blocked");
    default:
      return block("Identity verification has not been run");
  }
}

/** Academic structure must be fully resolved before allocation (§14). */
function academicMappingComplete(onboarding: OnboardingCase): GuardResult {
  const missing = (["programId", "departmentId", "academicYear", "batchId"] as const).filter(
    (key) => !onboarding.academic[key],
  );
  if (missing.length === 0) return OK;
  return block(`Academic mapping incomplete: ${missing.join(", ")}`);
}

function sectionAllocated(onboarding: OnboardingCase): GuardResult {
  return onboarding.academic.sectionId ? OK : block("Section has not been allocated");
}

/** Institutions may allow creation before clearance; only HOLD hard-blocks (§16). */
function financeSettled(onboarding: OnboardingCase): GuardResult {
  switch (onboarding.finance) {
    case "CLEARED":
    case "NOT_REQUIRED":
      return OK;
    case "PENDING":
      return block("Finance verification is still pending");
    case "HOLD":
      return block("Case is on a finance hold");
  }
}

/** Every configured approval step has been APPROVED (§18). */
function approvalsComplete(
  onboarding: OnboardingCase,
  definition: WorkflowDefinition,
): GuardResult {
  if (definition.approvalChain.length === 0) return OK;
  const outstanding = definition.approvalChain.filter((step) => {
    const record = onboarding.approvals.find((entry) => entry.step === step.step);
    return !record || record.state !== "APPROVED";
  });
  if (outstanding.length === 0) return OK;
  return block(
    `Awaiting approval from: ${outstanding.map((step) => step.role).join(", ")}`,
  );
}

const GUARDS: Record<
  GuardKey,
  (onboarding: OnboardingCase, definition: WorkflowDefinition) => GuardResult
> = {
  mandatoryDocumentsSatisfied,
  identityResolved,
  academicMappingComplete,
  sectionAllocated,
  financeSettled,
  approvalsComplete,
};

/**
 * Run guards and collect *every* failure rather than short-circuiting — a
 * parallel stage gate should tell the operator all of what is outstanding at
 * once (§42).
 */
export function runGuards(
  onboarding: OnboardingCase,
  definition: WorkflowDefinition,
  keys: GuardKey[] = [],
): GuardResult {
  const reasons = keys
    .map((key) => GUARDS[key](onboarding, definition))
    .filter((result) => !result.ok)
    .map((result) => result.reason ?? "blocked");
  return reasons.length === 0 ? OK : { ok: false, reason: reasons.join("; ") };
}
