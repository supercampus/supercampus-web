import { defineModule } from "@supercampus/module-sdk";

export const hostelModule = defineModule({
  key: "hostel",
  version: "0.1.0",
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