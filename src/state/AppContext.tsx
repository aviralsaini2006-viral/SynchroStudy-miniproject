import React, { createContext, useCallback, useMemo, useState } from "react";
import { loadState, saveState, uid } from "../lib/storage";
import type { PersistedState } from "../lib/storage";
import { calculatePriority } from "../domain/priority";
import type { Task, StudySession, Subject, AvailabilitySettings, NotificationPrefs, NotificationLog } from "../domain/types";

interface AppContextValue {
  state: PersistedState;
  setState: React.Dispatch<React.SetStateAction<PersistedState>>;
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt" | "priorityScore" | "priorityBand" | "completedAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  addSubject: (name: string, color: string) => void;
  deleteSubject: (id: string) => void;
  saveAvailability: (a: AvailabilitySettings) => void;
  replaceSessions: (sessions: StudySession[]) => void;
  addNotification: (message: string, dedupeKey: string) => void;
  dismissNotification: (id: string) => void;
  rescheduleSession: (id: string, startsAt: string, endsAt: string) => boolean;
  pinSession: (id: string, pinned: boolean) => void;
  markSessionComplete: (id: string) => void;
  updateNotificationPrefs: (p: NotificationPrefs) => void;
}

export const AppContext = createContext<AppContextValue>(undefined as any);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<PersistedState>(() => loadState());

  const setState = useCallback((updater: React.SetStateAction<PersistedState>) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      // recalc priorities
      next.tasks = next.tasks.map((t: Task) => {
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
      });
      saveState(next);
      return next;
    });
  }, []);

  const addTask = useCallback((t: any) => {
    const task: Task = {
      id: uid(),
      title: t.title,
      subjectId: t.subjectId,
      description: t.description ?? "",
      dueAt: t.dueAt,
      estimatedMinutes: t.estimatedMinutes,
      difficulty: t.difficulty,
      gradeImportance: t.gradeImportance,
      preparationGap: t.preparationGap,
      status: t.status ?? "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      priorityScore: 0,
      priorityBand: "Low",
    };
    setState((prev: PersistedState) => ({ ...prev, tasks: [...prev.tasks, task] }));
  }, [setState]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((prev: PersistedState) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? { ...t, ...patch, updatedAt: new Date().toISOString(), completedAt: patch.status === "completed" ? (t.completedAt ?? new Date().toISOString()) : t.completedAt }
          : t
      ),
    }));
  }, [setState]);

  const deleteTask = useCallback((id: string) => {
    setState((prev: PersistedState) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      sessions: prev.sessions.filter((s) => s.taskId !== id),
    }));
  }, [setState]);

  const toggleComplete = useCallback((id: string) => {
    setState((prev: PersistedState) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "completed" ? "todo" : "completed",
              completedAt: t.status === "completed" ? null : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  }, [setState]);

  const addSubject = useCallback((name: string, color: string) => {
    const subject: Subject = { id: uid(), name, color };
    setState((prev: PersistedState) => ({ ...prev, subjects: [...prev.subjects, subject] }));
  }, [setState]);

  const deleteSubject = useCallback((id: string) => {
    setState((prev: PersistedState) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      tasks: prev.tasks.map((t) => (t.subjectId === id ? { ...t, subjectId: null } : t)),
    }));
  }, [setState]);

  const saveAvailability = useCallback((a: AvailabilitySettings) => {
    setState((prev: PersistedState) => ({ ...prev, availability: a }));
  }, [setState]);

  const replaceSessions = useCallback((sessions: StudySession[]) => {
    setState((prev: PersistedState) => {
      // preserve completed/pinned existing, remove old generated
      const preserved = prev.sessions.filter((s) => s.status === "completed" || s.isPinned);
      const preservedIds = new Set(preserved.map((s) => s.id));
      const incoming = sessions.filter((s) => !preservedIds.has(s.id));
      return { ...prev, sessions: [...preserved, ...incoming] };
    });
  }, [setState]);

  const addNotification = useCallback((message: string, dedupeKey: string) => {
    setState((prev: PersistedState) => {
      if (prev.notificationLogs.some((n) => n.dedupeKey === dedupeKey)) return prev;
      const log: NotificationLog = {
        id: uid(),
        message,
        channel: "in_app",
        status: "queued",
        dedupeKey,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, notificationLogs: [log, ...prev.notificationLogs].slice(0, 50) };
    });
  }, [setState]);

  const dismissNotification = useCallback((id: string) => {
    setState((prev: PersistedState) => ({
      ...prev,
      notificationLogs: prev.notificationLogs.map((n) => (n.id === id ? { ...n, status: "dismissed" } : n)),
    }));
  }, [setState]);

  const rescheduleSession = useCallback((id: string, startsAt: string, endsAt: string): boolean => {
    // conflict check
    let ok = true;
    setState((prev: PersistedState) => {
      const target = prev.sessions.find((s) => s.id === id);
      if (!target) { ok = false; return prev; }
      const newStart = new Date(startsAt);
      const newEnd = new Date(endsAt);
      if (newEnd <= newStart) { ok = false; return prev; }
      const conflicts = prev.sessions
        .filter((s) => s.id !== id)
        .some((s) => {
          const ss = new Date(s.startsAt), se = new Date(s.endsAt);
          return newStart < se && ss < newEnd; // overlap
        });
      if (conflicts) { ok = false; return prev; }
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === id ? { ...s, startsAt, endsAt, source: "manual" as const, updatedAt: new Date().toISOString() } : s
        ),
      };
    });
    // above type missing updatedAt on type? fine
    return ok;
  }, [setState]);

  const pinSession = useCallback((id: string, pinned: boolean) => {
    setState((prev: PersistedState) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === id ? { ...s, isPinned: pinned } : s)),
    }));
  }, [setState]);

  const markSessionComplete = useCallback((id: string) => {
    setState((prev: PersistedState) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === id ? { ...s, status: "completed" as const } : s)),
    }));
  }, [setState]);

  const updateNotificationPrefs = useCallback((p: NotificationPrefs) => {
    setState((prev: PersistedState) => ({ ...prev, notificationPrefs: p }));
  }, [setState]);

  const value: AppContextValue = useMemo(
    () => ({
      state,
      setState,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      addSubject,
      deleteSubject,
      saveAvailability,
      replaceSessions,
      addNotification,
      dismissNotification,
      rescheduleSession,
      pinSession,
      markSessionComplete,
      updateNotificationPrefs,
    }),
    [state, setState, addTask, updateTask, deleteTask, toggleComplete, addSubject, deleteSubject, saveAvailability, replaceSessions, addNotification, dismissNotification, rescheduleSession, pinSession, markSessionComplete, updateNotificationPrefs]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
