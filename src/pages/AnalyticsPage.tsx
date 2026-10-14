import { useContext, useMemo } from "react";
import { AppContext } from "../state/AppContext";
import ConsistencyPanel from "../components/ConsistencyPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function AnalyticsPage() {
  const { state } = useContext(AppContext);

  const metrics = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const plannedMinutes = state.sessions.reduce((a, s) => a + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000, 0);
    const completedMinutes = state.sessions.filter((s) => s.status === "completed").reduce((a, s) => a + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000, 0);

    const bySubject = state.subjects.map((s) => {
      const tasks = state.tasks.filter((t) => t.subjectId === s.id);
      const done = tasks.filter((t) => t.status === "completed").length;
      return { name: s.name, total: tasks.length, completed: done, color: s.color };
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekly = weekDays.map((d, i) => {
      const mins = state.sessions.filter((s) => new Date(s.startsAt).getDay() === i).reduce((a, s) => a + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000, 0);
      return { day: d, minutes: Math.round(mins) };
    });

    return { total, completed, pending, rate, plannedMinutes, completedMinutes, bySubject, weekly };
  }, [state]);

  const streak = useMemo(() => {
    const active = new Set<string>();
    state.tasks.forEach((t) => { if (t.completedAt) active.add(new Date(t.completedAt).toDateString()); });
    state.sessions.forEach((s) => active.add(new Date(s.startsAt).toDateString()));
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (active.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [state]);

  const pieData = [
    { name: "Completed", value: metrics.completed },
    { name: "Pending", value: metrics.pending },
  ];
  const COLORS = ["#22c55e", "#cbd5e1"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <span className="text-orange-400 font-semibold flex items-center gap-1 text-sm">
          🔥 {streak}<span className="text-slate-500 text-xs font-normal ml-1">day streak</span>
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Total tasks</div><div className="text-2xl font-bold mt-1">{metrics.total}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Completed</div><div className="text-2xl font-bold mt-1">{metrics.completed}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Completion rate</div><div className="text-2xl font-bold mt-1">{metrics.rate}%</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Planned study min</div><div className="text-2xl font-bold mt-1">{Math.round(metrics.plannedMinutes)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Completed vs pending</h2>
          {metrics.total === 0 ? <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No data yet.</div> : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Study minutes by day</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.weekly}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Tasks by subject</h2>
        {metrics.bySubject.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No subjects.</div>}
        <ul className="space-y-2">
          {metrics.bySubject.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-sm">
              <span>{s.name}</span>
              <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{s.completed}/{s.total} completed</span>
            </li>
          ))}
        </ul>
      </div>
      <ConsistencyPanel />
    </div>
  );
}
