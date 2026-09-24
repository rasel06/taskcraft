# Prompt for AI Developer: Build "TaskCraft" Project & Issue Management System

Copy and paste the prompt below into an advanced AI coding assistant (like Claude 3.5 Sonnet, Cursor, v0, or GPT-4o) to generate a fully functional, production-ready, dynamic Next.js application matching the TaskCraft interface and capabilities.

---

```text
You are an expert full-stack developer. Your task is to build a complete, production-ready, fully functional dynamic web application named "TaskCraft" — a modern project and issue management platform.

### Tech Stack Constraints
- Framework: Next.js (App Router, React Server Components where beneficial, Client Components for interactive states)
- CSS: Tailwind CSS (with highly polished dark mode support resembling linear/zinc aesthetics)
- Component Library: shadcn/ui (Radix UI primitives, dynamic dialogs, calendars, select lists, custom sheets)
- Database: SQLite (configured via Prisma ORM or Drizzle ORM for dynamic persistence)
- Icons: Lucide React

---

## DB SCHEMA DESIGN (SQLite + Prisma)
Implement the following schema to support the database relationships:

1. User
   - id: String (PK)
   - name: String
   - email: String (Unique)
   - avatarUrl: String?
   - projectsLed: Project[] (Relation to Project.lead)
   - projectMemberships: ProjectMember[]
   - teamMemberships: TeamMember[]
   - assignedIssues: Issue[]

2. Team
   - id: String (PK)
   - name: String
   - identifier: String (Unique, 3-4 letters uppercase, e.g., "FRO", used to prefix issue numbers)
   - timezone: String (e.g., "GMT+6:00 - Bangladesh Standard Time")
   - isPrivate: Boolean (Default: false)
   - parentTeamId: String? (Self-relation for sub-teams)
   - projects: Project[]
   - members: TeamMember[]

3. Project
   - id: String (PK)
   - name: String
   - description: String? (Supports rich descriptions / briefs)
   - status: String (e.g., "Backlog", "Planned", "Active", "Completed")
   - priority: String (e.g., "No priority", "Low", "Medium", "High")
   - leadId: String (FK to User)
   - startDate: DateTime?
   - targetDate: DateTime? (End date)
   - isDraft: Boolean (Default: false)
   - teamId: String (FK to Team)
   - milestones: Milestone[]
   - issues: Issue[]
   - members: ProjectMember[]

4. Milestone
   - id: String (PK)
   - projectId: String (FK to Project)
   - name: String
   - description: String?

5. Issue
   - id: String (PK) (Format: "[Team-Identifier]-[Auto-Increment Number]" e.g., "FRO-12")
   - title: String
   - description: String?
   - status: String (e.g., "Backlog", "Todo", "In Progress", "Done")
   - priority: String
   - assigneeId: String? (FK to User)
   - projectId: String (FK to Project)
   - createdAt: DateTime (Default: now)

6. TeamMember & ProjectMember
   - Explicit join tables linking Users to Teams and Projects with role definitions to enforce visibility restrictions.

---

## STEP-BY-STEP IMPLEMENTATION PLAN

Follow this structured, step-by-step development guide. Generate complete, robust code for each section, avoiding placeholders or truncated code.

### STEP 1: Main Layout & Sidebar Architecture (The Workspace View)
1. Set up a dark-themed responsive split sidebar layout. 
2. Sidebar items:
   - Global Search input triggering a command-menu style Search Modal.
   - Core Pages: Inbox, My Issues, Views, Roadmaps.
   - Dynamic Teams list (loaded from SQLite) with sub-menus: "Issues", "Cycles", "Roadmaps", "Settings".
   - Administration section: "Invite people", "Connect GitHub" integration link.
3. Use a zinc-950 dark theme background (`bg-zinc-950`, border colors `border-zinc-800`, text colors `text-zinc-400` with high-contrast active states `text-zinc-100`).

### STEP 2: Team Creation & Management Settings (The Admin Portal)
1. Build a "Create Team" dialog matching the TaskCraft style:
   - Fields: Team Name, Team Identifier (auto-capitalize, max 4 letters), Icon selector, Timezone selector dropdown.
   - Options: Access toggle (Public vs "Private team - visible only to members and workspace admins") and a "Clone settings" dropdown to replicate cycles/workflows from an existing team.
2. Enforce validation: Ensure the identifier is unique and alphanumeric.
3. Build the Team Settings page layout:
   - Sidebar settings hierarchy:
     - Personal: Profile, Notifications, Preferences, Security, Agent Personalization.
     - Issues: Labels, Templates, SLAs.
     - Projects: Labels, Templates, Statuses, Updates.
     - Workspace: Members, Teams, Billing, Integrations.
     - Features toggle matrix (AI & Agents, Initiatives, Documents, Customer requests, Releases).

### STEP 3: Multi-Stage Project Creator Drawer / Modal (Requirements 1 & 3)
1. Build the "New Project" creation modal. It must look like a high-fidelity sliding drawer or absolute-centered layout.
2. Form fields:
   - Project Name & Description (brief inputs).
   - "Project Lead" and "Members" dropdowns (dynamically populated from workspace users).
   - "Timeline": Start and Target (end) date selectors using a custom date range picker styled with shadcn/ui Popovers and Calendars. Include a granularity toggle for UI display: Day, Month, Quarter, Half-year, Year.
   - Inline Milestones:
     - Section inside the drawer showing an active list of project milestones.
     - Add milestone inline form: Milestone Name (input), Description (input), and an "Add" button.
     - Added milestones should show a list with a custom diamond icon next to them and edit/delete actions.
   - Automation: Add a decorative or mocked AI panel "Create with Agent" that simulates outline generation.
   - Actions: Dual primary buttons: "Save as draft" (sets `isDraft: true`) and "Publish" (sets `isDraft: false` and redirects to roadmap/project board).

### STEP 4: Advanced Issue Creator with Rapid Ingestion (Requirements 2, 4 & 5)
1. Build the "New Issue" modal:
   - Form fields: Issue Title, Description (rich textarea), Status selection (Backlog, Todo, etc.), Priority selection (No priority, Low, Medium, High), Assignee selection dropdown, Project dropdown, and Labels selector.
   - Attachment: Include a styled paperclip icon triggering local file selection (store mock URLs in SQLite or local state).
   - Core Feature: Include a "Create more" toggle at the bottom-left of the footer.
     - When toggle is ON: Clicking "Create issue" submits the database transaction, clears the title/description fields, displays a temporary success toast, and keeps the dialog open for the next task submission.
     - When toggle is OFF: Creating an issue closes the modal.
2. Create code to auto-calculate the Issue ID: On submission, read the parent Project -> Team identifier (e.g. FRO) and dynamically append the incremented integer for that team (e.g. FRO-1, FRO-2).

### STEP 5: Board Views, Searching & Filtering (Requirement 6)
1. Build a dynamic board/list page for a selected Project.
2. Features:
   - Backlog/Status lanes displaying issue cards. Each card must show: Issue ID (e.g., FRO-12), Title, Priority Icon, Assignee Avatar, and Creation Date.
   - Top filtering bar: Search input field, Group By selector, Order By selector, and filter badges.
3. Build the Global Search (Command-K style):
   - Command dialog that queries the SQLite database across issues and projects.
   - Users can type keyword queries. The search should support project-specific filtering (e.g., typing "FRO:" or selecting a Project chip first, then typing keywords to search exclusively within that project's issues).

### STEP 6: Multi-Project Access Control & Security Middleware (Requirement 7)
1. Enforce strict visibility rules:
   - A user can be assigned to multiple independent projects as a member.
   - If a Project belongs to a **Private Team**, configure check rules on the route and database fetch levels:
     - Retrieve the current user's team membership.
     - If the team is marked `isPrivate: true` and the current user is NOT in the `TeamMember` table for that team (and is not a workspace admin), deny page view and return a custom access-denied layout.
     - Hide private projects from the global search results and sidebar navigation unless the user has authorized membership.

---

### STYLING & DESIGN GUIDELINES
- Backgrounds: Deep black (`#09090b`) or heavy dark gray (`#18181b`).
- Card/Component borders: `border-zinc-800` or `border-zinc-900`.
- Milestone visual style: A solid cyan/blue or emerald diamond indicator (e.g., `w-3 h-3 rotate-45 border-2 bg-transparent border-emerald-500`).
- Dialog transitions: Smooth scale-up transitions or slide-in sheets.
- Toast notifications: Integrated shadcn/ui sonner or custom toasts for issue creation success.

