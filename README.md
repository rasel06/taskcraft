# TaskCraft

Project and issue management app: Next.js (App Router) + Tailwind CSS + shadcn-style components + Prisma/PostgreSQL, with real password authentication and light/dark theming.

## Setup

```bash
npm install
# Set DATABASE_URL in .env to your local Postgres instance,
# e.g. postgresql://USER:PASSWORD@localhost:5432/task_craft_db
npx prisma generate
npx prisma db push   # creates the schema in your Postgres database
npm run db:seed      # seeds demo users (with hashed passwords), teams, projects, issues
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`.

## Authentication

Real auth: passwords are hashed with bcrypt, sessions are DB-backed (`Session` table) and identified by an httpOnly cookie. `src/proxy.ts` (Next's middleware/proxy convention) does a fast cookie-presence redirect to `/login`; `src/app/(app)/layout.tsx` does the authoritative check (validates the session against the DB, redirects if missing/expired).

Members are admin-managed, not self-signup: a workspace admin creates accounts (with an initial password) from **Settings → Members**. Any signed-in member can change their own password from **Settings → Security** — doing so signs them out everywhere and they need to log back in. An admin can also reset another member's password or delete their account from the Members page (`src/actions/members.ts`); deleting a member is blocked if they still lead a project (reassign the lead first).

## Demo data & access control

Seeding creates:

- Users: **Alice** (workspace admin), Bob, Carol, Dave — all with password `password123`
- Teams: **Frontend** (`FRO`, public), **Platform** (`PLT`, private — only Alice & Dave are members)
- Projects and issues under each team

Log in as Bob or Carol to see the private-team access control in action: the Platform team is absent from the sidebar and search results, and direct links to it or its project show "Access denied". Log in as Alice or Dave to see it.

## Theming

Light/dark/system theme via `next-themes`, toggle in the sidebar footer and in **Settings → Preferences**. Colors are semantic CSS-variable tokens (`background`, `foreground`, `muted`, `muted-foreground`, `faint-foreground`, `accent`, `border`, `input`, `ring` — defined in `src/app/globals.css`) rather than hardcoded `zinc-*` classes, so the whole app (sidebar, dialogs, board, settings) follows the toggle, not just the shell.

## Key scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run db:push` — sync `prisma/schema.prisma` to Postgres
- `npm run db:seed` — re-run seeding (no-ops if users already exist)
- `npm run db:studio` — Prisma Studio to browse the database

## Notes

- Settings pages under Personal/Issues/Projects (labels, templates, SLAs, notifications, etc.) are UI-only and persist to `localStorage` in your browser — there's no corresponding database model for them per the schema this app implements (User, Session, Team, Project, Milestone, Issue, TeamMember, ProjectMember). Profile, Members, Teams, and Security settings are real and backed by Postgres.
- "Connect GitHub" and billing are honest placeholders (no OAuth app / payment provider wired up).
- Issue IDs (`FRO-12`) are generated atomically per team via `Team.issueCounter`.
# taskcraft
