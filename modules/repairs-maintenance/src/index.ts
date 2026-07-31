import { defineModule } from "@supercampus/module-sdk";
import { repairsMaintenanceWorkflowCatalog } from "./flows";

export const repairsmaintenanceModule = defineModule({
  key: "repairs-maintenance",
  version: "0.1.0",
  workflowCatalog: repairsMaintenanceWorkflowCatalog,
  navigation: [{
    id: "repairs-maintenance",
    label: "Repairs & Maintenance",
    route: "/dashboard/repairs-maintenance",
    requiredPermissions: ["repairs-maintenance.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("repairs-maintenance"),
});

export const repairsmaintenanceCapabilities = [
  "tickets",
  "assets",
  "assignments",
  "vendors",
  "reports",
] as const;

