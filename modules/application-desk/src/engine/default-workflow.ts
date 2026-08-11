/**
 * The default MVP workflow (§8, §46).
 *
 * Note on ordering: §8 lists student-number generation before approval, while
 * the state model (§27) and the worked example (§44) both generate the number
 * *after* approval succeeds. We follow §27/§44 — minting an institutional
 * identifier for a case that may still be rejected would burn sequence numbers
 * and leak identifiers for non-students. The number is therefore an effect of
 * STUDENT_CREATION.
 */

import type { DocumentRequirement } from "./types.ts";
import type { WorkflowDefinition, WorkflowStage } from "./workflow.ts";

export const DEFAULT_DOCUMENT_CHECKLIST: DocumentRequirement[] = [
  { type: "certificate-10", label: "10th Certificate", required: true },
  { type: "certificate-12", label: "12th Certificate", required: true },
  { type: "transfer-certificate", label: "Transfer Certificate", required: true },
  { type: "identity-proof", label: "Identity Proof", required: true },
  { type: "address-proof", label: "Address Proof", required: false },
  { type: "photo", label: "Passport Photo", required: true },
  { type: "admission-proof", label: "Admission Proof", required: true },
  { type: "category-certificate", label: "Category Certificate", required: false },
];

const STAGES: WorkflowStage[] = [
  { id: "NEW", label: "Case Created", sequence: 0, enabled: true, mandatory: true },
  {
    id: "DATA_REVIEW",
    label: "Applicant Data Review",
    sequence: 10,
    enabled: true,
    mandatory: true,
    assignedRole: "application-desk-officer",
  },
  {
    id: "IDENTITY_VERIFICATION",
    label: "Identity Verification",
    sequence: 20,
    enabled: true,
    mandatory: true,
    assignedRole: "application-desk-officer",
    guards: ["identityResolved"],
  },
  {
    id: "DOCUMENT_VERIFICATION",
    label: "Document Verification",
    sequence: 30,
    enabled: true,
    mandatory: true,
    assignedRole: "application-desk-officer",
    guards: ["mandatoryDocumentsSatisfied"],
  },
  {
    id: "ACADEMIC_MAPPING",
    label: "Academic Mapping",
    sequence: 40,
    enabled: true,
    mandatory: true,
    assignedRole: "academic-administrator",
    guards: ["academicMappingComplete"],
  },
  {
    id: "SECTION_ALLOCATION",
    label: "Section Allocation",
    sequence: 50,
    enabled: true,
    mandatory: true,
    assignedRole: "academic-administrator",
    guards: ["sectionAllocated"],
  },
  {
    id: "FINANCE_VERIFICATION",
    label: "Finance Verification",
    sequence: 60,
    enabled: true,
    mandatory: true,
    assignedRole: "finance-officer",
    guards: ["financeSettled"],
  },
  {
    id: "APPROVAL",
    label: "Approval",
    sequence: 70,
    enabled: true,
    mandatory: true,
    assignedRole: "registrar",
    guards: ["approvalsComplete"],
  },
  {
    id: "STUDENT_CREATION",
    label: "Student Master Creation",
    sequence: 80,
    enabled: true,
    mandatory: true,
    // Number first, then the student record that carries it.
    effects: ["generate_number", "create_student"],
  },
  {
    id: "ACCOUNT_PROVISIONING",
    label: "User Account Creation",
    sequence: 90,
    enabled: true,
    mandatory: true,
    effects: ["create_user"],
  },
  {
    id: "ACCESS_PROVISIONING",
    label: "Module Access Provisioning",
    sequence: 100,
    enabled: true,
    mandatory: true,
    effects: ["provision_access"],
  },
  {
    id: "ACTIVATION",
    label: "Activation & Welcome",
    sequence: 110,
    enabled: true,
    mandatory: true,
    effects: ["notify"],
  },
  { id: "COMPLETED", label: "Completed", sequence: 120, enabled: true, mandatory: true },
];

export function defaultWorkflow(tenantId: string): WorkflowDefinition {
  return {
    id: "application-desk-default",
    version: 1,
    tenantId,
    name: "Standard Admission Onboarding",
    stages: STAGES,
    // Sequence order covers the happy path; only exceptions need declaring.
    // `reject` needs no entry — it closes the case where it stands rather than
    // routing anywhere, so the old `APPROVAL -> APPROVAL` row said nothing.
    transitions: [
      // Bad imported data surfaces at document check; send it back for correction.
      { from: "DOCUMENT_VERIFICATION", action: "return", to: "DATA_REVIEW" },
    ],
    documentChecklist: DEFAULT_DOCUMENT_CHECKLIST,
    approvalChain: [
      { step: 1, role: "application-desk-officer" },
      { step: 2, role: "registrar" },
    ],
    expiryDays: 45,
  };
}

/**
 * International applicants need passport/visa checks the standard flow skips
 * (§43). Shown here to prove the same engine drives both without a code change.
 */
export function internationalWorkflow(tenantId: string): WorkflowDefinition {
  const base = defaultWorkflow(tenantId);
  return {
    ...base,
    id: "application-desk-international",
    name: "International Admission Onboarding",
    documentChecklist: [
      ...base.documentChecklist,
      { type: "passport", label: "Passport", required: true },
      { type: "visa", label: "Student Visa", required: true },
    ],
    approvalChain: [...base.approvalChain, { step: 3, role: "international-office" }],
  };
}
