import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const feedbackGrievanceWorkflowCatalog = {
  moduleKey: "feedback-grievance",
  source: "docs/workflows/Feedback_Grievance_Management_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-parent-app",
  "flutter-staff-app",
  "web-admin"
],
  overview: "The Feedback & Grievance Management module provides a structured platform for students and staff to submit feedback, raise grievances, or file anonymous complaints — with automated categorization, assignment, investigation, resolution tracking, AI sentiment analysis, and performance metrics.",
  navigation: [
  "Feedback",
  "Grievances",
  "Anonymous Submissions",
  "Categories",
  "Assign & Resolve",
  "AI Sentiment Analysis",
  "Notifications & Alerts",
  "Reports & Analytics"
],
  workflows: [
  {
    "id": "feedback",
    "moduleKey": "feedback-grievance",
    "name": "Feedback",
    "summary": "Authenticate into the system",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student / Staff Login",
        "description": "Authenticate into the system",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Feedback Category",
        "description": "Academic / Faculty / Campus / Services",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Enter Feedback Details",
        "description": "Describe the feedback",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Upload Supporting Files (Optional)",
        "description": "Attach evidence",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Submit Feedback",
        "description": "Send to the system",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Validate & Categorize Feedback",
        "description": "Auto-classify by type",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Assign to Concerned Department",
        "description": "Route to responsible team",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Review & Take Necessary Action",
        "description": "Department responds",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Feedback Status Updated",
        "description": "Open → In Progress → Resolved → Closed",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Notify User & Request Rating",
        "description": "Close the loop",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "grievances",
    "moduleKey": "feedback-grievance",
    "name": "Grievances",
    "summary": "Student / Staff Login",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student / Staff Login",
        "description": "Student / Staff Login",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Raise New Grievance",
        "description": "Raise New Grievance",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Grievance Category",
        "description": "Select Grievance Category",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Academic Harassment Administration",
        "description": "Academic Harassment Administration",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Describe Issue & Upload Evidence",
        "description": "Describe Issue & Upload Evidence",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Submit Grievance Request",
        "description": "Submit Grievance Request",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Initial Review & Verification",
        "description": "Initial Review & Verification",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Assign Investigation Officer",
        "description": "Assign Investigation Officer",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Investigation & Case Review",
        "description": "Investigation & Case Review",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Additional Info Investigation Complete",
        "description": "Additional Info Investigation Complete",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Required",
        "description": "Required",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-12",
        "order": 12,
        "title": "User Responds",
        "description": "User Responds",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-13",
        "order": 13,
        "title": "Resolution Decision",
        "description": "Resolution Decision",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-14",
        "order": 14,
        "title": "Notify Student / Staff",
        "description": "Notify Student / Staff",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-15",
        "order": 15,
        "title": "Case Closed & Archived",
        "description": "Case Closed & Archived",
        "type": "delete",
        "crud": [
          "delete"
        ]
      }
    ]
  },
  {
    "id": "anonymous-submissions",
    "moduleKey": "feedback-grievance",
    "name": "Anonymous Submissions",
    "summary": "Access without login",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Open Anonymous Portal",
        "description": "Access without login",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Feedback / Grievance",
        "description": "Choose submission type",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Issue Category",
        "description": "Categorize the concern",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Enter Complaint Details",
        "description": "Describe the issue",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Upload Evidence (Optional)",
        "description": "Attach supporting files",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Submit Without Identity",
        "description": "No personal data collected",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Generate Anonymous Reference ID",
        "description": "Track using reference number",
        "type": "create",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Assign to Concerned Authority",
        "description": "Route for investigation",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Investigation & Resolution",
        "description": "Handle anonymously",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Update Status Using Reference ID",
        "description": "User checks progress",
        "type": "update",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "categories",
    "moduleKey": "feedback-grievance",
    "name": "Categories",
    "summary": "Administrator Login",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Administrator Login",
        "description": "Administrator Login",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Create / Edit Categories",
        "description": "Create / Edit Categories",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Define Category Information",
        "description": "Define Category Information",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Feedback Category Grievance Category",
        "description": "Feedback Category Grievance Category",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Assign Responsible Department",
        "description": "Assign Responsible Department",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Configure Priority Level",
        "description": "Configure Priority Level",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Define SLA & Resolution Time",
        "description": "Define SLA & Resolution Time",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Activate Category",
        "description": "Activate Category",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Available for User Submission",
        "description": "Available for User Submission",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "assign-and-resolve",
    "moduleKey": "feedback-grievance",
    "name": "Assign & Resolve",
    "summary": "System captures submission",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "New Case Received",
        "description": "System captures submission",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Review Submitted Details",
        "description": "Read complaint/feedback",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Determine Priority Level",
        "description": "Low / Medium / High",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Assign Concerned Officer",
        "description": "Route to responsible person",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Investigation / Discussion",
        "description": "Gather facts and discuss",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Take Corrective Action",
        "description": "Implement solution",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Record Resolution Notes",
        "description": "Document actions taken",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "User Confirmation (Optional)",
        "description": "Verify user satisfaction",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Satisfied → Close & Archive Case",
        "description": "Finalize",
        "type": "delete",
        "crud": [
          "delete"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Reopen Case → Return to investigation",
        "description": "Further action needed",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
