import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const timetableWorkflowCatalog = {
  moduleKey: "timetable",
  source: "docs/workflows/Timetable_Management_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-parent-app",
  "flutter-staff-app",
  "web-admin",
  "web-staff"
],
  overview: "The Timetable Management module automates and streamlines the creation, management, and publication of academic timetables. It supports both AI-powered auto-generation and manual creation with real-time conflict detection.",
  navigation: [
  "Configure Timetable",
  "AI Timetable Generator",
  "Manual Timetable",
  "Class Scheduling",
  "Faculty Allocation",
  "Room Allocation",
  "Timetables",
  "Substitutions",
  "Conflict Detection",
  "Publish Timetable"
],
  workflows: [
  {
    "id": "configure-timetable",
    "moduleKey": "timetable",
    "name": "Configure Timetable",
    "summary": "Select the academic year",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Academic Year",
        "description": "Select the academic year",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Semester",
        "description": "Choose the semester",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Department",
        "description": "Select the department",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Programme",
        "description": "Choose the programme",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Batch / Section",
        "description": "Specify batch and section",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Configure Working Days",
        "description": "Set which days classes run",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Configure Time Slots",
        "description": "Define available time periods",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Configure Periods & Breaks",
        "description": "Set class duration and break times",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Configure Timetable Rules",
        "description": "Define scheduling constraints",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Save Configuration",
        "description": "Store the timetable settings",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "ai-timetable-generation",
    "moduleKey": "timetable",
    "name": "AI Timetable Generation",
    "summary": "Start AI Generator",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Start AI Generator",
        "description": "Start AI Generator",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Load Academic Structure",
        "description": "Load Academic Structure",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Load Subjects",
        "description": "Load Subjects",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Load Faculty Availability",
        "description": "Load Faculty Availability",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Load Room Availability",
        "description": "Load Room Availability",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Apply Timetable Rules",
        "description": "Apply Timetable Rules",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "AI Generates Timetable",
        "description": "AI Generates Timetable",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Conflict Detection",
        "description": "Conflict Detection",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Conflicts No Conflicts",
        "description": "Conflicts No Conflicts",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Resolve",
        "description": "Resolve",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Preview",
        "description": "Preview",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-12",
        "order": 12,
        "title": "Publish",
        "description": "Publish",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "manual-timetable-generation",
    "moduleKey": "timetable",
    "name": "Manual Timetable Generation",
    "summary": "Choose the target class/section",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Select Class",
        "description": "Choose the target class/section",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Day",
        "description": "Pick the day of the week",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Choose Period",
        "description": "Select the time slot",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Assign Subject",
        "description": "Link a subject to the period",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Assign Faculty",
        "description": "Allocate a faculty member",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Assign Room",
        "description": "Select the classroom or lab",
        "type": "update",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Real-time Conflict Check",
        "description": "System validates for overlaps",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Save",
        "description": "Store the manual entry",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "class-scheduling",
    "moduleKey": "timetable",
    "name": "Class Scheduling",
    "summary": "Create Class Schedule",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Create Class Schedule",
        "description": "Create Class Schedule",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Assign Subjects",
        "description": "Assign Subjects",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Assign Weekly Hours",
        "description": "Assign Weekly Hours",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Assign Preferred Slots",
        "description": "Assign Preferred Slots",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Validate",
        "description": "Validate",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Ready for Timetable",
        "description": "Ready for Timetable",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "faculty-allocation",
    "moduleKey": "timetable",
    "name": "Faculty Allocation",
    "summary": "View all available faculty",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Faculty List",
        "description": "View all available faculty",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Assign Department",
        "description": "Link faculty to departments",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Assign Subjects",
        "description": "Allocate subjects to faculty",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Configure Availability",
        "description": "Set faculty working hours",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Set Maximum Workload",
        "description": "Define teaching hour limits",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Save Allocation",
        "description": "Store faculty assignments",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "room-allocation",
    "moduleKey": "timetable",
    "name": "Room Allocation",
    "summary": "View all available rooms",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Room List",
        "description": "View all available rooms",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Room Capacity",
        "description": "Set or verify seating capacity",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Room Type",
        "description": "Classify as Lab or Classroom",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Assign Available Slots",
        "description": "Mark when room is free",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Save",
        "description": "Store room configuration",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      }
    ]
  },
  {
    "id": "substitution-management",
    "moduleKey": "timetable",
    "name": "Substitution Management",
    "summary": "Faculty Leave",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Faculty Leave",
        "description": "Faculty Leave",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Affected Classes",
        "description": "Affected Classes",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Find Available Faculty",
        "description": "Find Available Faculty",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Allocate Substitute",
        "description": "Allocate Substitute",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Update Timetable",
        "description": "Update Timetable",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Notify Students & Faculty",
        "description": "Notify Students & Faculty",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "timetable-conflict-detection",
    "moduleKey": "timetable",
    "name": "Timetable Conflict Detection",
    "summary": "Description",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Conflict Type",
        "description": "Description",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Faculty Conflict",
        "description": "Same faculty assigned to multiple classes simultaneously",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Room Conflict",
        "description": "Same room booked for overlapping periods",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Class Conflict",
        "description": "Same class scheduled for multiple subjects at once",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Time Slot Conflict",
        "description": "Overlapping time allocations",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Lab Conflict",
        "description": "Lab resources double-booked",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "AI Generation",
        "description": "Automated timetable creation using intelligent algorithms",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Manual Creation",
        "description": "Step-by-step manual scheduling with real-time validation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Conflict Detection",
        "description": "Automatic identification of scheduling conflicts",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Substitute Management",
        "description": "Quick allocation of substitute faculty during leaves",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-12",
        "order": 12,
        "title": "Multi-View Publishing",
        "description": "Publish timetables for students, faculty, and departments",
        "type": "update",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-13",
        "order": 13,
        "title": "Ongoing Management",
        "description": "Handle class changes, faculty leaves, and room changes",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-14",
        "order": 14,
        "title": "Analytics",
        "description": "Reports and insights on timetable efficiency",
        "type": "report",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
