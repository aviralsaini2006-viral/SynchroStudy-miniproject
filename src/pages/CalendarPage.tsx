import React, { useContext, useState } from "react";
import { AppContext } from "../state/AppContext";
import { formatDateTime, toInputDateTime, fromInputDateTime } from "../lib/datetime";
import type { StudySession } from "../domain/types";

export default function CalendarPage() {
  const { state, rescheduleSession, pinSession, markSessionComplete } = useContext(AppContext);
  const [resched, setResched] = useState<StudySession | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  const tasksById = React.useMemo(() => Object.fromEntries(state.tasks.map((t) => [t.id, t])), [state.tasks]);

  // Build events: sessions + deadlines
  const events = React.useMemo(() => {
    const list: { id: string; type: "session" | "deadline"; title: string; start: string; end?: string; sid?: string }[] = [];
    state.sessions.forEach((s) => {
      const t = tasksById[s.taskId];
      list.push({ id: s.id, type: "session", title: t?.title ?? "Study session", start: s.startsAt, end: s.endsAt, sid: s.id });
    });
    state.tasks.filter((t) => t.status !== "completed").forEach((t) => {
      list.push({ id: `dl-${t.id}`, type: "deadline", title: `Deadline: ${t.title}`, start: t.dueAt });
    });
    return list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [state, tasksById]);

  function openResched(s: StudySession) {
    setResched(s);
    setStart(toInputDateTime(s.startsAt));
    setEnd(toInputDateTime(s.endsAt));
    setMsg("");
  }

  function saveResched() {
    if (!resched) return;
    const ok = rescheduleSession(resched.id, fromInputDateTime(start), fromInputDateTime(end));
    if (ok) { setResched(null); setMsg("Rescheduled."); }
    else setMsg("Conflict or invalid time.");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendar</h1>
      {msg && <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-3">{msg}</div>}

      {resched && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold">Reschedule session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveResched} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Save</button>
            <button onClick={() => setResched(null)} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Agenda</h2>
        {events.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">No events yet.</div>}
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg border ${e.type === "deadline" ? "bg-red-50 dark:bg-red-900/30 border-red-200" : "bg-blue-50 dark:bg-blue-900/30 border-blue-200"}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {formatDateTime(e.start)}{e.end ? ` → ${formatDateTime(e.end)}` : ""}
                </div>
              </div>
              {e.type === "session" && e.sid && (
                <div className="flex gap-2">
                  <button onClick={() => openResched(state.sessions.find((s) => s.id === e.sid)!)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-white dark:hover:bg-slate-700 dark:bg-[#0a0a0a]">Reschedule</button>
                  <button onClick={() => pinSession(e.sid!, !state.sessions.find((s) => s.id === e.sid)?.isPinned)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-white dark:hover:bg-slate-700 dark:bg-[#0a0a0a]">
                    {state.sessions.find((s) => s.id === e.sid)?.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => markSessionComplete(e.sid!)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-white dark:hover:bg-slate-700 dark:bg-[#0a0a0a]">Complete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
