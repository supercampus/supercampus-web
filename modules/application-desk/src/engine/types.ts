/**
 * Application Desk — core domain types.
 *
 * The Application Desk is an onboarding *orchestration* layer: it owns the
 * OnboardingCase and nothing else. Every other entity referenced here
 * (applicant, student, fee structure, user account) is owned by another module
 * and is referred to by id only. See docs/workflows/Application_Desk_Workflow.md §31.
 */

/** Forward pipeline position of a case. */
export type OnboardingStage =
  | "NEW"
  | "DATA_REVIEW"
  | "IDENTITY_VERIFICATION"
  | "DOCUMENT_VERIFICATION"
  | "ACADEMIC_MAPPING"
  | "SECTION_ALLOCATION"
  | "FINANCE_VERIFICATION"
  | "APPROVAL"
  | "STUDENT_CREATION"
  | "ACCOUNT_PROVISIONING"
  | "ACCESS_PROVISIONING"
  | "ACTIVATION"
  | "COMPLETED";

/**
 * Lifecycle of the case, tracked independently of `stage` so that a held or
 * returned case still remembers where it must resume (§25).
 *
 * REJECTED / CANCELLED / WITHDRAWN / EXPIRED are deliberately distinct — §26.
 */
export type OnboardingStatus =
  | "ACTIVE"
  | "ON_HOLD"
  | "RETURNED"
  | "REJECTED"
  | "CANCELLED"
  | "WITHDRAWN"
  | "EXPIRED"
  | "FAILED"
  | "COMPLETED";

/** Terminal statuses can never transition again. */
export const TERMINAL_STATUSES: readonly OnboardingStatus[] = [
  "REJECTED",
  "CANCELLED",
  "WITHDRAWN",
  "EXPIRED",
  "COMPLETED",
];

export type DocumentState =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "WAIVED";

/** A document counts as satisfied when verified outright or explicitly waived. */
export const SATISFIED_DOCUMENT_STATES: readonly DocumentState[] = ["VERIFIED", "WAIVED"];

export type FinanceState = "NOT_REQUIRED" | "PENDING" | "CLEARED" | "HOLD";

export type IdentityMatchKind = "NO_MATCH" | "POSSIBLE_MATCH" | "CONFIRMED_MATCH" | "DUPLICATE";

export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";

export interface DocumentRequirement {
  type: string;
  label: string;
  required: boolean;
}

export interface DocumentRecord {
  type: string;
  state: DocumentState;
  fileId?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
}

export interface AcademicMapping {
  campusId?: string;
  departmentId?: string;
  programId?: string;
  academicYear?: string;
  batchId?: string;
  semester?: number;
  sectionId?: string;
}

export interface ApprovalRecord {
  step: number;
  role: string;
  state: ApprovalState;
  actedBy?: string;
  actedAt?: string;
  comment?: string;
}

/**
 * The onboarding case — the workflow record. The Student Master is only
 * created once the workflow reaches STUDENT_CREATION (§6).
 */
export interface OnboardingCase {
  id: string;
  tenantId: string;
  applicantId: string;
  applicationId: string;
  admissionId: string;
  crmLeadId?: string;

  stage: OnboardingStage;
  status: OnboardingStatus;
  /** Stage to return to when a hold or return is resolved (§25). */
  resumeStage?: OnboardingStage;

  workflowId: string;
  workflowVersion: number;

  assignedTo?: string;
  academicYear?: string;
  admissionCategory?: string;

  identityMatch?: IdentityMatchKind;
  documents: DocumentRecord[];
  academic: AcademicMapping;
  finance: FinanceState;
  approvals: ApprovalRecord[];

  /** Populated only by the corresponding provisioning stages. */
  studentNumber?: string;
  studentId?: string;
  userAccountId?: string;
  accessProvisioned?: boolean;

  holdReason?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  /** Idempotency ledger: action key -> result reference (§34). */
  appliedEffects: Record<string, string>;

  /** Free-form institution fields addressed by workflow conditions. */
  attributes: Record<string, unknown>;
}

export interface AuditEntry {
  caseId: string;
  actor: string;
  action: string;
  fromStage: OnboardingStage;
  toStage: OnboardingStage;
  fromStatus: OnboardingStatus;
  toStatus: OnboardingStatus;
  timestamp: string;
  reason?: string;
}

/** Domain events other modules subscribe to (§33). */
export type OnboardingEventName =
  | "OnboardingCreated"
  | "IdentityVerified"
  | "DocumentsVerified"
  | "AcademicMappingCompleted"
  | "SectionAllocated"
  | "FinanceVerified"
  | "StudentNumberGenerated"
  | "StudentCreated"
  | "UserCreated"
  | "AccessProvisioned"
  | "StudentActivated"
  | "OnboardingCompleted"
  | "OnboardingHeld"
  | "OnboardingReturned"
  | "OnboardingRejected"
  /** Distinct from OnboardingFailed: an expiry is a deadline, not a breakage (§26). */
  | "OnboardingExpired"
  | "OnboardingFailed";

export interface OnboardingEvent {
  name: OnboardingEventName;
  caseId: string;
  tenantId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface OnboardingException {
  caseId: string;
  kind:
    | "DUPLICATE_APPLICANT"
    | "MISSING_DOCUMENT"
    | "INVALID_ACADEMIC_MAPPING"
    | "SECTION_UNAVAILABLE"
    | "FINANCE_HOLD"
    | "APPROVAL_REJECTED"
    | "PROVISIONING_FAILED";
  message: string;
  retryable: boolean;
}
