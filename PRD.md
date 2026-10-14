# SynchroStudy — Product Requirements Document (PRD)

**Document version:** 1.0  
**Project type:** College mini-project / academic productivity web application  
**Status:** Build specification  
**Primary audience:** Student developers, project evaluators, and Bolt.new

---

## 1. Product Summary

**SynchroStudy** is a centralized study dashboard that helps students organize assignments, understand what to work on first, generate realistic study sessions, and track academic progress from one place.

The system combines:
- Assignment and deadline management
- A transparent, weighted task-priority calculator
- A study-plan generator that respects available time and avoids overlapping sessions
- An in-app calendar and deadline reminders
- Optional integrations with Google Calendar, Todoist, and Telegram when real credentials are configured

The product must be useful even when external integrations are not configured. The core experience must never pretend an external service is connected or synchronized when it is not.

### Product value proposition

> Turn scattered assignments and deadlines into a clear, realistic study plan.

## 2. Goals and Non-Goals

### Goals
1. Let a student create, update, complete, filter, and delete academic tasks.
2. Calculate a reproducible priority score from task attributes.
3. Generate daily and weekly study sessions based on deadlines, duration, availability, and task priority.
4. Prevent generated sessions from overlapping and clearly explain work that could not be scheduled.
5. Show tasks, study sessions, and deadlines in a unified dashboard and calendar.
6. Persist data between sessions using Supabase when configured, with a clearly labeled local demo fallback.
7. Provide a clean, responsive, professional interface suitable for a college mini-project demonstration.
8. Keep integrations modular so they can be added after the core application is reliable.

### Non-goals for the first release
- Building a full learning management system (LMS)
- Automatically reading a college portal or email inbox
- AI-generated answers to assignments
- Predicting grades or guaranteeing academic outcomes
- Silently writing to third-party services without user consent
- Claiming real Google Calendar, Todoist, or Telegram functionality without credentials and successful API calls

## 3. Target Users and Main Use Cases

### Primary persona
A college student handling several subjects, assignments, quizzes, practicals, and exams with competing deadlines.

### Main use cases
- Add an assignment due in three days, estimate its effort, and mark its importance.
- See which tasks are most urgent and why.
- Generate a weekly study plan around college hours and other commitments.
- Move or pin a study session and regenerate the remaining schedule.
- Mark work complete and see dashboard metrics update.
- Review overdue tasks and tasks that could not fit into available study time.
- Connect an external service only after completing its setup and authorization.

## 4. Product Scope and Release Priorities

### Must have — core release
- Dashboard
- Task CRUD and status management
- Subjects/courses
- Priority score and priority label
- Availability settings
- Conflict-free study scheduler
- Calendar/list views for sessions and deadlines
- In-app reminders and notification history
- Sample/demo data
- Persistent storage in configured mode
- Validation, error states, responsive layout, README, and basic tests

### Should have — if time permits
- Analytics and progress summaries
- CSV import/export
- Search, sorting, and advanced filters
- Manual session pinning and rescheduling

### Optional integrations — separate phases
- Google Calendar OAuth and event synchronization
- Todoist task synchronization
- Telegram bot reminders

### Future possibilities
- PDF syllabus extraction
- Multiple calendar providers
- Collaborative study groups
- AI-based task description parsing

---

## 5. Functional Requirements

### FR-1: Dashboard
Display:
- Total tasks
- Pending tasks
- Completed tasks
- Overdue tasks
- Upcoming deadlines
- Today's planned study time
- High-priority tasks
- Upcoming study sessions
- Weekly completion overview

All values must be derived from actual application data, not hardcoded dashboard totals.

### FR-2: Task Management
Each task should support:
- Title (required)
- Subject/course
- Description (optional)
- Due date and time
- Estimated effort in minutes
- Difficulty (1–5)
- Grade importance (1–5)
- Preparation gap / readiness (1–5)
- Status: `todo`, `in_progress`, `completed`
- Created and updated timestamps
- Calculated priority score and priority band

Users can create, view, edit, complete, delete, search, sort, and filter tasks. Validate required fields and sensible duration ranges. Completed tasks should not receive new study sessions by default.

