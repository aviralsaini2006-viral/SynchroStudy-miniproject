import { useContext, useMemo } from "react";
import { AppContext } from "../state/AppContext";

function dayKey(d: string | Date): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toDateString();
}

export default function ConsistencyPanel() {
  const { state } = useContext(AppContext);

  const activityMinutes = useMemo(() => {
    const map = new Map<string, number>();
    state.sessions.forEach((s) => {
      const k = dayKey(s.startsAt);
      const mins = (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000;
      map.set(k, (map.get(k) ?? 0) + mins);
    });
    return map;
  }, [state.sessions]);


  const lastDays = useMemo(() => {
    const arr: { key: string; label: string; mins: number; level: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 55; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = d.toDateString();
      const mins = activityMinutes.get(k) ?? 0;
      let level = 0;
      if (mins > 0) level = 1;
      if (mins >= 30) level = 2;
      if (mins >= 60) level = 3;
      if (mins >= 120) level = 4;
      arr.push({ key: k, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), mins: Math.round(mins), level });
    }
    return arr;
  }, [activityMinutes]);

  const suggestions = useMemo(() => {
    const out: string[] = [];
    const now = Date.now();
    const pending = state.tasks.filter((t) => t.status !== "completed");
    const overdue = pending.filter((t) => new Date(t.dueAt).getTime() < now);
    const high = pending.filter((t) => t.priorityBand === "High");
    if (overdue.length > 0) out.push(`Finish ${overdue.length} overdue task(s): ${overdue[0].title}`);
    if (high.length > 0) out.push(`Start high-priority work: ${high[0].title}`);
    if (pending.length > 0) {
      const next = [...pending].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];
      out.push(`Next due: ${next.title} (${new Date(next.dueAt).toLocaleDateString()})`);
    }
    if (state.sessions.length === 0 && pending.length > 0) out.push("Generate a weekly study plan in Smart Planner.");
    const completed = state.tasks.filter((t) => t.status === "completed").length;
    const rate = state.tasks.length > 0 ? (completed / state.tasks.length) * 100 : 0;
    if (state.tasks.length > 0 && rate < 50) out.push("Boost completion rate by finishing small tasks first.");
    if (pending.length === 0 && state.tasks.length > 0) out.push("All tasks done. Add new goals to keep your streak.");
    if (out.length === 0) out.push("You're on track. Keep up the consistent study!");
    return out.slice(0, 5);
  }, [state]);

  const levelClass = (level: number) => {
    switch (level) {
      case 1: return "bg-blue-900/40";
      case 2: return "bg-blue-700/60";
      case 3: return "bg-blue-600";
      case 4: return "bg-blue-500";
      default: return "bg-white/5";
    }
  };

  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">Consistency (last 8 weeks)</h2>
          <div className="grid grid-cols-7 gap-1">
            {lastDays.map((d) => (
              <div
                key={d.key}
                title={`${d.label}: ${d.mins} min`}
                className={`aspect-square rounded-sm ${levelClass(d.level)} border border-white/5`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span>Less</span>
            <span className="w-3 h-3 rounded-sm bg-white/5 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-blue-900/40 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-blue-700/60 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
            <span>More</span>
          </div>
        </div>

        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold mb-3">What to do next</h2>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
