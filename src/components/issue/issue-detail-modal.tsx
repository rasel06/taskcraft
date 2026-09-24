"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Trash2, MessageCircle, History, ChevronRight, Save, Lock, Tag, CalendarDays, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { TeamIconBadge } from "@/components/shared/team-icon";
import { updateIssue, deleteIssue } from "@/actions/issues";
import { markIssueViewed } from "@/actions/comments";
import { PRIORITIES } from "@/lib/constants";
import { useProjectIssueStatuses } from "@/components/shared/issue-statuses-context";
import { formatDate } from "@/lib/utils";
import { IssueDiscussion, type IssueCommentEntry } from "@/components/issue/issue-discussion";
import {
  AttachmentGrid,
  AttachmentPickerButton,
  AttachmentPreviewDialog,
  uploadStagedFiles,
  useStagedFiles,
} from "@/components/issue/issue-attachments";
import type { IssueAttachment } from "@/lib/attachments";
import type { UserLite } from "@/lib/types";
import {
  renderActivityText,
  formatActivityTime,
  type IssueActivityEntry,
} from "@/components/issue/issue-activity";

export type { IssueActivityEntry };

export type { IssueCommentEntry };

export interface IssueDetail {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  labels: string;
  attachments: IssueAttachment[];
  createdAt: string;
  assigneeIds: string[];
  projectName: string;
  team: { name: string; icon: string; color: string };
  activity?: IssueActivityEntry[];
  // Names for user / milestone / cycle ids referenced in activity values.
  activityNames?: Record<string, string>;
  comments?: IssueCommentEntry[];
}