### FR-3: Priority Calculator
Use a transparent weighted score from 0 to 100.

**Default weights**
- Deadline urgency: 35%
- Grade importance: 25%
- Difficulty: 15%
- Preparation gap: 15%
- Estimated effort: 10%

Normalize every factor to a 0–100 scale before combining it. The total is:

`priorityScore = 0.35 × urgency + 0.25 × gradeImportance + 0.15 × difficulty + 0.15 × preparationGap + 0.10 × effort`

Recommended initial normalizations:
- **Urgency:** 0–100 based on time remaining, increasing as the deadline approaches. Overdue unfinished tasks should receive 100. Define and unit-test the curve; do not allow negative or greater-than-100 values.
- **Grade importance:** `((gradeImportance - 1) / 4) × 100`
- **Difficulty:** `((difficulty - 1) / 4) × 100`
- **Preparation gap:** `((preparationGap - 1) / 4) × 100`, where 1 means well prepared and 5 means very underprepared.
- **Effort:** normalize estimated effort against a documented configurable range, cap it to 0–100, and test the boundaries. Higher effort modestly increases the score, but must not outweigh an imminent deadline.

Priority bands:
- **High:** score ≥ 70
- **Medium:** score ≥ 40 and < 70
- **Low:** score < 40

Show the score and band in the UI. Where practical, explain the main contributing factors, such as “Due tomorrow” or “High grade importance.” Recalculate whenever relevant task fields or current time change.

**Important:** Keep the scoring logic in a standalone, pure TypeScript module. Do not use fabricated historical completion speed or user behavior in the initial release.

### FR-4: Study Availability
Allow users to define:
- Typical available days
- Available time windows per day
- Unavailable periods/commitments
- Maximum study minutes per day
- Preferred session duration (default 45–60 minutes)
- Break duration between sessions

Handle overnight boundaries and time zones deliberately. For the mini-project MVP, a clearly documented single user-local time zone is acceptable.

### FR-5: Smart Scheduler
Generate a daily or weekly schedule using:
- Unfinished tasks
- Priority scores
- Deadlines
- Estimated remaining effort
- Available time windows
- Daily study limit
- Session length and break settings
- Existing pinned/completed sessions

Required behavior:
1. Schedule higher-priority work first while considering deadline feasibility.
2. Split long tasks into manageable sessions, typically 45–60 minutes.
3. Do not schedule outside available windows.
4. Do not overlap sessions or known unavailable periods.
5. Respect the daily study limit.
6. Preserve completed sessions and user-pinned sessions when regenerating.
7. Avoid duplicate sessions when the same generation action is repeated.
8. Report unscheduled work and explain why it did not fit.
9. Let users regenerate the plan after changing task data or availability.
10. Allow manual rescheduling with validation against conflicts.

Use a deterministic, explainable algorithm for the MVP rather than claiming advanced AI optimization. Prefer earliest-deadline/highest-priority feasible tasks, then place sessions into the earliest available valid slots. A task's deadline must not be silently ignored. If the remaining time cannot fit before a deadline, flag the task as infeasible instead of creating misleading sessions.

### FR-6: Calendar
Provide:
- Weekly calendar view
- Agenda/list view
- Distinct visual styling for deadlines and study sessions
- Session details and task links
- Edit/reschedule action
- Conflict validation

The internal calendar must work without Google Calendar credentials.

### FR-7: In-App Reminders
Show reminders for:
- Deadlines approaching within a configurable window
- Study sessions starting soon
- Overdue unfinished tasks

Include notification preferences and a notification history. Avoid repeated duplicate reminders for the same event and reminder window. In-browser notifications may require user permission; explain that clearly.

### FR-8: Analytics
Display basic, factual metrics:
- Task completion rate
- Completed versus pending tasks
- Study time planned/completed
- Tasks completed by subject
- Weekly progress

Metrics must be calculated from stored data and have useful empty states when there is not enough data.

### FR-9: Integrations
Each integration must have states such as `Not configured`, `Connected`, `Syncing`, `Error`, and `Last synced`.

Never label a service as connected until authorization and a successful verification call complete.

