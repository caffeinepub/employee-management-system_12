import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Employee } from "../backend.d";
import { useBackend } from "../hooks/useBackend";

const DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
  "IT",
  "Legal",
];

function emptyEmployee(): Employee {
  return {
    id: 0n,
    name: "",
    designation: "",
    joiningDate: "",
    isActive: true,
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    uanNumber: "",
    esiNumber: "",
    pfAccountNumber: "",
    createdAt: 0n,
    updatedAt: 0n,
  };
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function Employees() {
  const backend = useBackend();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    open: boolean;
    editing: Employee | null;
  }>({ open: false, editing: null });
  const [form, setForm] = useState<Employee>(emptyEmployee());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  async function load() {
    if (!backend) return;
    setLoading(true);
    try {
      const emps = await backend.getAllEmployees();
      setEmployees(emps);
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (backend) load();
  }, [backend]);

  const filtered = employees.filter((e) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      e.name.toLowerCase().includes(s) ||
      e.employeeId.toLowerCase().includes(s) ||
      e.department.toLowerCase().includes(s);
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  function openAdd() {
    setForm(emptyEmployee());
    setModal({ open: true, editing: null });
  }

  function openEdit(emp: Employee) {
    setForm({ ...emp });
    setModal({ open: true, editing: emp });
  }

  async function handleSave() {
    if (!backend) return;
    setSaving(true);
    try {
      if (modal.editing) {
        await backend.updateEmployee(modal.editing.id, form);
      } else {
        await backend.createEmployee(form);
      }
      setModal({ open: false, editing: null });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: bigint) {
    if (!backend) return;
    await backend.deleteEmployee(id);
    setDeleteId(null);
    await load();
  }

  function setField(key: keyof Employee, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No employees found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Emp ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Designation</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp, i) => (
                  <tr
                    key={Number(emp.id)}
                    className={i % 2 === 1 ? "bg-slate-50/50" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                      {emp.employeeId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {emp.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {emp.department}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {emp.designation}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {emp.email}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{emp.phone}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={emp.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(emp.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {modal.editing ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                type="button"
                onClick={() => setModal({ open: false, editing: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ["name", "Full Name", "text"],
                  ["employeeId", "Employee ID", "text"],
                  ["email", "Email", "email"],
                  ["phone", "Phone", "text"],
                  ["joiningDate", "Joining Date", "date"],
                ] as [keyof Employee, string, string][]
              ).map(([key, label, type]) => (
                <div key={key}>
                  <span className="block text-xs font-medium text-slate-600 mb-1">
                    {label}
                  </span>
                  <input
                    type={type}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(form[key] ?? "")}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Department
                </span>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={String(form.department)}
                  onChange={(e) => setField("department", e.target.value)}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Designation
                </span>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.designation}
                  onChange={(e) => setField("designation", e.target.value)}
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  ESI Number
                </span>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.esiNumber}
                  onChange={(e) => setField("esiNumber", e.target.value)}
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  PF Account Number
                </span>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.pfAccountNumber}
                  onChange={(e) => setField("pfAccountNumber", e.target.value)}
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  UAN Number
                </span>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.uanNumber}
                  onChange={(e) => setField("uanNumber", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600">
                  Active Status
                </span>
                <button
                  type="button"
                  onClick={() => setField("isActive", !form.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal({ open: false, editing: null })}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : modal.editing
                    ? "Update"
                    : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-800 mb-2">
              Delete Employee?
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
