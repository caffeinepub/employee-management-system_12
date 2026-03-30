import { useEffect, useState } from "react";
import type { AttendanceRecord, Employee } from "../backend.d";
import { AttendanceStatus } from "../backend.d";
import { useBackend } from "../hooks/useBackend";

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  color: string;
}[] = [
  {
    value: AttendanceStatus.present,
    label: "Present",
    color: "bg-green-100 text-green-700",
  },
  {
    value: AttendanceStatus.absent,
    label: "Absent",
    color: "bg-red-100 text-red-700",
  },
  {
    value: AttendanceStatus.halfDay,
    label: "Half Day",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: AttendanceStatus.late,
    label: "Late",
    color: "bg-amber-100 text-amber-700",
  },
];

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

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  if (!opt) return null;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

export default function Attendance() {
  const backend = useBackend();
  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<number, { status: AttendanceStatus; notes: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [histEmpId, setHistEmpId] = useState<number>(0);
  const [histMonth, setHistMonth] = useState(new Date().getMonth() + 1);
  const [histYear, setHistYear] = useState(new Date().getFullYear());
  const [histRecords, setHistRecords] = useState<AttendanceRecord[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!backend) return;
    backend.getAllEmployees().then((emps) => {
      setEmployees(emps);
      const m: Record<number, { status: AttendanceStatus; notes: string }> = {};
      for (const e of emps) {
        m[Number(e.id)] = { status: AttendanceStatus.present, notes: "" };
      }
      setAttendanceMap(m);
      if (emps.length > 0) setHistEmpId(Number(emps[0].id));
    });
  }, [backend]);

  async function handleBulkSubmit() {
    if (!backend) return;
    setSubmitting(true);
    try {
      const records: AttendanceRecord[] = employees.map((emp) => ({
        id: 0n,
        employeeId: emp.id,
        date,
        status:
          attendanceMap[Number(emp.id)]?.status ?? AttendanceStatus.present,
        notes: attendanceMap[Number(emp.id)]?.notes ?? "",
        createdAt: 0n,
        updatedAt: 0n,
      }));
      await backend.bulkMarkAttendance(records);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function loadHistory() {
    if (!backend || !histEmpId) return;
    setHistLoading(true);
    try {
      const recs = await backend.getAttendanceByEmployee(
        BigInt(histEmpId),
        BigInt(histMonth),
        BigInt(histYear),
      );
      setHistRecords(recs);
    } finally {
      setHistLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (tab === "history" && backend) loadHistory();
  }, [tab, histEmpId, histMonth, histYear, backend]);

  const daysInMonth = new Date(histYear, histMonth, 0).getDate();
  const recordByDay: Record<number, AttendanceRecord> = {};
  for (const r of histRecords) {
    const day = Number.parseInt(r.date.split("-")[2]);
    recordByDay[day] = r;
  }

  const summary = { present: 0, absent: 0, halfDay: 0, late: 0 };
  for (const r of histRecords) {
    if (r.status === AttendanceStatus.present) summary.present++;
    else if (r.status === AttendanceStatus.absent) summary.absent++;
    else if (r.status === AttendanceStatus.halfDay) summary.halfDay++;
    else if (r.status === AttendanceStatus.late) summary.late++;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-slate-100">
          {(["mark", "history"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "mark" ? "Mark Attendance" : "Attendance History"}
            </button>
          ))}
        </div>

        {tab === "mark" && (
          <div className="p-6">
            <div className="flex flex-wrap gap-4 items-center mb-5">
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {submitted && (
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm">
                  Attendance saved!
                </div>
              )}
            </div>
            {employees.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No employees found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={Number(emp.id)}>
                        <td className="px-4 py-2 font-medium text-slate-800">
                          {emp.name}
                        </td>
                        <td className="px-4 py-2 text-slate-500">
                          {emp.department}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={
                              attendanceMap[Number(emp.id)]?.status ??
                              AttendanceStatus.present
                            }
                            onChange={(e) =>
                              setAttendanceMap((m) => ({
                                ...m,
                                [Number(emp.id)]: {
                                  ...m[Number(emp.id)],
                                  status: e.target.value as AttendanceStatus,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            placeholder="Optional notes"
                            value={attendanceMap[Number(emp.id)]?.notes ?? ""}
                            onChange={(e) =>
                              setAttendanceMap((m) => ({
                                ...m,
                                [Number(emp.id)]: {
                                  ...m[Number(emp.id)],
                                  notes: e.target.value,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={submitting || employees.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Submit Attendance"}
              </button>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Employee
                </span>
                <select
                  value={histEmpId}
                  onChange={(e) => setHistEmpId(Number(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map((e) => (
                    <option key={Number(e.id)} value={Number(e.id)}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Month
                </span>
                <select
                  value={histMonth}
                  onChange={(e) => setHistMonth(Number(e.target.value))}
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
                  value={histYear}
                  onChange={(e) => setHistYear(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {histLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: "Present",
                      value: summary.present,
                      color: "bg-green-100 text-green-700",
                    },
                    {
                      label: "Absent",
                      value: summary.absent,
                      color: "bg-red-100 text-red-700",
                    },
                    {
                      label: "Half Day",
                      value: summary.halfDay,
                      color: "bg-blue-100 text-blue-700",
                    },
                    {
                      label: "Late",
                      value: summary.late,
                      color: "bg-amber-100 text-amber-700",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-lg p-3 text-center ${s.color}`}
                    >
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const rec = recordByDay[day];
                      return (
                        <div
                          key={day}
                          className="aspect-square rounded-lg border border-slate-100 flex flex-col items-center justify-center text-xs"
                        >
                          <span className="text-slate-500 mb-0.5">{day}</span>
                          {rec ? (
                            <StatusBadge status={rec.status} />
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