Begin by generating the Prisma Database Schema, database seeding script (populating default users, teams, and initial statuses), and then build the full Next.js page structure!
```

---

## Implemented Beyond Original Scope

The sections above are the original build prompt. The live application has since grown past it. This section documents what actually exists today, so this file stays a trustworthy reference rather than a stale spec.

### Notifications (Telegram + Slack)
- Per-user Telegram linking: a member generates a one-time code in Settings → Notifications, sends `/start <code>` to the workspace bot (long-polled by `scripts/telegram-bot.js`, run via `npm run telegram:bot`), which links their `telegramChatId`.
- Slack: a single workspace Incoming Webhook (`SLACK_WEBHOOK_URL`) posts to one channel. Members can optionally link their own Slack member ID (`slackUserId`) in Settings → Notifications to get `@mentioned` in that channel's messages instead of just seeing an unaddressed broadcast.
- Events covered: project create/update/status-change/member-add/member-remove/role-change, issue create/update (including multi-assignee changes), team member-add/member-remove/lead-change, and discussion replies (notifies only the parent comment's author, Telegram + Slack-mention-only, never a full-channel broadcast for a 1:1 reply).
- Message formatting: shared composer (`src/lib/notify/render.ts`, `templates.ts`) gives every notification type a consistent look — bold title, italic context line, colored status/priority indicator emoji, a footer with actor name and a link back into the app. Telegram uses `parse_mode: HTML`; Slack uses `mrkdwn` inside a colored `attachments` sidebar bar (color keyed by action type, or by target status for status-change events).
- Delivery is fire-and-forget (`Promise.allSettled`) — a Telegram/Slack outage never fails the underlying DB write.
- Every attempted send (per channel, per recipient) is written to a `NotificationLog` table for audit, viewable at Settings → Audit log (gated behind a `view_audit_log` permission, granted to the seeded Admin role only).

### Multi-assignee issues
- Issues support multiple assignees (`IssueAssignee` join table) instead of a single `assigneeId`. The New Issue dialog and the issue detail panel both use a multi-select (checkbox dropdown) with avatar-stack display. The board's "Group by Assignee" view places a card in every assignee's column.

### Project / team integrity rules
- Project names are unique per team (`@@unique([teamId, name])`), enforced both at the DB level and with a friendly pre-check error in `createProject`/`updateProject`.
- In the New Project form, the Project Lead and Members pickers are mutually exclusive: picking someone as lead removes them from the members list and vice versa (the backend still always includes the lead as an ADMIN project member under the hood).
- The Team Settings "Team lead" dropdown lists every workspace user, not just existing team members (matching what the backend already allowed).

### Project statuses (database driven)
- Project statuses live in a `ProjectStatus` table (name, hex color, category, position, isDefault) instead of a hardcoded list. The table is seeded with Backlog / Planned / Active / Completed / Cancelled the first time it is read while empty.
- Settings → Projects → Statuses: everyone can view the lifecycle; users whose role has `manage_project_statuses` (seeded Admin) can create, edit (name / color / category), reorder, set the default, and delete statuses.
- `Project.status` still stores the status name. Renaming a status updates every project on it; deleting a status that is in use requires choosing a replacement status, and the default status cannot be deleted.
- The category (backlog / planned / started / completed / canceled) sets the icon shape; the color is used for the icon, the project header selector, filters, and roadmap bars. New projects get the default status; drafts get the first backlog-category status.

### Issue statuses (per project, database driven)
- Each project has its own issue workflow in the `IssueStatus` table (`projectId`, name unique per project, color, category, position, isDefault). A project without rows gets Backlog / Todo / In Progress / Done / Cancelled (Backlog default) the first time its workflow is read.
- Managed by users with `manage_issue_statuses` (seeded Admin) for any project, and by a project's lead or ADMIN members for that project (`canManageIssueStatuses` in `src/lib/auth.ts`). They can add a column ("Add status"), edit, drag to reorder, make default, or delete (moving that project's issues to another status) from the project board's column headers, or at Settings → Issues → Statuses with a project picker.
- A project board uses that project's workflow. Boards spanning projects (My Issues, team, cycle, views) show the merged status names of the projects involved, ordered by category, and are read-only for workflow changes. Moving an issue to a status its project doesn't have is rejected.
- Workflows reach client components via `IssueStatusesProvider` (layout, visible projects) plus `ProjectIssueStatusesProvider` on the project page; hooks in `issue-statuses-context.tsx`. Server actions for project and issue statuses are in `src/actions/statuses.ts` (issue calls carry `projectId`).
- Cycle and report progress treat each issue's status as closed if it is in the completed/canceled category of its own project's workflow.

### Project creation
- Creating projects (including drafts) requires the `create_projects` permission, granted to the seeded Admin role only. `createProject` checks it before anything else, and the sidebar "+ Project" button and the Projects page "New project" button are hidden for everyone else.

### Issue permissions
- Any project member (or a user who can see all projects) can create issues in that project.
- Editing an issue (all fields, including status changes from the board) is allowed for: workspace admins (`manage_teams`), the project lead, the leader of the project's team, and the issue's creator — but the creator loses edit rights once anyone else has posted in the issue's discussion. Moving issues in and out of cycles additionally stays open to whoever can manage the team. Enforced in `updateIssue` via `getIssueEditAccess`; the issue panel shows a lock notice and disables editing for everyone else.

### Issue attachments and priority colors
- Issue attachments are uploaded to `public/uploads/issues/` and stored as JSON on `Issue.attachments`; cards show an image cover — a slideshow with arrows, dots and a counter when there are several images — and a preview dialog (images + PDFs), and the issue detail panel stages attachment/description edits until "Save changes" is pressed.
- Priorities have distinct colors (Urgent red, High orange, Medium amber, Low blue) via `PRIORITY_STYLES` in `priority-icon.tsx`.

### UI
- Default theme is light (was dark); the login page is a professional split-screen design (blue gradient brand panel + clean sign-in card), with the old demo-credentials box removed.
- The issue detail dialog (`?issue=<id>` on a project page) is a wide two-pane modal: breadcrumb header (project › issue id, Delete with confirmation, close), content column (title, description, attachments, Discussion/Activity tabs) and a Properties panel (status, priority, assignees, labels, team, created). Closing — Esc, outside click, ✕ or the breadcrumb — returns to the board and asks first if there are unsaved edits. All dialogs share a translucent scrim (dimmed, lightly blurred, desaturated) so the page stays as context without competing with the dialog.
- Issue cards have a Timeline button (calendar-clock icon, next to the discussion count) that opens a dialog with the issue's full history, oldest first and grouped by day: creation, every field change (status, priority, assignees, labels, milestone, cycle, title, description, attachments) and comment events. It loads on demand via `getIssueTimeline` in `src/actions/issues.ts` (checks project access, resolves user/milestone/cycle names). The attachment-count button was removed from cards.
- Login failures show inline on the login form ("Incorrect email or password", etc.) instead of the raw API response: the form posts with fetch and `Accept: application/json`; without JavaScript the route redirects to `/login?error=<code>`. Messages live in `src/lib/login-errors.ts`.
- Board issue cards load collapsed to a single line; each card's chevron expands it, and the board toolbar has Expand all / Collapse all. The set of expanded cards is a per-viewer preference in `localStorage` (`taskcraft.expandedIssues`, `src/hooks/use-collapsed-issues.ts`), shared across boards and tabs.
- The sidebar is collapsible (icon-only rail, ~56px, state persisted in `localStorage`) via a toggle button next to the logo.
