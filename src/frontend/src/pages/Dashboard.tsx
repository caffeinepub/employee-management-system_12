import {
  CheckCircle,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  AttendanceRecord,
  DashboardStats,
  Employee,
  LeaveRequest,
} from "../backend.d";
import { AttendanceStatus, LeaveStatus, LeaveType } from "../backend.d";
import { useBackend } from "../hooks/useBackend";
import type { Page } from "../types";

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: "bg-green-100 text-green-700",
    [AttendanceStatus.absent]: "bg-red-100 text-red-700",
    [AttendanceStatus.late]: "bg-amber-100 text-amber-700",
    [AttendanceStatus.halfDay]: "bg-blue-100 text-blue-700",
  };
  const labels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: "Present",
    [AttendanceStatus.absent]: "Absent",
    [AttendanceStatus.late]: "Late",
    [AttendanceStatus.halfDay]: "Half Day",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function LeaveTypeBadge({ type }: { type: LeaveType }) {
  const map: Record<LeaveType, string> = {
    [LeaveType.pl]: "bg-purple-100 text-purple-700",
    [LeaveType.cl]: "bg-teal-100 text-teal-700",
    [LeaveType.sl]: "bg-orange-100 text-orange-700",
  };
  const labels: Record<LeaveType, string> = {
    [LeaveType.pl]: "PL",
    [LeaveType.cl]: "CL",
    [LeaveType.sl]: "SL",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[type]}`}
    >
      {labels[type]}
    </span>
  );
}

interface Props {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const backend = useBackend();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>(
    [],
  );
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!backend) return;
    load();
  }, [backend]);

  async function load() {
    if (!backend) return;
    setLoading(true);
    try {
      let emps = await backend.getAllEmployees();
      if (emps.length === 0) {
        await backend.seedSampleData();
        emps = await backend.getAllEmployees();
      }
      setEmployees(emps);
      const [s, att, leaves] = await Promise.all([
        backend.getDashboardStats(),
        backend.getAttendanceByDate(today),
        backend.getLeaveRequestsByStatus(LeaveStatus.pending),
      ]);
      setStats(s);
      setTodayAttendance(att);
      setPendingLeaves(leaves);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: bigint) {
    if (!backend) return;
    await backend.approveLeaveRequest(id);
    setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleReject(id: bigint) {
    if (!backend) return;
    await backend.rejectLeaveRequest(id);
    setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
  }

  const nameMap = Object.fromEntries(
    employees.map((e) => [Number(e.id), e.name]),
  );

  if (loading || !backend) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Employees",
      value: Number(stats?.totalEmployees ?? 0),
      icon: <Users size={22} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Present Today",
      value: Number(stats?.presentToday ?? 0),
      icon: <UserCheck size={22} />,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Pending Leaves",
      value: Number(stats?.pendingLeaves ?? 0),
      icon: <Clock size={22} />,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Active Employees",
      value: Number(stats?.activeEmployees ?? 0),
      icon: <TrendingUp size={22} />,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}
            >
              {c.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{c.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Today's Attendance</h2>
            <button
              type="button"
              onClick={() => onNavigate("attendance")}
              className="text-blue-600 text-sm hover:underline"
            >
              View All
            </button>
          </div>
          {todayAttendance.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No attendance marked for today
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayAttendance.slice(0, 8).map((a) => (
                    <tr key={Number(a.id)} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {nameMap[Number(a.employeeId)] ??
                          `Emp #${Number(a.employeeId)}`}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500 truncate max-w-[120px]">
                        {a.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Pending Leave Requests
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("leaves")}
              className="text-blue-600 text-sm hover:underline"
            >
              View All
            </button>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No pending leave requests
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.slice(0, 6).map((l) => (
                <div
                  key={Number(l.id)}
                  className="px-5 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-700 text-sm truncate">
                      {nameMap[Number(l.employeeId)] ??
                        `Emp #${Number(l.employeeId)}`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {l.fromDate} → {l.toDate}
                    </div>
                  </div>
                  <LeaveTypeBadge type={l.leaveType} />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleApprove(l.id)}
                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(l.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
