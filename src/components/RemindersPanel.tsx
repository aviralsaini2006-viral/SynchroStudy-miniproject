import { useContext, useEffect } from "react";
import { AppContext } from "../state/AppContext";

export default function RemindersPanel() {
  const { state, addNotification, dismissNotification } = useContext(AppContext);

  useEffect(() => {
    const now = Date.now();
    state.tasks
      .filter((t) => t.status !== "completed" && new Date(t.dueAt).getTime() < now)
      .forEach((t) => addNotification(`Overdue task: ${t.title}`, `overdue-${t.id}`));
    const lead = state.notificationPrefs.deadlineLeadMinutes * 60 * 1000;
    state.tasks
      .filter((t) => t.status !== "completed")
      .forEach((t) => {
        const due = new Date(t.dueAt).getTime();
        if (due > now && due - now <= lead) {
          addNotification(`Deadline approaching: ${t.title}`, `deadline-${t.id}`);
        }
      });
    const sLead = state.notificationPrefs.sessionLeadMinutes * 60 * 1000;
    state.sessions
      .filter((s) => s.status === "planned")
      .forEach((s) => {
        const start = new Date(s.startsAt).getTime();
        if (start > now && start - now <= sLead) {
          const task = state.tasks.find((t) => t.id === s.taskId);
          addNotification(`Session starting soon: ${task?.title ?? "Study"}`, `session-${s.id}`);
        }
      });
  }, [state.tasks.length, state.sessions.length, state.notificationPrefs]);

  if (state.notificationLogs.length === 0) return null;
  return (
    <div className="card p-5">
      <h2 className="font-semibold mb-3">Reminders</h2>
      <ul className="space-y-2">
        {state.notificationLogs.slice(0, 10).map((n) => (
          <li key={n.id} className="flex items-center justify-between text-sm">
            <span className={n.status === "dismissed" ? "line-through text-slate-400 dark:text-slate-500" : ""}>{n.message}</span>
            {n.status !== "dismissed" && (
              <button onClick={() => dismissNotification(n.id)} className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:underline">Dismiss</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
