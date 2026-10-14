import React, { useContext, useState } from "react";
import { AppContext } from "../state/AppContext";
import { generateSchedule } from "../domain/scheduler";

import type { AvailabilitySettings, UnavailablePeriod } from "../domain/types";
import { uid } from "../lib/storage";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PlannerPage() {
  const { state, saveAvailability, replaceSessions } = useContext(AppContext);
  const [avail, setAvail] = useState<AvailabilitySettings>(state.availability);
  const [unscheduled, setUnscheduled] = useState<any[]>([]);
  const [previewMsg, setPreviewMsg] = useState("");

  // sync when state changes externally
  React.useEffect(() => { setAvail(state.availability); }, [state.availability]);

  const days = [0, 1, 2, 3, 4, 5, 6];

  function addWindow(day: number) {
    setAvail({ ...avail, windows: [...avail.windows, { weekday: day, start: "09:00", end: "11:00", available: true }] });
  }

  function removeWindow(idx: number) {
    const w = avail.windows.filter((_, i) => i !== idx);
    setAvail({ ...avail, windows: w });
  }

  function addUnavailable() {
    const p: UnavailablePeriod = { id: uid(), title: "Commitment", startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 3600000).toISOString() };
    setAvail({ ...avail, unavailablePeriods: [...avail.unavailablePeriods, p] });
  }

  function save() {
    saveAvailability(avail);
  }

  function generate() {
    saveAvailability(avail);
    const result = generateSchedule({
      tasks: state.tasks,
      existingSessions: state.sessions,
      availability: avail,
      now: new Date(),
      horizonDays: 7,
    });
    replaceSessions(result.sessions);
    setUnscheduled(result.unscheduled);
    const newCount = result.sessions.filter((s) => !s.isPinned && s.status === "planned").length;
    setPreviewMsg(`Generated ${newCount} sessions. ${result.unscheduled.length} task(s) could not be fully scheduled.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Planner</h1>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-black">Save availability</button>
          <button onClick={generate} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Generate plan</button>
        </div>
      </div>

      {previewMsg && <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 text-blue-800 text-sm rounded-lg p-3">{previewMsg}</div>}

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold">Limits &amp; session settings</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Max study min/day</label>
            <input type="number" value={avail.maxStudyMinutesPerDay} onChange={(e) => setAvail({ ...avail, maxStudyMinutesPerDay: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Session length (min)</label>
            <input type="number" value={avail.sessionLengthMinutes} onChange={(e) => setAvail({ ...avail, sessionLengthMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Break (min)</label>
            <input type="number" value={avail.breakMinutes} onChange={(e) => setAvail({ ...avail, breakMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-semibold">Weekly availability</h2>
        {days.map((day) => {
          const dayWins = avail.windows.map((w, idx) => ({ w, idx })).filter((x) => x.w.weekday === day);
          return (
            <div key={day} className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{DAY_NAMES[day]}</span>
                <button onClick={() => addWindow(day)} className="text-xs text-blue-600 hover:underline">+ window</button>
              </div>
              {dayWins.length === 0 && <div className="text-xs text-slate-400 dark:text-slate-500">No available window (unavailable all day)</div>}
              {dayWins.map(({ w, idx }) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <input type="time" value={w.start} onChange={(e) => {
                    const next = { ...avail };
                    next.windows[idx] = { ...next.windows[idx], start: e.target.value };
                    setAvail(next);
                  }} className="border rounded px-2 py-1 text-sm" />
                  <span className="text-slate-400 dark:text-slate-500">to</span>
                  <input type="time" value={w.end} onChange={(e) => {
                    const next = { ...avail };
                    next.windows[idx] = { ...next.windows[idx], end: e.target.value };
                    setAvail(next);
                  }} className="border rounded px-2 py-1 text-sm" />
                  <button onClick={() => removeWindow(idx)} className="text-xs text-red-500 hover:underline">remove</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Unavailable periods</h2>
          <button onClick={addUnavailable} className="text-xs text-blue-600 hover:underline">+ Add</button>
        </div>
        {avail.unavailablePeriods.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">None added.</div>}
        {avail.unavailablePeriods.map((p, idx) => (
          <div key={p.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={p.title} onChange={(e) => {
              const next = { ...avail };
              next.unavailablePeriods[idx] = { ...next.unavailablePeriods[idx], title: e.target.value };
              setAvail(next);
            }} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="datetime-local" value={p.startsAt.slice(0, 16)} onChange={(e) => {
              const next = { ...avail };
              next.unavailablePeriods[idx] = { ...next.unavailablePeriods[idx], startsAt: new Date(e.target.value).toISOString() };
              setAvail(next);
            }} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="datetime-local" value={p.endsAt.slice(0, 16)} onChange={(e) => {
              const next = { ...avail };
              next.unavailablePeriods[idx] = { ...next.unavailablePeriods[idx], endsAt: new Date(e.target.value).toISOString() };
              setAvail(next);
            }} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-3 text-amber-700">Unscheduled work</h2>
          <ul className="space-y-2">
            {unscheduled.map((u) => (
              <li key={u.taskId} className="text-sm">
                <span className="font-medium">{u.title}</span> — <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">{u.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
