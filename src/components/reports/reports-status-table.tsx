"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useIssueStatuses } from "@/components/shared/issue-statuses-context";
import type { ProjectStatusReportRow } from "@/lib/data";

export function ReportsStatusTable({ projects }: { projects: ProjectStatusReportRow[] }) {
  const [search, setSearch] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState("all");
  const { statuses } = useIssueStatuses();
  const statusNames = statuses.map((s) => s.name);

  const teamOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.team.id, p.team.identifier);
    return Array.from(map.entries());
  }, [projects]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (teamFilter !== "all" && p.team.id !== teamFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.team.name.toLowerCase().includes(q);
    });
  }, [projects, search, teamFilter]);

  const columns: DataTableColumn<ProjectStatusReportRow>[] = [
    {
      key: "name",
      header: "Project",
      sortValue: (p) => p.name.toLowerCase(),
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate text-foreground">{p.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{p.team.identifier}</div>
        </div>
      ),
    },
    ...statusNames.map(
      (status): DataTableColumn<ProjectStatusReportRow> => ({
        key: status,
        header: status,
        sortValue: (p) => p.counts[status] ?? 0,
        className: "text-center text-muted-foreground",
        headerClassName: "text-center",
        render: (p) => p.counts[status] ?? 0,
      }),
    ),
    {
      key: "total",
      header: "Total",
      sortValue: (p) => p.total,
      className: "text-center font-medium text-foreground",
      headerClassName: "text-center",
      render: (p) => p.total,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      getRowKey={(p) => p.id}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search project or team..."
      emptyMessage="No projects match your filters."
      filters={
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
      }
    />
  );
}
