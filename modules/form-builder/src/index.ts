import { defineModule } from "@supercampus/module-sdk";
import { formBuilderWorkflowCatalog } from "./flows";

export const formbuilderModule = defineModule({
  key: "form-builder",
  version: "0.1.0",
  workflowCatalog: formBuilderWorkflowCatalog,
  navigation: [{
    id: "form-builder",
    label: "Form Builder",
    route: "/dashboard/form-builder",
    requiredPermissions: ["form-builder.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("form-builder"),
});

export const formbuilderCapabilities = [
  "forms",
  "fields",
  "publishing",
  "approval-routing",
  "erp-mapping",
] as const;

