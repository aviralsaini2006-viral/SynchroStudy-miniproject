// Pure TypeScript priority calculator. No browser or DB dependencies.

import type { PriorityBand, Task } from "./types";

const WEIGHTS = {
  urgency: 0.35,
  gradeImportance: 0.25,
  difficulty: 0.15,
  preparationGap: 0.15,
  effort: 0.10,
} as const;

const EFFORT_MIN = 15;
const EFFORT_MAX = 240;

export interface PriorityInputs {
  dueAt: string;
  estimatedMinutes: number;
  difficulty: number;
  gradeImportance: number;
  preparationGap: number;
  status: Task["status"];
  now?: Date;
}

export interface PriorityResult {
  score: number;
  band: PriorityBand;
  urgency: number;
  gradeImportanceNorm: number;
  difficultyNorm: number;
  preparationGapNorm: number;
  effortNorm: number;
  reasons: string[];
}

export function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function normalizeLinear(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100);
}

export function calculateUrgency(dueAt: string, now: Date, isCompleted: boolean): number {
  if (isCompleted) return 0;
  const dueMs = new Date(dueAt).getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(dueMs)) return 50;
  const diffMs = dueMs - nowMs;
  const diffHours = diffMs / (1000 * 60 * 60);
  // overdue -> 100
  if (diffHours <= 0) return 100;
  // <= 24h -> 95
  if (diffHours <= 24) return 95;
  // <= 3 days -> 85..90
  if (diffHours <= 72) return 85;
  // <= 7 days -> 70
  if (diffHours <= 168) return 70;
  // <= 14 days -> 50
  if (diffHours <= 336) return 50;
  // <= 30 days -> 30
  if (diffHours <= 720) return 30;
  return 15;
}

export function calculatePriority(inputs: PriorityInputs): PriorityResult {
  const now = inputs.now ?? new Date();
  const isCompleted = inputs.status === "completed";
  const urgency = isCompleted ? 0 : calculateUrgency(inputs.dueAt, now, isCompleted);
  const gradeImportanceNorm = normalizeLinear(inputs.gradeImportance, 1, 5);
  const difficultyNorm = normalizeLinear(inputs.difficulty, 1, 5);
  const preparationGapNorm = normalizeLinear(inputs.preparationGap, 1, 5);
  const effortNorm = normalizeLinear(inputs.estimatedMinutes, EFFORT_MIN, EFFORT_MAX);

  const raw =
    WEIGHTS.urgency * urgency +
    WEIGHTS.gradeImportance * gradeImportanceNorm +
    WEIGHTS.difficulty * difficultyNorm +
    WEIGHTS.preparationGap * preparationGapNorm +
    WEIGHTS.effort * effortNorm;

  const score = isCompleted ? 0 : clamp(raw);
  let band: PriorityBand = "Low";
  if (!isCompleted) {
    if (score >= 70) band = "High";
    else if (score >= 40) band = "Medium";
    else band = "Low";
  } else {
    band = "Low";
  }

  const reasons: string[] = [];
  if (isCompleted) reasons.push("Completed");
  else {
    if (urgency >= 95) reasons.push("Due within 24 hours");
    else if (urgency === 100) reasons.push("Overdue");
    if (inputs.gradeImportance >= 4) reasons.push("High grade importance");
    if (inputs.difficulty >= 4) reasons.push("High difficulty");
    if (inputs.preparationGap >= 4) reasons.push("Underprepared");
    if (inputs.estimatedMinutes >= 120) reasons.push("Large effort");
  }

  return {
    score: Math.round(score * 10) / 10,
    band,
    urgency,
    gradeImportanceNorm,
    difficultyNorm,
    preparationGapNorm,
    effortNorm,
    reasons,
  };
}

export function bandColor(band: PriorityBand): string {
  switch (band) {
    case "High":
      return "text-red-600 bg-red-50 dark:bg-red-900/30 border-red-200";
    case "Medium":
      return "text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200";
    case "Low":
      return "text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200";
  }
}
