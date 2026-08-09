import { defineModule } from "@supercampus/module-sdk";
import { applicationDeskWorkflowCatalog } from "./flows.ts";

export const applicationDeskModule = defineModule({
  key: "application-desk",
  version: "0.1.0",
  workflowCatalog: applicationDeskWorkflowCatalog,
  navigation: [
    {
      id: "application-desk",
      label: "Application Desk",
      route: "/dashboard/application-desk",
      requiredPermissions: ["application-desk.view"],
    },
  ],
  canActivate: (context) =>
    context.enabledModules.includes("application-desk") &&
    // The desk is meaningless without an admissions source to draw from (§5).
    context.enabledModules.includes("admissions"),
});

export const applicationDeskCapabilities = [
  "admission-handoff",
  "onboarding-orchestration",
  "identity-resolution",
  "document-verification",
  "academic-mapping",
  "section-allocation",
  "finance-verification",
  "approval-chain",
  "student-number-generation",
  "student-provisioning",
  "access-provisioning",
] as const;

export * from "./engine/types.ts";
export * from "./engine/workflow.ts";
export * from "./engine/guards.ts";
export * from "./engine/engine.ts";
export * from "./engine/default-workflow.ts";
export * from "./engine/intake.ts";
export * from "./engine/numbering.ts";
