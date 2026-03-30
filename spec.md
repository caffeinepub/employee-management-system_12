# Employee Management System

## Current State
New project — no existing application files.

## Requested Changes (Diff)

### Add
- Full-stack Employee Management System with Motoko backend and React/TypeScript frontend
- Six core modules: Dashboard, Employee Management, Attendance, Leave Management, Statutory (ESI/EPF), Reports
- Sidebar navigation layout
- Sample/seed data for demonstration

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)

**Data Models:**
- `Employee`: id, name, employeeId, department, designation, email, phone, joiningDate, isActive, esiNumber, pfAccountNumber, uanNumber
- `AttendanceRecord`: id, employeeId, date, status (Present/Absent/HalfDay/Late), notes
- `LeaveRequest`: id, employeeId, leaveType (PL/CL/SL), fromDate, toDate, reason, status (Pending/Approved/Rejected), appliedOn, reviewedOn, reviewedBy
- `LeaveBalance`: employeeId, year, plTotal, plUsed, clTotal, clUsed, slTotal, slUsed
- `LeaveQuota`: year, plQuota, clQuota, slQuota
- `StatutoryRecord`: id, employeeId, month, year, basicSalary, esiEmployeeContribution, esiEmployerContribution, epfEmployeeContribution, epfEmployerContribution

**Backend APIs:**
- CRUD for employees
- CRUD for attendance records, bulk mark attendance for a day
- CRUD for leave requests, approve/reject leave
- CRUD for leave balances and quotas
- CRUD for statutory records
- Query functions: attendance by employee/month, leaves by employee/status, statutory by employee/month, dashboard stats
- Seed sample data function

### Frontend (React/TypeScript)

**Layout:**
- Sidebar with navigation links for all 6 modules
- Top header with title and user info
- Main content area

**Pages/Components:**
1. **Dashboard** — Stat cards (total employees, present today, pending leaves, this month ESI/EPF totals), recent attendance summary table, pending leave requests list
2. **Employees** — Employee table with search/filter by department; Add/Edit modal form; Delete confirmation; Employee detail view
3. **Attendance** — Date picker to select day, mark attendance for each employee (Present/Absent/HalfDay/Late); Per-employee calendar view; Monthly summary table
4. **Leave Management** — Tabs: Apply Leave form, Pending Requests (admin approve/reject), Leave Balance per employee, Leave history; Configurable quotas panel
5. **Statutory** — Per-employee ESI/EPF details; Monthly contribution table; Statutory compliance summary; Monthly report view
6. **Reports** — Three report types selectable: Attendance (daily/monthly), Leave, Statutory; Filter by date range/employee/department; Printable table view
