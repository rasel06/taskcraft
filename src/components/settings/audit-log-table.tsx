"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface LogRow {
  id: string;
  channel: string;
  event: string;
  status: string;
  error: string | null;
  message: string;
  createdAt: string;
  recipient: { id: string; name: string; avatarUrl: string | null } | null;
}

const EVENT_LABELS: Record<string, string> = {
  issue_created: "Issue created",
  issue_updated: "Issue updated",
  project_created: "Project created",
  project_updated: "Project updated",
  project_status_changed: "Project status changed",
  project_member_added: "Member added",
  project_member_removed: "Member removed",
  project_member_role_changed: "Member role changed",
  comment_reply: "Comment reply",
  team_lead_changed: "Team lead changed",
  team_member_added: "Team member added",
  team_member_removed: "Team member removed",
};

function plainText(message: string): string {
  return message
    .replace(/<[^>]+>/g, "")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function AuditLogTable({ logs }: { logs: LogRow[] }) {
  const [search, setSearch] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [eventFilter, setEventFilter] = React.useState("all");

  const channelOptions = React.useMemo(() => Array.from(new Set(logs.map((l) => l.channel))).sort(), [logs]);
  const eventOptions = React.useMemo(() => Array.from(new Set(logs.map((l) => l.event))).sort(), [logs]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (channelFilter !== "all" && l.channel !== channelFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (eventFilter !== "all" && l.event !== eventFilter) return false;
      if (!q) return true;
      return (
        plainText(l.message).toLowerCase().includes(q) ||
        (EVENT_LABELS[l.event] ?? l.event).toLowerCase().includes(q) ||
        (l.recipient?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, search, channelFilter, statusFilter, eventFilter]);

  const columns: DataTableColumn<LogRow>[] = [
    {
      key: "time",
      header: "Time",
      sortValue: (l) => l.createdAt,
      className: "whitespace-nowrap text-faint-foreground",
      render: (l) =>
        new Date(l.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    },
    {
      key: "event",
      header: "Event",
      sortValue: (l) => l.event,
      className: "whitespace-nowrap text-foreground",
      render: (l) => EVENT_LABELS[l.event] ?? l.event,
    },
    {
      key: "channel",
      header: "Channel",
      sortValue: (l) => l.channel,
      className: "whitespace-nowrap capitalize text-muted-foreground",
      render: (l) => l.channel,
    },
    {
      key: "recipient",
      header: "Recipient",
      render: (l) =>
        l.recipient ? (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-foreground">
            <UserAvatar user={l.recipient} className="h-4 w-4" /> {l.recipient.name}
          </span>
        ) : (
          <span className="whitespace-nowrap text-faint-foreground">Channel broadcast</span>
        ),
    },
    {
      key: "message",
      header: "Message",
      className: "max-w-md text-muted-foreground",
      render: (l) => <span className="line-clamp-2">{plainText(l.message)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (l) => l.status,
      className: "whitespace-nowrap",
      render: (l) => (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            l.status === "sent"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          )}
          title={l.error ?? undefined}
        >
          {l.status}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      getRowKey={(l) => l.id}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search message, event, recipient..."
      emptyMessage="No notifications match your filters."
      filters={
        <>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-8 w-auto min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {eventOptions.map((e) => (
                <SelectItem key={e} value={e}>
                  {EVENT_LABELS[e] ?? e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="h-8 w-auto min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {channelOptions.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
