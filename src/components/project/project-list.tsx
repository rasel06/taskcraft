"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ListFilter, ArrowUpDown, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { TeamIconBadge, teamGroupClass } from "@/components/shared/team-icon";
import { cn } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import type { ProjectStatusDef } from "@/lib/project-status";
import { formatDate } from "@/lib/utils";
import type { ProjectOverview } from "@/lib/types";

type GroupBy = "none" | "team" | "status" | "priority";
type OrderBy = "target" | "priority" | "name" | "created";

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3, "No priority": 4 };

function groupKey(project: ProjectOverview, groupBy: GroupBy) {
  if (groupBy === "team") return `${project.team.identifier} · ${project.team.name}`;
  if (groupBy === "status") return project.status;
  if (groupBy === "priority") return project.priority;
  return "All projects";
}

export function ProjectList({ projects, statuses }: { projects: ProjectOverview[]; statuses: ProjectStatusDef[] }) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = React.useState<string[]>([]);
  const [teamFilter, setTeamFilter] = React.useState<string[]>([]);
  const [groupBy, setGroupBy] = React.useState<GroupBy>("team");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("target");

  const teams = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; identifier: string }>();
    projects.forEach((p) => map.set(p.team.id, p.team));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.identifier.toLowerCase().includes(q),
      );
    }
    if (statusFilter.length > 0) list = list.filter((p) => statusFilter.includes(p.status));
    if (priorityFilter.length > 0) list = list.filter((p) => priorityFilter.includes(p.priority));
    if (teamFilter.length > 0) list = list.filter((p) => teamFilter.includes(p.team.id));
    list = [...list].sort((a, b) => {
      if (orderBy === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (orderBy === "name") return a.name.localeCompare(b.name);
      if (orderBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const at = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
      const bt = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
      return at - bt;
    });
    return list;
  }, [projects, search, statusFilter, priorityFilter, teamFilter, orderBy]);

  const groups = React.useMemo(() => {
    const map = new Map<string, ProjectOverview[]>();
    filtered.forEach((p) => {
      const key = groupKey(p, groupBy);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    const entries = Array.from(map.entries());
    if (groupBy === "status") {
      // Follow the configured lifecycle order; unknown statuses go last.
      const rank = (name: string) => {
        const i = statuses.findIndex((s) => s.name === name);
        return i === -1 ? statuses.length : i;
      };
      entries.sort(([a], [b]) => rank(a) - rank(b));
    }
    return entries;
  }, [filtered, groupBy, statuses]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const activeFilterCount = statusFilter.length + priorityFilter.length + teamFilter.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-2.5">
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
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRIORITIES.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={priorityFilter.includes(p)}
                  onCheckedChange={() => toggle(priorityFilter, setPriorityFilter, p)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex items-center gap-2">
                    <PriorityIcon priority={p} /> {p}
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
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
              <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">Group: Team</SelectItem>
              <SelectItem value="status">Group: Status</SelectItem>
              <SelectItem value="priority">Group: Priority</SelectItem>
              <SelectItem value="none">Group: None</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
            <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="target">Order: Target date</SelectItem>
              <SelectItem value="priority">Order: Priority</SelectItem>
              <SelectItem value="name">Order: Name</SelectItem>
              <SelectItem value="created">Order: Created</SelectItem>
            </SelectContent>
          </Select>
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
            {priorityFilter.map((p) => (
              <Badge key={p} variant="indigo" className="gap-1">
                <PriorityIcon priority={p} /> {p}
                <button onClick={() => toggle(priorityFilter, setPriorityFilter, p)} className="ml-0.5 hover:text-white">
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
                setPriorityFilter([]);
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
            <p className="text-sm">No projects found</p>
          </div>
        ) : (
          groups.map(([key, list]) => {
            // Team groups are drawn in the team's color; rows always carry
            // their team's color as a left strip so teams stay recognisable
            // in the status / priority / flat views too.
            const team = groupBy === "team" ? list[0]?.team : undefined;
            const teamStyle = team ? teamGroupClass(team.color) : undefined;
            return (
            <div key={key} className="flex flex-col">
              {groupBy !== "none" && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 border-b border-border px-5 py-1.5 text-xs font-medium",
                    team ? cn("border-l-4 font-semibold", teamStyle!.header, teamStyle!.accent) : "bg-muted/30 text-muted-foreground",
                  )}
                >
                  {team && (
                    <TeamIconBadge icon={team.icon} color={team.color} className="h-5 w-5 rounded" iconClassName="h-3 w-3" />
                  )}
                  {groupBy === "status" && <ProjectStatusIcon status={key} statuses={statuses} />}
                  {groupBy === "priority" && <PriorityIcon priority={key} />}
                  {key}
                  <span className={cn("ml-auto", team ? "opacity-70" : "text-faint-foreground")}>{list.length}</span>
                </div>
              )}
              {list.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className={cn(
                    "flex items-center gap-3 border-b border-l-4 border-border px-5 py-2.5 hover:bg-muted/40",
                    teamGroupClass(p.team.color).accent,
                  )}
                >
                  <ProjectStatusIcon status={p.status} statuses={statuses} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm text-foreground">{p.name}</span>
                      {p.isDraft && (
                        <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-faint-foreground">{p.team.identifier} · {p.team.name}</div>
                  </div>
                  <PriorityIcon priority={p.priority} />
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserAvatar user={p.lead} className="h-4 w-4" /> {p.lead.name}
                  </span>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {p.targetDate ? formatDate(p.targetDate) : "No date"}
                  </span>
                  <span className="w-16 text-right text-xs text-faint-foreground">{p.issueCount} issues</span>
                </Link>
              ))}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
