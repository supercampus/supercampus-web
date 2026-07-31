import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const academicsWorkflowCatalog = {
  moduleKey: "academics",
  source: "docs/workflows/Academic_Management_Workflow.md",
  deliveryTargets: [
  "flutter-student-app",
  "flutter-parent-app",
  "flutter-staff-app",
  "web-admin",
  "web-staff"
],
  overview: "",
  navigation: [
  "- Academic Management",
  "- Dashboard",
  "- Academic Structure",
  "- Curriculum",
  "- Subjects",
  "- Credits",
  "- Lesson Planning",
  "- Assignments",
  "- Learning Outcomes",
  "- AI Academic Insights",
  "- Notifications",
  "- Reports & Analytics",
  "---",
  "## 3."
],
  workflows: [
  {
    "id": "1-configure-academic-structure",
    "moduleKey": "academics",
    "name": "1 Configure Academic Structure",
    "summary": "CONFIGURE ACADEMIC STRUCTURE",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "CONFIGURE ACADEMIC STRUCTURE",
        "description": "CONFIGURE ACADEMIC STRUCTURE",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Academic Year",
        "description": "Select Academic Year",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Semester",
        "description": "Select Semester",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Create Faculty / Department",
        "description": "Create Faculty / Department",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Create Programme / Course",
        "description": "Create Programme / Course",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Create Batch / Section",
        "description": "Create Batch / Section",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Configure Academic Regulations",
        "description": "Configure Academic Regulations",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "(CBCS • NEP • Choice Based Rules)",
        "description": "(CBCS • NEP • Choice Based Rules)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Save & Activate Structure",
        "description": "Save & Activate Structure",
        "type": "action",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Academic Setup Completed",
        "description": "Academic Setup Completed",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "2-curriculum-management",
    "moduleKey": "academics",
    "name": "2 Curriculum Management",
    "summary": "CURRICULUM MANAGEMENT",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "CURRICULUM MANAGEMENT",
        "description": "CURRICULUM MANAGEMENT",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Programme / Degree",
        "description": "Select Programme / Degree",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Regulation",
        "description": "Select Regulation",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Create Curriculum",
        "description": "Create Curriculum",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Define Semester Structure",
        "description": "Define Semester Structure",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Add Core / Elective Subjects",
        "description": "Add Core / Elective Subjects",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Assign Credits & Contact Hours",
        "description": "Assign Credits & Contact Hours",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Map Prerequisites (If Required)",
        "description": "Map Prerequisites (If Required)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Curriculum Review",
        "description": "Curriculum Review",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Approve & Publish Curriculum",
        "description": "Approve & Publish Curriculum",
        "type": "approval",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "3-subject-management",
    "moduleKey": "academics",
    "name": "3 Subject Management",
    "summary": "SUBJECT MANAGEMENT",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "SUBJECT MANAGEMENT",
        "description": "SUBJECT MANAGEMENT",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Department / Programme",
        "description": "Select Department / Programme",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Create Subject",
        "description": "Create Subject",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Enter Subject Code & Title",
        "description": "Enter Subject Code & Title",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Select Subject Category",
        "description": "Select Subject Category",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Core Elective Laboratory",
        "description": "Core Elective Laboratory",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Assign Faculty & Semester",
        "description": "Assign Faculty & Semester",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Define Contact Hours & Credits",
        "description": "Define Contact Hours & Credits",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Save Subject Details",
        "description": "Save Subject Details",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Subject Ready for Offering",
        "description": "Subject Ready for Offering",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "4-credit-allocation",
    "moduleKey": "academics",
    "name": "4 Credit Allocation",
    "summary": "CREDIT ALLOCATION",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "CREDIT ALLOCATION",
        "description": "CREDIT ALLOCATION",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Programme",
        "description": "Select Programme",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Semester",
        "description": "Select Semester",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Fetch Subject List",
        "description": "Fetch Subject List",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Assign Credit Values",
        "description": "Assign Credit Values",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Theory Practical Project",
        "description": "Theory Practical Project",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Validate Credit Regulations",
        "description": "Validate Credit Regulations",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Calculate Total Semester Credits",
        "description": "Calculate Total Semester Credits",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Save Credit Structure",
        "description": "Save Credit Structure",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "5-lesson-planning",
    "moduleKey": "academics",
    "name": "5 Lesson Planning",
    "summary": "LESSON PLANNING",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "LESSON PLANNING",
        "description": "LESSON PLANNING",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Faculty",
        "description": "Select Faculty",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Subject",
        "description": "Select Subject",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Select Semester",
        "description": "Select Semester",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Create Lesson Plan Schedule",
        "description": "Create Lesson Plan Schedule",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Add Topics & Subtopics",
        "description": "Add Topics & Subtopics",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Map Learning Outcomes (COs)",
        "description": "Map Learning Outcomes (COs)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Attach Study Materials",
        "description": "Attach Study Materials",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Review & Publish Lesson Plan",
        "description": "Review & Publish Lesson Plan",
        "type": "approval",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Students Can View Lesson Plan",
        "description": "Students Can View Lesson Plan",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "6-assignment-management",
    "moduleKey": "academics",
    "name": "6 Assignment Management",
    "summary": "ASSIGNMENT MANAGEMENT",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "ASSIGNMENT MANAGEMENT",
        "description": "ASSIGNMENT MANAGEMENT",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Faculty Login",
        "description": "Faculty Login",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Select Subject",
        "description": "Select Subject",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Create Assignment",
        "description": "Create Assignment",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Enter Instructions & Rubrics",
        "description": "Enter Instructions & Rubrics",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Upload Supporting Files",
        "description": "Upload Supporting Files",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Set Due Date & Marks",
        "description": "Set Due Date & Marks",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Publish Assignment",
        "description": "Publish Assignment",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Students Submit Assignment",
        "description": "Students Submit Assignment",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Faculty Evaluation & Feedback",
        "description": "Faculty Evaluation & Feedback",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Marks Updated to ERP",
        "description": "Marks Updated to ERP",
        "type": "integration",
        "crud": [
          "read",
          "update"
        ]
      }
    ]
  },
  {
    "id": "7-learning-outcomes",
    "moduleKey": "academics",
    "name": "7 Learning Outcomes",
    "summary": "LEARNING OUTCOMES",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "LEARNING OUTCOMES",
        "description": "LEARNING OUTCOMES",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Programme & Course",
        "description": "Select Programme & Course",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Define Course Outcomes (CO)",
        "description": "Define Course Outcomes (CO)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Map CO → PO → PSO",
        "description": "Map CO → PO → PSO",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Link Assessments & Assignments",
        "description": "Link Assessments & Assignments",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Collect Student Performance",
        "description": "Collect Student Performance",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Calculate Outcome Attainment",
        "description": "Calculate Outcome Attainment",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "Achieved Partially Not Achieved",
        "description": "Achieved Partially Not Achieved",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Generate Improvement Plan",
        "description": "Generate Improvement Plan",
        "type": "create",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "AI Outcome Performance Analysis",
        "description": "AI Outcome Performance Analysis",
        "type": "action",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "8-ai-academic-insights",
    "moduleKey": "academics",
    "name": "8 AI Academic Insights",
    "summary": "AI ACADEMIC INSIGHTS",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "AI ACADEMIC INSIGHTS",
        "description": "AI ACADEMIC INSIGHTS",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Read Academic Performance Data",
        "description": "Read Academic Performance Data",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Analyze Curriculum Coverage",
        "description": "Analyze Curriculum Coverage",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Identify Slow Learning Topics",
        "description": "Identify Slow Learning Topics",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Predict Student Performance",
        "description": "Predict Student Performance",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Recommend Learning Resources",
        "description": "Recommend Learning Resources",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Faculty & HOD Academic Dashboard",
        "description": "Faculty & HOD Academic Dashboard",
        "type": "report",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "9-academic-notifications",
    "moduleKey": "academics",
    "name": "9 Academic Notifications",
    "summary": "ACADEMIC NOTIFICATIONS",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "ACADEMIC NOTIFICATIONS",
        "description": "ACADEMIC NOTIFICATIONS",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Lesson Plan / Assignment Published",
        "description": "Lesson Plan / Assignment Published",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Check Notification Preferences",
        "description": "Check Notification Preferences",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Send Notifications to Students",
        "description": "Send Notifications to Students",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "Portal Email Mobile App",
        "description": "Portal Email Mobile App",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Reminder Before Due Date",
        "description": "Reminder Before Due Date",
        "type": "notification",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "Submission & Evaluation Alerts",
        "description": "Submission & Evaluation Alerts",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  },
  {
    "id": "10-academic-reports",
    "moduleKey": "academics",
    "name": "10 Academic Reports",
    "summary": "ACADEMIC REPORTS",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "ACADEMIC REPORTS",
        "description": "ACADEMIC REPORTS",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-2",
        "order": 2,
        "title": "Select Report Type",
        "description": "Select Report Type",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-3",
        "order": 3,
        "title": "Curriculum Subject Learning Outcomes",
        "description": "Curriculum Subject Learning Outcomes",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-4",
        "order": 4,
        "title": "Apply Academic Filters",
        "description": "Apply Academic Filters",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-5",
        "order": 5,
        "title": "(Year • Semester • Department • Course)",
        "description": "(Year • Semester • Department • Course)",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-6",
        "order": 6,
        "title": "Generate Report",
        "description": "Generate Report",
        "type": "report",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-7",
        "order": 7,
        "title": "View • Print • Export PDF / Excel",
        "description": "View • Print • Export PDF / Excel",
        "type": "integration",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-8",
        "order": 8,
        "title": "ACADEMIC MANAGEMENT",
        "description": "ACADEMIC MANAGEMENT",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-9",
        "order": 9,
        "title": "Configure Academic Structure",
        "description": "Configure Academic Structure",
        "type": "action",
        "crud": [
          "create",
          "read"
        ]
      },
      {
        "id": "step-10",
        "order": 10,
        "title": "Curriculum Management",
        "description": "Curriculum Management",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-11",
        "order": 11,
        "title": "Subject Management",
        "description": "Subject Management",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-12",
        "order": 12,
        "title": "Credit Allocation",
        "description": "Credit Allocation",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-13",
        "order": 13,
        "title": "Lesson Planning",
        "description": "Lesson Planning",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-14",
        "order": 14,
        "title": "Assignment Management",
        "description": "Assignment Management",
        "type": "update",
        "crud": [
          "read",
          "update"
        ]
      },
      {
        "id": "step-15",
        "order": 15,
        "title": "Learning Outcome Assessment",
        "description": "Learning Outcome Assessment",
        "type": "action",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-16",
        "order": 16,
        "title": "AI Academic Insights",
        "description": "AI Academic Insights",
        "type": "report",
        "crud": [
          "read"
        ]
      },
      {
        "id": "step-17",
        "order": 17,
        "title": "Notifications • Reports • Analytics",
        "description": "Notifications • Reports • Analytics",
        "type": "notification",
        "crud": [
          "read"
        ]
      }
    ]
  }
],
} as const satisfies ModuleWorkflowCatalog;
