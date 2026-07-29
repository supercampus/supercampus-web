import { defineModule } from "@supercampus/module-sdk";

export const admissionsModule = defineModule({
  key: "admissions",
  version: "0.1.0",
  navigation: [{
    id: "admissions",
    label: "Admissions",
    route: "/dashboard/admissions",
    requiredPermissions: ["admissions.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("admissions"),
});

export const admissionsCapabilities = [
  "applications",
  "applicants",
  "programs",
  "intakes",
  "counseling",
  "offers",
  "enrollment",
] as const;