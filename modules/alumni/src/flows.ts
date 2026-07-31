import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const alumniWorkflowCatalog = {
  moduleKey: "alumni",
  source: "docs/workflows/Alumni_Management_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-staff-app",
  "public-web",
  "web-admin"
],
  overview: "The Alumni Management module connects graduates with the institution through registration, directory services, mentorship programs, donation campaigns, events & reunions, and engagement analytics.",
  navigation: [
  "Alumni Directory",
  "Alumni Registration",
  "Alumni Engagement",
  "Mentorship",
  "Donations & Contributions",
  "Events & Reunions",
  "Notifications",
  "Reports"
],
  workflows: [
  {
    "id": "alumni-registration-workflow",
    "moduleKey": "alumni",
    "name": "Alumni Registration Workflow",
    "summary": "Student completes their degree",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Graduate Student",
        "description": "Student completes their degree",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Register as Alumni",
        "description": "Sign up on the alumni portal",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Verify Email / Mobile",
        "description": "Confirm contact information",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Complete Alumni Profile",
        "description": "Fill in personal and professional details",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Academic Details",
        "description": "Batch • Programme • Department",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Professional Details",
        "description": "Company • Designation • Industry",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Profile Verification",
        "description": "Admin reviews and validates the profile",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Approved",
        "description": "Profile is activated",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Added to Alumni Directory",
        "description": "Graduate becomes part of the alumni network",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "alumni-directory-workflow",
    "moduleKey": "alumni",
    "name": "Alumni Directory Workflow",
    "summary": "Alumni Directory",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Alumni Directory",
        "description": "Alumni Directory",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Search Alumni",
        "description": "Search Alumni",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Filter",
        "description": "Filter",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "(Batch • Department • Company • Location)",
        "description": "(Batch • Department • Company • Location)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "View Alumni Profile",
        "description": "View Alumni Profile",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Connect / Message",
        "description": "Connect / Message",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Build Professional Network",
        "description": "Build Professional Network",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "alumni-engagement-workflow",
    "moduleKey": "alumni",
    "name": "Alumni Engagement Workflow",
    "summary": "Admin initiates an engagement initiative",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create Engagement Activity",
        "description": "Admin initiates an engagement initiative",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Announcements",
        "description": "Publish news and updates",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Newsletters",
        "description": "Send periodic email updates",
        "type": "notification",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Discussion Forums",
        "description": "Enable alumni community discussions",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Success Stories",
        "description": "Highlight notable alumni achievements",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Recognition & Awards",
        "description": "Acknowledge outstanding contributions",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Community Participation",
        "description": "Track and encourage involvement",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "mentorship-to-students-workflow",
    "moduleKey": "alumni",
    "name": "Mentorship to Students Workflow",
    "summary": "Alumni Volunteer",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Alumni Volunteer",
        "description": "Alumni Volunteer",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Register as Mentor",
        "description": "Register as Mentor",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Expertise",
        "description": "Select Expertise",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Student Requests Mentorship",
        "description": "Student Requests Mentorship",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Admin / AI Matching",
        "description": "Admin / AI Matching",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Assign Mentor",
        "description": "Assign Mentor",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Schedule Sessions",
        "description": "Schedule Sessions",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Track Progress",
        "description": "Track Progress",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Collect Feedback",
        "description": "Collect Feedback",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "donations-and-contributions-workflow",
    "moduleKey": "alumni",
    "name": "Donations & Contributions Workflow",
    "summary": "Define purpose and target amount",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create Donation Campaign",
        "description": "Define purpose and target amount",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Notify Alumni",
        "description": "Send campaign announcements",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Online Contribution",
        "description": "Alumni make donations through the portal",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Payment Confirmation",
        "description": "System verifies the transaction",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Generate Receipt",
        "description": "Auto-generate tax receipt",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Allocate Fund",
        "description": "Direct funds to the designated cause",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Contribution History",
        "description": "Maintain records of all donations",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "events-and-reunions-workflow",
    "moduleKey": "alumni",
    "name": "Events & Reunions Workflow",
    "summary": "Self-service portal for graduates to register and verify profiles",
    "steps": [
      {
        "id": "step-2",
        "order": 2,
        "title": "Alumni Registration",
        "description": "Self-service portal for graduates to register and verify profiles",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Alumni Directory",
        "description": "Searchable directory with filters (batch, department, company, location)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Alumni Engagement",
        "description": "Announcements, newsletters, forums, success stories, and awards",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Mentorship Program",
        "description": "Alumni volunteer as mentors matched with students",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Donations & Contributions",
        "description": "Campaign creation, online payments, receipts, and fund allocation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Events & Reunions",
        "description": "Event creation, invitations, RSVP tracking, and feedback collection",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Notifications",
        "description": "Updates and alerts to keep alumni informed",
        "type": "notification",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Reports & Analytics",
        "description": "Dashboard metrics on registrations, engagement, donations, and events",
        "type": "report",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
