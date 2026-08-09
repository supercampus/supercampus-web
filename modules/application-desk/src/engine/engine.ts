/**
 * The onboarding workflow engine.
 *
 * Implements the backend processing pattern of §38:
 *
 *   Load workflow -> load case -> evaluate conditions -> validate stage
 *   -> execute effects -> persist state -> audit -> emit events -> next stage
 *
 * Two properties are deliberate:
 *
 *  - **Deterministic.** The engine never reads the clock or generates ids
 *    itself; `now` and the integration services come in through `EngineContext`.
 *    That keeps it unit-testable and keeps retries reproducible.
 *  - **Idempotent.** Every effect is keyed by the onboarding id, so replaying an
 *    action can never create a second student or a second account (§34).
 */

import { runGuards } from "./guards.ts";
import {
  TERMINAL_STATUSES,
  type AuditEntry,
  type OnboardingCase,
  type OnboardingEvent,
  type OnboardingEventName,
  type OnboardingException,
  type OnboardingStage,
  type OnboardingStatus,
} from "./types.ts";
import {
  evaluateConditions,
  nextStage,
  stageById,
  type ActionKind,
  type EffectKind,
  type WorkflowDefinition,
} from "./workflow.ts";

/**
 * Integration boundary (§32, §39). The desk *requests* work from owning
 * modules; it never writes their tables directly.
 */
export interface OnboardingServices {
  generateStudentNumber(onboarding: OnboardingCase, definition: WorkflowDefinition): Promise<string>;
  createStudent(onboarding: OnboardingCase): Promise<string>;
  createUserAccount(onboarding: OnboardingCase): Promise<string>;
  provisionAccess(onboarding: OnboardingCase): Promise<void>;
  notify(onboarding: OnboardingCase, template: string): Promise<void>;
}

export interface EngineContext {
  actor: string;
  /** ISO timestamp injected by the caller — the engine stays clock-free. */
  now: string;
  reason?: string;
  services: OnboardingServices;
}

export interface TransitionResult {
  ok: boolean;
  case: OnboardingCase;
  events: OnboardingEvent[];
  audit: AuditEntry[];
  exception?: OnboardingException;
  /** Populated when the action was refused; the case is returned unchanged. */
  error?: string;
}

const STAGE_EVENT: Partial<Record<OnboardingStage, OnboardingEventName>> = {
  IDENTITY_VERIFICATION: "IdentityVerified",
  DOCUMENT_VERIFICATION: "DocumentsVerified",
  ACADEMIC_MAPPING: "AcademicMappingCompleted",
  SECTION_ALLOCATION: "SectionAllocated",
  FINANCE_VERIFICATION: "FinanceVerified",
  STUDENT_CREATION: "StudentCreated",
  ACCOUNT_PROVISIONING: "UserCreated",
  ACCESS_PROVISIONING: "AccessProvisioned",
  ACTIVATION: "StudentActivated",
};

function event(
  onboarding: OnboardingCase,
  name: OnboardingEventName,
  timestamp: string,
  payload: Record<string, unknown> = {},
): OnboardingEvent {
  return { name, caseId: onboarding.id, tenantId: onboarding.tenantId, timestamp, payload };
}

function audit(
  before: OnboardingCase,
  after: OnboardingCase,
  action: string,
  context: EngineContext,
): AuditEntry {
  return {
    caseId: before.id,
    actor: context.actor,
    action,
    fromStage: before.stage,
    toStage: after.stage,
    fromStatus: before.status,
    toStatus: after.status,
    timestamp: context.now,
    reason: context.reason,
  };
}

function refuse(onboarding: OnboardingCase, error: string): TransitionResult {
  return { ok: false, case: onboarding, events: [], audit: [], error };
}

/** Idempotency key for one effect on one case (§34). */
export function effectKey(onboarding: OnboardingCase, effect: EffectKind): string {
  return `${onboarding.id}:${effect}`;
}

/**
 * Run a stage's effects. Each is skipped when its idempotency key is already
 * present, so a retried transition reuses the original student number, student
 * id and account id rather than minting new ones.
 */
