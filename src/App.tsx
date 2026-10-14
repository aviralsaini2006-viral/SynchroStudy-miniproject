import { useEffect, useState } from "react";
import { AppProvider } from "./state/AppContext";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import PlannerPage from "./pages/PlannerPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";


const tabs = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "My Tasks" },
  { id: "planner", label: "Smart Planner" },
  { id: "calendar", label: "Calendar" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
] as const;

function Shell() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("dashboard");
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">S</div>
            <span className="font-semibold text-lg">SynchroStudy</span>
          </div>

        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <nav className="md:w-48 shrink-0">
          <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {tabs.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActive(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active === t.id ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-[#0a0a0a]"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 min-w-0">
          {active === "dashboard" && <DashboardPage />}
          {active === "tasks" && <TasksPage />}
          {active === "planner" && <PlannerPage />}
          {active === "calendar" && <CalendarPage />}
          {active === "analytics" && <AnalyticsPage />}
          {active === "settings" && <SettingsPage />}
        </main>
      </div>
      <footer className="border-t border-slate-200 dark:border-slate-700 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Made by Aviral Saini and Alok Giri
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
