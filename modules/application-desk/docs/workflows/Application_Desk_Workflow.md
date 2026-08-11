# Application Desk — Dynamic Onboarding Workflow

## Purpose

The Application Desk is the bridge between the Admissions module and the
operational SuperCampus system. It converts a **confirmed admitted applicant**
into a valid SuperCampus student and user account, under controlled,
tenant-configurable rules.

It must never create a student blindly.

## Position in the admissions flow

```text
Admission Confirmed
        ↓
APPLICATION DESK
        ↓
Student Master → User Account → Module Access
```

The desk begins *after* an applicant is admitted/confirmed. It does not
duplicate the admission pipeline.

## Core principle

The Application Desk is an **onboarding orchestration layer**. It owns the
`OnboardingCase` and nothing else. Every other record — applicant, student,
fee structure, user account — is owned by the module named in *Ownership of
data* below, and is referenced by id.

## Default MVP workflow

```text
Admission Trigger → Onboarding Case → Applicant Data Review
→ Identity Verification → Document Verification → Academic Mapping
→ Section Allocation → Finance Verification → Approval
→ Student Number + Student Master → User Account → Module Access
→ Welcome Communication → Completed
```

Stages can be disabled, reordered or made approval-based through configuration;
the engine skips disabled stages during traversal rather than requiring the
transition table to be rewired.

### Ordering note

The narrative spec lists student-number generation *before* approval, while the
state model and the worked example both generate it *after* approval succeeds.
The implementation follows the latter: minting an institutional identifier for a
case that may still be rejected would burn sequence numbers and leak identifiers
for people who never become students. Generation is an effect of
`STUDENT_CREATION`.

## State model

Stage (pipeline position) and status (lifecycle) are tracked separately so a
held case still remembers where to resume.

```text
Stage:  NEW → DATA_REVIEW → IDENTITY_VERIFICATION → DOCUMENT_VERIFICATION
        → ACADEMIC_MAPPING → SECTION_ALLOCATION → FINANCE_VERIFICATION
        → APPROVAL → STUDENT_CREATION → ACCOUNT_PROVISIONING
        → ACCESS_PROVISIONING → ACTIVATION → COMPLETED

Status: ACTIVE | ON_HOLD | RETURNED | REJECTED | CANCELLED
        | WITHDRAWN | EXPIRED | FAILED | COMPLETED
```

`REJECTED`, `CANCELLED`, `WITHDRAWN` and `EXPIRED` are deliberately distinct —
they are not interchangeable.

## Actions

Actions fall into three families, and the split is load-bearing. Guards can only
ever *refuse*; something has to be able to satisfy them. That is casework.

| Family | Actions | Effect on the case |
|---|---|---|
| Movement | `advance` | Validates the current stage, runs its effects, hands off to the next enabled stage |
| Casework | `record_identity`, `review_document`, `map_academics`, `allocate_section`, `record_finance`, `approve` | Records the facts a guard is waiting for. Never changes stage or status |
| Lifecycle | `hold`, `resume`, `return`, `reject`, `cancel`, `withdraw`, `expire` | Parks or closes the case |

Casework carries a `StageInput` payload and refuses when it is missing, so a
malformed request cannot appear to succeed while changing nothing. It is
permitted while a case is `ON_HOLD` or `RETURNED` — a hold usually exists
*because* a document is outstanding, so the document has to be recordable before
the case can resume.

`approve` signs one step of the approval chain, in order: step 2 is refused
until step 1 is `APPROVED`, so the registrar cannot sign ahead of the officer.
Rejecting an approval is not a step state — it is `reject` on the case.

## Transition model

```text
Current Stage + Action + Conditions → Next Stage
```

Conditions are declarative field comparisons (`field`, `operator`, `value`).
Checks that a field comparison cannot express are named **guards**:

| Guard | Blocks until |
|---|---|
| `identityResolved` | match is `NO_MATCH` or `CONFIRMED_MATCH`; duplicates hard-block |
| `mandatoryDocumentsSatisfied` | every required checklist item is `VERIFIED` or `WAIVED` |
| `academicMappingComplete` | program, department, academic year and batch resolved |
| `sectionAllocated` | a section is assigned |
| `financeSettled` | finance is `CLEARED` or `NOT_REQUIRED` (`HOLD` blocks) |
| `approvalsComplete` | every configured approval step is `APPROVED` |

Guards collect *all* failures rather than short-circuiting, so a parallel gate
reports everything outstanding at once.

## Duplicate protection

Before a case is created, the desk checks applicant id, application id and
admission id against live cases. Closed cases (rejected/cancelled/withdrawn/
expired) do not block a legitimate re-admission.

## Idempotency

Every side effect is keyed `<caseId>:<effect>`. Replaying a transition reuses
the original student number, student id and account id rather than minting new
ones. This matters most for student creation, account creation and number
generation.

## Hold, return and resume

A hold records reason, owner and resume condition, and stores the stage to
return to. Resuming continues from that stage — never from the beginning. A hold
leaves the stage untouched, and a case cannot be held twice.

A **return** is different: it is the one side action that means "go back to stage
X", so it is routed through the transition table. `DOCUMENT_VERIFICATION +
return → DATA_REVIEW` sends the case back for correction and resumes there.
Closures leave the stage alone — a rejected case is rejected where it stood.

## Expiry

`expiryDays` on the workflow defines how long an open case may sit. `isExpired`
is the predicate a scheduled sweep uses to pick cases for the `expire` action;
a held case is deliberately parked, so it never lapses. An expiry emits
`OnboardingExpired`, not `OnboardingFailed` — a missed deadline is not a system
breakage.

## Ownership of data

| Data | Primary owner |
|---|---|
| Application, admission decision | Admissions |
| Onboarding case | Application Desk |
| Student Master | Core Administration |
| Academic enrollment | Academic Management |
| Fee structure, payments | Fees & Finance |
| User account, permissions | Identity / Users & Roles |
| Documents | Document Management |

The desk orchestrates these areas; it does not become their permanent owner.

## Events

`OnboardingCreated`, `IdentityVerified`, `DocumentsVerified`,
`AcademicMappingCompleted`, `SectionAllocated`, `FinanceVerified`,
`StudentNumberGenerated`, `StudentCreated`, `UserCreated`, `AccessProvisioned`,
`StudentActivated`, `OnboardingCompleted`, `OnboardingHeld`,
`OnboardingReturned`, `OnboardingRejected`, `OnboardingExpired`,
`OnboardingFailed`.

Casework emits no domain event: recording a document is data capture, while
`DocumentsVerified` means the *stage* completed, which only `advance` does.

Downstream modules subscribe rather than being called directly, which keeps the
desk from absorbing every downstream business process.

## Permissions

```text
application-desk.view      .create   .edit     .verify   .assign
application-desk.approve   .reject   .hold     .resume   .activate
application-desk.manage_settings     .reports.read
```

These are not interchangeable, so the permission follows the work rather than
the action name. Advancing out of `APPROVAL` requires `.approve`; advancing out
of the provisioning stages requires `.activate`; everything else requires
`.verify`. Section allocation requires `.assign` and academic mapping `.edit`.
If a single grant authorised every forward move, splitting verification,
approval and activation between teams would be decorative.

## Completion definition

The desk is functionally complete when a confirmed admitted applicant can flow
end-to-end into an activated SuperCampus student with a user account and module
access, with a full audit trail and no duplicate records.
