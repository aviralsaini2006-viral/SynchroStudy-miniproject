import React, { useContext, useState } from "react";
import { AppContext } from "../state/AppContext";
import { supabaseModeLabel, isSupabaseConfigured } from "../lib/supabase";

export default function SettingsPage() {
  const { state, addSubject, deleteSubject, updateNotificationPrefs } = useContext(AppContext);
  const [subjName, setSubjName] = useState("");
  const [subjColor, setSubjColor] = useState("#2563eb");
  const [notif, setNotif] = useState(state.notificationPrefs);

  React.useEffect(() => { setNotif(state.notificationPrefs); }, [state.notificationPrefs]);

  function saveSubj(e: React.FormEvent) {
    e.preventDefault();
    if (!subjName.trim()) return;
    addSubject(subjName.trim(), subjColor);
    setSubjName("");
  }

  function saveNotif() {
    updateNotificationPrefs(notif);
  }

  function resetDemo() {
    if (confirm("Reset all demo data to seed?")) {
      localStorage.removeItem("synchro-study-state-v1");
      location.reload();
    }
  }

  const integrations = [
    { name: "Google Calendar", status: "Not configured" },
    { name: "Todoist", status: "Not configured" },
    { name: "Telegram", status: "Not configured" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Profile &amp; mode</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300">Persistence mode: {supabaseModeLabel()}</div>
        {!isSupabaseConfigured && (
          <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Supabase is not configured. Using local demo storage (localStorage).</div>
        )}
        <div className="text-sm text-slate-600 dark:text-slate-300">Timezone: {state.availability.timeZone}</div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Subjects</h2>
        <form onSubmit={saveSubj} className="flex gap-2">
          <input value={subjName} onChange={(e) => setSubjName(e.target.value)} placeholder="Subject name" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <input type="color" value={subjColor} onChange={(e) => setSubjColor(e.target.value)} className="w-10 h-10 border rounded" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Add</button>
        </form>
        <ul className="space-y-1">
          {state.subjects.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                {s.name}
              </span>
              <button onClick={() => { if (confirm("Delete subject?")) deleteSubject(s.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Notification preferences</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notif.deadlineRemindersEnabled} onChange={(e) => setNotif({ ...notif, deadlineRemindersEnabled: e.target.checked })} />
          Deadline reminders
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notif.sessionRemindersEnabled} onChange={(e) => setNotif({ ...notif, sessionRemindersEnabled: e.target.checked })} />
          Session reminders
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Deadline lead (min)</label>
            <input type="number" value={notif.deadlineLeadMinutes} onChange={(e) => setNotif({ ...notif, deadlineLeadMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-300">Session lead (min)</label>
            <input type="number" value={notif.sessionLeadMinutes} onChange={(e) => setNotif({ ...notif, sessionLeadMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={saveNotif} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Save preferences</button>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Integrations (optional)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">No third-party integrations are configured. These features require credentials and explicit user consent.</p>
        <ul className="space-y-2">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
              <span>{i.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{i.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Demo data</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Reset the local demo dataset.</p>
        <button onClick={resetDemo} className="px-4 py-2 rounded-lg border text-sm text-red-600 hover:bg-red-50 dark:bg-red-900/30">Reset demo data</button>
      </div>
    </div>
  );
}
