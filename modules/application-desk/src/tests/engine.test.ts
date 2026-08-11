import assert from "node:assert/strict";
import test from "node:test";

import { applyAction, type OnboardingServices } from "../engine/engine.ts";
import { defaultWorkflow } from "../engine/default-workflow.ts";
import {
  createCase,
  evaluateIntake,
  isExpired,
  queueOf,
  summariseQueues,
  type AdmissionTrigger,
} from "../engine/intake.ts";
import {
  DEFAULT_NUMBER_FORMAT,
  formatStudentNumber,
  inMemoryAllocator,
  sequenceScope,
} from "../engine/numbering.ts";
import type { OnboardingCase } from "../engine/types.ts";

const NOW = "2026-08-08T10:00:00.000Z";
const TENANT = "tenant-1";

const TRIGGER: AdmissionTrigger = {
  tenantId: TENANT,
  applicantId: "APP-2026-00891",
  applicationId: "APL-2026-00891",
  admissionId: "ADM-2026-00452",
  admissionStatus: "CONFIRMED",
  academicYear: "2026",
  programId: "prog-btech-cse",
  departmentId: "dept-cse",
  campusId: "campus-main",
  batchId: "batch-2026",
};

/** Counting services so tests can assert effects ran exactly once. */
function services() {
  const calls = { number: 0, student: 0, user: 0, access: 0, notify: 0 };
  const impl: OnboardingServices = {
    async generateStudentNumber() {
      calls.number += 1;
      return `2026CSE${String(calls.number).padStart(3, "0")}`;
    },
    async createStudent() {
      calls.student += 1;
      return `STU-${calls.student}`;
    },
    async createUserAccount() {
      calls.user += 1;
      return `USR-${calls.user}`;
    },
    async provisionAccess() {
      calls.access += 1;
    },
    async notify() {
      calls.notify += 1;
    },
  };
  return { impl, calls };
}

function context(overrides: Partial<{ actor: string; reason: string }> = {}) {
  return { actor: "officer-1", now: NOW, services: services().impl, ...overrides };
}

/** A case with every guard satisfied, parked at `stage`. */
function readyCase(stage: OnboardingCase["stage"]): OnboardingCase {
  const definition = defaultWorkflow(TENANT);
  const base = createCase(TRIGGER, definition, { id: "ONB-2026-000145", now: NOW });
  return {
    ...base,
    stage,
    identityMatch: "NO_MATCH",
    documents: base.documents.map((doc) => ({ ...doc, state: "VERIFIED" as const })),
    academic: { ...base.academic, sectionId: "sec-a" },
    finance: "CLEARED",
    approvals: base.approvals.map((entry) => ({ ...entry, state: "APPROVED" as const })),
  };
}

// -- intake -----------------------------------------------------------------

test("intake refuses admissions that are not confirmed", () => {
  const decision = evaluateIntake({ ...TRIGGER, admissionStatus: "PENDING" }, []);
  assert.equal(decision.create, false);
  assert.match(decision.reason, /not CONFIRMED/);
});

test("intake blocks a duplicate applicant but allows re-admission after a closed case", () => {
  const definition = defaultWorkflow(TENANT);
  const existing = createCase(TRIGGER, definition, { id: "ONB-1", now: NOW });

  const blocked = evaluateIntake(TRIGGER, [existing]);
  assert.equal(blocked.create, false);
  assert.equal(blocked.duplicateOf, "ONB-1");

  const reopened = evaluateIntake(TRIGGER, [{ ...existing, status: "WITHDRAWN" }]);
  assert.equal(reopened.create, true, "a withdrawn case must not block re-admission");
});

test("intake honours the fee-paid trigger mode", () => {
  assert.equal(evaluateIntake(TRIGGER, [], "on_fee_paid").create, false);
  assert.equal(evaluateIntake({ ...TRIGGER, feePaid: true }, [], "on_fee_paid").create, true);
});

// -- guards -----------------------------------------------------------------

test("a duplicate identity hard-blocks the workflow", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = { ...readyCase("IDENTITY_VERIFICATION"), identityMatch: "DUPLICATE" as const };
  const result = await applyAction(definition, onboarding, "advance", context());
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /duplicate/i);
  assert.equal(result.case.stage, "IDENTITY_VERIFICATION", "a refused action must not move the case");
});

