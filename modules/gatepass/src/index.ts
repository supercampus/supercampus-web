import { defineModule } from "@supercampus/module-sdk";
import { gatepassWorkflowCatalog } from "./flows";

export const gatepassModule = defineModule({
  key: "gatepass",
  version: "0.1.0",
  workflowCatalog: gatepassWorkflowCatalog,
  navigation: [{
    id: "gatepass",
    label: "Gate Pass",
    route: "/dashboard/gatepass",
    requiredPermissions: ["gatepass.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("gatepass"),
});

export const gatepassCapabilities = [
  "passes",
  "approvals",
  "qr",
  "scans",
  "geofences",
  "overrides",
] as const;