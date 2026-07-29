import { defineModule } from "@supercampus/module-sdk";

export const documentsModule = defineModule({
  key: "documents",
  version: "0.1.0",
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