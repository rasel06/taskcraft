"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ListChecks, LayoutGrid, Map, UserPlus, GitBranch, Plus, FolderKanban, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

const COLLAPSE_KEY = "taskcraft.sidebar.collapsed";

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
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const allProjects = teams.flatMap((t) =>
    t.projects.map((p) => ({ ...p, teamIdentifier: t.identifier })),
  );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-background transition-[width] duration-150",
        collapsed ? "w-14" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-2 px-3 pt-3", collapsed && "flex-col gap-1.5 px-2")}>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          T
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-sm font-semibold text-foreground">TaskCraft</span>
            <HelpDialog />
          </>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className={cn("flex flex-col gap-2 px-3 pt-3", collapsed && "px-2")}>
        <SearchModal teamIdentifiers={teams.map((t) => t.identifier)} collapsed={collapsed} />
        <div className={cn("flex gap-1.5", collapsed && "flex-col")}>
          <CreateIssueDialog
            projects={allProjects}
            users={users}
            trigger={
              collapsed ? (
                <Button variant="secondary" size="sm" className="w-full px-0" title="New issue">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="flex-1">
                  <Plus className="h-3.5 w-3.5" /> Issue
                </Button>
              )
            }
          />
          <CreateProjectDrawer
            teams={teams}
            users={users}
            trigger={
              collapsed ? (
                <Button variant="outline" size="sm" className="w-full px-0" title="New project">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="flex-1">
                  <Plus className="h-3.5 w-3.5" /> Project
                </Button>
              )
            }
          />
        </div>
      </div>

      <nav className={cn("flex flex-col gap-0.5 px-3 pt-3", collapsed && "px-2")}>
        {CORE_LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                collapsed && "justify-center px-0",
                active ? "bg-primary-soft-bg text-primary-soft-text" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>

      {collapsed ? (
        <div className="mx-2 mt-4 border-t border-border" />
      ) : (
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
      )}
      <div className={cn("flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1.5", collapsed && "items-center px-2")}>
        {teams.map((team) => (
          <TeamNavItem key={team.id} team={team} collapsed={collapsed} />
        ))}
      </div>

      <div className={cn("flex flex-col gap-0.5 border-t border-border px-3 py-2", collapsed && "items-center px-2")}>
        {!collapsed && <span className="px-2 pb-1 text-xs font-medium text-faint-foreground">Administration</span>}
        <Link
          href="/settings/members"
          title={collapsed ? "Invite people" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted",
            collapsed && "justify-center px-0",
          )}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {!collapsed && "Invite people"}
        </Link>
        <Link
          href="/settings/integrations"
          title={collapsed ? "Connect GitHub" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted",
            collapsed && "justify-center px-0",
          )}
        >
          <GitBranch className="h-4 w-4 shrink-0" />
          {!collapsed && "Connect GitHub"}
        </Link>
      </div>

      <div className={cn("flex items-center gap-2 border-t border-border px-2 py-2", collapsed && "flex-col gap-1.5")}>
        <div className={cn("min-w-0 flex-1", collapsed && "flex-none")}>
          <AccountMenu currentUser={currentUser} collapsed={collapsed} />
        </div>
        {!collapsed && <ThemeToggle />}
      </div>
    </aside>
  );
}
