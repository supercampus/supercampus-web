import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const counsellingWellnessWorkflowCatalog = {
  moduleKey: "counselling-wellness",
  source: "docs/workflows/Counselling_Mental_Wellness_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-staff-app",
  "web-admin"
],
  overview: "The Counselling & Mental Wellness module provides a confidential, structured system for students to request counselling, schedule appointments, manage cases, participate in wellness programs, and receive emergency mental health support.",
  navigation: [
  "Counselling Requests",
  "Appointments",
  "Case Management",
  "Wellness Programs",
  "Emergency Support",
  "AI Wellness Insights",
  "Notifications & Alerts",
  "Reports & Analytics"
],
  workflows: [
  {
    "id": "counselling-requests",
    "moduleKey": "counselling-wellness",
    "name": "Counselling Requests",
    "summary": "Authenticate into the counselling system",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student Login Portal",
        "description": "Authenticate into the counselling system",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Submit Counselling Request",
        "description": "Initiate a new counselling request",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Counselling Category",
        "description": "Choose: Academic / Personal / Mental Health",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Provide Concern / Description",
        "description": "Describe the issue in detail",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Choose Confidentiality Preference",
        "description": "Set privacy level for the request",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Submit Request for Review",
        "description": "Send to counselling team",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Assign Counsellor",
        "description": "Auto-assigned or manually assigned",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Appointment Scheduling",
        "description": "Book a session with the assigned counsellor",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "appointments",
    "moduleKey": "counselling-wellness",
    "name": "Appointments",
    "summary": "Counselling Request Approved",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Counselling Request Approved",
        "description": "Counselling Request Approved",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Assign Counsellor",
        "description": "Assign Counsellor",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "View Counsellor Availability",
        "description": "View Counsellor Availability",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Student Selects Time Slot",
        "description": "Student Selects Time Slot",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Confirm Appointment Booking",
        "description": "Confirm Appointment Booking",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Notification Sent to Student & Counsellor",
        "description": "Notification Sent to Student & Counsellor",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Conduct Counselling Session",
        "description": "Conduct Counselling Session",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Session Notes & Follow-up Logged",
        "description": "Session Notes & Follow-up Logged",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Schedule Follow-up (If Required)",
        "description": "Schedule Follow-up (If Required)",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "case-management",
    "moduleKey": "counselling-wellness",
    "name": "Case Management",
    "summary": "Session ends and notes are recorded",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Counselling Session Completed",
        "description": "Session ends and notes are recorded",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Create / Update Student Case",
        "description": "Open or update the student's case file",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Record Counselling Notes",
        "description": "Document session insights and observations",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Attach Documents (Optional)",
        "description": "Upload relevant documents",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Assess Severity / Risk Level",
        "description": "Evaluate the student's condition",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Low Risk → Close Case",
        "description": "Issue resolved, no further action needed",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Moderate Risk → Follow-up Plan",
        "description": "Schedule additional sessions",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "High Risk → Emergency Escalation",
        "description": "Activate emergency support protocol",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Case Status Updated",
        "description": "Log the final disposition",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "wellness-programs",
    "moduleKey": "counselling-wellness",
    "name": "Wellness Programs",
    "summary": "Wellness Team Creates Program",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Wellness Team Creates Program",
        "description": "Wellness Team Creates Program",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Define Program Details",
        "description": "Define Program Details",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "(Workshop • Seminar • Awareness Campaign)",
        "description": "(Workshop • Seminar • Awareness Campaign)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Select Target Audience",
        "description": "Select Target Audience",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Publish Program Schedule",
        "description": "Publish Program Schedule",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Students Register / Nomination",
        "description": "Students Register / Nomination",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Conduct Wellness Program",
        "description": "Conduct Wellness Program",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Record Participation",
        "description": "Record Participation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Collect Feedback Survey",
        "description": "Collect Feedback Survey",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "AI Wellness Engagement Analytics",
        "description": "AI Wellness Engagement Analytics",
        "type": "report",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "emergency-support",
    "moduleKey": "counselling-wellness",
    "name": "Emergency Support",
    "summary": "Emergency request is submitted",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student / Staff Raises Emergency",
        "description": "Emergency request is submitted",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Emergency Request Received",
        "description": "System captures the alert",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Assess Emergency Severity",
        "description": "Evaluate the level of urgency",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Low → Notify Counsellor",
        "description": "Standard counsellor notification",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Moderate → Notify Emergency Counsellor",
        "description": "Priority alert to senior counsellor",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Critical → Activate Emergency Response Team",
        "description": "Full emergency protocol",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Parent / Guardian Notification",
        "description": "Inform family if required",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Medical / Security Support",
        "description": "Coordinate with relevant departments",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Incident Documentation",
        "description": "Record all emergency details",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Case Management Updated",
        "description": "Link to student's ongoing case",
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
        "description": "Schedule post-emergency support",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