**Google Calendar**
- Use a secure OAuth flow and provider APIs.
- Request only necessary scopes.
- Preview proposed events and ask for confirmation before writing them.
- Store provider event IDs and synchronization timestamps.
- Use idempotent create/update behavior to prevent duplicate events.
- Handle revoked authorization, API errors, rate limits, and token expiry.
- Keep secrets on a trusted server or secure function; never expose client secrets in browser code.

**Todoist**
- Optional integration to create/update tasks after explicit user authorization.
- Track external IDs and synchronization status.
- Define which fields are authoritative when local and remote data conflict.
- If not implemented/configured, show setup instructions and a demo-only status.

**Telegram**
- Optional bot-based reminders after the user deliberately links a chat.
- Keep bot tokens in server-side secrets.
- Do not send messages before the user opts in.
- Log successful and failed delivery attempts.
- If not implemented/configured, show setup instructions and a demo-only status.

**Demo mode**
- Demo mode must be visually identified.
- Mock data and mock integration previews must not be presented as real third-party synchronization.
- Provide an obvious way to distinguish demo records from live records.

### FR-10: Data and Account Settings
Allow users to manage profile preferences, subjects, availability, session settings, and notification preferences. If authentication is enabled, each user must access only their own records.

### FR-11: Import and Export (optional)
If implemented:
- Start with CSV import/export.
- Preview imported records and validate them before saving.
- Report invalid rows clearly.
- Never silently invent due dates or task properties.
- PDF extraction is a later enhancement and should require review before creating tasks.

---

## 6. User Interface and Page Structure

### Visual direction
Use a restrained SaaS dashboard style:
- White/light-gray surfaces
- Navy or charcoal text
- Blue accent color
- Readable typography and consistent spacing
- Rounded cards with subtle borders
- Consistent iconography
- Accessible contrast and keyboard focus
- Responsive layouts for desktop, tablet, and mobile

Avoid excessive gradients, decorative animations, and crowded charts.

### Main navigation
1. **Dashboard** — overview, urgent tasks, today's sessions
2. **My Tasks** — task table/list, filters, create/edit form
3. **Smart Planner** — availability controls, generate plan, unscheduled work
4. **Calendar** — week and agenda views
5. **Analytics** — progress and completion metrics
6. **Settings** — profile, subjects, availability, reminders, integrations

### Required UI states
- Loading
- Empty state with a clear next action
- Validation errors
- Successful save
- API/integration error
- Offline or demo-mode notice where applicable
- Confirmation before destructive actions
- Clear labels for live versus demo functionality

---

## 7. Technical Architecture

### Recommended stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **UI components:** a consistent accessible component library, if compatible with the project
- **Charts:** a lightweight React chart library only where useful
- **Backend/data/auth:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Core logic:** pure TypeScript modules for priority calculation and scheduling
- **Integrations:** server-side functions/API routes for OAuth and provider API calls
- **Testing:** Vitest and React Testing Library; integration tests for database/API flows where feasible
- **Version control:** Git

Bolt may select compatible tooling based on its environment, but it must not replace the required behavior with static mock screens.

### High-level architecture

```text
Student
  |
  v
React + TypeScript UI
  |-- Dashboard / Tasks / Planner / Calendar / Analytics / Settings
  |
  |-- Domain logic (pure TypeScript)
  |     |-- Priority calculator
  |     |-- Scheduling engine
  |     |-- Validation and conflict detection
  |
  v
Application data layer
  |-- Supabase client for user-scoped application data
  |-- Server functions for privileged operations
  |
  +--> Supabase Auth + PostgreSQL + Row Level Security
  |
  +--> Integration service layer (optional)
         |-- Google Calendar
         |-- Todoist
         |-- Telegram Bot API
```

### Architectural rules
- Keep UI components separate from business logic and persistence.
- Priority calculation and schedule generation must be testable without a browser or database.
- Keep provider-specific code behind small integration interfaces.
- Use environment variables for configuration.
- Never commit API keys, OAuth secrets, or bot tokens.
- Do not call privileged third-party APIs directly from untrusted browser code.
- Provide useful error messages without leaking secrets.
- Keep local demo mode isolated from live user data.
- Do not claim an integration is implemented merely because its settings screen exists.

