/**
 * Workflow definition model + condition evaluator.
 *
 * The engine is data-driven: institutions describe stages, conditions and
 * transitions as configuration (§7, §29) rather than the engine hard-coding an
 * `if/else` chain per institution (§38).
 */

import type {
  DocumentRequirement,
  OnboardingCase,
  OnboardingStage,
} from "./types.ts";

export type ConditionOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "exists"
  | "empty";

export interface Condition {
  /** Dot path resolved against the case, e.g. `finance` or `academic.programId`. */
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

/** Named guards for checks that a field comparison cannot express. */
export type GuardKey =
  | "mandatoryDocumentsSatisfied"
  | "identityResolved"
  | "academicMappingComplete"
  | "sectionAllocated"
  | "financeSettled"
  | "approvalsComplete";

/**
 * What an operator can do to a case.
 *
 * Three families, and the distinction matters: `advance` *moves* a case,
 * casework *records the facts a guard is waiting for*, and the lifecycle
 * actions park or close it. Without the casework family the guards can only
 * ever refuse — nothing would be able to satisfy them, and a case created at
 * DATA_REVIEW could never reach COMPLETED.
 */
export type ActionKind =
  /** Forward movement: validate the current stage, run its effects, hand off. */
  | "advance"
  // -- casework: supply what a stage's guard is blocking on -------------------
  | "record_application"
  | "record_identity"
  | "review_document"
  | "map_academics"
  | "allocate_section"
  | "record_finance"
  | "approve"
  // -- lifecycle -------------------------------------------------------------
  | "reject"
  | "return"
  | "hold"
  | "resume"
  | "cancel"
  | "withdraw"
  | "expire";

/** Casework actions record data; they never move the case between stages. */
export const CASEWORK_ACTIONS = [
  "record_application",
  "record_identity",
  "review_document",
  "map_academics",
  "allocate_section",
  "record_finance",
  "approve",
] as const satisfies readonly ActionKind[];

export function isCaseworkAction(action: ActionKind): boolean {
  return (CASEWORK_ACTIONS as readonly string[]).includes(action);
}

export type EffectKind =
  | "generate_number"
  | "create_student"
  | "create_user"
  | "provision_access"
  | "notify";

export interface WorkflowStage {
  id: OnboardingStage;
  label: string;
  sequence: number;
  enabled: boolean;
  /** A disabled non-mandatory stage is skipped during traversal (§8). */
  mandatory: boolean;
  assignedRole?: string;
  /** All must pass before the stage may be left via `advance`. */
  guards?: GuardKey[];
  conditions?: Condition[];
  /** Side effects executed on successful exit, in order (§29). */
  effects?: EffectKind[];
}

export interface WorkflowTransition {
  from: OnboardingStage;
  action: ActionKind;
  to: OnboardingStage;
  when?: Condition[];
  guards?: GuardKey[];
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  tenantId: string;
  name: string;
  stages: WorkflowStage[];
  /** Explicit overrides; anything not listed falls back to sequence order. */
  transitions: WorkflowTransition[];
  documentChecklist: DocumentRequirement[];
  approvalChain: Array<{ step: number; role: string }>;
  /** Blank means the institution never auto-expires cases. */
  expiryDays?: number;
}

/** Resolve a dot path against an object without throwing on missing links. */
export function resolveField(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function compare(actual: unknown, operator: ConditionOperator, expected: unknown): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "ne":
      return actual !== expected;
    case "gt":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "gte":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lt":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "lte":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual as never);
    case "nin":
      return Array.isArray(expected) && !expected.includes(actual as never);
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "empty":
      return actual === undefined || actual === null || actual === "";
  }
}

export function evaluateCondition(onboarding: OnboardingCase, condition: Condition): boolean {
  return compare(resolveField(onboarding, condition.field), condition.operator, condition.value);
}

/** Conditions are conjunctive; an empty list is vacuously true (§28). */
export function evaluateConditions(
  onboarding: OnboardingCase,
  conditions: Condition[] = [],
): boolean {
  return conditions.every((condition) => evaluateCondition(onboarding, condition));
}

export function stageById(definition: WorkflowDefinition, stage: OnboardingStage) {
  return definition.stages.find((entry) => entry.id === stage);
}

/**
 * Next enabled stage in sequence order. Disabled stages are transparently
 * skipped so an institution can switch a stage off without rewiring
 * transitions (§7).
 */
export function nextStage(
  definition: WorkflowDefinition,
  from: OnboardingStage,
): OnboardingStage | undefined {
  const current = stageById(definition, from);
  if (!current) return undefined;
  return definition.stages
    .filter((stage) => stage.enabled && stage.sequence > current.sequence)
    .sort((a, b) => a.sequence - b.sequence)[0]?.id;
}
