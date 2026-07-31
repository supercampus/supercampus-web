import { defineModule } from "@supercampus/module-sdk";
import { academicsWorkflowCatalog } from "./flows";

export const academicsModule = defineModule({
  key: "academics",
  version: "0.1.0",
  workflowCatalog: academicsWorkflowCatalog,
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