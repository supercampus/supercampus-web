# Academic Management Workflow

Complete workflow specification for the Academic Management module — covers the overall process flow, module navigation, and detailed step-by-step workflows for each sub-module.

---

## 1. Complete Academic Management Workflow (Top-Level Flow)

```
ACADEMIC MANAGEMENT
        │
        ▼
Configure Academic Structure
        │
        ▼
Curriculum Management
        │
        ▼
Subject Management
        │
        ▼
Credit Allocation
        │
        ▼
Lesson Planning
        │
        ▼
Assignment Management
        │
        ▼
Learning Outcome Assessment
        │
        ▼
AI Academic Insights
        │
        ▼
Notifications & Alerts
        │
        ▼
Reports & Analytics
```

**Stages, in order:**

1. Configure Academic Structure
2. Curriculum Management
3. Subject Management
4. Credit Allocation
5. Lesson Planning
6. Assignment Management
7. Learning Outcome Assessment
8. AI Academic Insights
9. Notifications & Alerts
10. Reports & Analytics

---

## 2. Module Navigation

Left-nav structure for the Academic Management module:

- **Academic Management**
  - Dashboard
  - Academic Structure
  - Curriculum
  - Subjects
  - Credits
  - Lesson Planning
  - Assignments
  - Learning Outcomes
  - AI Academic Insights
  - Notifications
  - Reports & Analytics

---

## 3. Individual Workflows

### 3.1 Configure Academic Structure

```
CONFIGURE ACADEMIC STRUCTURE
            │
            ▼
    Select Academic Year
            │
            ▼
      Select Semester
            │
            ▼
 Create Faculty / Department
            │
            ▼
 Create Programme / Course
            │
            ▼
  Create Batch / Section
            │
            ▼
Configure Academic Regulations
(CBCS • NEP • Choice Based Rules)
            │
            ▼
 Save & Activate Structure
            │
            ▼
Academic Setup Completed
```

**Steps:**

1. Select Academic Year
2. Select Semester
3. Create Faculty / Department
4. Create Programme / Course
5. Create Batch / Section
6. Configure Academic Regulations (CBCS, NEP, Choice-Based rules)
7. Save & Activate Structure
8. Academic Setup Completed

---

### 3.2 Curriculum Management

```
   CURRICULUM MANAGEMENT
            │
            ▼
 Select Programme / Degree
            │
            ▼
    Select Regulation
            │
            ▼
   Create Curriculum
            │
            ▼
Define Semester Structure
            │
            ▼
Add Core / Elective Subjects
            │
            ▼
Assign Credits & Contact Hours
            │
            ▼
Map Prerequisites (If Required)
            │
            ▼
   Curriculum Review
            │
            ▼
Approve & Publish Curriculum
```

**Steps:**

1. Select Programme / Degree
2. Select Regulation
3. Create Curriculum
4. Define Semester Structure
5. Add Core / Elective Subjects
6. Assign Credits & Contact Hours
7. Map Prerequisites (if required)
8. Curriculum Review
9. Approve & Publish Curriculum

---

### 3.3 Subject Management

```
      SUBJECT MANAGEMENT
             │
             ▼
 Select Department / Programme
             │
             ▼
      Create Subject
             │
             ▼
 Enter Subject Code & Title
             │
             ▼
 Select Subject Category
 ┌──────────┬──────────┬──────────┐
 ▼          ▼          ▼
Core     Elective     Laboratory
 └──────────┴──────────┘
             │
             ▼
Assign Faculty & Semester
             │
             ▼
Define Contact Hours & Credits
             │
             ▼
   Save Subject Details
             │
             ▼
  Subject Ready for Offering
```

**Steps:**

1. Select Department / Programme
2. Create Subject
3. Enter Subject Code & Title
4. Select Subject Category — branches into **Core**, **Elective**, or **Laboratory**
5. Assign Faculty & Semester
6. Define Contact Hours & Credits
7. Save Subject Details
8. Subject Ready for Offering

---

### 3.4 Credit Allocation

```
      CREDIT ALLOCATION
             │
             ▼
        Select Programme
             │
             ▼
        Select Semester
             │
             ▼
      Fetch Subject List
             │
             ▼
      Assign Credit Values
             │
   ┌─────────────┼──────────────┐
   ▼             ▼              ▼
Theory        Practical      Project
             │
             ▼
 Validate Credit Regulations
             │
             ▼
Calculate Total Semester Credits
             │
             ▼
    Save Credit Structure
```

**Steps:**

1. Select Programme
2. Select Semester
3. Fetch Subject List
4. Assign Credit Values — split across **Theory**, **Practical**, and **Project**
5. Validate Credit Regulations
6. Calculate Total Semester Credits
7. Save Credit Structure

---

### 3.5 Lesson Planning

```
      LESSON PLANNING
             │
             ▼
        Select Faculty
             │
             ▼
        Select Subject
             │
             ▼
       Select Semester
             │
             ▼
 Create Lesson Plan Schedule
             │
             ▼
  Add Topics & Subtopics
             │
             ▼
 Map Learning Outcomes (COs)
             │
             ▼
  Attach Study Materials
             │
             ▼
 Review & Publish Lesson Plan
             │
             ▼
Students Can View Lesson Plan
```

