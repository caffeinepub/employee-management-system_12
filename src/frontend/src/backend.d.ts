import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaveRequest {
    id: bigint;
    status: LeaveStatus;
    appliedOn: string;
    createdAt: bigint;
    reviewedBy: Principal;
    reviewedOn: string;
    toDate: string;
    updatedAt: bigint;
    employeeId: bigint;
    fromDate: string;
    leaveType: LeaveType;
    reason: string;
}
export interface LeaveQuota {
    clQuota: bigint;
    createdAt: bigint;
    year: bigint;
    plQuota: bigint;
    updatedAt: bigint;
    slQuota: bigint;
}
export interface StatutoryRecord {
    id: bigint;
    month: bigint;
    epfEmployeeContribution: number;
    createdAt: bigint;
    year: bigint;
    esiEmployeeContribution: number;
    updatedAt: bigint;
    employeeId: bigint;
    epfEmployerContribution: number;
    basicSalary: number;
    esiEmployerContribution: number;
}
export interface Employee {
    id: bigint;
    name: string;
    designation: string;
    createdAt: bigint;
    joiningDate: string;
    isActive: boolean;
    email: string;
    updatedAt: bigint;
    employeeId: string;
    phone: string;
    pfAccountNumber: string;
    department: string;
    uanNumber: string;
    esiNumber: string;
}
export interface AttendanceRecord {
    id: bigint;
    status: AttendanceStatus;
    date: string;
    createdAt: bigint;
    updatedAt: bigint;
    employeeId: bigint;
    notes: string;
}
export interface LeaveBalance {
    id: bigint;
    plTotal: bigint;
    plUsed: bigint;
    createdAt: bigint;
    year: bigint;
    slUsed: bigint;
    updatedAt: bigint;
    slTotal: bigint;
    employeeId: bigint;
    clTotal: bigint;
    clUsed: bigint;
}
export interface UserProfile {
    name: string;
    employeeId?: bigint;
}
export interface DashboardStats {
    totalEmployees: bigint;
    presentToday: bigint;
    activeEmployees: bigint;
    pendingLeaves: bigint;
}
export enum AttendanceStatus {
    halfDay = "halfDay",
    present = "present",
    late = "late",
    absent = "absent"
}
export enum LeaveStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum LeaveType {
    cl = "cl",
    pl = "pl",
    sl = "sl"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStatutoryRecord(record: StatutoryRecord): Promise<bigint>;
    applyLeaveRequest(request: LeaveRequest): Promise<bigint>;
    approveLeaveRequest(id: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkMarkAttendance(records: Array<AttendanceRecord>): Promise<Array<bigint>>;
    createEmployee(employee: Employee): Promise<bigint>;
    deleteEmployee(id: bigint): Promise<void>;
    getAllEmployees(): Promise<Array<Employee>>;
    getAttendanceByDate(date: string): Promise<Array<AttendanceRecord>>;
    getAttendanceByEmployee(employeeId: bigint, month: bigint, year: bigint): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getEmployeeById(id: bigint): Promise<Employee>;
    getLeaveBalance(employeeId: bigint, year: bigint): Promise<LeaveBalance | null>;
    getLeaveQuota(year: bigint): Promise<LeaveQuota | null>;
    getLeaveRequestsByEmployee(employeeId: bigint): Promise<Array<LeaveRequest>>;
    getLeaveRequestsByStatus(status: LeaveStatus): Promise<Array<LeaveRequest>>;
    getStatutoryByEmployee(employeeId: bigint): Promise<Array<StatutoryRecord>>;
    getStatutoryByMonth(month: bigint, year: bigint): Promise<Array<StatutoryRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAttendance(record: AttendanceRecord): Promise<bigint>;
    rejectLeaveRequest(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchEmployees(searchTerm: string): Promise<Array<Employee>>;
    seedSampleData(): Promise<void>;
    setLeaveQuota(year: bigint, quota: LeaveQuota): Promise<void>;
    updateEmployee(id: bigint, employee: Employee): Promise<void>;
    updateLeaveBalance(balance: LeaveBalance): Promise<void>;
}
