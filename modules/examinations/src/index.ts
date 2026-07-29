import { defineModule } from "@supercampus/module-sdk";

export const examinationsModule = defineModule({
  key: "examinations",
  version: "0.1.0",
  navigation: [{
    id: "examinations",
    label: "Examinations",
    route: "/dashboard/examinations",
    requiredPermissions: ["examinations.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("examinations"),
});

export const examinationsCapabilities = [
  "assessments",
  "schedules",
  "grading",
  "results",
  "transcripts",
] as const;