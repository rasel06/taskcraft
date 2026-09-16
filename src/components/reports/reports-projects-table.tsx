"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/utils";
import type { ProjectStatusReportRow } from "@/lib/data";

export function ReportsProjectsTable({ projects }: { projects: ProjectStatusReportRow[] }) {
  const [search, setSearch] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const teamOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.team.id, p.team.identifier);
    return Array.from(map.entries());
  }, [projects]);
  const statusOptions = React.useMemo(() => Array.from(new Set(projects.map((p) => p.status))).sort(), [projects]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (teamFilter !== "all" && p.team.id !== teamFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.team.name.toLowerCase().includes(q) || p.lead.name.toLowerCase().includes(q);
    });
  }, [projects, search, teamFilter, statusFilter]);

  const columns: DataTableColumn<ProjectStatusReportRow>[] = [
    {
      key: "name",
      header: "Project",
      sortValue: (p) => p.name.toLowerCase(),
      render: (p) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate text-foreground">
            {p.name}
            {p.isDraft && <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-faint-foreground">Draft</span>}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{p.team.name}</div>
        </div>
      ),
    },
    {
      key: "lead",
      header: "Lead",
      sortValue: (p) => p.lead.name.toLowerCase(),
      render: (p) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-foreground">
          <UserAvatar user={p.lead} className="h-4 w-4" /> {p.lead.name}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => p.status,
      className: "whitespace-nowrap",
      render: (p) => <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{p.status}</span>,
    },
    {
      key: "timeline",
      header: "Timeline",
      className: "whitespace-nowrap text-faint-foreground",
      render: (p) =>
        p.startDate || p.targetDate ? `${formatDate(p.startDate) ?? "…"} – ${formatDate(p.targetDate) ?? "…"}` : "—",
    },
    {
      key: "issues",
      header: "Issues",
      sortValue: (p) => p.total,
      className: "whitespace-nowrap text-center text-muted-foreground",
      render: (p) => p.total,
    },
    {
      key: "progress",
      header: "Progress",
      sortValue: (p) => p.progressPct,
      className: "w-40",
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${p.progressPct}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground">{p.progressPct}%</span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      getRowKey={(p) => p.id}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search project, team, lead..."
      emptyMessage="No projects match your filters."
      filters={
        <>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-8 w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teamOptions.map(([id, identifier]) => (
                <SelectItem key={id} value={id}>
                  {identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