**Steps:**

1. Select Faculty
2. Select Subject
3. Select Semester
4. Create Lesson Plan Schedule
5. Add Topics & Subtopics
6. Map Learning Outcomes (Course Outcomes / COs)
7. Attach Study Materials
8. Review & Publish Lesson Plan
9. Students Can View Lesson Plan

---

### 3.6 Assignment Management

```
   ASSIGNMENT MANAGEMENT
            │
            ▼
       Faculty Login
            │
            ▼
      Select Subject
            │
            ▼
    Create Assignment
            │
            ▼
Enter Instructions & Rubrics
            │
            ▼
  Upload Supporting Files
            │
            ▼
   Set Due Date & Marks
            │
            ▼
   Publish Assignment
            │
            ▼
Students Submit Assignment
            │
            ▼
Faculty Evaluation & Feedback
            │
            ▼
   Marks Updated to ERP
```

**Steps:**

1. Faculty Login
2. Select Subject
3. Create Assignment
4. Enter Instructions & Rubrics
5. Upload Supporting Files
6. Set Due Date & Marks
7. Publish Assignment
8. Students Submit Assignment
9. Faculty Evaluation & Feedback
10. Marks Updated to ERP

---

### 3.7 Learning Outcomes

```
     LEARNING OUTCOMES
            │
            ▼
 Select Programme & Course
            │
            ▼
 Define Course Outcomes (CO)
            │
            ▼
   Map CO → PO → PSO
            │
            ▼
Link Assessments & Assignments
            │
            ▼
 Collect Student Performance
            │
            ▼
Calculate Outcome Attainment
            │
   ┌────────────┼────────────┐
   ▼            ▼            ▼
Achieved     Partially     Not Achieved
            │
            ▼
Generate Improvement Plan
            │
            ▼
AI Outcome Performance Analysis
```

**Steps:**

1. Select Programme & Course
2. Define Course Outcomes (CO)
3. Map CO → PO (Programme Outcome) → PSO (Programme Specific Outcome)
4. Link Assessments & Assignments
5. Collect Student Performance
6. Calculate Outcome Attainment — result is one of **Achieved**, **Partially Achieved**, or **Not Achieved**
7. Generate Improvement Plan
8. AI Outcome Performance Analysis

---

### 3.8 AI Academic Insights

```
    AI ACADEMIC INSIGHTS
            │
            ▼
Read Academic Performance Data
            │
            ▼
 Analyze Curriculum Coverage
            │
            ▼
Identify Slow Learning Topics
            │
            ▼
Predict Student Performance
            │
            ▼
Recommend Learning Resources
            │
            ▼
Faculty & HOD Academic Dashboard
```

**Steps:**

1. Read Academic Performance Data
2. Analyze Curriculum Coverage
3. Identify Slow Learning Topics
4. Predict Student Performance
5. Recommend Learning Resources
6. Faculty & HOD Academic Dashboard

**AI can provide:**

- Curriculum completion tracking
- Subject difficulty analysis
- Assignment completion trends
- Student performance prediction
- Course Outcome (CO) attainment analysis
- Faculty teaching progress
- Learning gap identification

---

### 3.9 Academic Notifications

```
   ACADEMIC NOTIFICATIONS
            │
            ▼
Lesson Plan / Assignment Published
            │
            ▼
Check Notification Preferences
            │
            ▼
Send Notifications to Students
            │
  ┌─────────────┼─────────────┐
  ▼             ▼             ▼
Portal        Email        Mobile App
            │
            ▼
 Reminder Before Due Date
            │
            ▼
Submission & Evaluation Alerts
```

**Steps:**

1. Lesson Plan / Assignment Published (trigger event)
2. Check Notification Preferences
3. Send Notifications to Students — delivered via **Portal**, **Email**, or **Mobile App**
4. Reminder Before Due Date
5. Submission & Evaluation Alerts

---

### 3.10 Academic Reports

```
     ACADEMIC REPORTS
            │
            ▼
    Select Report Type
            │
   ┌─────────────┼──────────────┐
   ▼             ▼              ▼
Curriculum     Subject      Learning Outcomes
            │
            ▼
  Apply Academic Filters
(Year • Semester • Department • Course)
            │
            ▼
     Generate Report
            │
            ▼
View • Print • Export PDF / Excel
```

**Steps:**

1. Select Report Type — choice of **Curriculum**, **Subject**, or **Learning Outcomes**
2. Apply Academic Filters (Year, Semester, Department, Course)
3. Generate Report
4. View, Print, or Export (PDF / Excel)

---

## 4. Summary Flow (Recap)

```
ACADEMIC MANAGEMENT
        │
        ▼
Configure Academic Structure
        │
        ▼
Curriculum Management
        │
        ▼
Subject Management
        │
        ▼
Credit Allocation
        │
        ▼
Lesson Planning
        │
        ▼
Assignment Management
        │
        ▼
Learning Outcome Assessment
        │
        ▼
AI Academic Insights
        │
        ▼
Notifications • Reports • Analytics
```
