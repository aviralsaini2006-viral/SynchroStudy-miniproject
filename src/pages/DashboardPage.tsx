import { useContext, useMemo } from "react";
import { AppContext } from "../state/AppContext";
import RemindersPanel from "../components/RemindersPanel";
import { formatDateTime } from "../lib/datetime";

export default function DashboardPage() {
  const { state } = useContext(AppContext);
  const now = new Date();

  const metrics = useMemo(() => {
    const tasks = state.tasks;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => t.status !== "completed" && new Date(t.dueAt) < now).length;
    const high = tasks.filter((t) => t.status !== "completed" && t.priorityBand === "High").length;
    const upcomingDeadlines = tasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todaysMinutes = state.sessions
      .filter((s) => s.status !== "skipped")
      .filter((s) => { const d = new Date(s.startsAt); return d >= todayStart && d <= todayEnd; })
      .reduce((acc, s) => acc + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000, 0);
    const upcomingSessions = state.sessions
      .filter((s) => s.status === "planned" && new Date(s.startsAt) >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 5);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, high, upcomingDeadlines, todaysMinutes, upcomingSessions, completionRate };
  }, [state]);

  return (
    <div className="space-y-6 dashboard-area">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total tasks", value: metrics.total },
          { label: "Pending", value: metrics.pending },
          { label: "Completed", value: metrics.completed },
          { label: "Overdue", value: metrics.overdue },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{c.label}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Today's planned study</div>
          <div className="text-2xl font-bold mt-1">{Math.round(metrics.todaysMinutes)} min</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">High priority</div>
          <div className="text-2xl font-bold mt-1">{metrics.high}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Completion rate</div>
          <div className="text-2xl font-bold mt-1">{metrics.completionRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Upcoming deadlines</h2>
          {metrics.upcomingDeadlines.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No pending tasks.</div>}
          <ul className="space-y-2">
            {metrics.upcomingDeadlines.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span>{t.title}</span>
                <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{formatDateTime(t.dueAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Upcoming study sessions</h2>
          {metrics.upcomingSessions.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No sessions planned. Generate a plan.</div>}
          <ul className="space-y-2">
            {metrics.upcomingSessions.map((s) => {
              const task = state.tasks.find((t) => t.id === s.taskId);
              return (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>{task?.title ?? "Unknown task"}</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{formatDateTime(s.startsAt)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <RemindersPanel />
    </div>
  );
}
