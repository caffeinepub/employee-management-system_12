import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Employee, StatutoryRecord } from "../backend.d";
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

export default function Statutory() {
  const backend = useBackend();
  const [tab, setTab] = useState<"details" | "monthly">("details");
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selEmpId, setSelEmpId] = useState<number>(0);
  const [empRecords, setEmpRecords] = useState<StatutoryRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthRecords, setMonthRecords] = useState<StatutoryRecord[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [mForm, setMForm] = useState({
    employeeId: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
  });
  const [saving, setSaving] = useState(false);

  const empMap = Object.fromEntries(employees.map((e) => [Number(e.id), e]));
  const selEmp = empMap[selEmpId];

  useEffect(() => {
    if (!backend) return;
    backend.getAllEmployees().then((emps) => {
      setEmployees(emps);
      if (emps.length > 0) {
        setSelEmpId(Number(emps[0].id));
        setMForm((f) => ({ ...f, employeeId: Number(emps[0].id) }));
      }
    });
  }, [backend]);

  useEffect(() => {
    if (!selEmpId || !backend) return;
    setDetailLoading(true);
    backend.getStatutoryByEmployee(BigInt(selEmpId)).then((recs) => {
      setEmpRecords(recs);
      setDetailLoading(false);
    });
  }, [selEmpId, backend]);

  useEffect(() => {
    if (tab !== "monthly" || !backend) return;
    setMonthLoading(true);
    backend.getStatutoryByMonth(BigInt(month), BigInt(year)).then((recs) => {
      setMonthRecords(recs);
      setMonthLoading(false);
    });
  }, [tab, month, year, backend]);

  async function handleAddRecord() {
    if (!backend) return;
    setSaving(true);
    try {
      const b = mForm.basicSalary;
      const rec: StatutoryRecord = {
        id: 0n,
        employeeId: BigInt(mForm.employeeId),
        month: BigInt(mForm.month),
        year: BigInt(mForm.year),
        basicSalary: b,
        esiEmployeeContribution: b * 0.0075,
        esiEmployerContribution: b * 0.0325,
        epfEmployeeContribution: b * 0.12,
        epfEmployerContribution: b * 0.12,
        createdAt: 0n,
        updatedAt: 0n,
      };
      await backend.addStatutoryRecord(rec);
      setModal(false);
      if (tab === "details") {
        backend.getStatutoryByEmployee(BigInt(selEmpId)).then(setEmpRecords);
      } else {
        backend
          .getStatutoryByMonth(BigInt(month), BigInt(year))
          .then(setMonthRecords);
      }
    } finally {
      setSaving(false);
    }
  }

  const totalEsiEmp = monthRecords.reduce(
    (s, r) => s + r.esiEmployeeContribution,
    0,
  );
  const totalEsiEr = monthRecords.reduce(
    (s, r) => s + r.esiEmployerContribution,
    0,
  );
  const totalEpfEmp = monthRecords.reduce(
    (s, r) => s + r.epfEmployeeContribution,
    0,
  );
  const totalEpfEr = monthRecords.reduce(
    (s, r) => s + r.epfEmployerContribution,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-slate-100 items-center">
          <div className="flex flex-1">
            {(["details", "monthly"] as const).map((t) => (
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
                {t === "details" ? "Employee Details" : "Monthly Report"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="mr-4 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            <Plus size={14} /> Add Record
          </button>
        </div>

        {tab === "details" && (
          <div className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-sm text-slate-600">Employee:</span>
              <select
                value={selEmpId}
                onChange={(e) => setSelEmpId(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {employees.map((e) => (
                  <option key={Number(e.id)} value={Number(e.id)}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            {selEmp && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-500 mb-1">ESI Number</div>
                  <div className="font-mono text-blue-800 text-sm">
                    {selEmp.esiNumber || "—"}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-500 mb-1">
                    PF Account Number
                  </div>
                  <div className="font-mono text-purple-800 text-sm">
                    {selEmp.pfAccountNumber || "—"}
                  </div>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <div className="text-xs text-teal-500 mb-1">UAN Number</div>
                  <div className="font-mono text-teal-800 text-sm">
                    {selEmp.uanNumber || "—"}
                  </div>
                </div>
              </div>
            )}
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              </div>
            ) : empRecords.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No statutory records for this employee
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Month/Year</th>
                      <th className="px-4 py-3 text-right">Basic Salary</th>
                      <th className="px-4 py-3 text-right">ESI (Emp)</th>
                      <th className="px-4 py-3 text-right">ESI (Er)</th>
                      <th className="px-4 py-3 text-right">EPF (Emp)</th>
                      <th className="px-4 py-3 text-right">EPF (Er)</th>
                      <th className="px-4 py-3 text-right">Total Ded.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empRecords.map((r, i) => (
                      <tr
                        key={Number(r.id)}
                        className={i % 2 === 1 ? "bg-slate-50/50" : ""}
                      >
                        <td className="px-4 py-3 font-medium">
                          {MONTHS[Number(r.month) - 1]} {Number(r.year)}
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
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          ₹
                          {fmt(
                            r.esiEmployeeContribution +
                              r.epfEmployeeContribution,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "monthly" && (
          <div className="p-5">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={MONTHS.indexOf(m) + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {monthLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              </div>
            ) : monthRecords.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No statutory records for this month
              </div>
            ) : (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRecords.map((r, i) => (
                      <tr
                        key={Number(r.id)}
                        className={i % 2 === 1 ? "bg-slate-50/50" : ""}
                      >
                        <td className="px-4 py-3 font-medium">
                          {empMap[Number(r.employeeId)]?.name ??
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
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="px-4 py-3">Totals</td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        ₹{fmt(totalEsiEmp)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-400">
                        ₹{fmt(totalEsiEr)}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-600">
                        ₹{fmt(totalEpfEmp)}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-400">
                        ₹{fmt(totalEpfEr)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                Add Statutory Record
              </h2>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Employee
                </span>
                <select
                  value={mForm.employeeId}
                  onChange={(e) =>
                    setMForm((f) => ({
                      ...f,
                      employeeId: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map((e) => (
                    <option key={Number(e.id)} value={Number(e.id)}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-1">
                    Month
                  </span>
                  <select
                    value={mForm.month}
                    onChange={(e) =>
                      setMForm((f) => ({ ...f, month: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    value={mForm.year}
                    onChange={(e) =>
                      setMForm((f) => ({ ...f, year: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Basic Salary (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  value={mForm.basicSalary}
                  onChange={(e) =>
                    setMForm((f) => ({
                      ...f,
                      basicSalary: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {mForm.basicSalary > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-medium text-slate-700 mb-2">
                    Auto-calculated contributions
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ESI Employee (0.75%)</span>
                    <span>₹{fmt(mForm.basicSalary * 0.0075)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ESI Employer (3.25%)</span>
                    <span>₹{fmt(mForm.basicSalary * 0.0325)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EPF Employee (12%)</span>
                    <span>₹{fmt(mForm.basicSalary * 0.12)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EPF Employer (12%)</span>
                    <span>₹{fmt(mForm.basicSalary * 0.12)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRecord}
                disabled={saving || mForm.basicSalary <= 0}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
