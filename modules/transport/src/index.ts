import { defineModule } from "@supercampus/module-sdk";
import { transportWorkflowCatalog } from "./flows";

export const transportModule = defineModule({
  key: "transport",
  version: "0.1.0",
  workflowCatalog: transportWorkflowCatalog,
  navigation: [{
    id: "transport",
    label: "Transport",
    route: "/dashboard/transport",
    requiredPermissions: ["transport.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("transport"),
});

export const transportCapabilities = [
  "routes",
  "vehicles",
  "stops",
  "assignments",
  "tracking",
  "maintenance",
] as const;