test("document verification reports every outstanding mandatory document at once", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = readyCase("DOCUMENT_VERIFICATION");
  const blocked: OnboardingCase = {
    ...onboarding,
    documents: onboarding.documents.map((doc) =>
      doc.type === "photo" || doc.type === "identity-proof"
        ? { ...doc, state: "NOT_SUBMITTED" as const }
        : doc,
    ),
  };
  const result = await applyAction(definition, blocked, "advance", context());
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /Identity Proof/);
  assert.match(result.error ?? "", /Passport Photo/);
});

test("a waived document satisfies the checklist", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = readyCase("DOCUMENT_VERIFICATION");
  const waived: OnboardingCase = {
    ...onboarding,
    documents: onboarding.documents.map((doc) =>
      doc.type === "transfer-certificate" ? { ...doc, state: "WAIVED" as const } : doc,
    ),
  };
  const result = await applyAction(definition, waived, "advance", context());
  assert.equal(result.ok, true);
});

test("a finance hold blocks but a not-required fee structure does not", async () => {
  const definition = defaultWorkflow(TENANT);
  const held = await applyAction(
    definition,
    { ...readyCase("FINANCE_VERIFICATION"), finance: "HOLD" },
    "advance",
    context(),
  );
  assert.equal(held.ok, false);

  const exempt = await applyAction(
    definition,
    { ...readyCase("FINANCE_VERIFICATION"), finance: "NOT_REQUIRED" },
    "advance",
    context(),
  );
  assert.equal(exempt.ok, true);
});

test("approval chain must be fully approved before student creation", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = readyCase("APPROVAL");
  const partial: OnboardingCase = {
    ...onboarding,
    approvals: onboarding.approvals.map((entry) =>
      entry.step === 2 ? { ...entry, state: "PENDING" as const } : entry,
    ),
  };
  const result = await applyAction(definition, partial, "advance", context());
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /registrar/);
});

// -- effects and idempotency -----------------------------------------------

test("student creation generates a number and a student exactly once on retry", async () => {
  const definition = defaultWorkflow(TENANT);
  const { impl, calls } = services();
  const ctx = { actor: "officer-1", now: NOW, services: impl };

  const first = await applyAction(definition, readyCase("STUDENT_CREATION"), "advance", ctx);
  assert.equal(first.ok, true);
  assert.equal(first.case.studentNumber, "2026CSE001");
  assert.equal(first.case.studentId, "STU-1");

  // Replaying the same transition on the produced case must not mint again.
  const replay = await applyAction(
    definition,
    { ...first.case, stage: "STUDENT_CREATION" },
    "advance",
    ctx,
  );
  assert.equal(replay.ok, true);
  assert.equal(replay.case.studentNumber, "2026CSE001", "student number must be stable across retries");
  assert.equal(replay.case.studentId, "STU-1");
  assert.equal(calls.number, 1, "number generation must run once");
  assert.equal(calls.student, 1, "student creation must run once");
});

test("a failing integration marks the case FAILED and raises a retryable exception", async () => {
  const definition = defaultWorkflow(TENANT);
  const failing: OnboardingServices = {
    async generateStudentNumber() {
      return "2026CSE001";
    },
    async createStudent() {
      throw new Error("student service unavailable");
    },
    async createUserAccount() {
      return "USR-1";
    },
    async provisionAccess() {},
    async notify() {},
  };

  const result = await applyAction(definition, readyCase("STUDENT_CREATION"), "advance", {
    actor: "officer-1",
    now: NOW,
    services: failing,
  });

  assert.equal(result.ok, false);
  assert.equal(result.case.status, "FAILED");
  assert.equal(result.exception?.kind, "PROVISIONING_FAILED");
  assert.equal(result.exception?.retryable, true);
  // The number was already allocated, so a retry must reuse it rather than burn another.
  assert.equal(result.case.studentNumber, "2026CSE001");
  assert.ok(result.events.some((entry) => entry.name === "OnboardingFailed"));
});

// -- lifecycle --------------------------------------------------------------

