import type { Task, Subject, StudySession, AvailabilitySettings, NotificationPrefs, NotificationLog } from "../domain/types";
import { calculatePriority } from "../domain/priority";

const KEY = "synchro-study-state-v4";

export interface PersistedState {
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  availability: AvailabilitySettings;
  notificationPrefs: NotificationPrefs;
  notificationLogs: NotificationLog[];
  demoMode: boolean;
}

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function nowISO(): string {
  return new Date().toISOString();
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function makeTask(partial: Partial<Task> & { title: string; dueAt: string }): Task {
  const t: Task = {
    id: uid(),
    title: partial.title,
    subjectId: partial.subjectId ?? null,
    description: partial.description ?? "",
    dueAt: partial.dueAt,
    estimatedMinutes: partial.estimatedMinutes ?? 60,
    difficulty: partial.difficulty ?? 3,
    gradeImportance: partial.gradeImportance ?? 3,
    preparationGap: partial.preparationGap ?? 3,
    status: partial.status ?? "todo",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    completedAt: partial.completedAt ?? null,
    priorityScore: 0,
    priorityBand: "Low",
  };
  const r = calculatePriority({
    dueAt: t.dueAt,
    estimatedMinutes: t.estimatedMinutes,
    difficulty: t.difficulty,
    gradeImportance: t.gradeImportance,
    preparationGap: t.preparationGap,
    status: t.status,
  });
  t.priorityScore = r.score;
  t.priorityBand = r.band;
  return t;
}

export function createSeedState(): PersistedState {
  const subjects: Subject[] = [
    { id: uid(), name: "Data Structures", color: "#2563eb" },
    { id: uid(), name: "DBMS", color: "#7c3aed" },
    { id: uid(), name: "Operating Systems", color: "#059669" },
    { id: uid(), name: "Computer Networks", color: "#ea580c" },
    { id: uid(), name: "Mathematics", color: "#dc2626" },
  ];
  const [s1, s2, s3, s4, s5] = subjects.map((s) => s.id);
  const now = new Date();
  const tasks: Task[] = [
    makeTask({ title: "DSA Assignment 3", subjectId: s1, dueAt: addDays(now, 2).toISOString(), estimatedMinutes: 120, difficulty: 4, gradeImportance: 5, preparationGap: 4, status: "todo", description: "Arrays, linked lists and recursion problems (15 questions)." }),
    makeTask({ title: "DBMS ER Diagram", subjectId: s2, dueAt: addDays(now, 4).toISOString(), estimatedMinutes: 90, difficulty: 3, gradeImportance: 4, preparationGap: 2, status: "in_progress", description: "Entity-relationship diagram for college library system." }),
    makeTask({ title: "OS Lab Report", subjectId: s3, dueAt: addDays(now, 1).toISOString(), estimatedMinutes: 60, difficulty: 2, gradeImportance: 3, preparationGap: 3, status: "completed", completedAt: addDays(now, -1).toISOString(), description: "CPU scheduling algorithms observation and output." }),
    makeTask({ title: "DSA Quiz Prep", subjectId: s1, dueAt: addDays(now, 6).toISOString(), estimatedMinutes: 45, difficulty: 3, gradeImportance: 4, preparationGap: 4, status: "todo", description: "Revise trees and graphs notes before quiz." }),
    makeTask({ title: "OS Midterm Revision", subjectId: s3, dueAt: addDays(now, 3).toISOString(), estimatedMinutes: 180, difficulty: 5, gradeImportance: 5, preparationGap: 5, status: "todo", description: "Deadlocks, memory management and file systems." }),
    makeTask({ title: "CN Lab: Socket Programming", subjectId: s4, dueAt: addDays(now, 5).toISOString(), estimatedMinutes: 120, difficulty: 4, gradeImportance: 4, preparationGap: 3, status: "todo", description: "TCP client-server echo using python sockets." }),
    makeTask({ title: "CN Assignment 2", subjectId: s4, dueAt: addDays(now, 7).toISOString(), estimatedMinutes: 90, difficulty: 3, gradeImportance: 3, preparationGap: 2, status: "todo", description: "Subnetting and CIDR practice questions." }),
    makeTask({ title: "Maths Problem Set 4", subjectId: s5, dueAt: addDays(now, 2).toISOString(), estimatedMinutes: 75, difficulty: 3, gradeImportance: 4, preparationGap: 4, status: "in_progress", description: "Calculus and linear algebra numericals (8 problems)." }),
    makeTask({ title: "Maths Viva Prep", subjectId: s5, dueAt: addDays(now, 8).toISOString(), estimatedMinutes: 60, difficulty: 2, gradeImportance: 2, preparationGap: 3, status: "todo", description: "Definitions, formulas and short proofs." }),
    makeTask({ title: "DBMS SQL Queries", subjectId: s2, dueAt: addDays(now, 9).toISOString(), estimatedMinutes: 60, difficulty: 2, gradeImportance: 3, preparationGap: 2, status: "completed", completedAt: addDays(now, -2).toISOString(), description: "Joins, aggregations and subqueries practice." }),
  ];
  const sessions: StudySession[] = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(now, -i);
    d.setHours(10, 0, 0, 0);
    sessions.push({
      id: uid(),
      taskId: tasks[i % tasks.length].id,
      startsAt: d.toISOString(),
      endsAt: new Date(d.getTime() + 50 * 60000).toISOString(),
      status: i % 3 === 0 ? "planned" : "completed",
      isPinned: false,
      source: "generated",
    });
    if (i % 2 === 0) {
      const d2 = new Date(d.getTime() + 4 * 3600000);
      sessions.push({
        id: uid(),
        taskId: tasks[(i + 2) % tasks.length].id,
        startsAt: d2.toISOString(),
        endsAt: new Date(d2.getTime() + 45 * 60000).toISOString(),
        status: i % 4 === 0 ? "planned" : "completed",
        isPinned: false,
        source: "generated",
      });
    }
  }
  const availability: AvailabilitySettings = {
    windows: [
      { weekday: 1, start: "09:00", end: "12:00", available: true },
      { weekday: 1, start: "14:00", end: "17:00", available: true },
      { weekday: 2, start: "09:00", end: "12:00", available: true },
      { weekday: 2, start: "14:00", end: "18:00", available: true },
      { weekday: 3, start: "10:00", end: "13:00", available: true },
      { weekday: 4, start: "09:00", end: "12:00", available: true },
      { weekday: 4, start: "13:00", end: "17:00", available: true },
      { weekday: 5, start: "09:00", end: "11:00", available: true },
    ],
    unavailablePeriods: [],
    maxStudyMinutesPerDay: 240,
    sessionLengthMinutes: 50,
    breakMinutes: 10,
    timeZone: "Asia/Kolkata",
  };
  return {
    subjects,
    tasks,
    sessions,
    availability,
    notificationPrefs: { deadlineRemindersEnabled: true, sessionRemindersEnabled: true, deadlineLeadMinutes: 1440, sessionLeadMinutes: 60 },
    notificationLogs: [],
    demoMode: true,
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      parsed.tasks = parsed.tasks.map((t) => {
        const r = calculatePriority({ dueAt: t.dueAt, estimatedMinutes: t.estimatedMinutes, difficulty: t.difficulty, gradeImportance: t.gradeImportance, preparationGap: t.preparationGap, status: t.status });
        t.priorityScore = r.score; t.priorityBand = r.band;
        return t;
      });
      return parsed;
    }
  } catch {
    // ignore
  }
  return createSeedState();
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export { uid };
