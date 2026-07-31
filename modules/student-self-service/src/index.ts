import { defineModule } from "@supercampus/module-sdk";
import { studentSelfServiceWorkflowCatalog } from "./flows";

export const studentselfserviceModule = defineModule({
  key: "student-self-service",
  version: "0.1.0",
  workflowCatalog: studentSelfServiceWorkflowCatalog,
  navigation: [{
    id: "student-self-service",
    label: "Student Self Service",
    route: "/dashboard/student-self-service",
    requiredPermissions: ["student-self-service.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("student-self-service"),
});

export const studentselfserviceCapabilities = [
  "profile",
  "fees",
  "attendance",
  "requests",
  "documents",
] as const;

