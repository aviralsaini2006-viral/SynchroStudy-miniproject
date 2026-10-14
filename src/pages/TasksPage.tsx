import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../state/AppContext";
import { calculatePriority } from "../domain/priority";
import type { Task, TaskStatus } from "../domain/types";
import { fromInputDateTime, toInputDateTime, formatDateTime } from "../lib/datetime";

export default function TasksPage() {
  const { state, addTask, updateTask, deleteTask, toggleComplete } = useContext(AppContext);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sort, setSort] = useState<"priority" | "due" | "title">("priority");

  const formInit = (t?: Task) => ({
    title: t?.title ?? "",
    subjectId: t?.subjectId ?? (state.subjects[0]?.id ?? ""),
    description: t?.description ?? "",
    dueAt: toInputDateTime(t?.dueAt ?? new Date(Date.now() + 86400000).toISOString()),
    estimatedMinutes: t?.estimatedMinutes ?? 60,
    difficulty: t?.difficulty ?? 3,
    gradeImportance: t?.gradeImportance ?? 3,
    preparationGap: t?.preparationGap ?? 3,
    status: t?.status ?? ("todo" as TaskStatus),
  });

  const [form, setForm] = useState(formInit());

  const subjectsById = useMemo(() => Object.fromEntries(state.subjects.map((s) => [s.id, s])), [state.subjects]);

  const filtered = useMemo(() => {
    let list = state.tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (subjectFilter !== "all" && t.subjectId !== subjectFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "priority") return b.priorityScore - a.priorityScore;
      if (sort === "due") return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [state.tasks, statusFilter, subjectFilter, search, sort]);

  function openCreate() {
    setEditingId(null);
    setForm(formInit());
    setShowForm(true);
  }
  function openEdit(t: Task) {
    setEditingId(t.id);
    setForm(formInit(t));
    setShowForm(true);
  }
  function close() {
    setShowForm(false);
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      subjectId: form.subjectId || null,
      description: form.description,
      dueAt: fromInputDateTime(form.dueAt),
      estimatedMinutes: Number(form.estimatedMinutes),
      difficulty: Number(form.difficulty),
      gradeImportance: Number(form.gradeImportance),
      preparationGap: Number(form.preparationGap),
      status: form.status,
    };
    if (editingId) {
      updateTask(editingId, payload);
    } else {
      addTask(payload as any);
    }
    close();
  }

  function previewScore() {
    const r = calculatePriority({
      dueAt: fromInputDateTime(form.dueAt),
      estimatedMinutes: Number(form.estimatedMinutes),
      difficulty: Number(form.difficulty),
      gradeImportance: Number(form.gradeImportance),
      preparationGap: Number(form.preparationGap),
      status: form.status,
    });
    return r;
  }

  const preview = previewScore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">+ New Task</button>
      </div>

      {/* filters */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input placeholder="Search title..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All subjects</option>
          {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="priority">Sort: Priority</option>
          <option value="due">Sort: Due date</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      {/* form */}
      {showForm && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-lg">{editingId ? "Edit Task" : "New Task"}</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">None</option>
                {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Due date/time</label>
              <input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Estimated minutes</label>
              <input type="number" min={1} max={600} value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            {["difficulty", "gradeImportance", "preparationGap"].map((field) => (
              <div key={field}>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{field} (1-5)</label>
                <input type="number" min={1} max={5} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Preview priority: <span className="font-bold">{preview.score}</span> ({preview.band}) {preview.reasons.join(", ")}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={close} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Save</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm">No tasks match. Create one above.</div>
        )}
        {filtered.map((t) => {
          const subj = t.subjectId ? subjectsById[t.subjectId] : null;
          const pr = calculatePriority({ dueAt: t.dueAt, estimatedMinutes: t.estimatedMinutes, difficulty: t.difficulty, gradeImportance: t.gradeImportance, preparationGap: t.preparationGap, status: t.status });
          return (
            <div key={t.id} className={`card p-4 flex flex-col md:flex-row md:items-center gap-3 ${t.status === "completed" ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${t.status === "completed" ? "line-through" : ""}`}>{t.title}</span>
                  {subj && <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: subj.color, color: subj.color }}>{subj.name}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${pr.band === "High" ? "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200" : pr.band === "Medium" ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200" : "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200"}`}>
                    {pr.band} · {pr.score}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t.status}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">
                  Due {formatDateTime(t.dueAt)} · {t.estimatedMinutes} min · diff {t.difficulty} · importance {t.gradeImportance} · prep {t.preparationGap}
                </div>
                {pr.reasons.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">Why: {pr.reasons.join(", ")}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleComplete(t.id)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-black">{t.status === "completed" ? "Undo" : "Complete"}</button>
                <button onClick={() => openEdit(t)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-black">Edit</button>
                <button onClick={() => { if (confirm("Delete task?")) deleteTask(t.id); }} className="px-3 py-1.5 rounded-lg border text-xs text-red-600 hover:bg-red-50 dark:bg-red-900/30">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
