export type TenantId = string;
export type UserId = string;
export type ModuleKey = "crm" | "admissions" | "academics" | "attendance" | "documents" | "examinations" | "fees" | "gatepass" | "hostel" | "library" | "placement" | "transport";

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