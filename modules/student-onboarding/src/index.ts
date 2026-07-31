import { defineModule } from "@supercampus/module-sdk";
import { studentOnboardingWorkflowCatalog } from "./flows";

export const studentonboardingModule = defineModule({
  key: "student-onboarding",
  version: "0.1.0",
  workflowCatalog: studentOnboardingWorkflowCatalog,
  navigation: [{
    id: "student-onboarding",
    label: "Student Onboarding",
    route: "/dashboard/student-onboarding",
    requiredPermissions: ["student-onboarding.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("student-onboarding"),
});

export const studentonboardingCapabilities = [
  "admission-handoff",
  "profile-creation",
  "documents",
  "fee-start",
  "erp-sync",
] as const;

