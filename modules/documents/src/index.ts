import { defineModule } from "@supercampus/module-sdk";
import { documentsWorkflowCatalog } from "./flows";

export const documentsModule = defineModule({
  key: "documents",
  version: "0.1.0",
  workflowCatalog: documentsWorkflowCatalog,
  navigation: [{
    id: "documents",
    label: "Documents",
    route: "/dashboard/documents",
    requiredPermissions: ["documents.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("documents"),
});

export const documentsCapabilities = [
  "files",
  "folders",
  "templates",
  "verification",
  "retention",
] as const;