import { defineModule } from "@supercampus/module-sdk";
import { sickRoomMedicalRecordsWorkflowCatalog } from "./flows";

export const sickroommedicalrecordsModule = defineModule({
  key: "sick-room-medical-records",
  version: "0.1.0",
  workflowCatalog: sickRoomMedicalRecordsWorkflowCatalog,
  navigation: [{
    id: "sick-room-medical-records",
    label: "Sick Room & Medical Records",
    route: "/dashboard/sick-room-medical-records",
    requiredPermissions: ["sick-room-medical-records.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("sick-room-medical-records"),
});

export const sickroommedicalrecordsCapabilities = [
  "visits",
  "medical-records",
  "medicines",
  "referrals",
  "reports",
] as const;

