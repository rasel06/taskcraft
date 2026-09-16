"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EditMemberDialog } from "@/components/settings/edit-member-dialog";
import { ResetPasswordDialog } from "@/components/settings/reset-password-dialog";
import { DeleteMemberDialog } from "@/components/settings/delete-member-dialog";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  bankId: string | null;
  fileNumber: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  role: { id: string; name: string } | null;
  teamMemberships: { id: string; team: { identifier: string } }[];
}

export function MembersTable({
  members,
  roles,
  currentUserId,
}: {
  members: MemberRow[];
  roles: { id: string; name: string }[];
  currentUserId?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [teamFilter, setTeamFilter] = React.useState("all");

  const teamOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of members) {
      for (const tm of m.teamMemberships) set.add(tm.team.identifier);
    }
    return Array.from(set).sort();
  }, [members]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role?.id !== roleFilter) return false;
      if (teamFilter !== "all" && !m.teamMemberships.some((tm) => tm.team.identifier === teamFilter)) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.bankId ?? "").toLowerCase().includes(q) ||
        (m.fileNumber ?? "").toLowerCase().includes(q) ||
        (m.mobile ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, search, roleFilter, teamFilter]);

  const columns: DataTableColumn<MemberRow>[] = [
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
      key: "details",
      header: "Bank / File / Mobile",
      render: (m) => (
        <span className="whitespace-nowrap text-[11px] text-faint-foreground">
          {m.bankId ?? "—"} · {m.fileNumber ?? "—"} · {m.mobile ?? "—"}
        </span>
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
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.teamMemberships.length === 0 ? (
            <span className="text-faint-foreground">—</span>
          ) : (
            m.teamMemberships.map((tm) => (
              <span key={tm.id} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {tm.team.identifier}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-0",
      render: (m) => (
        <div className="flex items-center justify-end gap-2.5">
          <EditMemberDialog
            member={{
              id: m.id,
              name: m.name,
              email: m.email,
              bankId: m.bankId,
              fileNumber: m.fileNumber,
              mobile: m.mobile,
              avatarUrl: m.avatarUrl,
              role: m.role,
            }}
            roles={roles}
          />
          <ResetPasswordDialog userId={m.id} name={m.name} />
          {m.id !== currentUserId && <DeleteMemberDialog userId={m.id} name={m.name} />}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      getRowKey={(m) => m.id}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name, email, bank ID, file #, mobile..."
      emptyMessage="No members match your filters."
      filters={
        <>
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
          {teamOptions.length > 0 && (
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="h-8 w-auto min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teamOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      }
    />
  );
}
