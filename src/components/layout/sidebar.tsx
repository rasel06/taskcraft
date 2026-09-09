"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ListChecks, LayoutGrid, Map, UserPlus, GitBranch, Plus, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/components/search/search-modal";
import { TeamNavItem } from "@/components/layout/team-nav-item";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateTeamDialog } from "@/components/team/create-team-dialog";
import { CreateProjectDrawer } from "@/components/project/create-project-drawer";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { HelpDialog } from "@/components/help-dialog";
import { Button } from "@/components/ui/button";
import type { TeamWithProjects, UserLite } from "@/lib/types";

const CORE_LINKS = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/my-issues", label: "My Issues", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/views", label: "Views", icon: LayoutGrid },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
];

export function Sidebar({
  currentUser,
  users,
  teams,
}: {
  currentUser: UserLite | null;
  users: UserLite[];
  teams: TeamWithProjects[];
}) {
  const pathname = usePathname();
  const allProjects = teams.flatMap((t) =>
    t.projects.map((p) => ({ ...p, teamIdentifier: t.identifier })),
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 px-3 pt-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          T
        </div>
        <span className="text-sm font-semibold text-foreground">TaskCraft</span>
        <div className="ml-auto">
          <HelpDialog />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-3 pt-3">
        <SearchModal teamIdentifiers={teams.map((t) => t.identifier)} />
        <div className="flex gap-1.5">
          <CreateIssueDialog
            projects={allProjects}
            users={users}
            trigger={
              <Button variant="secondary" size="sm" className="flex-1">
                <Plus className="h-3.5 w-3.5" /> Issue
              </Button>
            }
          />
          <CreateProjectDrawer
            teams={teams}
            users={users}
            trigger={
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-3.5 w-3.5" /> Project
              </Button>
            }
          />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-3">
        {CORE_LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                active ? "bg-primary-soft-bg text-primary-soft-text" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center justify-between px-5">
        <span className="text-xs font-medium text-faint-foreground">Teams</span>
        <CreateTeamDialog
          teams={teams}
          users={users}
          currentUserId={currentUser?.id ?? ""}
          trigger={
            <button className="text-faint-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1.5">
        {teams.map((team) => (
          <TeamNavItem key={team.id} team={team} />
        ))}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border px-3 py-2">
        <span className="px-2 pb-1 text-xs font-medium text-faint-foreground">Administration</span>
        <Link
          href="/settings/members"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <UserPlus className="h-4 w-4" />
          Invite people
        </Link>
        <Link
          href="/settings/integrations"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <GitBranch className="h-4 w-4" />
          Connect GitHub
        </Link>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-2 py-2">
        <div className="min-w-0 flex-1">
          <AccountMenu currentUser={currentUser} />
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
