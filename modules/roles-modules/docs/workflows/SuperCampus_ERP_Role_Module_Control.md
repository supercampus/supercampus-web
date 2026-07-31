# SuperCampus ERP — Role & Module Control

> **Version:** 1.0  
> **Platform:** SuperCampus IEMS (Integrated Education Management System)  
> **Scope:** Enterprise Resource Planning Module  
> **Access Model:** MCAC (Module-Centric Access Control)  
> **Last Updated:** 2026-07-30

---

## Table of Contents

1. [ERP Philosophy & MCAC Model](#1-erp-philosophy--mcac-model)
2. [Scope Modifiers](#2-scope-modifiers)
3. [ERP Role Families](#3-erp-role-families)
4. [ERP Module Inventory by Domain](#4-erp-module-inventory-by-domain)
5. [ERP Role-Module Matrix](#5-erp-role-module-matrix)
   - 5.1 [Academic Core](#51-academic-core)
   - 5.2 [Student Services](#52-student-services)
   - 5.3 [Administrative & Finance](#53-administrative--finance)
   - 5.4 [Career & Analytics](#54-career--analytics)
6. [ERP Special Rules](#6-erp-special-rules)
   - 6.1 [Sensitive Module Restrictions](#61-sensitive-module-restrictions)
   - 6.2 [Self-Service Portal Rules](#62-self-service-portal-rules)
   - 6.3 [Cross-Module Data Flow](#63-cross-module-data-flow)
7. [ERP Implementation Notes](#7-erp-implementation-notes)
8. [Audit & Compliance](#8-audit--compliance)

---

## 1. ERP Philosophy & MCAC Model

The ERP is **modular by domain** (Academics, Finance, Operations, etc.). The same 5 Interaction Levels apply. Because the ERP has **30+ modules** and **30+ role families**, we use **Role Families** to keep the matrix readable. Individual roles inherit their family's level.

### Why MCAC for ERP?

| Problem with Binary Toggles | MCAC Solution |
|----------------------------|---------------|
| 30+ modules × 30+ roles = matrix hell | Role Families collapse roles into manageable groups |
| Faculty can see all students' marks | Scope Modifiers auto-restrict to Department/Self |
| HOD needs to approve but not configure | `Manage` = Approve; `Admin` = Configure |
| Students should only see their own data | `Self` scope auto-applied to Student/Parent families |

---

## 2. Scope Modifiers

The system **automatically scopes** data access based on the role's organizational position. Scope is applied **in addition to** the Interaction Level.

| Scope | Meaning | Typical For |
|-------|---------|-------------|
| **Self** | Only their own records | Student, Parent, Faculty (personal data) |
| **Department** | Records within their department | HOD, Exam Cell, Dept Coordinator, Teaching Faculty |
| **Institution** | All records within the college | Principal, Registrar, Management |
| **Cross-Institution** | Multi-college view across tenant group | Management, CEO, Trust |

> **Rule:** If a user has multiple roles, the system uses the **broadest scope** for `View` operations and the **narrowest scope** for `Edit/Delete` operations.

---

## 3. ERP Role Families

| # | Family | Key Roles | Default Scope |
|---|--------|-----------|---------------|
| **R1** | **Student** | Student, Research Scholar | Self |
| **R2** | **Parent** | Parent, Guardian | Self (linked to student) |
| **R3** | **Teaching Faculty** | Teaching Faculty, Class Incharge | Department |
| **R4** | **Lab Staff** | Lab Assistant, Technician, Non-Teaching Faculty | Department |
| **R5** | **HOD / Dean** | HOD, Dean Academics | Department |
| **R6** | **Principal** | Principal, Vice Principal, Academic Director | Institution |
| **R7** | **Registrar** | Registrar | Institution |
| **R8** | **Exam Controller** | Controller of Examinations, Exam Cell Officer | Institution |
| **R9** | **Student Affairs** | Student Affairs Officer | Institution |
| **R10** | **Hostel Staff** | Chief Warden, Warden, Asst. Warden, Hostel Clerk | Institution |
| **R11** | **Librarian** | Librarian, Asst. Librarian | Institution |
| **R12** | **Sports** | Sports Director, PE Director | Institution |
| **R13** | **Security** | Security Officer, Gate Guard | Institution |
| **R14** | **Finance** | Accountant, Fee Clerk, Cashier, Finance Officer, Bursar | Institution |
| **R15** | **Maintenance** | Maintenance Manager, Technician | Institution |
| **R16** | **Research** | Research Dean, Research Coordinator, Research Scholar | Department / Institution |
| **R17** | **Transport** | Transport Manager, Attendant, Driver | Institution |
| **R18** | **Canteen** | Canteen Manager, Mess Manager, Chef | Institution |
| **R19** | **Placement & Alumni** | TPO, Placement Coordinator, Alumni Officer | Institution |
| **R20** | **HR** | HR Admin, Payroll Officer | Institution |
| **R21** | **Management** | Chairman, Trustee, CEO, COO, CTO, CXO, Governing Council | Cross-Institution |
| **R22** | **Admin Staff** | Admin Officer, Office Superintendent, Data Entry Operator | Institution |
| **R23** | **Medical / Counselor** | Medical Officer, Nurse, Counselor, Psychologist | Institution |
| **R24** | **Quality & Compliance** | IQAC, NAAC, NBA, NIRF Coordinators | Institution |
| **R25** | **External** | Vendor, Supplier, Visitor, Guest, Alumni | Self / Limited |

---

## 4. ERP Module Inventory by Domain

| Domain | Modules |
|--------|---------|
| **Academic Core** | Academic Management, Timetable Management, Attendance Management, Examination System, Student Onboarding |
| **Student Services** | Student Self Service, Parent Self Service, Hostel Management, Transport Management, Library Management, Gate Pass Management, Visitor Management, Sick Room & Medical, Counselling & Wellness |
| **Administrative** | Document Management, No Due Management, Feedback & Grievance, Communication Management (Institutional), Form Builder (Institutional), Repairs & Maintenance |
| **Finance** | Fees & Finance, Vendor Management |
| **Career** | Placement & Career, Alumni Management |
| **Analytics** | Analytics & BI |
| **Employee** | Employee Self Service |

---

## 5. ERP Role-Module Matrix

### 5.1 Academic Core

| Role Family | Academic Mgmt | Timetable | Attendance | Examination | Student Onboarding |
|-------------|:-------------:|:---------:|:----------:|:-----------:|:------------------:|
| **R1 Student** | V | V | V | V | — |
| **R2 Parent** | V | V | V | V | — |
| **R3 Teaching Faculty** | O | O | O | V | — |
| **R4 Lab Staff** | V | V | O | V | — |
| **R5 HOD / Dean** | M | M | M | M | V |
| **R6 Principal** | A | A | A | A | A |
| **R7 Registrar** | M | M | M | M | A |
| **R8 Exam Controller** | V | V | V | A | V |
| **R9 Student Affairs** | V | V | V | V | O |
| **R22 Admin Staff** | O | O | O | O | O |

### 5.2 Student Services

| Role Family | Student Self Svc | Parent Self Svc | Hostel | Transport | Library | Gate Pass | Visitor | Sick Room | Counselling |
|-------------|:----------------:|:---------------:|:------:|:---------:|:-------:|:---------:|:-------:|:---------:|:-----------:|
| **R1 Student** | O | — | O | O | O | O | — | V | O |
| **R2 Parent** | — | O | V | V | V | V | — | — | — |
| **R3 Teaching Faculty** | — | — | — | — | O | V | — | — | — |
| **R5 HOD / Dean** | — | — | — | — | — | M | — | — | — |
| **R10 Hostel Staff** | — | — | A | — | — | — | — | — | — |
| **R11 Librarian** | — | — | — | — | A | — | — | — | — |
| **R13 Security** | — | — | — | — | — | M | A | — | — |
| **R17 Transport** | — | — | — | A | — | — | — | — | — |
| **R23 Medical / Counselor** | — | — | — | — | — | — | — | A | A |

### 5.3 Administrative & Finance

| Role Family | Document Mgmt | No Due | Feedback | Comm (Inst.) | Form Builder | Repairs | Fees & Finance | Vendor Mgmt |
|-------------|:---------------:|:------:|:--------:|:------------:|:------------:|:-------:|:--------------:|:-----------:|
| **R1 Student** | O | O | O | V | — | O | V | — |
| **R2 Parent** | O | — | O | V | — | — | V | — |
| **R3 Teaching Faculty** | O | — | O | O | — | O | — | — |
| **R5 HOD / Dean** | M | M | M | O | — | M | — | — |
| **R6 Principal** | A | A | A | A | A | A | A | A |
| **R14 Finance** | V | M | V | V | — | V | A | M |
| **R15 Maintenance** | V | — | V | V | — | A | — | O |
| **R21 Management** | A | A | A | A | A | A | A | A |
| **R22 Admin Staff** | O | O | O | O | O | O | O | O |
| **R25 External (Vendor)** | — | — | — | — | — | — | — | O |

### 5.4 Career & Analytics

| Role Family | Placement & Career | Alumni Mgmt | Analytics & BI | Employee Self Svc |
|-------------|:------------------:|:-----------:|:--------------:|:-----------------:|
| **R1 Student** | O | V | V | — |
| **R3 Teaching Faculty** | V | — | V | O |
| **R5 HOD / Dean** | M | — | M | — |
| **R6 Principal** | A | A | A | — |
| **R19 Placement & Alumni** | A | A | O | — |
| **R20 HR** | — | — | O | A |
| **R21 Management** | A | A | A | — |
| **R25 External (Recruiter)** | V | — | — | — |
| **R25 External (Alumni)** | — | O | — | — |

**Legend:** `—` = None | `V` = View | `O` = Operate | `M` = Manage | `A` = Admin

---

## 6. ERP Special Rules

### 6.1 Sensitive Module Restrictions

| Module | Special Rule |
|--------|-------------|
| **Fees & Finance** | Only R14 (Finance) and R21 (Management) get Admin. Teaching Faculty get `—` (no access). Students/Parents get View (see own ledger) + Operate (make payments). |
| **Examination** | Only R8 (Exam Controller) gets Admin. HOD gets Manage (moderation, result approval). Faculty get Operate (marks entry for their subjects only). Students get View (published results only). |
| **Attendance** | Faculty get Operate (mark attendance for their classes). Students get View. HOD gets Manage (corrections, reports). |
| **Gate Pass** | Security gets Manage (verify at gate). Students get Operate (request). Wardens get Manage (approve). |
| **No Due** | R14 (Finance) must approve Accounts clearance. R10 (Hostel) must approve Hostel clearance. R11 (Library) must approve Library clearance. No one gets Admin except R6/R21. |

### 6.2 Self-Service Portal Rules

| Portal | Access Rule |
|--------|-------------|
| **Student Self Service** | Every student gets Operate. This is their default landing page after admission. |
| **Parent Self Service** | Parents get Operate for linked students only. Cannot see other students. |
| **Employee Self Service** | All staff (R3–R24) get Operate. External users get `—`. |

### 6.3 Cross-Module Data Flow

| Flow | Permission Check |
|------|-----------------|
| **Student Onboarding → Academic Mgmt** | Registrar (A) triggers activation. |
| **CRM ERP Handoff → Student Onboarding** | Finance (M) confirms payment; Registrar (A) triggers onboarding. |
| **Fees & Finance → No Due** | Finance (A) must clear dues before No Due certificate generates. |
| **Examination → Placement** | Exam Controller (A) releases results; Placement (A) uses CGPA for eligibility. |

---

## 7. ERP Implementation Notes

### 7.1 HOD as Departmental Gatekeeper
- Most academic modules default to **Department scope** for HODs.
- They **cannot see other departments' data** unless explicitly granted Institution scope by Management.
- HODs can approve (Manage) but cannot configure (Admin) — this prevents accidental policy changes.

### 7.2 Principal vs. Management
| Aspect | Principal (R6) | Management (R21) |
|--------|---------------|------------------|
| Scope | Institution | Cross-Institution |
| Modules | Admin on all operational modules | Admin on all modules |
| View | One college only | All colleges in tenant group |
| Use Case | Day-to-day operations | Strategic oversight, analytics |

### 7.3 External Users
| External Type | Modules Accessible |
|--------------|-------------------|
| **Vendors** | Vendor Management only |
| **Recruiters** | Placement (read-only job postings + student eligibility lists) |
| **Alumni** | Alumni Management + Placement (job applications) |
| **Guests/Visitors** | Visitor Management (self-check-in) |

### 7.4 Data Entry Operators (R22)
- Get Operate on many modules but **never Approve or Delete**.
- They are the workhorses, not the decision-makers.
- Their actions are always logged and flagged for review if anomalous.

### 7.5 Research Scholars (R1 / R16)
- As students: Self scope on Academic modules.
- As researchers: Department scope on Research modules (if assigned).
- Dual-role users resolve via **permission union** (see Unified Platform doc).

---

## 8. Audit & Compliance

| Action | Logged Fields |
|--------|--------------|
| Marks entry | User ID, Subject, Student ID, Marks, Timestamp, IP |
| Fee payment | User ID, Amount, Mode, Student ID, Receipt #, Timestamp |
| Gate pass issue | User ID, Student ID, Type, Validity, Timestamp |
| Document generated | User ID, Doc Type, Student ID, Template, Timestamp |
| Attendance marked | User ID, Class, Date, Present/Absent list, Timestamp |
| Settings changed | User ID, Module, Setting Key, Old Value, New Value, Timestamp |

---

> **End of Document** — SuperCampus ERP Role & Module Control v1.0
