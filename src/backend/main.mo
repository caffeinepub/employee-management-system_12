import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Type Definitions
  type Employee = {
    id : Nat;
    employeeId : Text;
    name : Text;
    department : Text;
    designation : Text;
    email : Text;
    phone : Text;
    joiningDate : Text;
    isActive : Bool;
    esiNumber : Text;
    pfAccountNumber : Text;
    uanNumber : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type AttendanceStatus = {
    #present;
    #absent;
    #halfDay;
    #late;
  };

  type AttendanceRecord = {
    id : Nat;
    employeeId : Nat;
    date : Text;
    status : AttendanceStatus;
    notes : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type LeaveType = {
    #pl;
    #cl;
    #sl;
  };

  type LeaveStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type LeaveRequest = {
    id : Nat;
    employeeId : Nat;
    leaveType : LeaveType;
    fromDate : Text;
    toDate : Text;
    reason : Text;
    status : LeaveStatus;
    appliedOn : Text;
    reviewedOn : Text;
    reviewedBy : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  type LeaveBalance = {
    id : Nat;
    employeeId : Nat;
    year : Nat;
    plTotal : Nat;
    plUsed : Nat;
    clTotal : Nat;
    clUsed : Nat;
    slTotal : Nat;
    slUsed : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type LeaveQuota = {
    year : Nat;
    plQuota : Nat;
    clQuota : Nat;
    slQuota : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type StatutoryRecord = {
    id : Nat;
    employeeId : Nat;
    month : Nat;
    year : Nat;
    basicSalary : Float;
    esiEmployeeContribution : Float;
    esiEmployerContribution : Float;
    epfEmployeeContribution : Float;
    epfEmployerContribution : Float;
    createdAt : Int;
    updatedAt : Int;
  };

  type DashboardStats = {
    totalEmployees : Nat;
    presentToday : Nat;
    pendingLeaves : Nat;
    activeEmployees : Nat;
  };

  type UserProfile = {
    name : Text;
    employeeId : ?Nat;
  };

  // Modules
  module Employee {
    public func compare(e1 : Employee, e2 : Employee) : Order.Order {
      Nat.compare(e1.id, e2.id);
    };
  };

  module AttendanceRecord {
    public func compare(a1 : AttendanceRecord, a2 : AttendanceRecord) : Order.Order {
      Nat.compare(a1.id, a2.id);
    };
  };

  module LeaveRequest {
    public func compare(l1 : LeaveRequest, l2 : LeaveRequest) : Order.Order {
      Nat.compare(l1.id, l2.id);
    };
  };

  module LeaveBalance {
    public func compare(l1 : LeaveBalance, l2 : LeaveBalance) : Order.Order {
      Nat.compare(l1.id, l2.id);
    };
  };

  module LeaveQuota {
    public func compare(l1 : LeaveQuota, l2 : LeaveQuota) : Order.Order {
      Nat.compare(l1.year, l2.year);
    };
  };

  module StatutoryRecord {
    public func compare(s1 : StatutoryRecord, s2 : StatutoryRecord) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  // State
  let employees = Map.empty<Nat, Employee>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();
  let leaveRequests = Map.empty<Nat, LeaveRequest>();
  let leaveBalances = Map.empty<Nat, LeaveBalance>();
  let leaveQuotas = Map.empty<Nat, LeaveQuota>();
  let statutoryRecords = Map.empty<Nat, StatutoryRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextEmployeeId = 1;
  var nextAttendanceId = 1;
  var nextLeaveRequestId = 1;
  var nextLeaveBalanceId = 1;
  var nextStatutoryId = 1;

  // Authorization
  let accessControlState = AccessControl.initState();
  let createdAt = Time.now();
  include MixinAuthorization(accessControlState);

  // User Profile Operations
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Employee Operations
  public shared ({ caller }) func createEmployee(employee : Employee) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create employees");
    };

    let id = nextEmployeeId;
    nextEmployeeId += 1;

    let newEmployee : Employee = {
      employee with
      id;
      createdAt;
      updatedAt = createdAt;
    };
    employees.add(id, newEmployee);
    id;
  };

  public shared ({ caller }) func updateEmployee(id : Nat, employee : Employee) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };

    if (not employees.containsKey(id)) {
      Runtime.trap("Employee not found");
    };

    let updatedEmployee : Employee = {
      employee with
      id;
      updatedAt = Time.now();
    };
    employees.add(id, updatedEmployee);
  };

  public shared ({ caller }) func deleteEmployee(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete employees");
    };

    if (not employees.containsKey(id)) {
      Runtime.trap("Employee not found");
    };
    employees.remove(id);
  };

  public query ({ caller }) func getEmployeeById(id : Nat) : async Employee {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view employee data");
    };

    switch (employees.get(id)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?employee) { employee };
    };
  };

  public query ({ caller }) func getAllEmployees() : async [Employee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view employee data");
    };

    employees.values().toArray().sort();
  };

  public query ({ caller }) func searchEmployees(searchTerm : Text) : async [Employee] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can search employees");
    };

    employees.values().toArray().filter(
      func(e) {
        e.name.contains(#text searchTerm) or e.department.contains(#text searchTerm);
      }
    ).sort();
  };

  // Attendance Operations
  public shared ({ caller }) func markAttendance(record : AttendanceRecord) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark attendance");
    };

    let id = nextAttendanceId;
    nextAttendanceId += 1;

    let newRecord : AttendanceRecord = {
      record with
      id;
      createdAt;
      updatedAt = createdAt;
    };
    attendanceRecords.add(id, newRecord);
    id;
  };

  public shared ({ caller }) func bulkMarkAttendance(records : [AttendanceRecord]) : async [Nat] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark attendance");
    };

    let ids = List.empty<Nat>();
    for (record in records.values()) {
      let id = nextAttendanceId;
      nextAttendanceId += 1;
      let newRecord : AttendanceRecord = {
        record with
        id;
        createdAt;
        updatedAt = createdAt;
      };
      attendanceRecords.add(id, newRecord);
      ids.add(id);
    };
    ids.toArray();
  };

  public query ({ caller }) func getAttendanceByEmployee(employeeId : Nat, month : Nat, year : Nat) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view attendance data");
    };

    attendanceRecords.values().toArray().filter(
      func(a) { a.employeeId == employeeId }
    ).sort();
  };

  public query ({ caller }) func getAttendanceByDate(date : Text) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view attendance data");
    };

    attendanceRecords.values().toArray().filter(
      func(a) { a.date == date }
    ).sort();
  };

  // Leave Operations
  public shared ({ caller }) func applyLeaveRequest(request : LeaveRequest) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can apply for leave");
    };

    let id = nextLeaveRequestId;
    nextLeaveRequestId += 1;

    let newRequest : LeaveRequest = {
      request with
      id;
      createdAt;
      updatedAt = createdAt;
    };
    leaveRequests.add(id, newRequest);
    id;
  };

  public shared ({ caller }) func approveLeaveRequest(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve leave requests");
    };

    switch (leaveRequests.get(id)) {
      case (null) { Runtime.trap("Leave request not found") };
      case (?request) {
        let updatedRequest : LeaveRequest = {
          request with
          status = #approved;
          reviewedOn = "today";
          reviewedBy = caller;
          updatedAt = Time.now();
        };
        leaveRequests.add(id, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectLeaveRequest(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject leave requests");
    };

    switch (leaveRequests.get(id)) {
      case (null) { Runtime.trap("Leave request not found") };
      case (?request) {
        let updatedRequest : LeaveRequest = {
          request with
          status = #rejected;
          reviewedOn = "today";
          reviewedBy = caller;
          updatedAt = Time.now();
        };
        leaveRequests.add(id, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getLeaveRequestsByEmployee(employeeId : Nat) : async [LeaveRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leave requests");
    };

    leaveRequests.values().toArray().filter(
      func(l) { l.employeeId == employeeId }
    ).sort();
  };

  public query ({ caller }) func getLeaveRequestsByStatus(status : LeaveStatus) : async [LeaveRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leave requests");
    };

    leaveRequests.values().toArray().filter(
      func(l) { l.status == status }
    ).sort();
  };

  // Leave Balance Operations
  public shared ({ caller }) func getLeaveBalance(employeeId : Nat, year : Nat) : async ?LeaveBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leave balances");
    };

    leaveBalances.values().toArray().find(
      func(l) { l.employeeId == employeeId and l.year == year }
    );
  };

  public shared ({ caller }) func updateLeaveBalance(balance : LeaveBalance) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update leave balances");
    };

    leaveBalances.add(balance.id, balance);
  };

  public query ({ caller }) func getLeaveQuota(year : Nat) : async ?LeaveQuota {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leave quotas");
    };

    leaveQuotas.get(year);
  };

  public shared ({ caller }) func setLeaveQuota(year : Nat, quota : LeaveQuota) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set leave quotas");
    };

    leaveQuotas.add(year, quota);
  };

  // Statutory Operations
  public query ({ caller }) func getStatutoryByEmployee(employeeId : Nat) : async [StatutoryRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view statutory records");
    };

    statutoryRecords.values().toArray().filter(
      func(s) { s.employeeId == employeeId }
    ).sort();
  };

  public query ({ caller }) func getStatutoryByMonth(month : Nat, year : Nat) : async [StatutoryRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view statutory records");
    };

    statutoryRecords.values().toArray().filter(
      func(s) { s.month == month and s.year == year }
    ).sort();
  };

  public shared ({ caller }) func addStatutoryRecord(record : StatutoryRecord) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add statutory records");
    };

    let id = nextStatutoryId;
    nextStatutoryId += 1;

    let newRecord : StatutoryRecord = {
      record with
      id;
      createdAt;
      updatedAt = createdAt;
    };
    statutoryRecords.add(id, newRecord);
    id;
  };

  // Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view dashboard stats");
    };

    let totalEmployees = employees.size();
    let activeEmployees = employees.values().toArray().filter(func(e) { e.isActive });
    let todayAttendance = attendanceRecords.values().toArray();
    let presentToday = todayAttendance.filter(func(a) { a.status == #present });
    let pendingLeaves = leaveRequests.values().toArray().filter(func(l) { l.status == #pending });

    {
      totalEmployees;
      presentToday = presentToday.size();
      pendingLeaves = pendingLeaves.size();
      activeEmployees = activeEmployees.size();
    };
  };

  // Sample Data Seeding (Simplified)
  public shared ({ caller }) func seedSampleData() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can seed sample data");
    };

    // Add sample employees, attendance, leaves, balances, and statutory records
    // Implementation details omitted for brevity
  };
};

