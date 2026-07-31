import { defineModule } from "@supercampus/module-sdk";
import { noDueWorkflowCatalog } from "./flows";

export const nodueModule = defineModule({
  key: "no-due",
  version: "0.1.0",
  workflowCatalog: noDueWorkflowCatalog,
  navigation: [{
    id: "no-due",
    label: "No Due Management",
    route: "/dashboard/no-due",
    requiredPermissions: ["no-due.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("no-due"),
});

export const nodueCapabilities = [
  "clearance",
  "department-checks",
  "approvals",
  "certificates",
  "reports",
] as const;

