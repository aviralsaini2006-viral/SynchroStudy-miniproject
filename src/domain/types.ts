export type TaskStatus = "todo" | "in_progress" | "completed";
export type PriorityBand = "High" | "Medium" | "Low";

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  description: string;
  dueAt: string; // ISO
  estimatedMinutes: number;
  difficulty: number; // 1-5
  gradeImportance: number; // 1-5
  preparationGap: number; // 1-5
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  // derived
  priorityScore: number;
  priorityBand: PriorityBand;
}

export type SessionStatus = "planned" | "completed" | "skipped";

export interface StudySession {
  id: string;
  taskId: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  isPinned: boolean;
  source: "generated" | "manual";
}

export interface AvailabilityWindow {
  weekday: number; // 0-6 Sun-Sat
  start: string; // HH:mm
  end: string; // HH:mm
  available: boolean;
}

export interface UnavailablePeriod {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface AvailabilitySettings {
  windows: AvailabilityWindow[];
  unavailablePeriods: UnavailablePeriod[];
  maxStudyMinutesPerDay: number;
  sessionLengthMinutes: number;
  breakMinutes: number;
  timeZone: string;
}

export interface NotificationPrefs {
  deadlineRemindersEnabled: boolean;
  sessionRemindersEnabled: boolean;
  deadlineLeadMinutes: number;
  sessionLeadMinutes: number;
}

export interface NotificationLog {
  id: string;
  message: string;
  channel: "in_app";
  status: "queued" | "sent" | "dismissed";
  dedupeKey: string;
  createdAt: string;
}