async function runEffects(
  onboarding: OnboardingCase,
  definition: WorkflowDefinition,
  effects: EffectKind[],
  context: EngineContext,
): Promise<{ case: OnboardingCase; events: OnboardingEvent[]; exception?: OnboardingException }> {
  let draft = onboarding;
  const events: OnboardingEvent[] = [];

  for (const effect of effects) {
    const key = effectKey(draft, effect);
    if (draft.appliedEffects[key]) continue;

    try {
      switch (effect) {
        case "generate_number": {
          const studentNumber = await context.services.generateStudentNumber(draft, definition);
          draft = {
            ...draft,
            studentNumber,
            appliedEffects: { ...draft.appliedEffects, [key]: studentNumber },
          };
          events.push(event(draft, "StudentNumberGenerated", context.now, { studentNumber }));
          break;
        }
        case "create_student": {
          const studentId = await context.services.createStudent(draft);
          draft = {
            ...draft,
            studentId,
            appliedEffects: { ...draft.appliedEffects, [key]: studentId },
          };
          break;
        }
        case "create_user": {
          const userAccountId = await context.services.createUserAccount(draft);
          draft = {
            ...draft,
            userAccountId,
            appliedEffects: { ...draft.appliedEffects, [key]: userAccountId },
          };
          break;
        }
        case "provision_access": {
          await context.services.provisionAccess(draft);
          draft = {
            ...draft,
            accessProvisioned: true,
            appliedEffects: { ...draft.appliedEffects, [key]: "provisioned" },
          };
          break;
        }
        case "notify": {
          await context.services.notify(draft, "onboarding.welcome");
          draft = { ...draft, appliedEffects: { ...draft.appliedEffects, [key]: "sent" } };
          break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        case: { ...draft, status: "FAILED" },
        events: [...events, event(draft, "OnboardingFailed", context.now, { effect, message })],
        exception: {
          caseId: draft.id,
          kind: "PROVISIONING_FAILED",
          message: `${effect} failed: ${message}`,
          retryable: true,
        },
      };
    }
  }

  return { case: draft, events };
}

/** Move a case to a side status without losing where it must resume (§25). */
function sideTransition(
  onboarding: OnboardingCase,
  status: OnboardingStatus,
  eventName: OnboardingEventName,
  context: EngineContext,
): TransitionResult {
  const after: OnboardingCase = {
    ...onboarding,
    status,
    resumeStage: onboarding.resumeStage ?? onboarding.stage,
    holdReason: status === "ON_HOLD" ? context.reason : onboarding.holdReason,
    rejectionReason:
      status === "REJECTED" || status === "CANCELLED" ? context.reason : onboarding.rejectionReason,
    updatedAt: context.now,
  };
  return {
    ok: true,
    case: after,
    events: [event(after, eventName, context.now, { reason: context.reason })],
    audit: [audit(onboarding, after, status, context)],
  };
}

/**
 * Apply an action to a case.
 *
 * `advance` is the forward move: it validates the current stage's conditions
 * and guards, runs its effects, then hands off to the next enabled stage.
 * Everything else is a lifecycle action (hold/resume/reject/...).
 */
export async function applyAction(
  definition: WorkflowDefinition,
  onboarding: OnboardingCase,
  action: ActionKind,
  context: EngineContext,
): Promise<TransitionResult> {
  if (TERMINAL_STATUSES.includes(onboarding.status)) {
    return refuse(onboarding, `Case is ${onboarding.status} and can no longer transition`);
  }

  switch (action) {
    case "hold":
      return sideTransition(onboarding, "ON_HOLD", "OnboardingHeld", context);
    case "return":
      return sideTransition(onboarding, "RETURNED", "OnboardingReturned", context);
    case "reject":
      return sideTransition(onboarding, "REJECTED", "OnboardingRejected", context);
    case "cancel":
      return sideTransition(onboarding, "CANCELLED", "OnboardingRejected", context);
    case "withdraw":
      return sideTransition(onboarding, "WITHDRAWN", "OnboardingRejected", context);
    case "expire":
      return sideTransition(onboarding, "EXPIRED", "OnboardingFailed", context);
    case "resume": {
      if (onboarding.status !== "ON_HOLD" && onboarding.status !== "RETURNED") {
        return refuse(onboarding, "Only held or returned cases can be resumed");
      }
      // Resume from the last valid stage rather than restarting (§25).
      const after: OnboardingCase = {
        ...onboarding,
        status: "ACTIVE",
        stage: onboarding.resumeStage ?? onboarding.stage,
        resumeStage: undefined,
        holdReason: undefined,
        updatedAt: context.now,
      };
      return {
        ok: true,
        case: after,
        events: [],
        audit: [audit(onboarding, after, "resume", context)],
      };
    }
    default:
      break;
  }

  // -- forward movement -----------------------------------------------------
  if (onboarding.status !== "ACTIVE") {
    return refuse(onboarding, `Case is ${onboarding.status}; resume it before advancing`);
  }

  const current = stageById(definition, onboarding.stage);
  if (!current) return refuse(onboarding, `Stage ${onboarding.stage} is not in workflow ${definition.id}`);
  if (!current.enabled) return refuse(onboarding, `Stage ${current.label} is disabled`);

  if (!evaluateConditions(onboarding, current.conditions)) {
    return refuse(onboarding, `Stage conditions for ${current.label} are not satisfied`);
  }

  const guard = runGuards(onboarding, definition, current.guards);
  if (!guard.ok) return refuse(onboarding, guard.reason ?? "Stage guards failed");

  const applicable = definition.transitions.find(
    (transition) =>
      transition.from === onboarding.stage &&
      transition.action === action &&
      evaluateConditions(onboarding, transition.when) &&
      runGuards(onboarding, definition, transition.guards).ok,
  );

  const target = applicable?.to ?? nextStage(definition, onboarding.stage);
  if (!target) return refuse(onboarding, `No transition available from ${current.label}`);

  const effectResult = await runEffects(onboarding, definition, current.effects ?? [], context);
  if (effectResult.exception) {
    return {
      ok: false,
      case: { ...effectResult.case, updatedAt: context.now },
      events: effectResult.events,
      audit: [audit(onboarding, effectResult.case, `${action}:failed`, context)],
      exception: effectResult.exception,
      error: effectResult.exception.message,
    };
  }

  const completed = target === "COMPLETED";
  const after: OnboardingCase = {
    ...effectResult.case,
    stage: target,
    status: completed ? "COMPLETED" : "ACTIVE",
    updatedAt: context.now,
    completedAt: completed ? context.now : effectResult.case.completedAt,
  };

  const events = [...effectResult.events];
  const stageEvent = STAGE_EVENT[onboarding.stage];
  if (stageEvent) events.push(event(after, stageEvent, context.now));
  if (completed) {
    events.push(
      event(after, "OnboardingCompleted", context.now, {
        studentId: after.studentId,
        studentNumber: after.studentNumber,
      }),
    );
  }

  return { ok: true, case: after, events, audit: [audit(onboarding, after, action, context)] };
}
