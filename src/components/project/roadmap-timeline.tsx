"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ProjectStatusDef } from "@/lib/project-status";
import { formatDate } from "@/lib/utils";
import type { ProjectOverview } from "@/lib/types";

export function RoadmapTimeline({ projects, statuses }: { projects: ProjectOverview[]; statuses: ProjectStatusDef[] }) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);

  const teams = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; identifier: string }>();
    projects.forEach((p) => map.set(p.team.id, p.team));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects;
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    if (statusFilter.length > 0) list = list.filter((p) => statusFilter.includes(p.status));
    if (teamFilter.length > 0) list = list.filter((p) => teamFilter.includes(p.team.id));
    return list;
  }, [projects, search, statusFilter, teamFilter]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const activeFilterCount = statusFilter.length + teamFilter.length;
  const dated = filtered.filter((p) => p.startDate && p.targetDate);
  const times = dated.flatMap((p) => [new Date(p.startDate!).getTime(), new Date(p.targetDate!).getTime()]);
  const min = times.length ? Math.min(...times) : 0;
  const max = times.length ? Math.max(...times) : 86400000;
  const span = Math.max(max - min, 86400000);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-7 pl-7 text-xs"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> Filter
                {activeFilterCount > 0 && (
                  <Badge variant="indigo" className="h-4 px-1 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statuses.map(({ name: s }) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onCheckedChange={() => toggle(statusFilter, setStatusFilter, s)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex items-center gap-2">
                    <ProjectStatusIcon status={s} statuses={statuses} /> {s}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              {teams.length > 1 && (
                <>
                  <DropdownMenuLabel>Team</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {teams.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t.id}
                      checked={teamFilter.includes(t.id)}
                      onCheckedChange={() => toggle(teamFilter, setTeamFilter, t.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {t.identifier} · {t.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="ml-auto text-xs text-faint-foreground">{filtered.length} projects</span>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {statusFilter.map((s) => (
              <Badge key={s} variant="indigo" className="gap-1">
                <ProjectStatusIcon status={s} statuses={statuses} /> {s}
                <button onClick={() => toggle(statusFilter, setStatusFilter, s)} className="ml-0.5 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {teamFilter.map((id) => {
              const t = teams.find((x) => x.id === id);
              if (!t) return null;
              return (
                <Badge key={id} variant="indigo" className="gap-1">
                  {t.identifier}
                  <button onClick={() => toggle(teamFilter, setTeamFilter, id)} className="ml-0.5 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            <button
              onClick={() => {
                setStatusFilter([]);
                setTeamFilter([]);
              }}
              className="text-xs text-faint-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
            <p className="text-sm">No projects match these filters</p>
          </div>
        ) : (
          filtered.map((p) => {
            const hasRange = p.startDate && p.targetDate;
            const left = hasRange ? ((new Date(p.startDate!).getTime() - min) / span) * 100 : 0;
            const width = hasRange
              ? Math.max(((new Date(p.targetDate!).getTime() - new Date(p.startDate!).getTime()) / span) * 100, 2)
              : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="grid grid-cols-[220px_1fr] items-center gap-4 border-b border-border px-5 py-3 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{p.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-faint-foreground">
                    <span>{p.team.identifier}</span>
                    <span>·</span>
                    <UserAvatar user={p.lead} className="h-3.5 w-3.5" />
                    <span>{p.lead.name}</span>
                    <span>·</span>
                    <span>{p.issueCount} issues</span>
                  </div>
                </div>
                <div className="relative h-6 rounded bg-muted/60">
                  {hasRange ? (
                    <div
                      className="absolute top-0.5 h-5 rounded"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: statuses.find((s) => s.name === p.status)?.color ?? "#52525b",
                      }}
                      title={`${p.status} · ${formatDate(p.startDate)} - ${formatDate(p.targetDate)}`}
                    />
                  ) : (
                    <span className="absolute left-2 top-1 text-xs text-faint-foreground">No timeline set</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