### Suggested folder structure

```text
src/
  app/
    routes/
    layout/
  components/
    common/
    dashboard/
    tasks/
    planner/
    calendar/
    analytics/
    settings/
  features/
    tasks/
    subjects/
    planner/
    reminders/
    integrations/
  lib/
    supabase/
    validation/
    date-time/
  services/
    tasks.service.ts
    subjects.service.ts
    sessions.service.ts
    reminders.service.ts
    integrations/
  domain/
    priority/
      calculatePriority.ts
      calculatePriority.test.ts
    scheduler/
      generateSchedule.ts
      detectConflicts.ts
      generateSchedule.test.ts
    types/
  hooks/
  styles/
  test/
supabase/
  migrations/
  functions/
docs/
```

Adjust this structure to the framework generated by Bolt, but preserve separation of concerns.

---

## 8. Data Model

Use PostgreSQL tables with UUID primary keys, timestamps, indexes on commonly filtered fields, and foreign keys. Add `user_id` to user-owned records and enforce ownership with Row Level Security.

### `profiles`
- `id` UUID, primary key referencing the authenticated user
- `display_name` text
- `timezone` text
- `created_at` timestamptz
- `updated_at` timestamptz

### `subjects`
- `id` UUID primary key
- `user_id` UUID
- `name` text
- `color` text, optional
- `created_at` timestamptz

### `tasks`
- `id` UUID primary key
- `user_id` UUID
- `subject_id` UUID nullable
- `title` text, required
- `description` text nullable
- `due_at` timestamptz
- `estimated_minutes` integer
- `difficulty` smallint, 1–5
- `grade_importance` smallint, 1–5
- `preparation_gap` smallint, 1–5
- `status` text/enum: `todo`, `in_progress`, `completed`
- `priority_score` numeric or calculated on read
- `priority_band` text or calculated on read
- `created_at` timestamptz
- `updated_at` timestamptz
- `completed_at` timestamptz nullable

### `availability_rules`
- `id` UUID primary key
- `user_id` UUID
- `weekday` smallint (define convention, e.g. 0–6)
- `start_time` time
- `end_time` time
- `is_available` boolean
- `created_at` timestamptz

### `unavailable_periods`
- `id` UUID primary key
- `user_id` UUID
- `title` text
- `starts_at` timestamptz
- `ends_at` timestamptz
- `created_at` timestamptz

### `study_sessions`
- `id` UUID primary key
- `user_id` UUID
- `task_id` UUID
- `starts_at` timestamptz
- `ends_at` timestamptz
- `status` text/enum: `planned`, `completed`, `skipped`
- `is_pinned` boolean default false
- `source` text: `generated`, `manual`, or `google_calendar`
- `external_event_id` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### `notification_preferences`
- `id` UUID primary key
- `user_id` UUID unique
- `deadline_reminders_enabled` boolean
- `session_reminders_enabled` boolean
- `deadline_lead_minutes` integer
- `session_lead_minutes` integer
- `telegram_enabled` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### `notification_logs`
- `id` UUID primary key
- `user_id` UUID
- `task_id` UUID nullable
- `session_id` UUID nullable
- `channel` text: `in_app`, `browser`, or `telegram`
- `status` text: `queued`, `sent`, `failed`, `dismissed`
- `dedupe_key` text
- `sent_at` timestamptz nullable
- `error_summary` text nullable
- `created_at` timestamptz

### `integration_connections` (only if integrations are implemented)
- `id` UUID primary key
- `user_id` UUID
- `provider` text: `google_calendar`, `todoist`, or `telegram`
- `connection_status` text
- `external_account_id` text nullable
- `last_synced_at` timestamptz nullable
- `created_at` timestamptz
- `updated_at` timestamptz

Store OAuth tokens only using an appropriate secure server-side mechanism. Do not expose access or refresh tokens to the frontend or store provider secrets in public client-readable tables.

### Data constraints
- Estimated effort must be positive and within a documented upper limit.
- Difficulty, grade importance, and preparation gap must be integers from 1 to 5.
- Session end must be after session start.
- A task and all related records must be owned by the same user.
- Prefer database constraints and validation in addition to frontend validation.

