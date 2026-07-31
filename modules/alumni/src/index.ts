import { defineModule } from "@supercampus/module-sdk";
import { alumniWorkflowCatalog } from "./flows";

export const alumniModule = defineModule({
  key: "alumni",
  version: "0.1.0",
  workflowCatalog: alumniWorkflowCatalog,
  navigation: [{
    id: "alumni",
    label: "Alumni Management",
    route: "/dashboard/alumni",
    requiredPermissions: ["alumni.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("alumni"),
});

export const alumniCapabilities = [
  "alumni-profiles",
  "chapters",
  "events",
  "mentorship",
  "donations",
] as const;