test("hold records the resume stage and resume returns to it, not to the start", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = readyCase("ACADEMIC_MAPPING");

  const held = await applyAction(definition, onboarding, "hold", {
    ...context(),
    reason: "Transfer Certificate pending",
  });
  assert.equal(held.case.status, "ON_HOLD");
  assert.equal(held.case.resumeStage, "ACADEMIC_MAPPING");
  assert.equal(held.case.holdReason, "Transfer Certificate pending");

  const resumed = await applyAction(definition, held.case, "resume", context());
  assert.equal(resumed.case.status, "ACTIVE");
  assert.equal(resumed.case.stage, "ACADEMIC_MAPPING");
  assert.equal(resumed.case.resumeStage, undefined);
});

test("a held case cannot advance until it is resumed", async () => {
  const definition = defaultWorkflow(TENANT);
  const held = await applyAction(definition, readyCase("ACADEMIC_MAPPING"), "hold", context());
  const result = await applyAction(definition, held.case, "advance", context());
  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /resume it before advancing/);
});

test("terminal statuses refuse every further transition", async () => {
  const definition = defaultWorkflow(TENANT);
  const rejected = await applyAction(definition, readyCase("APPROVAL"), "reject", context());
  assert.equal(rejected.case.status, "REJECTED");

  for (const action of ["advance", "resume", "hold"] as const) {
    const result = await applyAction(definition, rejected.case, action, context());
    assert.equal(result.ok, false, `${action} must be refused on a rejected case`);
  }
});

test("rejected, cancelled and withdrawn stay distinct states", async () => {
  const definition = defaultWorkflow(TENANT);
  const ctx = context();
  const rejected = await applyAction(definition, readyCase("APPROVAL"), "reject", ctx);
  const cancelled = await applyAction(definition, readyCase("APPROVAL"), "cancel", ctx);
  const withdrawn = await applyAction(definition, readyCase("APPROVAL"), "withdraw", ctx);
  assert.equal(rejected.case.status, "REJECTED");
  assert.equal(cancelled.case.status, "CANCELLED");
  assert.equal(withdrawn.case.status, "WITHDRAWN");
});

// -- traversal --------------------------------------------------------------

test("a disabled stage is skipped without rewiring transitions", async () => {
  const base = defaultWorkflow(TENANT);
  const definition = {
    ...base,
    stages: base.stages.map((stage) =>
      stage.id === "SECTION_ALLOCATION" ? { ...stage, enabled: false } : stage,
    ),
  };
  const onboarding = readyCase("ACADEMIC_MAPPING");
  const result = await applyAction(definition, onboarding, "advance", context());
  assert.equal(result.ok, true);
  assert.equal(result.case.stage, "FINANCE_VERIFICATION", "disabled stage must be skipped");
});

test("the full happy path reaches COMPLETED with a student, account and access", async () => {
  const definition = defaultWorkflow(TENANT);
  const { impl, calls } = services();
  const ctx = { actor: "officer-1", now: NOW, services: impl };

  let onboarding = readyCase("DATA_REVIEW");
  const seen: string[] = [];

  for (let step = 0; step < 20 && onboarding.status === "ACTIVE"; step += 1) {
    const result = await applyAction(definition, onboarding, "advance", ctx);
    assert.equal(result.ok, true, `stage ${onboarding.stage} failed: ${result.error}`);
    seen.push(...result.events.map((entry) => entry.name));
    onboarding = result.case;
  }

  assert.equal(onboarding.status, "COMPLETED");
  assert.equal(onboarding.stage, "COMPLETED");
  assert.ok(onboarding.studentNumber, "a student number must be assigned");
  assert.ok(onboarding.studentId, "a Student Master must exist");
  assert.ok(onboarding.userAccountId, "a user account must exist");
  assert.equal(onboarding.accessProvisioned, true);
  assert.equal(onboarding.completedAt, NOW);

  assert.ok(seen.includes("StudentCreated"));
  assert.ok(seen.includes("UserCreated"));
  assert.ok(seen.includes("AccessProvisioned"));
  assert.ok(seen.includes("OnboardingCompleted"));
  assert.equal(calls.student, 1);
  assert.equal(calls.user, 1);
});

test("every transition produces an audit entry with both endpoints", async () => {
  const definition = defaultWorkflow(TENANT);
  const result = await applyAction(definition, readyCase("DATA_REVIEW"), "advance", {
    ...context(),
    reason: "reviewed",
  });
  const [entry] = result.audit;
  assert.equal(entry.actor, "officer-1");
  assert.equal(entry.fromStage, "DATA_REVIEW");
  assert.equal(entry.toStage, "IDENTITY_VERIFICATION");
  assert.equal(entry.reason, "reviewed");
  assert.equal(entry.timestamp, NOW);
});

