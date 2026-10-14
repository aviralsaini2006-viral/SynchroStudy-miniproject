import type {
  Task,
  StudySession,
  AvailabilitySettings,
  UnavailablePeriod,
} from "./types";

// MIN_CHUNK not enforced in MVP (allow small final chunk)
const INCREMENT_MIN = 5;

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}


function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseHHMM(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function windowBounds(day: Date, w: { start: string; end: string }): { start: Date; end: Date } {
  const s = parseHHMM(w.start);
  const e = parseHHMM(w.end);
  const start = new Date(day);
  start.setHours(s.h, s.m, 0, 0);
  const end = new Date(day);
  end.setHours(e.h, e.m, 0, 0);
  // overnight
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  // half-open
  return aStart < bEnd && bStart < aEnd;
}

export interface ScheduleResult {
  sessions: StudySession[];
  unscheduled: { taskId: string; title: string; reason: string }[];
}

export function generateSchedule(params: {
  tasks: Task[];
  existingSessions: StudySession[];
  availability: AvailabilitySettings;
  now?: Date;
  horizonDays?: number;
}): ScheduleResult {
  const now = params.now ?? new Date();
  const horizonDays = params.horizonDays ?? 7;
  const horizonEnd = addMinutes(startOfDay(now), horizonDays * 24 * 60);

  // Preserve completed and pinned sessions (fixed blocks)
  const fixedSessions = params.existingSessions.filter(
    (s) => s.status === "completed" || s.isPinned
  );

  // New generated sessions accumulator
  const newSessions: StudySession[] = [];

  // daily used minutes for new sessions
  const dailyUsed = new Map<string, number>();

  // unavailable periods (convert)
  const unavailable: UnavailablePeriod[] = params.availability.unavailablePeriods;

  function dailyUsedGet(day: Date): number {
    return dailyUsed.get(dayKey(day)) ?? 0;
  }

  function dailyUsedAdd(day: Date, mins: number): void {
    dailyUsed.set(dayKey(day), dailyUsedGet(day) + mins);
  }

  function allFixedAndNew(): StudySession[] {
    return [...fixedSessions, ...newSessions];
  }

  function tryFindSlot(
    chunkMinutes: number,
    deadline: Date
  ): { start: Date; end: Date } | null {
    // iterate days
    for (let offset = 0; offset < horizonDays; offset++) {
      const day = addMinutes(startOfDay(now), offset * 24 * 60);
      if (day > horizonEnd) break;

      const weekday = day.getDay();
      const wins = params.availability.windows.filter(
        (w) => w.weekday === weekday && w.available
      );

      // sort windows by start
      wins.sort((a, b) => a.start.localeCompare(b.start));

      for (const w of wins) {
        const { start: wStart, end: wEnd } = windowBounds(day, w);
        let cursor = new Date(Math.max(wStart.getTime(), now.getTime()));
        // align to increment
        const rem = cursor.getTime() % (INCREMENT_MIN * 60 * 1000);
        if (rem !== 0) cursor = addMinutes(cursor, INCREMENT_MIN - rem / (60 * 1000));

        const maxEnd =
          wEnd.getTime() < deadline.getTime() ? wEnd.getTime() : deadline.getTime();
        // daily limit headroom
        while (cursor.getTime() + chunkMinutes * 60 * 1000 <= maxEnd) {
          const slotStart = cursor;
          const slotEnd = addMinutes(cursor, chunkMinutes);

          // daily limit
          if (dailyUsedGet(day) + chunkMinutes > params.availability.maxStudyMinutesPerDay) {
            // skip rest of this day for this chunk size
            break;
          }

          // conflict checks
          let conflict = false;
          for (const s of allFixedAndNew()) {
            const sStart = new Date(s.startsAt);
            const sEnd = new Date(s.endsAt);
            if (overlaps(slotStart, slotEnd, sStart, sEnd)) {
              conflict = true;
              break;
            }
          }
          if (!conflict) {
            for (const up of unavailable) {
              const uStart = new Date(up.startsAt);
              const uEnd = new Date(up.endsAt);
              if (overlaps(slotStart, slotEnd, uStart, uEnd)) {
                conflict = true;
                break;
              }
            }
          }
          // ensure slot within window
          if (slotStart < wStart || slotEnd > wEnd) {
            conflict = true;
          }
          // ensure before deadline
          if (slotEnd > deadline) {
            conflict = true;
          }

          if (!conflict) {
            return { start: slotStart, end: slotEnd };
          }

          cursor = addMinutes(cursor, INCREMENT_MIN);
        }
      }
    }
    return null;
  }

  // completed minutes per task from fixed completed sessions
  function completedMinutesFor(taskId: string): number {
    return fixedSessions
      .filter((s) => s.taskId === taskId && s.status === "completed")
      .reduce((acc, s) => acc + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60000, 0);
  }

  // eligible tasks
  const eligible = params.tasks
    .filter((t) => t.status !== "completed")
    .map((t) => ({
      task: t,
      remaining: Math.max(
        0,
        t.estimatedMinutes - completedMinutesFor(t.id)
      ),
    }))
    .filter((x) => x.remaining > 0);

  // sort: priority desc, then due asc, then id
  eligible.sort((a, b) => {
    if (b.task.priorityScore !== a.task.priorityScore)
      return b.task.priorityScore - a.task.priorityScore;
    const da = new Date(a.task.dueAt).getTime();
    const db = new Date(b.task.dueAt).getTime();
    if (da !== db) return da - db;
    return a.task.id.localeCompare(b.task.id);
  });

  const unscheduled: ScheduleResult["unscheduled"] = [];

  const sessionLength = params.availability.sessionLengthMinutes || 50;
  const breakMins = params.availability.breakMinutes || 5;

  for (const { task, remaining: initialRemaining } of eligible) {
    const deadline = new Date(task.dueAt);
    let remaining = initialRemaining;
    let unableReason: string | null = null;

    while (remaining > 0) {
      const toSchedule = Math.min(sessionLength, remaining);
      if (toSchedule <= 0) break;

      const slot = tryFindSlot(toSchedule, deadline);
      if (!slot) {
        unableReason = "No available slot before deadline / daily limit reached";
        break;
      }
      const session: StudySession = {
        id: `gen-${task.id}-${newSessions.length}`,
        taskId: task.id,
        startsAt: slot.start.toISOString(),
        endsAt: slot.end.toISOString(),
        status: "planned",
        isPinned: false,
        source: "generated",
      };
      newSessions.push(session);
      dailyUsedAdd(slot.start, toSchedule + breakMins);
      remaining -= toSchedule;
    }

    if (remaining > 0) {
      unscheduled.push({
        taskId: task.id,
        title: task.title,
        reason: unableReason ?? `${Math.round(remaining)} min could not be scheduled`,
      });
    }
  }

  return { sessions: [...fixedSessions, ...newSessions], unscheduled };
}
