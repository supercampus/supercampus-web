import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const formBuilderWorkflowCatalog = {
  moduleKey: "form-builder",
  source: "docs/workflows/Form_Builder_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-parent-app",
  "flutter-staff-app",
  "public-web",
  "web-admin",
  "web-staff"
],
  overview: "The Form Builder module enables institutions to create, design, publish, and manage dynamic forms with custom fields, approval workflows, submission validation, and analytics — supporting everything from admission enquiries to event registrations.",
  navigation: [
  "Form Builder",
  "Form Templates",
  "Field Management",
  "Submission Management",
  "Workflow & Approvals",
  "Publish & Share",
  "Enquiry Forms Widget",
  "Reports & Analytics",
  "Settings"
],
  workflows: [
  {
    "id": "form-builder",
    "moduleKey": "form-builder",
    "name": "Form Builder",
    "summary": "Start a blank form",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create New Form",
        "description": "Start a blank form",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Enter Form Details",
        "description": "Name • Category • Description",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Form Layout",
        "description": "Choose visual structure",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Add Sections / Pages",
        "description": "Organize form into logical parts",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Save Draft",
        "description": "Preserve progress",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Continue Designing",
        "description": "Proceed to field management",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "form-templates",
    "moduleKey": "form-builder",
    "name": "Form Templates",
    "summary": "Select Template Category",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Template Category",
        "description": "Select Template Category",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Admission Feedback Event Registration",
        "description": "Admission Feedback Event Registration",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Scholarship Leave Request Hostel Application",
        "description": "Scholarship Leave Request Hostel Application",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Preview Template",
        "description": "Preview Template",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Customize Template",
        "description": "Customize Template",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Save as New Form",
        "description": "Save as New Form",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "field-management",
    "moduleKey": "form-builder",
    "name": "Field Management",
    "summary": "Open the target form",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Form",
        "description": "Open the target form",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Add New Field",
        "description": "Choose field type",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Field Types Available",
        "description": "Text Box / Dropdown / Date Picker / Checkbox / Radio Button / File Upload / Signature / Number Field / Email Field",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Configure Field Properties",
        "description": "Mandatory • Validation • Default Value",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Arrange Field Order",
        "description": "Drag-and-drop reordering",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Save Changes",
        "description": "Persist field configuration",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "submission-management",
    "moduleKey": "form-builder",
    "name": "Submission Management",
    "summary": "User Submits Form",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "User Submits Form",
        "description": "User Submits Form",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Validate Required Fields",
        "description": "Validate Required Fields",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Validation Failed Validation Passed",
        "description": "Validation Failed Validation Passed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Show Error Message Store Submission",
        "description": "Show Error Message Store Submission",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Generate Submission ID",
        "description": "Generate Submission ID",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Submission Confirmation",
        "description": "Submission Confirmation",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "workflow-and-approvals",
    "moduleKey": "form-builder",
    "name": "Workflow & Approvals",
    "summary": "Form response enters the system",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Submission Received",
        "description": "Form response enters the system",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Identify Workflow Configuration",
        "description": "Check if approval chain is configured",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Route to Approver",
        "description": "Forward to designated approver",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Approved → Next Approval Level (if any)",
        "description": "Multi-level approval support",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Rejected → Notify Applicant",
        "description": "Inform user with reason",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Final Approval → Update Status",
        "description": "Mark as approved",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Notify Applicant",
        "description": "Send confirmation to user",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "publish-and-share",
    "moduleKey": "form-builder",
    "name": "Publish & Share",
    "summary": "Select Form",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Form",
        "description": "Select Form",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Configure Access Permissions",
        "description": "Configure Access Permissions",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Students Staff Public Users",
        "description": "Students Staff Public Users",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Generate Share Options",
        "description": "Generate Share Options",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "URL QR Code Website Embed",
        "description": "URL QR Code Website Embed",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Publish Form",
        "description": "Publish Form",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Form Available Online",
        "description": "Form Available Online",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "enquiry-forms-widget",
    "moduleKey": "form-builder",
    "name": "Enquiry Forms Widget",
    "summary": "User lands on institutional website",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Visitor Opens Website",
        "description": "User lands on institutional website",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Open Enquiry Widget",
        "description": "Click the floating enquiry form",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Fill Enquiry Details",
        "description": "Enter name, contact, query",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Submit Enquiry Form",
        "description": "Send the enquiry",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Auto Generate Enquiry ID",
        "description": "System assigns a reference number",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Route to Admission / Department",
        "description": "Forward to relevant team",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Staff Follow-up & Status Update",
        "description": "Track and update enquiry status",
        "type": "update",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Notification Sent to Visitor",
        "description": "Keep visitor informed",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