// -- casework ---------------------------------------------------------------
//
// Every test above starts from `readyCase`, which hand-satisfies every guard.
// That hid the real gap: nothing in the system could *satisfy* a guard. These
// tests start from a genuine intake case and do the work.

/** A freshly created case: nothing verified, nothing mapped, nothing signed. */
function freshCase(): OnboardingCase {
  const definition = defaultWorkflow(TENANT);
  return createCase({ ...TRIGGER, feePaid: true }, definition, { id: "ONB-2026-000145", now: NOW });
}

test("a case created from an admission can be walked to COMPLETED by an operator", async () => {
  const definition = defaultWorkflow(TENANT);
  const { impl, calls } = services();
  const base = { actor: "officer-1", now: NOW, services: impl };
  let onboarding = freshCase();

  const run = async (action: Parameters<typeof applyAction>[2], input?: unknown) => {
    const result = await applyAction(definition, onboarding, action, {
      ...base,
      input: input as never,
    });
    assert.equal(result.ok, true, `${action} at ${onboarding.stage} failed: ${result.error}`);
    onboarding = result.case;
    return result;
  };

  // Data review needs no casework.
  await run("advance");
  assert.equal(onboarding.stage, "IDENTITY_VERIFICATION");

  // Identity: the duplicate search comes back clean.
  await run("record_identity", { identityMatch: "NO_MATCH" });
  await run("advance");
  assert.equal(onboarding.stage, "DOCUMENT_VERIFICATION");

  // Documents: verify each mandatory item, waive one that does not apply.
  for (const requirement of definition.documentChecklist.filter((entry) => entry.required)) {
    await run("review_document", {
      document: {
        type: requirement.type,
        state: requirement.type === "transfer-certificate" ? "WAIVED" : "VERIFIED",
      },
    });
  }
  await run("advance");
  assert.equal(onboarding.stage, "ACADEMIC_MAPPING");

  // Academic mapping arrived with the admission, so this stage is already clear.
  await run("advance");
  assert.equal(onboarding.stage, "SECTION_ALLOCATION");

  await run("allocate_section", { sectionId: "sec-a" });
  await run("advance");
  assert.equal(onboarding.stage, "FINANCE_VERIFICATION");

  // The fee was paid at intake, so finance is already CLEARED.
  await run("advance");
  assert.equal(onboarding.stage, "APPROVAL");

  // Approval chain: officer, then registrar.
  await run("approve", { approval: { comment: "checked" } });
  await run("approve");
  assert.deepEqual(
    onboarding.approvals.map((entry) => entry.state),
    ["APPROVED", "APPROVED"],
  );
  await run("advance");
  assert.equal(onboarding.stage, "STUDENT_CREATION");

  await run("advance");
  await run("advance");
  await run("advance");
  await run("advance");

  assert.equal(onboarding.stage, "COMPLETED");
  assert.equal(onboarding.status, "COMPLETED");
  assert.ok(onboarding.studentNumber, "a student number must be assigned");
  assert.ok(onboarding.studentId, "a Student Master must exist");
  assert.ok(onboarding.userAccountId, "a user account must exist");
  assert.equal(onboarding.accessProvisioned, true);
  assert.equal(calls.number, 1);
  assert.equal(calls.student, 1);
});

test("recording identity unblocks the stage that was refusing to advance", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = { ...freshCase(), stage: "IDENTITY_VERIFICATION" as const };

  const blocked = await applyAction(definition, onboarding, "advance", context());
  assert.equal(blocked.ok, false);
  assert.match(blocked.error ?? "", /has not been run/);

  const recorded = await applyAction(definition, onboarding, "record_identity", {
    ...context(),
    input: { identityMatch: "NO_MATCH" },
  });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.case.identityMatch, "NO_MATCH");
  assert.equal(recorded.case.stage, "IDENTITY_VERIFICATION", "casework must not move the case");

  const cleared = await applyAction(definition, recorded.case, "advance", context());
  assert.equal(cleared.ok, true);
  assert.equal(cleared.case.stage, "DOCUMENT_VERIFICATION");
});

