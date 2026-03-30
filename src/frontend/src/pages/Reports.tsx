import { useEffect, useState } from "react";
import type {
  AttendanceRecord,
  Employee,
  LeaveRequest,
  StatutoryRecord,
} from "../backend.d";
import { AttendanceStatus, LeaveStatus, LeaveType } from "../backend.d";
import { useBackend } from "../hooks/useBackend";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function fmt(n: number) {
  return n.toFixed(2);
}

export default function Reports() {
  const backend = useBackend();
  const [tab, setTab] = useState<"attendance" | "leave" | "statutory">(
    "attendance",
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const empMap = Object.fromEntries(
    employees.map((e) => [Number(e.id), e.name]),
  );

  const [attDate, setAttDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attRecords, setAttRecords] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear());
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [leaveRecords, setLeaveRecords] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [statMonth, setStatMonth] = useState(new Date().getMonth() + 1);
  const [statYear, setStatYear] = useState(new Date().getFullYear());
  const [statRecords, setStatRecords] = useState<StatutoryRecord[]>([]);
  const [statLoading, setStatLoading] = useState(false);

  useEffect(() => {
    if (backend) backend.getAllEmployees().then(setEmployees);
  }, [backend]);

  async function loadAttendance() {
    if (!backend) return;
    setAttLoading(true);
    const recs = await backend.getAttendanceByDate(attDate);
    setAttRecords(recs);
    setAttLoading(false);
  }

  async function loadLeaves() {
    if (!backend) return;
    setLeaveLoading(true);
    const [p, a, r] = await Promise.all([
      backend.getLeaveRequestsByStatus(LeaveStatus.pending),
      backend.getLeaveRequestsByStatus(LeaveStatus.approved),
      backend.getLeaveRequestsByStatus(LeaveStatus.rejected),
    ]);
    let all = [...p, ...a, ...r];
    if (leaveType) all = all.filter((l) => l.leaveType === leaveType);
    all = all.filter((l) => l.fromDate.startsWith(String(leaveYear)));
    setLeaveRecords(all);
    setLeaveLoading(false);
  }

  async function loadStatutory() {
    if (!backend) return;
    setStatLoading(true);
    const recs = await backend.getStatutoryByMonth(
      BigInt(statMonth),
      BigInt(statYear),
    );
    setStatRecords(recs);
    setStatLoading(false);
  }

  const attStatusColors: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: "bg-green-100 text-green-700",
    [AttendanceStatus.absent]: "bg-red-100 text-red-700",
    [AttendanceStatus.late]: "bg-amber-100 text-amber-700",
    [AttendanceStatus.halfDay]: "bg-blue-100 text-blue-700",
  };
  const attStatusLabels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.present]: "Present",
    [AttendanceStatus.absent]: "Absent",
    [AttendanceStatus.late]: "Late",
    [AttendanceStatus.halfDay]: "Half Day",
  };
  const leaveStatusColors: Record<LeaveStatus, string> = {
    [LeaveStatus.pending]: "bg-amber-100 text-amber-700",
    [LeaveStatus.approved]: "bg-green-100 text-green-700",
    [LeaveStatus.rejected]: "bg-red-100 text-red-700",
  };

  const totalEsi = statRecords.reduce(
    (s, r) => s + r.esiEmployeeContribution + r.esiEmployerContribution,
    0,
  );
  const totalEpf = statRecords.reduce(
    (s, r) => s + r.epfEmployeeContribution + r.epfEmployerContribution,
    0,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {(["attendance", "leave", "statutory"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "attendance"
              ? "Attendance Report"
              : t === "leave"
                ? "Leave Report"
                : "Statutory Report"}
          </button>
        ))}
      </div>

      {tab === "attendance" && (
        <div className="p-5">
          <div className="flex flex-wrap gap-4 items-end mb-5">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Date
              </span>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={loadAttendance}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
          {attLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : attRecords.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              Select a date and click Generate Report.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {(
                  [
                    AttendanceStatus.present,
                    AttendanceStatus.absent,
                    AttendanceStatus.late,
                    AttendanceStatus.halfDay,
                  ] as AttendanceStatus[]
                ).map((s) => (
                  <div
                    key={s}
                    className={`rounded-lg p-3 text-center ${attStatusColors[s]}`}
                  >
                    <div className="text-xl font-bold">
                      {attRecords.filter((r) => r.status === s).length}
                    </div>
                    <div className="text-xs">{attStatusLabels[s]}</div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attRecords.map((r) => (
                      <tr key={Number(r.id)}>
                        <td className="px-4 py-3 font-medium">
                          {empMap[Number(r.employeeId)] ??
                            `#${Number(r.employeeId)}`}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attStatusColors[r.status]}`}
                          >
                            {attStatusLabels[r.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "leave" && (
        <div className="p-5">
          <div className="flex flex-wrap gap-4 items-end mb-5">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Year
              </span>
              <input
                type="number"
                value={leaveYear}
                onChange={(e) => setLeaveYear(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Leave Type
              </span>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType | "")}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value={LeaveType.pl}>PL</option>
                <option value={LeaveType.cl}>CL</option>
                <option value={LeaveType.sl}>SL</option>
              </select>
            </div>
            <button
              type="button"
              onClick={loadLeaves}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
          {leaveLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : leaveRecords.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              Set filters and click Generate Report.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left">To</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Applied On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRecords.map((r) => (
                    <tr key={Number(r.id)}>
                      <td className="px-4 py-3 font-medium">
                        {empMap[Number(r.employeeId)] ??
                          `#${Number(r.employeeId)}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                          {r.leaveType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.fromDate}</td>
                      <td className="px-4 py-3 text-slate-600">{r.toDate}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">
                        {r.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${leaveStatusColors[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.appliedOn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "statutory" && (
        <div className="p-5">
          <div className="flex flex-wrap gap-4 items-end mb-5">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Month
              </span>
              <select
                value={statMonth}
                onChange={(e) => setStatMonth(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={MONTHS.indexOf(m) + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Year
              </span>
              <input
                type="number"
                value={statYear}
                onChange={(e) => setStatYear(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={loadStatutory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
          {statLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : statRecords.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              Select month/year and click Generate Report.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-xs text-blue-500 mb-1">
                    Total ESI (Emp + Er)
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    ₹{fmt(totalEsi)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-xs text-purple-500 mb-1">
                    Total EPF (Emp + Er)
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    ₹{fmt(totalEpf)}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-right">Basic</th>
                      <th className="px-4 py-3 text-right">ESI (Emp)</th>
                      <th className="px-4 py-3 text-right">ESI (Er)</th>
                      <th className="px-4 py-3 text-right">EPF (Emp)</th>
                      <th className="px-4 py-3 text-right">EPF (Er)</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statRecords.map((r, i) => (
                      <tr
                        key={Number(r.id)}
                        className={i % 2 === 1 ? "bg-slate-50/50" : ""}
                      >
                        <td className="px-4 py-3 font-medium">
                          {empMap[Number(r.employeeId)] ??
                            `#${Number(r.employeeId)}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₹{fmt(r.basicSalary)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-600">
                          ₹{fmt(r.esiEmployeeContribution)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400">
                          ₹{fmt(r.esiEmployerContribution)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-600">
                          ₹{fmt(r.epfEmployeeContribution)}
                        </td>
                        <td className="px-4 py-3 text-right text-purple-400">
                          ₹{fmt(r.epfEmployerContribution)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ₹
                          {fmt(
                            r.esiEmployeeContribution +
                              r.esiEmployerContribution +
                              r.epfEmployeeContribution +
                              r.epfEmployerContribution,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
