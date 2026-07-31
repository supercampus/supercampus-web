# Repairs & Maintenance Workflow

## Overview

The Repairs & Maintenance module manages the full lifecycle of maintenance requests — from ticket creation and team/vendor assignment to work completion, quality verification, preventive maintenance scheduling, and AI-driven insights.

---

## Main Workflow

```
Repairs & Maintenance
│
▼
Maintenance Request Raised
│
▼
Select Asset / Building / Location
│
▼
Select Issue Category & Priority Level
│
▼
Enter Issue Details & Upload Images (Optional)
│
▼
Maintenance Ticket Generated
│
▼
Ticket Review & Validation
│
┌─────────────┴─────────────┐
▼                           ▼
Valid Request          Invalid / Duplicate
│                           │
▼                           ▼
Assign Maintenance Team    Notify Requester
│
▼
Determine Service Type
│
┌──────┴────────┐
▼               ▼
Internal Team   External Vendor
│               │
▼               ▼
Assign Technician    Select Approved Vendor
│               │
└──────┬────────┘
│
▼
Generate Work Order
│
▼
Technician / Vendor Accepts Work Order
│
▼
Repair / Maintenance Activity
│
▼
Update Work Progress Status
│
▼
Replace Parts (If Required)
│
▼
Record Labour & Materials Used
│
▼
Repair Work Completed
│
▼
Inspection & Quality Verification
│
┌─────┴─────────────┐
▼                   ▼
Approved           Rework Required
│                   │
▼                   ▼
Close Work Order   Return to Technician
│
▼
Update Asset Maintenance History
│
▼
Check Preventive Maintenance Schedule
│
┌────┴───────────────┐
▼                    ▼
Schedule Due      No Schedule Due
▼                    ▼
Generate PM Task   Complete Process
│
▼
Notify Maintenance Team
│
▼
Perform Preventive Maintenance
│
▼
Update Maintenance Log
│
▼
Evaluate Vendor Performance
│
▼
AI Maintenance Insights
│
├──────────────┬──────────────┬──────────────┐
▼              ▼              ▼
Recurring      High Cost     Asset Health
Issues         Repairs       Prediction
│
▼
Notifications & Alerts
│
├──────────────┬──────────────┬──────────────┐
▼              ▼              ▼
Requester      Technician     Facility Manager
│
▼
Reports & Analytics
│
├──────────────┬──────────────┬──────────────┬──────────────┐
▼              ▼              ▼              ▼
Ticket         Work Order     Asset          Vendor
Reports        Reports        Maintenance    Performance
                              Reports
│
▼
Process Completed
```

---

## Module Navigation

```
Repairs & Maintenance
│
├── Dashboard
├── Service Requests / Maintenance Tickets
├── Work Orders
├── Asset Maintenance
├── Preventive Maintenance
├── Vendors Management
├── AI Maintenance Insights
├── Notifications & Alerts
└── Reports & Analytics
```

---

## Individual Workflows

### 1. Service Requests / Maintenance Ticket

| Step | Action | Details |
|------|--------|---------|
| 1 | **Student / Staff / Admin Login** | Authenticate into the system |
| 2 | **Raise Maintenance Request** | Initiate a new service request |
| 3 | **Select Issue Category** | Choose from: Electrical / Plumbing / IT & Network |
| 4 | **Select Asset / Location** | Specify the affected asset or building area |
| 5 | **Enter Issue Description & Priority** | Describe the problem and set urgency |
| 6 | **Upload Images / Supporting Documents** | Attach visual evidence (optional) |
| 7 | **Submit Maintenance Ticket** | Send the request for review |
| 8 | **Ticket Number Generated Automatically** | System assigns a unique ticket ID |
| 9 | **Ticket Assigned for Review** | Routed to the maintenance team for validation |

---

### 2. Work Orders to Vendors

| Step | Action | Details |
|------|--------|---------|
| 1 | **Maintenance Ticket Reviewed** | Ticket assessed for validity and scope |
| 2 | **Determine Internal or Vendor Work** | Decide if handled in-house or outsourced |
| 3 | **Internal Team** → Assign Technician | Allocate an internal technician |
| 4 | **External Vendor** → Select Approved Vendor | Choose from pre-approved vendor list |
| 5 | **Generate Work Order** | Create a formal work order document |
| 6 | **Define Scope, Timeline & Cost** | Specify deliverables, deadlines, and budget |
| 7 | **Vendor Accepts Work Order** | Vendor confirms and begins work |
| 8 | **Repair / Service Completed** | Work is finished by technician or vendor |
| 9 | **Completion Verification & Approval** | Quality check by facility manager |
| 10 | **Work Order Closed & Recorded** | Archive work order and update records |

---

### 3. Asset Maintenance

```
Select Campus Asset
│
▼
View Asset Maintenance History
│
▼
Record Inspection / Service Details
│
▼
Update Asset Condition & Status
│
┌───────────────┼────────────────┐
▼               ▼                ▼
Good           Needs Repair     Replace
│               │                │
▼               ▼                ▼
Continue Use   Raise Work Order  Asset Replacement
│               │                │
└───────────────┴────────────────┘
│
▼
Update Asset Maintenance Log
```

---

### 4. Preventive Maintenance

| Step | Action | Details |
|------|--------|---------|
| 1 | **Create Maintenance Schedule** | Define a preventive maintenance plan |
| 2 | **Select Asset Categories** | Choose which assets to include |
| 3 | **Define Frequency** | Set interval: Daily / Weekly / Monthly |
| 4 | **Generate Preventive Maintenance Plan** | System creates the schedule |
| 5 | **Notify Maintenance Team / Vendor** | Alert responsible parties |
| 6 | **Perform Scheduled Maintenance** | Execute the planned maintenance |
| 7 | **Record Inspection & Service** | Log all activities performed |
| 8 | **Update Next Maintenance Schedule** | Set the next due date |
| 9 | **Preventive Maintenance History** | Maintain a complete audit trail |

---

### 5. Vendors Management

```
Register New Vendor
│
▼
Enter Vendor Profile Details
│
▼
Upload Licenses & Certifications
│
▼
Vendor Verification Process
│
┌────────────┴────────────┐
▼                         ▼
Approved                  Rejected
│                         │
▼                         ▼
Add to Approved List      Notify Vendor
│
▼
Assign Work Orders
│
▼
Track Vendor Performance
│
▼
Rating • SLA • Service History
│
▼
Vendor Performance Reports
```

---

## Complete Repairs & Maintenance Workflow (Summary)

```
Repairs & Maintenance
│
▼
Service Request Raised
│
▼
Ticket Review & Assignment
│
▼
Internal Team or Vendor Decision
│
┌───────────┴────────────┐
▼                        ▼
Internal Repair      Vendor Work Order
│                        │
└───────────┬────────────┘
│
▼
Repair / Maintenance Completed
│
▼
Asset Maintenance Updated
│
▼
Preventive Maintenance Scheduled
│
▼
Vendor Performance Evaluation
│
▼
Notifications • Reports • Analytics
```

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| **Ticket Management** | End-to-end tracking of maintenance requests |
| **Work Orders** | Formal assignment to internal teams or external vendors |
| **Asset Tracking** | Maintenance history and condition monitoring per asset |
| **Preventive Maintenance** | Scheduled upkeep to prevent breakdowns |
| **Vendor Management** | Registration, verification, and performance tracking |
| **AI Insights** | Recurring issues, cost analysis, and asset health predictions |
| **Notifications** | Alerts for requesters, technicians, and facility managers |
| **Reports** | Ticket reports, work order reports, asset maintenance, vendor performance |
