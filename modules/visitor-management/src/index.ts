import { defineModule } from "@supercampus/module-sdk";
import { visitorManagementWorkflowCatalog } from "./flows";

export const visitormanagementModule = defineModule({
  key: "visitor-management",
  version: "0.1.0",
  workflowCatalog: visitorManagementWorkflowCatalog,
  navigation: [{
    id: "visitor-management",
    label: "Visitor Management",
    route: "/dashboard/visitor-management",
    requiredPermissions: ["visitor-management.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("visitor-management"),
});

export const visitormanagementCapabilities = [
  "visitor-log",
  "appointments",
  "badges",
  "host-approval",
  "reports",
] as const;

