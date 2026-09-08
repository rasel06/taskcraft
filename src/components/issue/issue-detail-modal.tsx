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

export interface IssueDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  labels: string;
  createdAt: string;
  assigneeId: string | null;
}

export function IssueDetailModal({ issue, users }: { issue: IssueDetail; users: UserLite[] }) {
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
            <button onClick={handleDelete} className="text-faint-foreground hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
