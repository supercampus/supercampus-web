import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const repairsMaintenanceWorkflowCatalog = {
  moduleKey: "repairs-maintenance",
  source: "docs/workflows/Repairs_Maintenance_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-staff-app",
  "web-admin",
  "web-staff"
],
  overview: "The Repairs & Maintenance module manages the full lifecycle of maintenance requests — from ticket creation and team/vendor assignment to work completion, quality verification, preventive maintenance scheduling, and AI-driven insights.",
  navigation: [
  "Service Requests / Maintenance Tickets",
  "Work Orders",
  "Asset Maintenance",
  "Preventive Maintenance",
  "Vendors Management",
  "AI Maintenance Insights",
  "Notifications & Alerts",
  "Reports & Analytics"
],
  workflows: [
  {
    "id": "service-requests-maintenance-ticket",
    "moduleKey": "repairs-maintenance",
    "name": "Service Requests / Maintenance Ticket",
    "summary": "Authenticate into the system",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student / Staff / Admin Login",
        "description": "Authenticate into the system",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Raise Maintenance Request",
        "description": "Initiate a new service request",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Issue Category",
        "description": "Choose from: Electrical / Plumbing / IT & Network",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Select Asset / Location",
        "description": "Specify the affected asset or building area",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Enter Issue Description & Priority",
        "description": "Describe the problem and set urgency",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Upload Images / Supporting Documents",
        "description": "Attach visual evidence (optional)",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Submit Maintenance Ticket",
        "description": "Send the request for review",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Ticket Number Generated Automatically",
        "description": "System assigns a unique ticket ID",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Ticket Assigned for Review",
        "description": "Routed to the maintenance team for validation",
        "type": "approval",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "work-orders-to-vendors",
    "moduleKey": "repairs-maintenance",
    "name": "Work Orders to Vendors",
    "summary": "Ticket assessed for validity and scope",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Maintenance Ticket Reviewed",
        "description": "Ticket assessed for validity and scope",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Determine Internal or Vendor Work",
        "description": "Decide if handled in-house or outsourced",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Internal Team → Assign Technician",
        "description": "Allocate an internal technician",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "External Vendor → Select Approved Vendor",
        "description": "Choose from pre-approved vendor list",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Generate Work Order",
        "description": "Create a formal work order document",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Define Scope, Timeline & Cost",
        "description": "Specify deliverables, deadlines, and budget",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Vendor Accepts Work Order",
        "description": "Vendor confirms and begins work",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Repair / Service Completed",
        "description": "Work is finished by technician or vendor",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Completion Verification & Approval",
        "description": "Quality check by facility manager",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Work Order Closed & Recorded",
        "description": "Archive work order and update records",
        "type": "delete",
        "crud": [
          "delete"
        ]
      }
    ]
  },
  {
    "id": "asset-maintenance",
    "moduleKey": "repairs-maintenance",
    "name": "Asset Maintenance",
    "summary": "Select Campus Asset",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Campus Asset",
        "description": "Select Campus Asset",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "View Asset Maintenance History",
        "description": "View Asset Maintenance History",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Record Inspection / Service Details",
        "description": "Record Inspection / Service Details",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Update Asset Condition & Status",
        "description": "Update Asset Condition & Status",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Good Needs Repair Replace",
        "description": "Good Needs Repair Replace",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Continue Use Raise Work Order Asset Replacement",
        "description": "Continue Use Raise Work Order Asset Replacement",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Update Asset Maintenance Log",
        "description": "Update Asset Maintenance Log",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "preventive-maintenance",
    "moduleKey": "repairs-maintenance",
    "name": "Preventive Maintenance",
    "summary": "Define a preventive maintenance plan",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create Maintenance Schedule",
        "description": "Define a preventive maintenance plan",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Asset Categories",
        "description": "Choose which assets to include",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Define Frequency",
        "description": "Set interval: Daily / Weekly / Monthly",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Generate Preventive Maintenance Plan",
        "description": "System creates the schedule",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Notify Maintenance Team / Vendor",
        "description": "Alert responsible parties",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Perform Scheduled Maintenance",
        "description": "Execute the planned maintenance",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Record Inspection & Service",
        "description": "Log all activities performed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Update Next Maintenance Schedule",
        "description": "Set the next due date",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Preventive Maintenance History",
        "description": "Maintain a complete audit trail",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "vendors-management",
    "moduleKey": "repairs-maintenance",
    "name": "Vendors Management",
    "summary": "End-to-end tracking of maintenance requests",
    "steps": [
      {
        "id": "step-2",
        "order": 2,
        "title": "Ticket Management",
        "description": "End-to-end tracking of maintenance requests",
        "type": "create",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Work Orders",
        "description": "Formal assignment to internal teams or external vendors",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Asset Tracking",
        "description": "Maintenance history and condition monitoring per asset",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Preventive Maintenance",
        "description": "Scheduled upkeep to prevent breakdowns",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Vendor Management",
        "description": "Registration, verification, and performance tracking",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "AI Insights",
        "description": "Recurring issues, cost analysis, and asset health predictions",
        "type": "report",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Notifications",
        "description": "Alerts for requesters, technicians, and facility managers",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Reports",
        "description": "Ticket reports, work order reports, asset maintenance, vendor performance",
        "type": "report",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