---

## 9. Scheduling Algorithm — MVP Specification

Use a deterministic greedy scheduler. The algorithm should be explainable in a viva and predictable in tests.

### Inputs
- Unfinished tasks with due dates, priorities, and remaining estimated minutes
- User availability windows
- Unavailable periods
- Existing pinned or completed sessions
- Session duration and break settings
- Maximum daily study minutes
- Planning horizon (day/week)

### Process
1. Validate all task and availability inputs.
2. Exclude completed tasks from new scheduling.
3. Preserve completed and pinned sessions.
4. Calculate remaining estimated effort for each task using existing completed sessions only if that data is reliable; otherwise use the task's stated estimate.
5. Sort tasks using a documented deterministic ordering: deadline feasibility first, then descending priority, then earliest deadline, then stable task ID as a tie-breaker.
6. For each task, find the earliest available slot that fits within availability and before the task's deadline.
7. Allocate a session up to the configured session length or the task's remaining duration.
8. Enforce daily study limits and breaks.
9. Re-check each candidate slot against existing sessions and unavailable periods before committing it.
10. Continue until the task is allocated or no valid slot remains.
11. Return the generated sessions and a list of unscheduled tasks with a reason, such as insufficient time, outside availability, or daily limit reached.
12. Save the plan only after validating the entire proposed schedule.

### Conflict rules
Two sessions conflict if their time intervals overlap. Use half-open intervals `[start, end)` so a session ending at 10:00 does not conflict with another starting at 10:00. Apply the same rule to unavailable periods.

### Regeneration behavior
- Do not delete completed sessions.
- Do not move pinned sessions without explicit confirmation.
- Reuse or replace prior generated sessions in a controlled transaction-like operation.
- Avoid duplicate sessions if generation is repeated with unchanged inputs.
- Show a preview before replacing a user's existing generated plan.

### Scheduler acceptance criteria
- No overlapping generated sessions.
- No session outside an allowed availability window.
- No session scheduled after its task's deadline.
- Daily study limits are never exceeded.
- Pinned and completed sessions remain unchanged.
- Unscheduled work is reported honestly.
- Identical inputs produce the same output, aside from explicitly documented time-dependent urgency changes.

---

## 10. Security, Privacy, and Reliability

- Enforce Supabase Row Level Security for every user-owned table.
- Policies must restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to the authenticated owner.
- Validate and sanitize user input on both client and server where relevant.
- Keep secrets in environment variables or managed secret storage.
- Do not expose service-role keys, OAuth secrets, or Telegram bot tokens in client bundles.
- Use least-privilege OAuth scopes.
- Request consent before external writes and provide disconnect/revoke options.
- Avoid logging tokens or sensitive personal data.
- Provide clear errors for network failures and expired connections.
- Handle duplicate requests idempotently where possible.
- Keep demo data separate from real account data.
- Add loading and retry states for network operations.
- Provide a privacy note explaining what data is stored and which integrations receive data.

---

## 11. Testing and Quality Assurance

### Unit tests
**Priority calculator**
- Each factor maps to the documented 0–100 range.
- Overdue unfinished task urgency reaches the documented maximum.
- Scores remain between 0 and 100.
- Priority bands use the correct thresholds.
- Changing task attributes changes the score predictably.

**Scheduler**
- Creates sessions for eligible tasks.
- Never creates overlapping sessions.
- Respects availability and unavailable periods.
- Respects the daily study limit.
- Does not schedule completed tasks.
- Does not schedule after a deadline.
- Preserves pinned/completed sessions.
- Reports tasks that cannot fit.
- Repeated generation does not create duplicates.

### UI and integration tests
- Create, edit, complete, and delete a task.
- Filters and sorting return the correct records.
- Dashboard counts update after task changes.
- Refreshing the app preserves data in configured persistence mode.
- Unconfigured integrations are labeled accurately.
- Failed API calls show a clear error without claiming success.
- User A cannot access User B's data.

