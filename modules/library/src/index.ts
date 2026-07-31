import { defineModule } from "@supercampus/module-sdk";
import { libraryWorkflowCatalog } from "./flows";

export const libraryModule = defineModule({
  key: "library",
  version: "0.1.0",
  workflowCatalog: libraryWorkflowCatalog,
  navigation: [{
    id: "library",
    label: "Library",
    route: "/dashboard/library",
    requiredPermissions: ["library.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("library"),
});

export const libraryCapabilities = [
  "catalog",
  "copies",
  "loans",
  "holds",
  "members",
  "fines",
] as const;