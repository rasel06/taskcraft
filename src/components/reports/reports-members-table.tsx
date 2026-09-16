"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { MemberReportRow } from "@/lib/data";

export function ReportsMembersTable({
  members,
  roles,
}: {
  members: MemberReportRow[];
  roles: { id: string; name: string }[];
}) {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role?.id !== roleFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, search, roleFilter]);

  const columns: DataTableColumn<MemberReportRow>[] = [
    {
      key: "name",
      header: "Member",
      sortValue: (m) => m.name.toLowerCase(),
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar user={m} className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-foreground">{m.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortValue: (m) => m.role?.name.toLowerCase() ?? "",
      render: (m) =>
        m.role ? (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">{m.role.name}</span>
        ) : (
          <span className="text-faint-foreground">—</span>
        ),
    },
    {
      key: "teams",
      header: "Teams",
      sortValue: (m) => m.teams.length,
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.teams.length === 0 ? (
            <span className="text-faint-foreground">—</span>
          ) : (
            m.teams.map((t) => (
              <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "projects",
      header: "Projects",
      sortValue: (m) => m.projectCount,
      className: "text-center text-muted-foreground",
      headerClassName: "text-center",
      render: (m) => m.projectCount,
    },
    {
      key: "assigned",
      header: "Assigned issues",
      sortValue: (m) => m.assignedIssueCount,
      className: "text-center text-muted-foreground",
      headerClassName: "text-center",
      render: (m) => m.assignedIssueCount,
    },
    {
      key: "created",
      header: "Created issues",
      sortValue: (m) => m.createdIssueCount,
      className: "text-center text-muted-foreground",
      headerClassName: "text-center",
      render: (m) => m.createdIssueCount,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      getRowKey={(m) => m.id}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name or email..."
      emptyMessage="No members match your filters."
      filters={
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-auto min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
