import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Leaves from "./pages/Leaves";
import Reports from "./pages/Reports";
import Statutory from "./pages/Statutory";
import type { Page } from "./types";

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "employees", label: "Employees", icon: <Users size={18} /> },
  { id: "attendance", label: "Attendance", icon: <ClipboardCheck size={18} /> },
  { id: "leaves", label: "Leave Management", icon: <Calendar size={18} /> },
  { id: "statutory", label: "Statutory", icon: <FileText size={18} /> },
  { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  employees: "Employee Management",
  attendance: "Attendance Management",
  leaves: "Leave Management",
  statutory: "Statutory (ESI / EPF)",
  reports: "Reports",
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={setPage} />;
      case "employees":
        return <Employees />;
      case "attendance":
        return <Attendance />;
      case "leaves":
        return <Leaves />;
      case "statutory":
        return <Statutory />;
      case "reports":
        return <Reports />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            EMS
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">
              Employee
            </div>
            <div className="text-slate-400 text-xs">Management System</div>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="text-slate-400 text-xs text-center">
            v1.0.0 &bull; Admin Mode
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-slate-800 text-lg">
            {pageTitles[page]}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              Admin Panel
            </span>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