### Manual acceptance checklist
- [ ] Application starts using documented instructions.
- [ ] Dashboard works with demo data.
- [ ] Task CRUD works.
- [ ] Priority score and band recalculate.
- [ ] Schedule generation works.
- [ ] No overlapping sessions are created.
- [ ] Calendar and task status stay consistent.
- [ ] Data persists in configured mode.
- [ ] Responsive layout works on mobile and desktop.
- [ ] No broken buttons or placeholder actions in the core flow.
- [ ] No secrets are committed.
- [ ] README and test instructions are complete.

---

## 12. Phased Implementation Roadmap

Build and verify each phase before moving to the next. Do not ask Bolt to build every external integration first.

### Phase 0 — Project foundation and design system

**Objective:** Establish a running, consistent application shell.

**Build**
- React + TypeScript + Tailwind setup
- Main layout, sidebar, header, navigation, reusable cards, forms, badges, and dialogs
- Responsive design and consistent typography
- Routes for Dashboard, My Tasks, Smart Planner, Calendar, Analytics, and Settings
- Demo mode banner and sample-data seed

**Deliverables**
- Application starts without errors
- All pages render
- Navigation works
- Shared design components are reusable

**Acceptance criteria**
- No dead navigation links
- Responsive sidebar/navigation
- Empty, loading, and error states exist
- Sample data is clearly marked as demo data

**Bolt prompt**
> Implement Phase 0 of SynchroStudy only. Set up a clean React + TypeScript + Tailwind application with responsive navigation and the six main pages: Dashboard, My Tasks, Smart Planner, Calendar, Analytics, and Settings. Create reusable components, consistent styles, sample demo data, and clear demo-mode labeling. Do not build external integrations yet. Ensure the app runs and every navigation item works.

### Phase 1 — Task and subject management

**Objective:** Make the app useful before adding automation.

**Build**
- Subject CRUD
- Task create/edit/delete/complete
- Form validation
- Search, filter, and sort
- Local demo persistence or configured Supabase persistence
- Dashboard metrics derived from task data

**Acceptance criteria**
- A task can be created, edited, completed, and deleted
- Invalid data is rejected with understandable messages
- Dashboard counts update immediately
- Refresh behavior matches the selected persistence mode

**Bolt prompt**
> Implement Phase 1. Add complete task and subject management with title, subject, description, due date/time, estimated minutes, difficulty, grade importance, preparation gap, and status. Implement create, edit, delete, complete, search, filters, and sorting. Update dashboard counts from real app data. Use local persistence for demo mode and keep the data layer ready for Supabase. Add validation and tests for the main task operations.

### Phase 2 — Priority calculator

**Objective:** Calculate and explain task urgency.

**Build**
- Standalone pure TypeScript priority function
- Documented factor normalization and weighted formula
- High/Medium/Low labels
- Score display and short reason labels
- Unit tests

**Acceptance criteria**
- Score always remains 0–100
- Labels match defined thresholds
- Overdue unfinished tasks are treated as highly urgent
- Changing relevant fields recalculates the score
- No invented historical behavior is used

**Bolt prompt**
> Implement Phase 2 only. Create a pure TypeScript priority calculator using the documented weights: urgency 35%, grade importance 25%, difficulty 15%, preparation gap 15%, effort 10%. Normalize each input to 0–100, clamp the final score to 0–100, and use High >= 70, Medium >= 40, otherwise Low. Define and document the urgency and effort normalization curves. Show the score, label, and brief reasons in task rows/cards. Add unit tests for boundaries, overdue tasks, thresholds, and recalculation. Do not use fabricated historical completion speed.

### Phase 3 — Availability settings and smart scheduler

**Objective:** Generate valid study sessions automatically.

**Build**
- Weekly availability editor
- Unavailable periods
- Daily study limit
- Session length and break settings
- Deterministic scheduling engine
- Conflict detection
- Unscheduled task report
- Schedule preview and regeneration

**Acceptance criteria**
- Sessions do not overlap
- Sessions fit availability and daily limits
- Sessions do not occur after task deadlines
- Completed/pinned sessions are preserved
- Tasks that cannot fit are reported with reasons

