import { defineModule } from "@supercampus/module-sdk";
import { parentsSelfServiceWorkflowCatalog } from "./flows";

export const parentsselfserviceModule = defineModule({
  key: "parents-self-service",
  version: "0.1.0",
  workflowCatalog: parentsSelfServiceWorkflowCatalog,
  navigation: [{
    id: "parents-self-service",
    label: "Parents Self Service",
    route: "/dashboard/parents-self-service",
    requiredPermissions: ["parents-self-service.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("parents-self-service"),
});

export const parentsselfserviceCapabilities = [
  "student-profile",
  "fees",
  "attendance",
  "notices",
  "communication",
] as const;