test("casework refuses when its payload is missing or off-checklist", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = freshCase();

  const noPayload = await applyAction(definition, onboarding, "record_identity", context());
  assert.equal(noPayload.ok, false);
  assert.match(noPayload.error ?? "", /No identity match/);

  const unknownDocument = await applyAction(definition, onboarding, "review_document", {
    ...context(),
    input: { document: { type: "birth-certificate", state: "VERIFIED" } },
  });
  assert.equal(unknownDocument.ok, false);
  assert.match(unknownDocument.error ?? "", /not on the document checklist/);

  const noSection = await applyAction(definition, onboarding, "allocate_section", context());
  assert.equal(noSection.ok, false);
});

test("a verified document records who verified it and when", async () => {
  const definition = defaultWorkflow(TENANT);
  const result = await applyAction(definition, freshCase(), "review_document", {
    ...context(),
    input: { document: { type: "photo", state: "VERIFIED" } },
  });
  const record = result.case.documents.find((entry) => entry.type === "photo");
  assert.equal(record?.state, "VERIFIED");
  assert.equal(record?.verifiedBy, "officer-1");
  assert.equal(record?.verifiedAt, NOW);
});

test("a rejected document keeps its reason and stops satisfying the checklist", async () => {
  const definition = defaultWorkflow(TENANT);
  const verified = await applyAction(definition, readyCase("DOCUMENT_VERIFICATION"), "review_document", {
    ...context(),
    input: { document: { type: "photo", state: "REJECTED", reason: "Unreadable scan" } },
  });
  const record = verified.case.documents.find((entry) => entry.type === "photo");
  assert.equal(record?.rejectionReason, "Unreadable scan");
  assert.equal(record?.verifiedBy, undefined, "a rejection must not be recorded as a verification");

  const blocked = await applyAction(definition, verified.case, "advance", context());
  assert.equal(blocked.ok, false);
  assert.match(blocked.error ?? "", /Passport Photo/);
});

test("the approval chain must be signed in order", async () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = { ...freshCase(), stage: "APPROVAL" as const };

  const outOfOrder = await applyAction(definition, onboarding, "approve", {
    ...context(),
    input: { approval: { step: 2 } },
  });
  assert.equal(outOfOrder.ok, false);
  assert.match(outOfOrder.error ?? "", /step 1 \(application-desk-officer\) must be signed first/);

  const first = await applyAction(definition, onboarding, "approve", { ...context(), input: {} });
  assert.equal(first.ok, true);
  assert.equal(first.case.approvals[0]?.state, "APPROVED");
  assert.equal(first.case.approvals[0]?.actedBy, "officer-1");
  assert.equal(first.case.approvals[1]?.state, "PENDING");

  const again = await applyAction(definition, first.case, "approve", {
    ...context(),
    input: { approval: { step: 1 } },
  });
  assert.equal(again.ok, false);
  assert.match(again.error ?? "", /already approved/);

  const second = await applyAction(definition, first.case, "approve", context());
  assert.equal(second.ok, true);
  const exhausted = await applyAction(definition, second.case, "approve", context());
  assert.equal(exhausted.ok, false);
  assert.match(exhausted.error ?? "", /already signed/);
});

test("casework is allowed while a case is on hold, which is how holds get cleared", async () => {
  const definition = defaultWorkflow(TENANT);
  const held = await applyAction(definition, { ...freshCase(), stage: "DOCUMENT_VERIFICATION" }, "hold", {
    ...context(),
    reason: "Transfer Certificate outstanding",
  });
  assert.equal(held.case.status, "ON_HOLD");

  const verified = await applyAction(definition, held.case, "review_document", {
    ...context(),
    input: { document: { type: "transfer-certificate", state: "VERIFIED" } },
  });
  assert.equal(verified.ok, true, "the document that caused the hold must be recordable");
  assert.equal(verified.case.status, "ON_HOLD", "recording must not silently resume the case");

  const resumed = await applyAction(definition, verified.case, "resume", context());
  assert.equal(resumed.case.status, "ACTIVE");
  assert.equal(resumed.case.stage, "DOCUMENT_VERIFICATION");
});

// -- routing and lifecycle --------------------------------------------------

