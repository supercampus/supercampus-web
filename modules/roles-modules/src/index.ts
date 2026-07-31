import { defineModule } from "@supercampus/module-sdk";
import { rolesModulesWorkflowCatalog } from "./flows";

export const rolesmodulesModule = defineModule({
  key: "roles-modules",
  version: "0.1.0",
  workflowCatalog: rolesModulesWorkflowCatalog,
  navigation: [{
    id: "roles-modules",
    label: "Roles and Modules",
    route: "/dashboard/roles-modules",
    requiredPermissions: ["roles-modules.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("roles-modules"),
});

export const rolesmodulesCapabilities = [
  "roles",
  "modules",
  "features",
  "crud-permissions",
  "user-assignment",
] as const;

