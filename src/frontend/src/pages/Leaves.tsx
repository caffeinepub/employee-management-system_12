import { Principal } from "@icp-sdk/core/principal";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Employee,
  LeaveBalance,
  LeaveQuota,
  LeaveRequest,
} from "../backend.d";
import { LeaveStatus, LeaveType } from "../backend.d";
import { useBackend } from "../hooks/useBackend";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LeaveType.pl]: "Privilege Leave (PL)",
  [LeaveType.cl]: "Casual Leave (CL)",
  [LeaveType.sl]: "Sick Leave (SL)",
};

function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, string> = {
    [LeaveStatus.pending]: "bg-amber-100 text-amber-700",
    [LeaveStatus.approved]: "bg-green-100 text-green-700",
    [LeaveStatus.rejected]: "bg-red-100 text-red-700",
  };
  const labels: Record<LeaveStatus, string> = {
    [LeaveStatus.pending]: "Pending",
    [LeaveStatus.approved]: "Approved",
    [LeaveStatus.rejected]: "Rejected",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function Leaves() {
  const backend = useBackend();
  const [tab, setTab] = useState<"requests" | "apply" | "balances" | "quota">(
    "requests",
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");
  const [loading, setLoading] = useState(false);

  const [applyForm, setApplyForm] = useState({
    employeeId: 0,
    leaveType: LeaveType.pl,
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const [balanceYear, setBalanceYear] = useState(new Date().getFullYear());
  const [balances, setBalances] = useState<Record<number, LeaveBalance | null>>(
    {},
  );
  const [balancesLoading, setBalancesLoading] = useState(false);

  const [quotaYear, setQuotaYear] = useState(new Date().getFullYear());
  const [quota, setQuota] = useState<LeaveQuota | null>(null);
  const [quotaForm, setQuotaForm] = useState({ pl: 15, cl: 10, sl: 12 });
  const [savingQuota, setSavingQuota] = useState(false);

  const empMap = Object.fromEntries(
    employees.map((e) => [Number(e.id), e.name]),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!backend) return;
    backend.getAllEmployees().then((emps) => {
      setEmployees(emps);
      if (emps.length > 0)
        setApplyForm((f) => ({ ...f, employeeId: Number(emps[0].id) }));
    });
  }, [backend]);

  async function loadRequests() {
    if (!backend) return;
    setLoading(true);
    try {
      let reqs: LeaveRequest[];
      if (statusFilter) {
        reqs = await backend.getLeaveRequestsByStatus(
          statusFilter as LeaveStatus,
        );
      } else {
        const [p, a, r] = await Promise.all([
          backend.getLeaveRequestsByStatus(LeaveStatus.pending),
          backend.getLeaveRequestsByStatus(LeaveStatus.approved),
          backend.getLeaveRequestsByStatus(LeaveStatus.rejected),
        ]);
        reqs = [...p, ...a, ...r];
      }
      setRequests(reqs);
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (tab === "requests" && backend) loadRequests();
  }, [tab, statusFilter, backend]);

  useEffect(() => {
    if (tab === "quota" && backend) {
      backend.getLeaveQuota(BigInt(quotaYear)).then((q) => {
        if (q) {
          setQuota(q);
          setQuotaForm({
            pl: Number(q.plQuota),
            cl: Number(q.clQuota),
            sl: Number(q.slQuota),
          });
        }
      });
    }
  }, [tab, quotaYear, backend]);

  useEffect(() => {
    if (tab === "balances" && employees.length > 0 && backend) {
      setBalancesLoading(true);
      Promise.all(
        employees.map((e) =>
          backend
            .getLeaveBalance(e.id, BigInt(balanceYear))
            .then((b) => ({ id: Number(e.id), b })),
        ),
      ).then((results) => {
        const m: Record<number, LeaveBalance | null> = {};
        for (const { id, b } of results) {
          m[id] = b ?? null;
        }
        setBalances(m);
        setBalancesLoading(false);
      });
    }
  }, [tab, balanceYear, employees, backend]);

  async function handleApprove(id: bigint) {
    if (!backend) return;
    await backend.approveLeaveRequest(id);
    await loadRequests();
  }

  async function handleReject(id: bigint) {
    if (!backend) return;
    await backend.rejectLeaveRequest(id);
    await loadRequests();
  }

  async function handleApply() {
    if (!backend) return;
    setApplying(true);
    try {
      const req: LeaveRequest = {
        id: 0n,
        employeeId: BigInt(applyForm.employeeId),
        leaveType: applyForm.leaveType,
        fromDate: applyForm.fromDate,
        toDate: applyForm.toDate,
        reason: applyForm.reason,
        status: LeaveStatus.pending,
        appliedOn: new Date().toISOString().split("T")[0],
        reviewedOn: "",
        reviewedBy: Principal.anonymous(),
        createdAt: 0n,
        updatedAt: 0n,
      };
      await backend.applyLeaveRequest(req);
      setApplySuccess(true);
      setApplyForm((f) => ({ ...f, fromDate: "", toDate: "", reason: "" }));
      setTimeout(() => setApplySuccess(false), 3000);
    } finally {
      setApplying(false);
    }
  }

  async function handleSaveQuota() {
    if (!backend) return;
    setSavingQuota(true);
    try {
      const q: LeaveQuota = {
        year: BigInt(quotaYear),
        plQuota: BigInt(quotaForm.pl),
        clQuota: BigInt(quotaForm.cl),
        slQuota: BigInt(quotaForm.sl),
        createdAt: 0n,
        updatedAt: 0n,
      };
      await backend.setLeaveQuota(BigInt(quotaYear), q);
      setQuota(q);
    } finally {
      setSavingQuota(false);
    }
  }

  const tabs = [
    { id: "requests", label: "All Requests" },
    { id: "apply", label: "Apply Leave" },
    { id: "balances", label: "Leave Balances" },
    { id: "quota", label: "Leave Quota" },
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="p-5">
          <div className="mb-4 flex gap-3 flex-wrap items-center">
            <span className="text-sm text-slate-600">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as LeaveStatus | "")
              }
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value={LeaveStatus.pending}>Pending</option>
              <option value={LeaveStatus.approved}>Approved</option>
              <option value={LeaveStatus.rejected}>Rejected</option>
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              No leave requests found
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
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={Number(r.id)} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">
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
                        <LeaveStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.status === LeaveStatus.pending && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.id)}
                              className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
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

      {tab === "apply" && (
        <div className="p-6 max-w-lg">
          {applySuccess && (
            <div className="mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm">
              Leave applied successfully!
            </div>
          )}
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Employee
              </span>
              <select
                value={applyForm.employeeId}
                onChange={(e) =>
                  setApplyForm((f) => ({
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
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Leave Type
              </span>
              <select
                value={applyForm.leaveType}
                onChange={(e) =>
                  setApplyForm((f) => ({
                    ...f,
                    leaveType: e.target.value as LeaveType,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  From Date
                </span>
                <input
                  type="date"
                  value={applyForm.fromDate}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, fromDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  To Date
                </span>
                <input
                  type="date"
                  value={applyForm.toDate}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, toDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Reason
              </span>
              <textarea
                rows={3}
                value={applyForm.reason}
                onChange={(e) =>
                  setApplyForm((f) => ({ ...f, reason: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for leave..."
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || !applyForm.fromDate || !applyForm.toDate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {applying ? "Applying..." : "Apply for Leave"}
            </button>
          </div>
        </div>
      )}

      {tab === "balances" && (
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-slate-600">Year:</span>
            <input
              type="number"
              value={balanceYear}
              onChange={(e) => setBalanceYear(Number(e.target.value))}
              className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {balancesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-center">PL Total</th>
                    <th className="px-4 py-3 text-center">PL Used</th>
                    <th className="px-4 py-3 text-center">PL Rem.</th>
                    <th className="px-4 py-3 text-center">CL Total</th>
                    <th className="px-4 py-3 text-center">CL Used</th>
                    <th className="px-4 py-3 text-center">CL Rem.</th>
                    <th className="px-4 py-3 text-center">SL Total</th>
                    <th className="px-4 py-3 text-center">SL Used</th>
                    <th className="px-4 py-3 text-center">SL Rem.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp, i) => {
                    const b = balances[Number(emp.id)];
                    return (
                      <tr
                        key={Number(emp.id)}
                        className={i % 2 === 1 ? "bg-slate-50/50" : ""}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.plTotal) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.plUsed) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-green-600">
                          {b ? Number(b.plTotal) - Number(b.plUsed) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.clTotal) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.clUsed) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-green-600">
                          {b ? Number(b.clTotal) - Number(b.clUsed) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.slTotal) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b ? Number(b.slUsed) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-green-600">
                          {b ? Number(b.slTotal) - Number(b.slUsed) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "quota" && (
        <div className="p-6 max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-slate-600">Year:</span>
            <input
              type="number"
              value={quotaYear}
              onChange={(e) => setQuotaYear(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-4">
            {(
              [
                ["pl", "Privilege Leave (PL) Days"],
                ["cl", "Casual Leave (CL) Days"],
                ["sl", "Sick Leave (SL) Days"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  {label}
                </span>
                <input
                  type="number"
                  min={0}
                  value={quotaForm[key]}
                  onChange={(e) =>
                    setQuotaForm((f) => ({
                      ...f,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleSaveQuota}
              disabled={savingQuota}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {savingQuota ? "Saving..." : "Save Quota"}
            </button>
          </div>
          {quota && (
            <div className="mt-5 p-4 bg-slate-50 rounded-lg text-sm">
              <div className="font-medium text-slate-700 mb-2">
                Current Quota ({Number(quota.year)})
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-purple-100 text-purple-700 rounded p-2">
                  <div className="font-bold text-lg">
                    {Number(quota.plQuota)}
                  </div>
                  <div className="text-xs">PL</div>
                </div>
                <div className="bg-teal-100 text-teal-700 rounded p-2">
                  <div className="font-bold text-lg">
                    {Number(quota.clQuota)}
                  </div>
                  <div className="text-xs">CL</div>
                </div>
                <div className="bg-orange-100 text-orange-700 rounded p-2">
                  <div className="font-bold text-lg">
                    {Number(quota.slQuota)}
                  </div>
                  <div className="text-xs">SL</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
