# SynchroStudy — Academic Productivity Dashboard

SynchroStudy is a study planning web app that turns scattered assignments and deadlines into a clear, realistic study plan. It offers task management, a transparent weighted priority score, a conflict-free smart scheduler, calendar views, in-app reminders, analytics, and optional Supabase persistence (with a local demo fallback).

## Core Features

- Dashboard with live task, overdue, study-time, and completion metrics
- Task CRUD: title, subject, description, due date/time, estimated minutes, difficulty, grade importance, preparation gap, status
- Weighted priority calculator (0–100) with High/Medium/Low bands and short reasons
- Weekly availability editor and unavailable periods
- Deterministic greedy scheduler that avoids overlapping sessions
- Calendar (agenda) view for deadlines and study sessions
- Manual session reschedule with conflict validation
- In-app reminder center with deduplication
- Analytics: completion rate, subject stats, weekly study minutes
- Settings: subjects, availability, notification preferences, integrations status
- Row-level security ready data model (Supabase optional)
- Local demo mode with localStorage persistence
- Pitch-black dark theme with card hover effects

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS (CDN) + custom CSS |
| State | React Context + hooks |
| Persistence | localStorage (demo) / Supabase (optional) |
| Charts | Recharts |
| Icons | lucide-react available |
| Logic | Pure TypeScript modules (priority, scheduler) |

## System Architecture

```
Student (Browser)
   |
   v
React + TypeScript UI (Vite)
   |-- Dashboard
   |-- My Tasks
   |-- Smart Planner
   |-- Calendar
   |-- Analytics
   |-- Settings
   |
   |-- Domain Logic (pure, testable)
   |     |-- Priority Calculator (calculatePriority.ts)
   |     |-- Scheduler (scheduler.ts)
   |     |-- Conflict Detection (half-open intervals)
   |
   v
Application Data Layer
   |-- storage.ts (localStorage demo mode)
   |-- supabase.ts (optional client)
   |
   +--> Supabase (Auth + PostgreSQL + RLS)  [optional]
   |
   +--> Optional Integrations [not configured in this build]
         |-- Google Calendar
         |-- Todoist
         |-- Telegram
```

### Component Flow

1. UI calls AppContext actions (add/update/delete task, save availability, replace sessions).
2. AppContext persists state via `saveState` (localStorage) and recalculates priority scores.
3. Dashboard and Analytics derive metrics from stored state.
4. Planner calls `generateSchedule(tasks, sessions, availability)` returning new sessions and unscheduled tasks.
5. Calendar renders sessions + deadlines; manual reschedule validates conflicts via `rescheduleSession`.

### Folder Structure

```
src/
  app / components / pages
  domain/
    priority.ts        # pure priority calculator
    scheduler.ts       # deterministic scheduler
    types.ts           # shared TypeScript types
  lib/
    storage.ts         # seed data, load/save state
    datetime.ts        # date helpers
    supabase.ts        # optional client
  state/
    AppContext.tsx     # global state + actions
  pages/
    DashboardPage, TasksPage, PlannerPage, CalendarPage, AnalyticsPage, SettingsPage
```

## Data Model

User-owned entities:

- **profiles**: id, display_name, timezone, timestamps
- **subjects**: id, user_id, name, color
- **tasks**: id, user_id, subject_id, title, description, due_at, estimated_minutes, difficulty, grade_importance, preparation_gap, status, priority_score, priority_band, timestamps
- **availability_rules**: id, user_id, weekday, start_time, end_time, is_available
- **unavailable_periods**: id, user_id, title, starts_at, ends_at
- **study_sessions**: id, user_id, task_id, starts_at, ends_at, status, is_pinned, source, external_event_id
- **notification_preferences**: user-facing reminder settings
- **notification_logs**: reminder history with dedupe_key

In demo mode all records are stored in a single localStorage JSON blob.

## Priority Formula

```
priorityScore = 0.35 × urgency
             + 0.25 × gradeImportance
             + 0.15 × difficulty
             + 0.15 × preparationGap
             + 0.10 × effort
```

All factors are normalized to 0–100 before weighting.

- **Urgency**: 0–100 by time remaining. Overdue unfinished tasks → 100; ≥24h→95; ≤72h→85; ≤7d→70; ≤14d→50; ≤30d→30; else 15.
- **Grade importance**: ((g-1)/4)*100
- **Difficulty**: ((d-1)/4)*100
- **Preparation gap**: ((p-1)/4)*100 (5 = very underprepared)
- **Effort**: normalize 15–240 minutes to 0–100.

Bands: High ≥ 70, Medium ≥ 40 and < 70, Low < 40. Score is 0 for completed tasks.

## Scheduler (MVP)

Deterministic greedy algorithm:

1. Exclude completed tasks.
2. Preserve completed and pinned sessions.
3. Sort eligible tasks by priority (desc), then due date (asc), then id.
4. For each task, split remaining effort into sessions up to the configured length.
5. Find the earliest available slot before the deadline and within daily limit.
6. Use half-open intervals `[start, end)` for conflict checks.
7. Report unscheduled tasks with a reason.

Conflict rules: two sessions conflict if they overlap. A session ending at 10:00 does not conflict with one starting at 10:00.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. (Optional) Create `.env`:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
3. Start dev server:
   ```
   npm run dev
   ```
4. Production build:
   ```
   npm run build
   ```

If Supabase is not configured, the app automatically runs in local demo mode (localStorage).

## Testing

- `npm run build` (TypeScript check + Vite production build)
- Manual smoke: create/edit/complete/delete task; schedule generation; calendar reschedule; analytics update; refresh persistence.
- Domain tests are documented in `src/domain/priority.test.ts` (smoke assertions).

## Demo Script (3 minutes)

1. Open Dashboard and explain summary cards.
2. Create a task due soon; adjust effort, difficulty, grade importance.
3. Show priority score/band and how it changes with deadline/importance.
4. Set availability and generate a weekly plan; show no overlaps and unscheduled warnings.
5. Complete a task; show Dashboard updates.
6. Open Settings; explain integrations are “Not configured.”

## Integrations Status

Google Calendar, Todoist, and Telegram are **not implemented** in this build. They appear as “Not configured” and the app provides setup guidance only. No external service is simulated as connected.

## Limitations

- Single user-local time zone (`Asia/Kolkata` by default)
- Local demo persistence is not a substitute for secure multi-user storage
- No real authentication or Supabase migrations in this build
- No automated test runner included (build + smoke checks)

## Credits

Made by Aviral Saini and Alok Giri.
