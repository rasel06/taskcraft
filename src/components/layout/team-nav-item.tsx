"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Lock, ListTree, RefreshCw, Map, Settings, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamIconBadge } from "@/components/shared/team-icon";
import type { TeamWithProjects } from "@/lib/types";

const SUBLINKS = [
  { key: "issues", label: "Issues", icon: ListTree },
  { key: "cycles", label: "Cycles", icon: RefreshCw },
  { key: "roadmaps", label: "Roadmaps", icon: Map },
  { key: "settings", label: "Settings", icon: Settings },
];

export function TeamNavItem({ team, collapsed }: { team: TeamWithProjects; collapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(`/teams/${team.id}`);
  const [open, setOpen] = React.useState(isActive);

  React.useEffect(() => {
    if (!isActive) return;
    const timeout = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(timeout);
  }, [isActive]);

  if (collapsed) {
    return (
      <Link
        href={`/teams/${team.id}/issues`}
        title={team.name}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted",
          isActive && "bg-muted",
        )}
      >
        <TeamIconBadge icon={team.icon} color={team.color} className="h-5 w-5" iconClassName="h-3 w-3" />
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-faint-foreground transition-transform", open && "rotate-90")} />
        <TeamIconBadge icon={team.icon} color={team.color} className="h-4 w-4 shrink-0" iconClassName="h-2.5 w-2.5" />
        <span className="truncate">{team.name}</span>
        {team.isPrivate && <Lock className="ml-auto h-3 w-3 shrink-0 text-faint-foreground" />}
      </button>
      {open && (
        <div className="ml-3.5 flex flex-col gap-0.5 border-l border-border pl-3">
          {SUBLINKS.map((link) => {
            const href = `/teams/${team.id}/${link.key}`;
            const active = pathname === href;
            const Icon = link.icon;
            return (
              <Link
                key={link.key}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
          {team.projects.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5">
              {team.projects.map((p) => {
                const href = `/projects/${p.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={p.id}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted",
                      active ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Circle className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{p.name}</span>
                    {p.isDraft && <span className="ml-auto text-[10px] text-faint-foreground">draft</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
