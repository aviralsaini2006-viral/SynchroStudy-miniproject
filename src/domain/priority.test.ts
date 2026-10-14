// Lightweight smoke checks for the priority calculator (manual, not wired to a runner).
import { calculatePriority } from "./priority";

const overdue = calculatePriority({
  dueAt: new Date(Date.now() - 3600000).toISOString(),
  estimatedMinutes: 60,
  difficulty: 3,
  gradeImportance: 3,
  preparationGap: 3,
  status: "todo",
});
console.assert(overdue.urgency === 100, "overdue urgency should be 100");

const completed = calculatePriority({
  dueAt: new Date().toISOString(),
  estimatedMinutes: 60,
  difficulty: 5,
  gradeImportance: 5,
  preparationGap: 5,
  status: "completed",
});
console.assert(completed.score === 0, "completed score should be 0");
console.assert(completed.score >= 0 && completed.score <= 100, "score in range");
