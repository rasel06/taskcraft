"use client";

import * as React from "react";
import {
  CalendarClock,
  CirclePlus,
  Flag,
  GitCommitVertical,
  Loader2,
  MessageCircle,
  MessageSquareReply,
  Paperclip,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { getIssueTimeline, type IssueTimeline } from "@/actions/issues";
import { renderActivityText, type IssueActivityEntry } from "@/components/issue/issue-activity";
import { cn } from "@/lib/utils";

type TimelineEvent = IssueTimeline["events"][number];

// Icon for an event, colored by what kind of change it was.
function EventIcon({ event, projectId }: { event: TimelineEvent; projectId: string }) {
  const cls = "h-3.5 w-3.5";
  switch (event.field) {
    case "created":
      return <CirclePlus className={cn(cls, "text-emerald-500")} />;
    case "status":
      return <StatusIcon status={event.toValue ?? ""} projectId={projectId} className={cls} />;
    case "priority":
      return <PriorityIcon priority={event.toValue ?? "No priority"} className={cls} />;
    case "assignees":
      return <Users className={cn(cls, "text-sky-500")} />;
    case "comment":
      return <MessageCircle className={cn(cls, "text-indigo-500")} />;
    case "comment_reply":
      return <MessageSquareReply className={cn(cls, "text-indigo-500")} />;
    case "comment_edited":
      return <Pencil className={cn(cls, "text-muted-foreground")} />;
    case "comment_deleted":
      return <Trash2 className={cn(cls, "text-red-500")} />;
    case "attachments":
      return <Paperclip className={cn(cls, "text-muted-foreground")} />;
    case "labels":
      return <Tag className={cn(cls, "text-violet-500")} />;
    case "milestoneId":
      return <Flag className={cn(cls, "text-amber-500")} />;
    case "cycleId":
      return <RefreshCw className={cn(cls, "text-teal-500")} />;
    case "title":
    case "description":
      return <Pencil className={cn(cls, "text-muted-foreground")} />;
    default:
      return <GitCommitVertical className={cn(cls, "text-muted-foreground")} />;
  }
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupByDay(events: TimelineEvent[]) {
  const groups: { day: string; events: TimelineEvent[] }[] = [];
  for (const e of events) {
    const day = dayLabel(e.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.events.push(e);
    else groups.push({ day, events: [e] });
  }
  return groups;
}

// Card action: opens a dialog with the issue's complete history (creation,
// every field change, comments, replies, edits, deletions, attachments),
// loaded on demand so boards don't fetch every issue's activity up front.
export function IssueTimelineButton({
  issueId,
  projectId,
  className,
}: {
  issueId: string;
  projectId: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<IssueTimeline | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getIssueTimeline(issueId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the timeline");
    } finally {
      setLoading(false);
    }
  }

  const resolve = (id: string) => data?.names[id];
  const groups = data ? groupByDay(data.events) : [];

  return (
    <>
      <button
        type="button"
        title="Timeline"
        aria-label="Open issue timeline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          load();
        }}
        className={className}
      >
        <CalendarClock className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="lg"
          className="flex max-h-[80vh] flex-col overflow-hidden"
          // Portal events bubble through the React tree; keep them off the card.
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.stopPropagation()}
        >
          <DialogHeader className="shrink-0 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Timeline <span className="font-normal text-muted-foreground">· {issueId}</span>
            </DialogTitle>
            <DialogDescription className="truncate">
              {data ? data.issue.title : "Every change, comment and attachment on this issue, oldest first."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline…
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
                <span>{error}</span>
                <button type="button" onClick={load} className="text-xs text-primary hover:underline">
                  Try again
                </button>
              </div>
            )}
            {data && data.events.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No recorded events yet.</p>
            )}
            {data &&
              groups.map((group) => (
                <section key={group.day} className="mb-5 last:mb-0">
                  <h3 className="sticky top-0 z-10 mb-2 bg-background py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.day}
                  </h3>
                  <ol className="relative ml-3 border-l border-border">
                    {group.events.map((event) => (
                      <li key={event.id} className="relative pb-4 pl-6 last:pb-0">
                        <span className="absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
                          <EventIcon event={event} projectId={projectId} />
                        </span>
                        <div className="flex items-start gap-2">
                          <UserAvatar user={event.user ?? undefined} className="mt-0.5 h-5 w-5 shrink-0" />
                          <p className="min-w-0 flex-1 text-sm leading-5 text-muted-foreground">
                            <span className="font-medium text-foreground">{event.user?.name ?? "Someone"}</span>{" "}
                            {renderActivityText(event as IssueActivityEntry, resolve)}
                          </p>
                          <time
                            dateTime={event.createdAt}
                            title={new Date(event.createdAt).toLocaleString()}
                            className="shrink-0 pt-0.5 text-[11px] tabular-nums text-faint-foreground"
                          >
                            {timeLabel(event.createdAt)}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
          </div>

          {data && (
            <div className="shrink-0 border-t border-border px-5 py-2.5 text-xs text-faint-foreground">
              {data.events.length} event{data.events.length === 1 ? "" : "s"}
              {data.issue.creatorName && <> · created by {data.issue.creatorName}</>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
