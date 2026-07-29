import { defineModule } from "@supercampus/module-sdk";

export const crmModule = defineModule({
  key: "crm",
  version: "0.1.0",
  navigation: [{
    id: "crm",
    label: "SuperCampus CRM",
    route: "/dashboard/crm",
    requiredPermissions: ["crm.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("crm"),
});

export const crmCapabilities = [
  "leads",
  "contacts",
  "organizations",
  "pipelines",
  "opportunities",
  "activities",
  "tasks",
  "communications",
  "campaigns",
  "automations",
  "dashboards",
  "reports",
] as const;