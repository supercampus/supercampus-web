import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const placementWorkflowCatalog = {
  moduleKey: "placement",
  source: "docs/workflows/Hostel_Management_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-staff-app",
  "public-web",
  "web-admin",
  "web-staff"
],
  overview: "The Hostel Management module manages the complete residential student lifecycle — from hostel configuration and room allocation to attendance, visitor management, leave requests, curfew monitoring, complaints, maintenance, fee collection, and AI-driven insights.",
  navigation: [
  "Hostel Configuration",
  "Hostel Blocks",
  "Floors & Rooms",
  "Room Types",
  "Bed Configuration",
  "Hostel Rules",
  "Curfew Rules",
  "Fee Structure",
  "Notification Settings",
  "Room Management",
  "Room Allocation",
  "Room Transfer",
  "Room Vacating",
  "Occupancy Status",
  "Vacancy Management",
  "Student Hostel",
  "Hostel Admission",
  "Student Profile",
  "Room Assignment",
  "Leave Requests",
  "Hostel History",
  "Hostel Attendance",
  "Mark Attendance",
  "Attendance Register",
  "Late Entry",
  "Night Attendance",
  "Attendance Reports",
  "Visitor Management",
  "Visitor Registration",
  "Visitor Pass",
  "Check-In",
  "Check-Out",
  "Visitor History",
  "Complaints",
  "Raise Complaint",
  "Complaint Tracking",
  "Complaint Resolution",
  "Feedback",
  "Repairs & Maintenance",
  "Maintenance Requests",
  "Work Orders",
  "Staff Assignment",
  "Completion Status",
  "Maintenance History",
  "Hostel Fees",
  "Fee Generation",
  "Fee Collection",
  "Receipts",
  "Due Payments",
  "Refunds",
  "Leave Management",
  "Leave Requests",
  "Parent Approval",
  "Warden Approval",
  "Gate Pass",
  "Leave History",
  "Curfew Management",
  "Curfew Monitoring",
  "Violation Alerts",
  "Late Entry Approval",
  "Escalations",
  "Violation History",
  "AI Insights",
  "Occupancy Analytics",
  "Complaint Trends",
  "Maintenance Analytics",
  "Student Risk Analysis",
  "Fee Defaulters",
  "Curfew Violation Analysis",
  "Reports",
  "Occupancy Report",
  "Room Allocation Report",
  "Attendance Report",
  "Visitor Report",
  "Complaint Report",
  "Maintenance Report",
  "Hostel Fee Report",
  "Leave Report",
  "Curfew Violation Report",
  "Notifications",
  "Student Notifications",
  "Parent Notifications",
  "Warden Notifications",
  "Fee Reminders",
  "Leave Alerts",
  "Emergency Alerts"
],
  workflows: [
  {
    "id": "room-allocation",
    "moduleKey": "placement",
    "name": "Room Allocation",
    "summary": "Set active year",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Academic Year",
        "description": "Set active year",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Hostel Block",
        "description": "Choose building",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Floor / Room",
        "description": "Navigate to specific room",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "View Room Availability",
        "description": "Check occupancy",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Room Available → Select Student",
        "description": "Proceed with allocation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Room Occupied → Suggest Alternate Room",
        "description": "Offer alternatives",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Validate Eligibility",
        "description": "Fee Status • Gender • Year • Preferences",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Assign Bed / Room",
        "description": "Confirm allocation",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Generate Hostel Allocation",
        "description": "Create record",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Notify Student & Warden",
        "description": "Send confirmations",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "hostel-occupancy",
    "moduleKey": "placement",
    "name": "Hostel Occupancy",
    "summary": "Fetch Allocated Room Data",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Fetch Allocated Room Data",
        "description": "Fetch Allocated Room Data",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Calculate Occupancy Status",
        "description": "Calculate Occupancy Status",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Occupied Vacant Beds Reserved Rooms",
        "description": "Occupied Vacant Beds Reserved Rooms",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Update Occupancy Dashboard",
        "description": "Update Occupancy Dashboard",
        "type": "report",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Generate Occupancy Reports",
        "description": "Generate Occupancy Reports",
        "type": "report",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "visitor-management",
    "moduleKey": "placement",
    "name": "Visitor Management",
    "summary": "Log visitor entry",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Visitor Registration",
        "description": "Log visitor entry",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Enter Visitor Details",
        "description": "Name • ID • Contact • Student",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "OTP / ID Verification",
        "description": "Authenticate identity",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Warden Approval",
        "description": "Seek permission",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Approved → Issue Visitor Pass",
        "description": "Grant access",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Rejected → Notify Visitor",
        "description": "Deny access",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Check-In",
        "description": "Record entry time",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Check-Out",
        "description": "Record exit time",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Visitor Log Updated",
        "description": "Archive visit",
        "type": "delete",
        "crud": [
          "delete"
        ]
      }
    ]
  },
  {
    "id": "hostel-attendance",
    "moduleKey": "placement",
    "name": "Hostel Attendance",
    "summary": "Select Date & Time",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Date & Time",
        "description": "Select Date & Time",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Attendance Method",
        "description": "Select Attendance Method",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Manual QR Code Biometric",
        "description": "Manual QR Code Biometric",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Mark Student Presence",
        "description": "Mark Student Presence",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Validate Attendance",
        "description": "Validate Attendance",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Save Attendance",
        "description": "Save Attendance",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Absent Student List Generated",
        "description": "Absent Student List Generated",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Notify Warden",
        "description": "Notify Warden",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "complaints",
    "moduleKey": "placement",
    "name": "Complaints",
    "summary": "Submit issue",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student Raises Complaint",
        "description": "Submit issue",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Complaint Category",
        "description": "Room / Food / Internet / Discipline",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Upload Description / Photos",
        "description": "Attach evidence",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Assign to Hostel Staff",
        "description": "Route to responsible team",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Complaint Investigation",
        "description": "Review and assess",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Resolved → Student Feedback",
        "description": "Close with rating",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Escalate to Admin → Higher authority",
        "description": "Handle complex issues",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Close Complaint",
        "description": "Finalize",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "hostel-fees",
    "moduleKey": "placement",
    "name": "Hostel Fees",
    "summary": "Select Academic Year",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Academic Year",
        "description": "Select Academic Year",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Generate Hostel Fee",
        "description": "Generate Hostel Fee",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Apply Discounts / Scholarships",
        "description": "Apply Discounts / Scholarships",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Generate Invoice",
        "description": "Generate Invoice",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Student Payment",
        "description": "Student Payment",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Paid Pending",
        "description": "Paid Pending",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Generate Receipt Send Payment Reminder",
        "description": "Generate Receipt Send Payment Reminder",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Update Fee Ledger",
        "description": "Update Fee Ledger",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "leave-requests",
    "moduleKey": "placement",
    "name": "Leave Requests",
    "summary": "Initiate request",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Student Submits Leave",
        "description": "Initiate request",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Enter Leave Details",
        "description": "Date • Time • Reason",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Upload Supporting Documents",
        "description": "Attach proof",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Warden Approval",
        "description": "Review and decide",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Approved → Update Leave Register",
        "description": "Record approval",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Rejected → Notify Student",
        "description": "Communicate reason",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Gate Pass Generated",
        "description": "Create exit pass",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Leave Status Updated",
        "description": "Finalize record",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "curfew-violation-alert",
    "moduleKey": "placement",
    "name": "Curfew Violation Alert",
    "summary": "Monitor Hostel Entry/Exit",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Monitor Hostel Entry/Exit",
        "description": "Monitor Hostel Entry/Exit",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Compare with Curfew Rules",
        "description": "Compare with Curfew Rules",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Within Curfew Curfew Violated",
        "description": "Within Curfew Curfew Violated",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "No Action Generate Violation Alert",
        "description": "No Action Generate Violation Alert",
        "type": "notification",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Notify Student",
        "description": "Notify Student",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Notify Parent",
        "description": "Notify Parent",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Notify Warden",
        "description": "Notify Warden",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Record Violation History",
        "description": "Record Violation History",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Escalate for Repeated Violations",
        "description": "Escalate for Repeated Violations",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "repairs-and-maintenance",
    "moduleKey": "placement",
    "name": "Repairs & Maintenance",
    "summary": "Submit issue",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Maintenance Request Raised",
        "description": "Submit issue",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Maintenance Type",
        "description": "Electrical / Plumbing / Furniture / Internet",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Assign Maintenance Staff",
        "description": "Allocate technician",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Repair Work Started",
        "description": "Begin fixing",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Repair Completed",
        "description": "Finish work",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Inspection & Verification",
        "description": "Quality check",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Approved → Close Maintenance Ticket",
        "description": "Finalize",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Rework Required → Return to staff",
        "description": "Fix issues",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
