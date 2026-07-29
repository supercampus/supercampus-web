import { defineModule } from "@supercampus/module-sdk";

export const attendanceModule = defineModule({
  key: "attendance",
  version: "0.1.0",
  navigation: [{
    id: "attendance",
    label: "Attendance",
    route: "/dashboard/attendance",
    requiredPermissions: ["attendance.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("attendance"),
});

export const attendanceCapabilities = [
  "sessions",
  "records",
  "policies",
  "exceptions",
  "reports",
] as const;