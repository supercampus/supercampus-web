import { defineModule } from "@supercampus/module-sdk";
import { hostelWorkflowCatalog } from "./flows";

export const hostelModule = defineModule({
  key: "hostel",
  version: "0.1.0",
  workflowCatalog: hostelWorkflowCatalog,
  navigation: [{
    id: "hostel",
    label: "Hostel",
    route: "/dashboard/hostel",
    requiredPermissions: ["hostel.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("hostel"),
});

export const hostelCapabilities = [
  "buildings",
  "rooms",
  "allocations",
  "residents",
  "visitors",
  "maintenance",
] as const;