**Bolt prompt**
> Implement Phase 3. Build the availability settings and deterministic TypeScript study scheduler described in this PRD. Schedule unfinished tasks into valid slots using deadline feasibility and priority. Support 45–60 minute sessions, breaks, daily study limits, unavailable periods, pinned sessions, and completed sessions. Use half-open time intervals for conflict detection. Preview the plan before saving, preserve pinned/completed sessions, and show unscheduled tasks with clear reasons. Add comprehensive unit tests and do not describe the scheduler as AI unless a real AI component is added.

### Phase 4 — Calendar and reminders

**Objective:** Make the plan usable day to day.

**Build**
- Weekly calendar and agenda view
- Session and deadline event types
- Manual session rescheduling
- In-app reminder center
- Notification preferences and history
- Duplicate reminder prevention

**Acceptance criteria**
- Calendar shows saved sessions and deadlines
- Rescheduling validates conflicts
- Reminders reflect actual app data
- Duplicate reminder entries are prevented
- Browser notifications ask for permission where required

**Bolt prompt**
> Implement Phase 4. Create a working weekly calendar and agenda view for deadlines and study sessions. Add session details, manual rescheduling with conflict checks, an in-app reminder center, configurable reminder preferences, and notification history. Avoid duplicate reminders using a deduplication key. Keep all core functionality working without third-party integrations. Do not show a reminder as delivered through an external channel unless delivery is verified.

### Phase 5 — Supabase authentication and database

**Objective:** Persist real user data securely.

**Build**
- Supabase setup and environment configuration
- Sign up, sign in, sign out
- Database migrations
- User-scoped queries
- Row Level Security policies
- Loading/error/retry handling
- Data migration strategy from demo mode only if needed

**Acceptance criteria**
- Authenticated users can access only their own records
- RLS covers all user-owned tables and CRUD operations
- Secrets are not exposed to the browser
- Setup instructions work from a clean environment

**Bolt prompt**
> Implement Phase 5. Integrate Supabase Auth and PostgreSQL persistence. Create migrations for profiles, subjects, tasks, availability rules, unavailable periods, study sessions, notification preferences, and notification logs. Add Row Level Security policies that enforce per-user access for every CRUD operation. Use environment variables and never expose service-role keys or provider secrets in frontend code. Handle unauthenticated states, loading, errors, and retries. Preserve local demo mode when Supabase is not configured and label the mode clearly. Include exact setup instructions.

### Phase 6 — Google Calendar integration

**Objective:** Add real calendar synchronization after the core planner works.

**Build**
- Secure OAuth flow
- Connection status
- Calendar free/busy retrieval where supported by granted scopes
- Event preview and explicit confirmation
- Create/update synchronization with external event IDs
- Error handling and disconnect

**Acceptance criteria**
- No false connected/synced state
- User confirms events before they are created
- Repeated sync does not create duplicate events
- Credentials and tokens are handled securely
- App remains useful when not configured

**Bolt prompt**
> Implement Phase 6 as an optional real Google Calendar integration. Use secure OAuth and server-side API calls with least-privilege scopes. Add connection status, error handling, disconnect, event preview, and explicit user confirmation before creating or updating calendar events. Store external event IDs and make synchronization idempotent. Never expose OAuth secrets or tokens to browser code. If configuration is missing, keep the in-app calendar fully functional and clearly display “Not configured”; never simulate a successful Google sync.

### Phase 7 — Todoist and Telegram integrations

**Objective:** Add external task synchronization and messaging reminders.

**Build**
- Todoist connection and explicit sync action
- Telegram bot linking and opt-in
- Secure server-side secret handling
- Notification delivery logs
- Retry and duplicate prevention
- Clear disconnected/error states

**Acceptance criteria**
- User opts in before data is sent
- Tokens remain server-side
- Failed sends are visible
- Duplicate tasks/messages are prevented where feasible
- Missing configuration is clearly explained

**Bolt prompt**
> Implement Phase 7 as two optional integrations: Todoist task synchronization and Telegram reminders. Use real APIs only when valid credentials and user authorization are available. Add explicit opt-in, connection status, server-side secret handling, external IDs, deduplication, error reporting, delivery logs, and disconnect controls. If an integration is not configured, show clear setup instructions and keep the rest of the app working. Never claim a task was synced or a message was sent unless the provider confirms success.

