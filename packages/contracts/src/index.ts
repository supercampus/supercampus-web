export type TenantId = string;
export type UserId = string;
export type ModuleKey =
  | "academics"
  | "admissions"
  | "alumni"
  | "analytics"
  | "application-desk"
  | "attendance"
  | "communications"
  | "counselling-wellness"
  | "crm"
  | "documents"
  | "employee-self-service"
  | "examinations"
  | "feedback-grievance"
  | "fees"
  | "form-builder"
  | "gatepass"
  | "hostel"
  | "library"
  | "no-due"
  | "parents-self-service"
  | "placement"
  | "repairs-maintenance"
  | "roles-modules"
  | "sick-room-medical-records"
  | "student-onboarding"
  | "student-self-service"
  | "timetable"
  | "transport"
  | "vendor-management"
  | "visitor-management";

export interface RuntimeContext {
  tenantId: TenantId;
  campusId?: string;
  departmentId?: string;
  userId: UserId;
  permissions: string[];
  enabledModules: ModuleKey[];
}

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  requiredPermissions?: string[];
  children?: NavigationItem[];
}

export type ModuleWorkflowStepType =
  | "action"
  | "approval"
  | "create"
  | "delete"
  | "integration"
  | "notification"
  | "report"
  | "update";

export type CrudAction = "create" | "read" | "update" | "delete";

export type ModuleDeliveryTarget =
  | "flutter-student-app"
  | "flutter-parent-app"
  | "flutter-staff-app"
  | "public-web"
  | "web-admin"
  | "web-staff";

export interface ModuleWorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: ModuleWorkflowStepType;
  crud: CrudAction[];
}

export interface ModuleWorkflow {
  id: string;
  moduleKey: ModuleKey;
  name: string;
  summary: string;
  steps: ModuleWorkflowStep[];
}

export interface ModuleWorkflowCatalog {
  moduleKey: ModuleKey;
  source: string;
  deliveryTargets: ModuleDeliveryTarget[];
  overview: string;
  navigation: string[];
  workflows: ModuleWorkflow[];
}
