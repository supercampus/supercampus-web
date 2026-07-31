import { defineModule } from "@supercampus/module-sdk";
import { timetableWorkflowCatalog } from "./flows";

export const timetableModule = defineModule({
  key: "timetable",
  version: "0.1.0",
  workflowCatalog: timetableWorkflowCatalog,
  navigation: [{
    id: "timetable",
    label: "Timetable",
    route: "/dashboard/timetable",
    requiredPermissions: ["timetable.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("timetable"),
});

export const timetableCapabilities = [
  "schedules",
  "rooms",
  "faculty-allocation",
  "substitutions",
  "publishing",
] as const;

