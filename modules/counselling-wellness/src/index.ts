import { defineModule } from "@supercampus/module-sdk";
import { counsellingWellnessWorkflowCatalog } from "./flows";

export const counsellingwellnessModule = defineModule({
  key: "counselling-wellness",
  version: "0.1.0",
  workflowCatalog: counsellingWellnessWorkflowCatalog,
  navigation: [{
    id: "counselling-wellness",
    label: "Counselling & Mental Wellness",
    route: "/dashboard/counselling-wellness",
    requiredPermissions: ["counselling-wellness.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("counselling-wellness"),
});

export const counsellingwellnessCapabilities = [
  "appointments",
  "case-notes",
  "wellness-screening",
  "referrals",
  "confidential-reports",
] as const;

