import { defineModule } from "@supercampus/module-sdk";
import { communicationsWorkflowCatalog } from "./flows";

export const communicationsModule = defineModule({
  key: "communications",
  version: "0.1.0",
  workflowCatalog: communicationsWorkflowCatalog,
  navigation: [{
    id: "communications",
    label: "Communication",
    route: "/dashboard/communications",
    requiredPermissions: ["communications.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("communications"),
});

export const communicationsCapabilities = [
  "email",
  "sms",
  "whatsapp",
  "templates",
  "logs",
  "scheduler",
] as const;