### Phase 8 — QA, polish, documentation, and demonstration

**Objective:** Prepare a reliable college mini-project submission.

**Build**
- Run all unit and UI tests
- Fix broken flows and accessibility issues
- Verify desktop/mobile responsiveness
- Review security and environment configuration
- Complete README and project documentation
- Prepare sample demo data and a short demonstration flow

**Acceptance criteria**
- Core flows work from a clean start
- No major console/runtime errors
- Tests pass
- README explains setup, environment variables, features, limitations, and demo steps
- Integrations are described honestly
- Project is ready to present

**Bolt prompt**
> Implement Phase 8. Audit the full SynchroStudy project for broken buttons, incorrect calculations, scheduling conflicts, data persistence issues, responsive layout problems, accessibility, security, and misleading integration statuses. Run and fix tests. Write a README with project overview, architecture, data model, priority formula, scheduler design, setup instructions, environment variables, testing, limitations, and a 3-minute demo script. Add a concise project report section and 10 likely viva questions with answers. Do not add unrelated features until the core app passes its acceptance checklist.

---

## 13. Recommended Build Order and Scope Control

For a typical college mini-project, complete these in order:

1. Foundation and UI
2. Task and subject management
3. Priority calculator
4. Scheduler and conflict detection
5. Calendar and in-app reminders
6. Supabase persistence and authentication
7. Optional Google Calendar
8. Optional Todoist and Telegram
9. Testing, documentation, and demo preparation

If time is limited, finish phases 0–5 to a high standard before attempting phases 6–7. A fully working scheduler is more valuable than several integration screens that do not actually connect.

### Minimum viable submission
- Working dashboard
- Task CRUD
- Priority score and explanation
- Schedule generation
- Conflict-free calendar
- Data persistence in the chosen mode
- Unit tests for priority and scheduling
- README and demonstration script

### Suggested 3-minute demonstration
1. Open the dashboard and explain the summary cards.
2. Create a task due soon and set its effort, difficulty, and grade importance.
3. Show the priority score and how it changes when the deadline or importance changes.
4. Set availability and generate a weekly plan.
5. Demonstrate that sessions do not overlap and show any unscheduled task warning.
6. Mark a task complete and show the dashboard update.
7. Open Settings and explain which integrations are configured versus optional.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope becomes too large | Complete core phases before optional integrations |
| Scheduler creates invalid sessions | Keep logic pure, use interval conflict checks, and test boundaries |
| Priority score seems arbitrary | Document weights and normalization and explain the score in the UI |
| External API credentials delay progress | Keep the internal calendar and in-app reminders fully functional |
| Duplicate external events/tasks | Store provider IDs and use idempotent sync operations |
| Data leaks between users | Enable and test RLS for every user-owned table |
| Bolt produces a polished but nonfunctional UI | Test every core action and require real data-backed state changes |
| Demo mode is mistaken for live integration | Add persistent, visible mode and connection labels |
| Dates behave incorrectly | Store timestamps consistently and define the user's time zone |

---

## 15. Definition of Done

SynchroStudy is ready for demonstration when:
- The application runs using documented instructions.
- A student can manage tasks and subjects end to end.
- Priority scoring is documented, deterministic, and tested.
- The scheduler creates valid sessions without overlaps and reports unscheduled work.
- Calendar and dashboard reflect actual saved state.
- The selected persistence mode behaves consistently after refresh.
- User data is protected when authentication is enabled.
- Optional integrations are either genuinely implemented and tested or clearly marked as not configured.
- No core button is merely decorative.
- Tests and documentation are included.
- The demo can be completed in three minutes without relying on unverified external services.

---

## 16. Project Constraints and Assumptions

- This is an educational mini-project, not a production-certified academic platform.
- The first release uses a deterministic algorithm, not a claim of artificial intelligence.
- The student supplies task details and deadlines; automatic syllabus extraction is not required for the core release.
- Integration availability depends on provider accounts, credentials, OAuth configuration, and platform permissions.
- Local demo mode is a fallback for development and demonstration, not a substitute for secure multi-user persistence.
- All scoring weights and thresholds are configurable constants and should be documented in code and the report.
