import { defineModule } from "@supercampus/module-sdk";
import { analyticsWorkflowCatalog } from "./flows";

export const analyticsModule = defineModule({
  key: "analytics",
  version: "0.1.0",
  workflowCatalog: analyticsWorkflowCatalog,
  navigation: [{
    id: "analytics",
    label: "Analytics & BI",
    route: "/dashboard/analytics",
    requiredPermissions: ["analytics.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("analytics"),
});

export const analyticsCapabilities = [
  "dashboards",
  "reports",
  "metrics",
  "exports",
  "insights",
] as const;