// Issue detail / edit dialog, opened by the project page when `?issue=<id>` is
// in the URL (the same links notifications use). Layout: breadcrumb header,
// content column (title, description, attachments, discussion/activity tabs)
// and a properties panel. The page behind stays visible only as dimmed context.
export function IssueDetailModal({
  issue,
  users,
  currentUser,
  canDelete = false,
  canEdit = false,
  editBlockedReason,
  initialTab = "discussion",
}: {
  issue: IssueDetail;
  users: UserLite[];
  currentUser?: { id: string; name: string; avatarUrl: string | null };
  canDelete?: boolean;
  // Whether the current user may edit this issue (see getIssueEditAccess);
  // the server enforces the same rule.
  canEdit?: boolean;
  editBlockedReason?: string | null;
  initialTab?: "discussion" | "activity";
}) {
  const router = useRouter();
  const boardHref = `/projects/${issue.projectId}`;
  const [open, setOpen] = React.useState(true);
  const [description, setDescription] = React.useState(issue.description ?? "");
  const [removedUrls, setRemovedUrls] = React.useState<Set<string>>(new Set());
  const { staged: stagedFiles, add: addFiles, remove: removeFile, clear: clearFiles } = useStagedFiles();
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const { statuses } = useProjectIssueStatuses(issue.projectId);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const labels = issue.labels ? issue.labels.split(",").filter(Boolean) : [];
  const comments = issue.comments ?? [];
  const activity = issue.activity ?? [];

  React.useEffect(() => {
    markIssueViewed(issue.id);
  }, [issue.id]);

  const descriptionDirty = description !== (issue.description ?? "");
  const attachmentsDirty = removedUrls.size > 0 || stagedFiles.length > 0;
  const dirty = descriptionDirty || attachmentsDirty;

  // Warn before a reload / tab close would drop unsaved edits.
  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Closing (Esc, outside click, ✕, breadcrumb) returns to the board; unsaved
  // edits need confirmation first. Uses push, not back(), so a deep link from a
  // notification still lands on the board.
  //
  // Navigation waits until the close animation has finished (onAnimationEnd
  // below): pushing right away re-renders the page without this modal, which
  // cuts the animation off mid-fade and makes the dialog blink.
  function requestClose() {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setOpen(false);
  }

  function discardChanges() {
    setDescription(issue.description ?? "");
    setRemovedUrls(new Set());
    clearFiles();
  }

  // Description and attachment edits are staged locally and only persisted
  // when the user presses "Save changes".
  async function saveChanges() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const input: Parameters<typeof updateIssue>[1] = {};
      if (descriptionDirty) input.description = description;
      if (attachmentsDirty) {
        const uploaded = await uploadStagedFiles(issue.projectId, stagedFiles);
        input.attachments = [...issue.attachments.filter((a) => !removedUrls.has(a.url)), ...uploaded];
      }
      await updateIssue(issue.id, input);
      setRemovedUrls(new Set());
      clearFiles();
      toast.success("Changes saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function updateField(input: Parameters<typeof updateIssue>[1], failure: string) {
    try {
      await updateIssue(issue.id, input);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failure);
    }
  }

  function toggleRemoved(url: string, removed: boolean) {
    setRemovedUrls((prev) => {
      const next = new Set(prev);
      if (removed) next.add(url);
      else next.delete(url);
      return next;
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteIssue(issue.id);
      toast.success(`${issue.id} deleted`);
      setConfirmDelete(false);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete issue");
      setDeleting(false);
    }
  }

  const assignees = users.filter((u) => issue.assigneeIds.includes(u.id));
  const resolveName = (id: string) => issue.activityNames?.[id] ?? users.find((u) => u.id === id)?.name;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent
        size="2xl"
        aria-describedby={undefined}
        onAnimationEnd={(e) => {
          if (!open && e.target === e.currentTarget) router.push(boardHref, { scroll: false });
        }}
        className="flex h-[min(88vh,56rem)] flex-col overflow-hidden"
      >
      {/* Breadcrumb bar (right padding leaves room for the dialog's close button) */}
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border pl-5 pr-12 text-sm">
        <Link
          href={boardHref}
          onClick={(e) => {
            e.preventDefault();
            requestClose();
          }}
          title="Back to board"
          className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <TeamIconBadge icon={issue.team.icon} color={issue.team.color} className="h-5 w-5 rounded" iconClassName="h-3 w-3" />
          <span className="truncate">{issue.projectName}</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint-foreground" />
        <span className="font-medium text-foreground">{issue.id}</span>
        {dirty && <span className="ml-2 rounded bg-primary-soft-bg px-1.5 py-0.5 text-[10px] font-medium text-primary-soft-text">Unsaved</span>}
        <div className="ml-auto flex items-center gap-1">
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Content column */}
        <section className="min-w-0 flex-1 md:overflow-y-auto">
          <div className="flex flex-col gap-6 px-6 py-5">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-lg font-semibold leading-snug text-foreground">{issue.title}</DialogTitle>
              <p className="text-xs text-faint-foreground">Created {formatDate(issue.createdAt)}</p>
            </div>

            {!canEdit && (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{editBlockedReason ?? "You can view this issue but not edit it."}</span>
              </div>
            )}

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving || !canEdit}
                placeholder={canEdit ? "Add a description..." : "No description."}
                className="min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              />
            </section>

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Attachments{" "}
                  <span className="font-normal normal-case text-faint-foreground">
                    ({issue.attachments.length - removedUrls.size + stagedFiles.length})
                  </span>
                </h2>
                {canEdit && <AttachmentPickerButton onPick={addFiles} disabled={saving} label="Add files" />}
              </div>
              {issue.attachments.length === 0 && stagedFiles.length === 0 ? (
                <p className="text-xs text-faint-foreground">No attachments.</p>
              ) : (
                <AttachmentGrid
                  saved={issue.attachments}
                  removedUrls={removedUrls}
                  staged={stagedFiles}
                  onRemoveSaved={canEdit ? (url) => toggleRemoved(url, true) : undefined}
                  onRestoreSaved={canEdit ? (url) => toggleRemoved(url, false) : undefined}
                  onRemoveStaged={canEdit ? removeFile : undefined}
                  onPreviewSaved={setPreviewIndex}
                  disabled={saving}
                />
              )}
              <AttachmentPreviewDialog attachments={issue.attachments} index={previewIndex} onIndexChange={setPreviewIndex} />
            </section>

            {dirty && (
              <div className="sticky bottom-3 z-10 flex items-center justify-end gap-2 rounded-md border border-primary-soft-border bg-primary-soft-bg px-3 py-2 shadow-md">
                <span className="mr-auto text-xs text-primary-soft-text">You have unsaved changes</span>
                <Button type="button" variant="ghost" size="sm" onClick={discardChanges} disabled={saving}>
                  Discard
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={saveChanges} disabled={saving}>
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            )}

            <Tabs defaultValue={initialTab} className="flex flex-col gap-4">
              <TabsList>
                <TabsTrigger value="discussion" className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> Discussion
                  <span className="tabular-nums text-faint-foreground">{comments.length}</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> Activity
                  <span className="tabular-nums text-faint-foreground">{activity.length}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="discussion">
                <IssueDiscussion issueId={issue.id} comments={comments} currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="activity">
                {activity.length === 0 ? (
                  <p className="text-xs text-faint-foreground">No activity yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {activity.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-2 text-xs">
                        <UserAvatar user={entry.user ?? undefined} className="mt-0.5 h-5 w-5 shrink-0" />
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{entry.user?.name ?? "Someone"}</span>{" "}
                          {renderActivityText(entry, resolveName)}
                          <span className="ml-1.5 text-faint-foreground">· {formatActivityTime(entry.createdAt)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Properties panel */}
        <aside className="shrink-0 border-t border-border bg-muted/30 md:w-64 md:overflow-y-auto md:border-l md:border-t-0">
          <dl className="flex flex-col gap-4 px-5 py-5 text-sm">
            <Property label="Status">
              <Select
                disabled={!canEdit}
                value={issue.status}
                onValueChange={(v) => updateField({ status: v }, "Failed to update status")}
              >
                <SelectTrigger className="h-8 w-full justify-start gap-2 text-xs [&>span]:flex-1 [&>span]:text-left">
                  <StatusIcon status={issue.status} projectId={issue.projectId} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.name} icon={<StatusIcon status={s.name} projectId={issue.projectId} />}>
                      {s.name}
                    </SelectItem>
                  ))}
                  {/* Keep the current status selectable if it was removed from the workflow. */}
                  {!statuses.some((s) => s.name === issue.status) && (
                    <SelectItem value={issue.status} icon={<StatusIcon status={issue.status} projectId={issue.projectId} />}>
                      {issue.status}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Property>

            <Property label="Priority">
              <Select
                disabled={!canEdit}
                value={issue.priority}
                onValueChange={(v) => updateField({ priority: v }, "Failed to update priority")}
              >
                <SelectTrigger className="h-8 w-full justify-start gap-2 text-xs [&>span]:flex-1 [&>span]:text-left">
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
            </Property>

            <Property label="Assignees" icon={<Users className="h-3.5 w-3.5" />}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!canEdit}>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1 text-left text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {assignees.length === 0 ? (
                      <span className="text-muted-foreground">Unassigned</span>
                    ) : (
                      assignees.map((u) => (
                        <span key={u.id} className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                          <UserAvatar user={u} className="h-4 w-4" /> {u.name}
                        </span>
                      ))
                    )}
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
                        onCheckedChange={(checked) => {
                          if (locked && !checked) {
                            toast.error("You can't unassign yourself from an issue.");
                            return;
                          }
                          const next = checked ? [...issue.assigneeIds, u.id] : issue.assigneeIds.filter((id) => id !== u.id);
                          updateField({ assigneeIds: next }, "Failed to update assignees");
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
            </Property>

            <Property label="Labels" icon={<Tag className="h-3.5 w-3.5" />}>
              {labels.length > 0 ? (
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
              ) : (
                <span className="text-xs text-faint-foreground">None</span>
              )}
            </Property>

            <Property label="Team">
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <TeamIconBadge icon={issue.team.icon} color={issue.team.color} className="h-4 w-4 rounded" iconClassName="h-2.5 w-2.5" />
                {issue.team.name}
              </span>
            </Property>

            <Property label="Created" icon={<CalendarDays className="h-3.5 w-3.5" />}>
              <span className="text-xs text-foreground">{formatDate(issue.createdAt)}</span>
            </Property>
          </dl>
        </aside>
      </div>

      <Dialog open={confirmDelete} onOpenChange={(next) => !deleting && setConfirmDelete(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {issue.id}?</DialogTitle>
            <DialogDescription>
              &ldquo;{issue.title}&rdquo; and its discussion will be permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function Property({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
