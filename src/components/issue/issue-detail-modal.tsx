"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { updateIssue, deleteIssue } from "@/actions/issues";
import { ISSUE_STATUSES, PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { UserLite } from "@/lib/types";

export interface IssueActivityEntry {
  id: string;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface IssueDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  labels: string;
  createdAt: string;
  assigneeId: string | null;
  activity?: IssueActivityEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  created: "Issue",
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assigneeId: "Assignee",
  milestoneId: "Milestone",
  cycleId: "Cycle",
  labels: "Labels",
};

function formatActivityValue(field: string, value: string | null, users: UserLite[]): string {
  if (!value) return field === "assigneeId" ? "Unassigned" : "—";
  if (field === "assigneeId") return users.find((u) => u.id === value)?.name ?? "Unknown";
  if (field === "description" || field === "title") return value.length > 40 ? `${value.slice(0, 40)}…` : value;
  return value;
}

function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IssueDetailModal({
  issue,
  users,
  canDelete = true,
}: {
  issue: IssueDetail;
  users: UserLite[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [description, setDescription] = React.useState(issue.description ?? "");
  const labels = issue.labels ? issue.labels.split(",").filter(Boolean) : [];

  function close() {
    setOpen(false);
    router.back();
  }

  async function saveDescription() {
    if (description === (issue.description ?? "")) return;
    await updateIssue(issue.id, { description });
    router.refresh();
  }

  async function handleDelete() {
    await deleteIssue(issue.id);
    toast.success(`${issue.id} deleted`);
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-muted-foreground">{issue.id}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-5 py-4">
          <p className="text-base font-medium text-foreground">{issue.title}</p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            placeholder="Add description..."
            className="min-h-28 border-none bg-transparent px-0 focus-visible:ring-0"
          />

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => (
                <span key={l} className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-400">
                  {l}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Select
              value={issue.status}
              onValueChange={async (v) => {
                await updateIssue(issue.id, { status: v });
                router.refresh();
              }}
            >
              <SelectTrigger className="w-auto gap-1.5">
                <StatusIcon status={issue.status} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} icon={<StatusIcon status={s} />}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={issue.priority}
              onValueChange={async (v) => {
                await updateIssue(issue.id, { priority: v });
                router.refresh();
              }}
            >
              <SelectTrigger className="w-auto gap-1.5">
                <PriorityIcon priority={issue.priority} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} icon={<PriorityIcon priority={p} />}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={issue.assigneeId ?? "unassigned"}
              onValueChange={async (v) => {
                await updateIssue(issue.id, { assigneeId: v === "unassigned" ? null : v });
                router.refresh();
              }}
            >
              <SelectTrigger className="w-auto gap-1.5">
                {issue.assigneeId && (
                  <UserAvatar user={users.find((u) => u.id === issue.assigneeId)} className="h-4 w-4" />
                )}
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} icon={<UserAvatar user={u} className="h-4 w-4" />}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="ml-auto text-xs text-faint-foreground">Created {formatDate(issue.createdAt)}</span>
            {canDelete && (
              <button onClick={handleDelete} className="text-faint-foreground hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {issue.activity && issue.activity.length > 0 && (
            <div className="border-t border-border pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
              <ul className="flex flex-col gap-2.5">
                {issue.activity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2 text-xs">
                    <UserAvatar user={entry.user ?? undefined} className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{entry.user?.name ?? "Someone"}</span>{" "}
                      {entry.field === "created" ? (
                        "created this issue"
                      ) : (
                        <>
                          changed <span className="text-foreground">{FIELD_LABELS[entry.field] ?? entry.field}</span>{" "}
                          from <span className="text-foreground">{formatActivityValue(entry.field, entry.fromValue, users)}</span>{" "}
                          to <span className="text-foreground">{formatActivityValue(entry.field, entry.toValue, users)}</span>
                        </>
                      )}
                      <span className="ml-1.5 text-faint-foreground">· {formatActivityTime(entry.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
