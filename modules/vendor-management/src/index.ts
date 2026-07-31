import { defineModule } from "@supercampus/module-sdk";
import { vendorManagementWorkflowCatalog } from "./flows";

export const vendormanagementModule = defineModule({
  key: "vendor-management",
  version: "0.1.0",
  workflowCatalog: vendorManagementWorkflowCatalog,
  navigation: [{
    id: "vendor-management",
    label: "Vendor Management",
    route: "/dashboard/vendor-management",
    requiredPermissions: ["vendor-management.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("vendor-management"),
});

export const vendormanagementCapabilities = [
  "vendors",
  "contracts",
  "purchase-requests",
  "compliance",
  "payments",
] as const;

