import { defineModule } from "@supercampus/module-sdk";
import { employeeSelfServiceWorkflowCatalog } from "./flows";

export const employeeselfserviceModule = defineModule({
  key: "employee-self-service",
  version: "0.1.0",
  workflowCatalog: employeeSelfServiceWorkflowCatalog,
  navigation: [{
    id: "employee-self-service",
    label: "Employee Self Service",
    route: "/dashboard/employee-self-service",
    requiredPermissions: ["employee-self-service.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("employee-self-service"),
});

export const employeeselfserviceCapabilities = [
  "profile",
  "leave",
  "payroll",
  "documents",
  "requests",
] as const;

