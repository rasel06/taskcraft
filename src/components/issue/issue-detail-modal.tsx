"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, MessageCircle, History, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
import { TeamIconBadge } from "@/components/shared/team-icon";
import { updateIssue, deleteIssue } from "@/actions/issues";
import { markIssueViewed } from "@/actions/comments";
import { ISSUE_STATUSES, PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IssueDiscussion, type IssueCommentEntry } from "@/components/issue/issue-discussion";
import type { UserLite } from "@/lib/types";

export interface IssueActivityEntry {
  id: string;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export type { IssueCommentEntry };

export interface IssueDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  labels: string;
  createdAt: string;
  assigneeIds: string[];
  team: { name: string; icon: string; color: string };
  activity?: IssueActivityEntry[];
  comments?: IssueCommentEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  created: "Issue",
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assignees: "Assignees",
  milestoneId: "Milestone",
  cycleId: "Cycle",
  labels: "Labels",
};

function formatActivityValue(field: string, value: string | null, users: UserLite[]): string {
  if (field === "assignees") {
    const ids = value ? value.split(",").filter(Boolean) : [];
    if (ids.length === 0) return "Unassigned";
    return ids.map((id) => users.find((u) => u.id === id)?.name ?? "Unknown").join(", ");
  }
  if (!value) return "—";
  if (field === "description" || field === "title") return value.length > 40 ? `${value.slice(0, 40)}…` : value;
  return value;
}

function renderActivityText(entry: IssueActivityEntry, users: UserLite[]): React.ReactNode {
  if (entry.field === "created") return "created this issue";
  if (entry.field === "comment") return <>commented: <span className="text-foreground">“{entry.toValue}”</span></>;
  if (entry.field === "comment_reply")
    return (
      <>
        replied to <span className="text-foreground">{entry.fromValue}</span>: <span className="text-foreground">“{entry.toValue}”</span>
      </>
    );
  if (entry.field === "comment_edited") return <>edited a comment</>;
  if (entry.field === "comment_deleted") return <>deleted a comment</>;
  return (
    <>
      changed <span className="text-foreground">{FIELD_LABELS[entry.field] ?? entry.field}</span>{" "}
      from <span className="text-foreground">{formatActivityValue(entry.field, entry.fromValue, users)}</span>{" "}
      to <span className="text-foreground">{formatActivityValue(entry.field, entry.toValue, users)}</span>
    </>
  );
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
  currentUser,
  canDelete = true,
  initialView = "detail",
}: {
  issue: IssueDetail;
  users: UserLite[];
  currentUser?: { id: string; name: string; avatarUrl: string | null };
  canDelete?: boolean;
  initialView?: "detail" | "discussion" | "activity";
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [description, setDescription] = React.useState(issue.description ?? "");
  const [view, setView] = React.useState<"detail" | "discussion" | "activity">(initialView);
  const labels = issue.labels ? issue.labels.split(",").filter(Boolean) : [];
  const comments = issue.comments ?? [];
  const activity = issue.activity ?? [];

  React.useEffect(() => {
    markIssueViewed(issue.id);
  }, [issue.id]);

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
      <DialogContent size="lg" className="flex max-h-[85vh] flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          {view === "detail" ? (
            <>
              <div className="flex items-center gap-1.5">
                <TeamIconBadge icon={issue.team.icon} color={issue.team.color} className="h-5 w-5 rounded" iconClassName="h-3 w-3" />
                <span className="text-xs font-medium text-muted-foreground">{issue.team.name}</span>
                <span className="text-xs text-faint-foreground">·</span>
                <span className="text-xs text-faint-foreground">{issue.id}</span>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground">{issue.title}</DialogTitle>
              <p className="text-xs text-faint-foreground">Created {formatDate(issue.createdAt)}</p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("detail")}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <DialogTitle className="text-base font-semibold text-foreground">
                {view === "discussion" ? "Discussion" : "Activity"}
              </DialogTitle>
              <span className="text-xs text-faint-foreground">{issue.id}</span>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {view === "discussion" && <IssueDiscussion issueId={issue.id} comments={comments} currentUser={currentUser} />}

          {view === "activity" && (
            <ul className="flex flex-col gap-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2 text-xs">
                  <UserAvatar user={entry.user ?? undefined} className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{entry.user?.name ?? "Someone"}</span>{" "}
                    {renderActivityText(entry, users)}
                    <span className="ml-1.5 text-faint-foreground">· {formatActivityTime(entry.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {view === "detail" && (
            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h3>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  placeholder="Add a description..."
                  className="min-h-24 rounded-md border border-border bg-muted/10 px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
                />
              </section>

              <section className="flex flex-col gap-2 border-t border-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={issue.status}
                    onValueChange={async (v) => {
                      await updateIssue(issue.id, { status: v });
                      router.refresh();
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
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
                    <SelectTrigger className="h-8 w-auto gap-1.5 rounded-md border border-border bg-muted/30 text-xs">
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 text-xs text-foreground hover:bg-muted"
                      >
                        <AssigneeAvatars users={users.filter((u) => issue.assigneeIds.includes(u.id))} className="h-4 w-4" max={2} />
                        {issue.assigneeIds.length > 0
                          ? `${issue.assigneeIds.length} assignee${issue.assigneeIds.length === 1 ? "" : "s"}`
                          : "Unassigned"}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {users.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        const locked = isSelf && issue.assigneeIds.includes(u.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={u.id}
                            checked={issue.assigneeIds.includes(u.id)}
                            onSelect={(e) => e.preventDefault()}
                            title={locked ? "You can't unassign yourself from an issue" : undefined}
                            className={locked ? "opacity-60" : undefined}
                            onCheckedChange={async (checked) => {
                              if (locked && !checked) {
                                toast.error("You can't unassign yourself from an issue.");
                                return;
                              }
                              const next = checked
                                ? [...issue.assigneeIds, u.id]
                                : issue.assigneeIds.filter((id) => id !== u.id);
                              try {
                                await updateIssue(issue.id, { assigneeIds: next });
                                router.refresh();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to update assignees");
                              }
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <UserAvatar user={u} className="h-4 w-4" /> {u.name}
                            </span>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {canDelete && (
                    <>
                      <div className="ml-auto h-5 w-px bg-border" />
                      <button
                        onClick={handleDelete}
                        title="Delete issue"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-faint-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((l) => (
                      <span
                        key={l}
                        className="rounded-md border border-primary-soft-border bg-primary-soft-bg px-2 py-0.5 text-xs font-medium text-primary-soft-text"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setView("discussion")}
                  className="flex flex-1 items-center justify-center gap-1.5 border-r border-border bg-muted/20 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Discussion
                  <span className="tabular-nums text-faint-foreground">{comments.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("activity")}
                  className="flex flex-1 items-center justify-center gap-1.5 bg-muted/20 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <History className="h-3.5 w-3.5" />
                  Activity
                  <span className="tabular-nums text-faint-foreground">{activity.length}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