test("a return routes through the transition table instead of parking in place", async () => {
  const definition = defaultWorkflow(TENANT);
  const returned = await applyAction(definition, readyCase("DOCUMENT_VERIFICATION"), "return", {
    ...context(),
    reason: "Date of birth does not match the certificate",
  });

  assert.equal(returned.case.status, "RETURNED");
  assert.equal(returned.case.stage, "DATA_REVIEW", "the configured return target must be honoured");
  assert.equal(returned.case.resumeStage, "DATA_REVIEW");

  const resumed = await applyAction(definition, returned.case, "resume", context());
  assert.equal(resumed.case.status, "ACTIVE");
  assert.equal(resumed.case.stage, "DATA_REVIEW", "correction restarts at the stage it was sent to");
});

test("a hold leaves the stage alone and cannot be applied twice", async () => {
  const definition = defaultWorkflow(TENANT);
  const held = await applyAction(definition, readyCase("APPROVAL"), "hold", context());
  assert.equal(held.case.stage, "APPROVAL");

  const again = await applyAction(definition, held.case, "hold", context());
  assert.equal(again.ok, false);
  assert.match(again.error ?? "", /already ON_HOLD/);
});

test("an expiry is reported as an expiry, not as a failure", async () => {
  const definition = defaultWorkflow(TENANT);
  const result = await applyAction(definition, readyCase("DATA_REVIEW"), "expire", context());
  assert.equal(result.case.status, "EXPIRED");
  assert.ok(
    result.events.some((entry) => entry.name === "OnboardingExpired"),
    "EXPIRED and FAILED are deliberately distinct states",
  );
});

test("expiry is measured against the workflow's configured window", () => {
  const definition = defaultWorkflow(TENANT);
  const onboarding = freshCase();
  assert.equal(isExpired(onboarding, definition, "2026-09-01T10:00:00.000Z"), false);
  assert.equal(isExpired(onboarding, definition, "2026-10-01T10:00:00.000Z"), true);
  assert.equal(
    isExpired({ ...onboarding, status: "ON_HOLD" }, definition, "2026-10-01T10:00:00.000Z"),
    false,
    "a deliberate hold is not an accidental lapse",
  );
  assert.equal(isExpired(onboarding, { ...definition, expiryDays: undefined }, "2030-01-01T00:00:00.000Z"), false);
});

// -- projections and numbering ---------------------------------------------

test("queue projection buckets cases by stage and status", () => {
  assert.equal(queueOf(readyCase("DOCUMENT_VERIFICATION")), "documentsPending");
  assert.equal(queueOf(readyCase("APPROVAL")), "approvalPending");
  assert.equal(queueOf({ ...readyCase("APPROVAL"), status: "ON_HOLD" }), "onHold");
  assert.equal(queueOf({ ...readyCase("APPROVAL"), status: "COMPLETED" }), "activated");
  assert.equal(queueOf({ ...readyCase("APPROVAL"), status: "FAILED" }), "failed");

  const counts = summariseQueues([
    readyCase("DOCUMENT_VERIFICATION"),
    readyCase("APPROVAL"),
    { ...readyCase("APPROVAL"), status: "ON_HOLD" },
  ]);
  assert.equal(counts.documentsPending, 1);
  assert.equal(counts.approvalPending, 1);
  assert.equal(counts.onHold, 1);
});

test("student number format is configuration, not code", () => {
  assert.equal(
    formatStudentNumber({ year: "2026", departmentCode: "CSE", sequence: 1 }, DEFAULT_NUMBER_FORMAT),
    "2026CSE001",
  );
  assert.equal(
    formatStudentNumber(
      { year: "26", departmentCode: "CS", sequence: 1 },
      { pattern: ["prefix", "year", "department", "sequence"], prefix: "SC", separator: "/", sequenceWidth: 3 },
    ),
    "SC/26/CS/001",
  );
});

test("sequence allocation never repeats a number within a scope", async () => {
  const allocator = inMemoryAllocator();
  const scope = sequenceScope(TENANT, "2026", "CSE");
  const issued = await Promise.all(Array.from({ length: 50 }, () => allocator.next(scope)));
  assert.equal(new Set(issued).size, 50, "every allocated sequence must be unique");

  // A different department restarts its own sequence.
  assert.equal(await allocator.next(sequenceScope(TENANT, "2026", "MEC")), 1);
});
