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
  SATISFIED_DOCUMENT_STATES,
  TERMINAL_STATUSES,
  type AcademicMapping,
  type AuditEntry,
  type DocumentState,
  type FinanceState,
  type IdentityMatchKind,
  type OnboardingCase,
  type OnboardingEvent,
  type OnboardingEventName,
  type OnboardingException,
  type OnboardingStage,
  type OnboardingStatus,
} from "./types.ts";
import {
  evaluateConditions,
  isCaseworkAction,
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

/**
 * The payload a casework action carries. Each action reads exactly one field
 * and refuses if it is missing, so a malformed request cannot quietly succeed
 * while changing nothing.
 */
export interface StageInput {
  /** `record_identity` — the outcome of the duplicate search. */
  identityMatch?: IdentityMatchKind;
  /** `review_document` — one checklist item's verification outcome. */
  document?: { type: string; state: DocumentState; fileId?: string; reason?: string; expiresAt?: string };
  /** `map_academics` — the academic fields resolved by Academic Management. */
  academic?: Partial<AcademicMapping>;
  /** `allocate_section` — the section Academic Management assigned. */
  sectionId?: string;
  /** `record_finance` — the state Fees & Finance reported. */
  finance?: FinanceState;
  /** `approve` — which chain step is being signed, and any comment. */
  approval?: { step?: number; comment?: string };
}

export interface EngineContext {
  actor: string;
  /** ISO timestamp injected by the caller — the engine stays clock-free. */
  now: string;
  reason?: string;
  /** Payload for casework actions; ignored by `advance` and the lifecycle. */
  input?: StageInput;
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

/**
 * Move a case to a side status without losing where it must resume (§25).
 *
 * A `return` is the one side action that means "go back to stage X", so it is
 * routed through the transition table — `DOCUMENT_VERIFICATION + return ->
 * DATA_REVIEW` sends the case back for correction and resumes there. Holds and
 * closures leave the stage alone: a rejected case is rejected *where it was*.
 */
function sideTransition(
  definition: WorkflowDefinition,
  onboarding: OnboardingCase,
  action: ActionKind,
  status: OnboardingStatus,
  eventName: OnboardingEventName,
  context: EngineContext,
): TransitionResult {
  const routed =
    action === "return"
      ? definition.transitions.find(
          (transition) => transition.from === onboarding.stage && transition.action === "return",
        )?.to
      : undefined;
  const stage = routed ?? onboarding.stage;

  const after: OnboardingCase = {
    ...onboarding,
    stage,
    status,
    // A routed return resumes where it was sent, not where it was caught.
    resumeStage: routed ?? onboarding.resumeStage ?? onboarding.stage,
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

/** Record casework without moving the case, and audit who recorded it. */
function recorded(
  onboarding: OnboardingCase,
  patch: Partial<OnboardingCase>,
  action: ActionKind,
  context: EngineContext,
): TransitionResult {
  const after: OnboardingCase = { ...onboarding, ...patch, updatedAt: context.now };
  return { ok: true, case: after, events: [], audit: [audit(onboarding, after, action, context)] };
}

/**
 * Casework: record the facts the guards are waiting for.
 *
 * These are deliberately allowed while a case is ON_HOLD or RETURNED — a hold
 * usually exists *because* a document is outstanding, so the document has to be
 * recordable before the case can be resumed. Terminal cases are already refused
 * by the caller. No domain event fires here: the stage-completion events
 * (`IdentityVerified`, `DocumentsVerified`, …) belong to `advance`, which is
 * what actually completes a stage.
 */
function applyCasework(
  definition: WorkflowDefinition,
  onboarding: OnboardingCase,
  action: ActionKind,
  context: EngineContext,
): TransitionResult {
  const input = context.input ?? {};

  switch (action) {
    case "record_identity": {
      if (!input.identityMatch) return refuse(onboarding, "No identity match result supplied");
      return recorded(onboarding, { identityMatch: input.identityMatch }, action, context);
    }

    case "review_document": {
      const decision = input.document;
      if (!decision) return refuse(onboarding, "No document decision supplied");
      const requirement = definition.documentChecklist.find((entry) => entry.type === decision.type);
      if (!requirement) {
        return refuse(onboarding, `${decision.type} is not on the document checklist`);
      }
      const settled = SATISFIED_DOCUMENT_STATES.includes(decision.state);
      const documents = onboarding.documents.some((entry) => entry.type === decision.type)
        ? onboarding.documents.map((entry) =>
            entry.type === decision.type
              ? {
                  ...entry,
                  state: decision.state,
                  fileId: decision.fileId ?? entry.fileId,
                  verifiedBy: settled ? context.actor : undefined,
                  verifiedAt: settled ? context.now : undefined,
                  rejectionReason: decision.state === "REJECTED" ? decision.reason : undefined,
                  expiresAt: decision.expiresAt ?? entry.expiresAt,
                }
              : entry,
          )
        : // A checklist item added after the case was created has no record yet.
          [
            ...onboarding.documents,
            {
              type: decision.type,
              state: decision.state,
              fileId: decision.fileId,
              verifiedBy: settled ? context.actor : undefined,
              verifiedAt: settled ? context.now : undefined,
              rejectionReason: decision.state === "REJECTED" ? decision.reason : undefined,
              expiresAt: decision.expiresAt,
            },
          ];
      return recorded(onboarding, { documents }, action, context);
    }

    case "map_academics": {
      const mapping = input.academic;
      if (!mapping || Object.keys(mapping).length === 0) {
        return refuse(onboarding, "No academic mapping supplied");
      }
      return recorded(onboarding, { academic: { ...onboarding.academic, ...mapping } }, action, context);
    }

    case "allocate_section": {
      if (!input.sectionId) return refuse(onboarding, "No section supplied");
      return recorded(
        onboarding,
        { academic: { ...onboarding.academic, sectionId: input.sectionId } },
        action,
        context,
      );
    }

    case "record_finance": {
      if (!input.finance) return refuse(onboarding, "No finance state supplied");
      return recorded(onboarding, { finance: input.finance }, action, context);
    }

    case "approve": {
      if (definition.approvalChain.length === 0) {
        return refuse(onboarding, "This workflow has no approval chain");
      }
      const ordered = [...onboarding.approvals].sort((a, b) => a.step - b.step);
      const requested = input.approval?.step;
      const target =
        requested === undefined
          ? ordered.find((entry) => entry.state === "PENDING" || entry.state === "RETURNED")
          : ordered.find((entry) => entry.step === requested);

      if (!target) {
        return refuse(
          onboarding,
          requested === undefined
            ? "Every approval step is already signed"
            : `Approval step ${requested} is not part of this case`,
        );
      }
      if (target.state === "APPROVED") {
        return refuse(onboarding, `Approval step ${target.step} is already approved`);
      }
      // Chains are ordered: the registrar does not sign before the officer.
      const earlier = ordered.find((entry) => entry.step < target.step && entry.state !== "APPROVED");
      if (earlier) {
        return refuse(
          onboarding,
          `Approval step ${earlier.step} (${earlier.role}) must be signed first`,
        );
      }

      const approvals = onboarding.approvals.map((entry) =>
        entry.step === target.step
          ? {
              ...entry,
              state: "APPROVED" as const,
              actedBy: context.actor,
              actedAt: context.now,
              comment: input.approval?.comment ?? context.reason,
            }
          : entry,
      );
      return recorded(onboarding, { approvals }, action, context);
    }

    default:
      return refuse(onboarding, `${action} is not a casework action`);
  }
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

  if (isCaseworkAction(action)) return applyCasework(definition, onboarding, action, context);

  switch (action) {
    case "hold":
      if (onboarding.status === "ON_HOLD" || onboarding.status === "RETURNED") {
        return refuse(onboarding, `Case is already ${onboarding.status}`);
      }
      return sideTransition(definition, onboarding, action, "ON_HOLD", "OnboardingHeld", context);
    case "return":
      return sideTransition(definition, onboarding, action, "RETURNED", "OnboardingReturned", context);
    case "reject":
      return sideTransition(definition, onboarding, action, "REJECTED", "OnboardingRejected", context);
    case "cancel":
      return sideTransition(definition, onboarding, action, "CANCELLED", "OnboardingRejected", context);
    case "withdraw":
      return sideTransition(definition, onboarding, action, "WITHDRAWN", "OnboardingRejected", context);
    case "expire":
      // An expiry is a missed deadline, not a system failure — distinct event (§26).
      return sideTransition(definition, onboarding, action, "EXPIRED", "OnboardingExpired", context);
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
