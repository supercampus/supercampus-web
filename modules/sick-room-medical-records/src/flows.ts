import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const sickRoomMedicalRecordsWorkflowCatalog = {
  moduleKey: "sick-room-medical-records",
  source: "docs/workflows/Sick_Room_Medical_Records_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-parent-app",
  "flutter-staff-app",
  "web-admin"
],
  overview: "The Sick Room & Medical Records module manages patient visits, medical assessments, treatments, medicine inventory, emergency handling, and comprehensive medical analytics for students and staff.",
  navigation: [
  "Patient Visits",
  "Medical Records",
  "Medicines & Inventory",
  "Case Management",
  "Emergency Contacts",
  "Notifications",
  "Reports"
],
  workflows: [
  {
    "id": "patient-visit-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Patient Visit Workflow",
    "summary": "Patient arrives at the medical facility",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student / Staff Visits Sick Room",
        "description": "Patient arrives at the medical facility",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Search Existing Patient Record",
        "description": "Check if patient already has a record",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Record Found → Verify Details",
        "description": "Confirm existing information",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "New Walk-in → Register Patient",
        "description": "Create a new patient profile",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Select Visit Type",
        "description": "Choose: Illness / Injury / Emergency / Follow-up",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Record Visit Date & Time",
        "description": "Log the exact visit timestamp",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Proceed to Medical Assessment",
        "description": "Begin the examination process",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "medical-assessment-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Medical Assessment Workflow",
    "summary": "Record Patient Complaint",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Record Patient Complaint",
        "description": "Record Patient Complaint",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Record Symptoms",
        "description": "Record Symptoms",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Measure Vital Signs",
        "description": "Measure Vital Signs",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Temperature Blood Pressure Pulse Weight",
        "description": "Temperature Blood Pressure Pulse Weight",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Initial Medical Examination",
        "description": "Initial Medical Examination",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Record Preliminary Diagnosis",
        "description": "Record Preliminary Diagnosis",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Proceed to Treatment",
        "description": "Proceed to Treatment",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "treatment-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Treatment Workflow",
    "summary": "Examine the medical assessment results",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Review Assessment",
        "description": "Examine the medical assessment results",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Treatment Plan",
        "description": "Choose from: First Aid / Medicines / Observation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Is Hospital Referral Needed?",
        "description": "Evaluate severity",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "No → Recommend Rest",
        "description": "Patient can recover on campus",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Yes → Refer to Hospital",
        "description": "Escalate to external medical facility",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Update Treatment Details",
        "description": "Log all treatment actions",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "medical-record-update-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Medical Record Update Workflow",
    "summary": "Access the patient's file",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Open Patient Medical Record",
        "description": "Access the patient's file",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Record Final Diagnosis",
        "description": "Document the confirmed diagnosis",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Update Medicines Issued",
        "description": "Log all medications given",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Add Doctor / Nurse Observations",
        "description": "Include clinical notes",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Attach Medical Certificate (Optional)",
        "description": "Upload any certificates",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Schedule Follow-up Visit",
        "description": "Set next appointment if needed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Save Medical Record",
        "description": "Store all updates securely",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "case-management-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Case Management Workflow",
    "summary": "Create Medical Case",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create Medical Case",
        "description": "Create Medical Case",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Assign Doctor / Nurse",
        "description": "Assign Doctor / Nurse",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Monitor Patient Recovery",
        "description": "Monitor Patient Recovery",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Schedule Follow-up Visit",
        "description": "Schedule Follow-up Visit",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Recovery Complete Further Care Needed",
        "description": "Recovery Complete Further Care Needed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Close Case Continue Monitoring",
        "description": "Close Case Continue Monitoring",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "medicines-and-inventory-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Medicines & Inventory Workflow",
    "summary": "Doctor prescribes medication",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Medicine Prescribed",
        "description": "Doctor prescribes medication",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Verify Stock Availability",
        "description": "Check if medicine is in stock",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Stock Available → Issue Medicine",
        "description": "Dispense to patient",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Out of Stock → Notify Pharmacy/Admin",
        "description": "Trigger restock alert",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Update Inventory Stock",
        "description": "Deduct issued quantity",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Check Reorder Threshold",
        "description": "Evaluate stock levels",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Stock Sufficient → Continue",
        "description": "No action needed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Low Stock → Generate Purchase Alert",
        "description": "Initiate procurement",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "emergency-handling-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Emergency Handling Workflow",
    "summary": "Emergency Identified",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Emergency Identified",
        "description": "Emergency Identified",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Provide Immediate First Aid",
        "description": "Provide Immediate First Aid",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Assess Severity of Emergency",
        "description": "Assess Severity of Emergency",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Minor Case Critical Case",
        "description": "Minor Case Critical Case",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Continue Treatment Activate Emergency Protocol",
        "description": "Continue Treatment Activate Emergency Protocol",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Notify Parents / Guardian",
        "description": "Notify Parents / Guardian",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Notify Administration",
        "description": "Notify Administration",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Call Ambulance (If Required)",
        "description": "Call Ambulance (If Required)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Record Emergency Incident",
        "description": "Record Emergency Incident",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Update Medical Records",
        "description": "Update Medical Records",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Follow-up Counselling Plan",
        "description": "Follow-up Counselling Plan",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "reports-and-analytics-workflow",
    "moduleKey": "sick-room-medical-records",
    "name": "Reports & Analytics Workflow",
    "summary": "Choose: Patient Visits / Medical Records / Inventory / Emergency",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Report Category",
        "description": "Choose: Patient Visits / Medical Records / Inventory / Emergency",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Apply Filters",
        "description": "Filter by: Date / Department / Patient / Status",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Generate Report",
        "description": "System compiles the data",
        "type": "report",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "View / Print / Export",
        "description": "Output as PDF or Excel",
        "type": "integration",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
