import { defineModule } from "@supercampus/module-sdk";

export const academicsModule = defineModule({
  key: "academics",
  version: "0.1.0",
  navigation: [{
    id: "academics",
    label: "Academics",
    route: "/dashboard/academics",
    requiredPermissions: ["academics.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("academics"),
});

export const academicsCapabilities = [
  "programs",
  "courses",
  "curriculum",
  "classes",
  "faculty",
  "timetable",
] as const;