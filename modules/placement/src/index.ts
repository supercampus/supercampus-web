import { defineModule } from "@supercampus/module-sdk";

export const placementModule = defineModule({
  key: "placement",
  version: "0.1.0",
  navigation: [{
    id: "placement",
    label: "Placement",
    route: "/dashboard/placement",
    requiredPermissions: ["placement.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("placement"),
});

export const placementCapabilities = [
  "employers",
  "drives",
  "jobs",
  "applications",
  "offers",
  "reports",
] as const;