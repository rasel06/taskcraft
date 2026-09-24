"use client";

import * as React from "react";
import {
  ArrowRight,
  CalendarClock,
  CirclePlus,
  Clock,
  Flag,
  GitCommitVertical,
  Hourglass,
  Loader2,
  MessageCircle,
  MessageSquareReply,
  Paperclip,
  Pencil,
  RefreshCw,
  Repeat,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityBadge } from "@/components/shared/priority-icon";
import { useIssueStatusLookup } from "@/components/shared/issue-statuses-context";
import { getIssueTimeline, type IssueTimeline } from "@/actions/issues";
import { formatActivityValue } from "@/components/issue/issue-activity";
import { cn } from "@/lib/utils";

type TimelineEvent = IssueTimeline["events"][number];
type Person = IssueTimeline["people"][string];
type Filter = "all" | "status" | "comments" | "assignment" | "edits";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "status", label: "Status" },
  { key: "comments", label: "Comments" },
  { key: "assignment", label: "Assignment" },
  { key: "edits", label: "Edits" },
];

const COMMENT_FIELDS = new Set(["comment", "comment_reply", "comment_edited", "comment_deleted"]);

function eventCategory(field: string): Exclude<Filter, "all"> {
  if (field === "status" || field === "created") return "status";
  if (COMMENT_FIELDS.has(field)) return "comments";
  if (field === "assignees") return "assignment";
  return "edits";
}

// ---- time helpers -----------------------------------------------------------

const rtf = typeof Intl !== "undefined" ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }) : null;

function relativeTime(iso: string, now: number): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs) return rtf ? rtf.format(Math.round(diff / secs), unit) : `${Math.round(abs / secs)} ${unit}s ago`;
  }
  return "just now";
}

function duration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d${hours % 24 ? ` ${hours % 24}h` : ""}`;
  const months = Math.floor(days / 30);
  return `${months}mo${days % 30 ? ` ${days % 30}d` : ""}`;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const fullDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// ---- status journey ---------------------------------------------------------

interface StatusSpan {
  status: string;
  start: number;
  end: number;
}

// Periods the issue spent in each status: from creation (the "created" event
// records the initial status) through every status change, up to now.
function statusSpans(timeline: IssueTimeline, now: number): StatusSpan[] {
  const created = timeline.events.find((e) => e.field === "created");
  const changes = timeline.events.filter((e) => e.field === "status");
  let status = created?.toValue ?? changes[0]?.fromValue ?? timeline.issue.status;
  let start = new Date(timeline.issue.createdAt).getTime();
  const spans: StatusSpan[] = [];
  for (const change of changes) {
    const at = new Date(change.createdAt).getTime();
    spans.push({ status, start, end: at });
    status = change.toValue ?? status;
    start = at;
  }
  spans.push({ status, start, end: now });
  return spans.filter((s) => s.end > s.start || spans.length === 1);
}

// ---- small building blocks -----------------------------------------------------

function StatusChip({ name, projectId }: { name: string; projectId: string }) {
  const lookup = useIssueStatusLookup();
  const color = lookup(name, projectId)?.color ?? "#71717a";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium text-foreground"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <StatusIcon status={name} projectId={projectId} className="h-3 w-3" />
      {name}
    </span>
  );
}

function PersonChip({ person, removed }: { person: Person | { id: string; name: string; avatarUrl: null }; removed?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-xs",
        removed
          ? "border-red-200 bg-red-50 text-red-700 line-through decoration-red-400/70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      )}
    >
      <UserAvatar user={person} className="h-4 w-4" />
      {person.name}
    </span>
  );
}

function DiffChip({ label, removed }: { label: string; removed?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs",
        removed
          ? "border-red-200 bg-red-50 text-red-700 line-through decoration-red-400/70 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      )}
    >
      {removed ? "− " : "+ "}
      {label}
    </span>
  );
}

function listDiff(from: string | null, to: string | null, separator: string) {
  const a = from ? from.split(separator).map((x) => x.trim()).filter(Boolean) : [];
  const b = to ? to.split(separator).map((x) => x.trim()).filter(Boolean) : [];
  return { added: b.filter((x) => !a.includes(x)), removed: a.filter((x) => !b.includes(x)) };
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-1.5 line-clamp-3 rounded-md border-l-2 border-indigo-300 bg-muted/50 px-3 py-1.5 text-sm text-foreground dark:border-indigo-700">
      {children}
    </blockquote>
  );
}

const NODE_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; ring: string }> = {
  created: { icon: CirclePlus, ring: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900" },
  assignees: { icon: Users, ring: "bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:ring-sky-900" },
  comment: { icon: MessageCircle, ring: "bg-indigo-50 text-indigo-600 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:ring-indigo-900" },
  comment_reply: { icon: MessageSquareReply, ring: "bg-indigo-50 text-indigo-600 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:ring-indigo-900" },
  comment_edited: { icon: Pencil, ring: "bg-muted text-muted-foreground ring-border" },
  comment_deleted: { icon: Trash2, ring: "bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-900" },
  attachments: { icon: Paperclip, ring: "bg-muted text-muted-foreground ring-border" },
  labels: { icon: Tag, ring: "bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-400 dark:ring-violet-900" },
  milestoneId: { icon: Flag, ring: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-900" },
  cycleId: { icon: RefreshCw, ring: "bg-teal-50 text-teal-600 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-400 dark:ring-teal-900" },
  title: { icon: Pencil, ring: "bg-muted text-muted-foreground ring-border" },
  description: { icon: Pencil, ring: "bg-muted text-muted-foreground ring-border" },
};

function EventNode({ event, projectId }: { event: TimelineEvent; projectId: string }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full ring-1";
  if (event.field === "status") {
    return (
      <span className={cn(base, "bg-background ring-border")}>
        <StatusIcon status={event.toValue ?? ""} projectId={projectId} className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (event.field === "priority") {
    return (
      <span className={cn(base, "bg-background ring-border")}>
        <Flag className="h-3.5 w-3.5 text-orange-500" />
      </span>
    );
  }
  const style = NODE_STYLE[event.field] ?? { icon: GitCommitVertical, ring: "bg-muted text-muted-foreground ring-border" };
  const Icon = style.icon;
  return (
    <span className={cn(base, style.ring)}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

// ---- one event -----------------------------------------------------------------

function EventBody({
  event,
  timeline,
  previousStatusSince,
}: {
  event: TimelineEvent;
  timeline: IssueTimeline;
  previousStatusSince: number | null;
}) {
  const projectId = timeline.issue.projectId;
  const resolve = (id: string) => timeline.names[id];
  const person = (id: string) => timeline.people[id] ?? { id, name: resolve(id) ?? "Unknown", avatarUrl: null };

  switch (event.field) {
    case "created":
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>created the issue</span>
          {event.toValue && (
            <>
              <span>in</span>
              <StatusChip name={event.toValue} projectId={projectId} />
            </>
          )}
        </div>
      );
    case "status":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>moved the issue</span>
            {event.fromValue && <StatusChip name={event.fromValue} projectId={projectId} />}
            <ArrowRight className="h-3.5 w-3.5 text-faint-foreground" />
            {event.toValue && <StatusChip name={event.toValue} projectId={projectId} />}
          </div>
          {previousStatusSince !== null && event.fromValue && (
            <span className="flex items-center gap-1 text-xs text-faint-foreground">
              <Hourglass className="h-3 w-3" />
              after {duration(new Date(event.createdAt).getTime() - previousStatusSince)} in {event.fromValue}
            </span>
          )}
        </div>
      );
    case "priority":
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>changed priority</span>
          <PriorityBadge priority={event.fromValue ?? "No priority"} />
          <ArrowRight className="h-3.5 w-3.5 text-faint-foreground" />
          <PriorityBadge priority={event.toValue ?? "No priority"} />
        </div>
      );
    case "assignees": {
      const { added, removed } = listDiff(event.fromValue, event.toValue, ",");
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{added.length && !removed.length ? "assigned" : removed.length && !added.length ? "unassigned" : "reassigned"}</span>
          {added.map((id) => (
            <PersonChip key={`+${id}`} person={person(id)} />
          ))}
          {removed.map((id) => (
            <PersonChip key={`-${id}`} person={person(id)} removed />
          ))}
        </div>
      );
    }
    case "labels":
    case "attachments": {
      const { added, removed } = listDiff(event.fromValue, event.toValue, event.field === "labels" ? "," : ", ");
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{event.field === "labels" ? "updated labels" : "updated attachments"}</span>
          {added.map((x) => (
            <DiffChip key={`+${x}`} label={x} />
          ))}
          {removed.map((x) => (
            <DiffChip key={`-${x}`} label={x} removed />
          ))}
        </div>
      );
    }
    case "title":
      return (
        <div className="flex flex-col gap-1">
          <span>renamed the issue</span>
          <span className="text-xs">
            <span className="text-faint-foreground line-through">{event.fromValue}</span>
            <ArrowRight className="mx-1 inline h-3 w-3 text-faint-foreground" />
            <span className="font-medium text-foreground">{event.toValue}</span>
          </span>
        </div>
      );
    case "description":
      return (
        <div>
          <span>{event.fromValue ? "updated the description" : "added a description"}</span>
          {event.toValue && <Quote>{event.toValue}</Quote>}
        </div>
      );
    case "milestoneId":
    case "cycleId": {
      const label = event.field === "milestoneId" ? "milestone" : "cycle";
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{event.toValue ? `set ${label} to` : `removed the ${label}`}</span>
          <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-foreground">
            {formatActivityValue(event.field, event.toValue ?? event.fromValue, resolve)}
          </span>
        </div>
      );
    }
    case "comment":
      return (
        <div>
          <span>commented</span>
          {event.toValue && <Quote>{event.toValue}</Quote>}
        </div>
      );
    case "comment_reply":
      return (
        <div>
          <span>
            replied to <span className="font-medium text-foreground">{event.fromValue}</span>
          </span>
          {event.toValue && <Quote>{event.toValue}</Quote>}
        </div>
      );
    case "comment_edited":
      return <span>edited a comment</span>;
    case "comment_deleted":
      return <span>deleted a comment</span>;
    default:
      return (
        <span>
          changed {event.field} to {event.toValue ?? "—"}
        </span>
      );
  }
}

// ---- dialog ---------------------------------------------------------------------

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border bg-background px-3 py-2">
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StatusJourney({ spans, projectId, now }: { spans: StatusSpan[]; projectId: string; now: number }) {
  const lookup = useIssueStatusLookup();
  const total = Math.max(1, now - spans[0].start);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {spans.map((s, i) => (
          <div
            key={i}
            title={`${s.status} · ${duration(s.end - s.start)}`}
            className="h-full border-r border-background last:border-r-0"
            style={{
              width: `${Math.max(2, ((s.end - s.start) / total) * 100)}%`,
              backgroundColor: lookup(s.status, projectId)?.color ?? "#a1a1aa",
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {spans.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ArrowRight className="h-3 w-3 text-faint-foreground" />}
            <span className="inline-flex items-center gap-1">
              <StatusIcon status={s.status} projectId={projectId} className="h-3 w-3" />
              <span className="text-foreground">{s.status}</span>
              <span className="tabular-nums">{duration(s.end - s.start)}</span>
              {i === spans.length - 1 && <span className="text-faint-foreground">(current)</span>}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Card action: opens a dialog with the issue's complete history (creation, every
// field change, comments, replies, edits, deletions, attachments), plus a
// summary and status journey. Loaded on demand so boards don't fetch every
// issue's activity up front.
export function IssueTimelineButton({
  issueId,
  className,
}: {
  issueId: string;
  projectId?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<IssueTimeline | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [now, setNow] = React.useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getIssueTimeline(issueId));
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the timeline");
    } finally {
      setLoading(false);
    }
  }

  const counts = React.useMemo(() => {
    const c: Record<Filter, number> = { all: 0, status: 0, comments: 0, assignment: 0, edits: 0 };
    for (const e of data?.events ?? []) {
      c.all++;
      c[eventCategory(e.field)]++;
    }
    return c;
  }, [data]);

  const spans = React.useMemo(() => (data && now ? statusSpans(data, now) : []), [data, now]);

  // Start of the status each status-change event moved away from.
  const statusSince = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!data) return map;
    let since = new Date(data.issue.createdAt).getTime();
    for (const e of data.events) {
      if (e.field !== "status") continue;
      map.set(e.id, since);
      since = new Date(e.createdAt).getTime();
    }
    return map;
  }, [data]);

  const visible = (data?.events ?? []).filter((e) => filter === "all" || eventCategory(e.field) === filter);
  const groups: { day: string; events: TimelineEvent[] }[] = [];
  for (const e of visible) {
    const day = dayLabel(e.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.events.push(e);
    else groups.push({ day, events: [e] });
  }

  const contributors = React.useMemo(() => {
    const byId = new Map<string, Person>();
    for (const e of data?.events ?? []) if (e.user) byId.set(e.user.id, e.user);
    return [...byId.values()];
  }, [data]);

  const current = spans[spans.length - 1];

  return (
    <>
      <button
        type="button"
        title="Timeline"
        aria-label="Open issue timeline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          setFilter("all");
          load();
        }}
        className={className}
      >
        <CalendarClock className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="xl"
          className="flex max-h-[min(86vh,52rem)] flex-col overflow-hidden"
          // Portal events bubble through the React tree; keep them off the card.
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.stopPropagation()}
        >
          <DialogHeader className="shrink-0 gap-2 pr-12">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="font-medium uppercase tracking-wide">Timeline</span>
              <span className="text-faint-foreground">·</span>
              <span>{issueId}</span>
            </div>
            <DialogTitle className="text-base font-semibold leading-snug">{data?.issue.title ?? "Loading…"}</DialogTitle>
            {data ? (
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusChip name={data.issue.status} projectId={data.issue.projectId} />
                  <PriorityBadge priority={data.issue.priority} />
                  {data.issue.assignees.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <AssigneeAvatars users={data.issue.assignees} className="h-5 w-5" />
                      {data.issue.assignees.map((a) => a.name).join(", ")}
                    </span>
                  )}
                  <span className="ml-auto">
                    Created by <span className="font-medium text-foreground">{data.issue.creator?.name ?? "someone"}</span> ·{" "}
                    <span title={fullDate(data.issue.createdAt)}>{fullDate(data.issue.createdAt)}</span>
                  </span>
                </div>
              </DialogDescription>
            ) : (
              <DialogDescription>Every change, comment and attachment on this issue.</DialogDescription>
            )}
          </DialogHeader>

          {loading && !data && (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline…
            </div>
          )}
          {error && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{error}</span>
              <button type="button" onClick={load} className="text-xs text-primary hover:underline">
                Try again
              </button>
            </div>
          )}

          {data && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Summary */}
              <div className="flex shrink-0 flex-col gap-4 border-b border-border bg-muted/30 px-5 py-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Stat icon={<Clock className="h-3 w-3" />} label="Age" value={duration(now - new Date(data.issue.createdAt).getTime())} />
                  <Stat
                    icon={<Hourglass className="h-3 w-3" />}
                    label="In current status"
                    value={current ? duration(current.end - current.start) : "—"}
                  />
                  <Stat icon={<Repeat className="h-3 w-3" />} label="Status changes" value={counts.status - (data.events.some((e) => e.field === "created") ? 1 : 0)} />
                  <Stat icon={<MessageCircle className="h-3 w-3" />} label="Comments" value={counts.comments} />
                  <Stat
                    icon={<Users className="h-3 w-3" />}
                    label="Contributors"
                    value={
                      <span className="flex items-center gap-1.5">
                        <AssigneeAvatars users={contributors} className="h-5 w-5" max={4} />
                        {contributors.length}
                      </span>
                    }
                  />
                </div>
                {spans.length > 0 && <StatusJourney spans={spans} projectId={data.issue.projectId} now={now} />}
              </div>

              {/* Filters */}
              <div className="flex shrink-0 items-center gap-1 border-b border-border px-5 py-2" role="tablist" aria-label="Filter events">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.key}
                    disabled={f.key !== "all" && counts[f.key] === 0}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
                      filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {f.label}
                    <span className={cn("tabular-nums", filter === f.key ? "opacity-70" : "text-faint-foreground")}>{counts[f.key]}</span>
                  </button>
                ))}
              </div>

              {/* Events */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {visible.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No events of this type.</p>
                ) : (
                  groups.map((group) => (
                    <section key={group.day} className="mb-6 last:mb-0">
                      <h3 className="sticky top-0 z-10 -mx-5 mb-3 border-b border-border/60 bg-background/95 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                        {group.day}
                      </h3>
                      <ol className="relative">
                        {/* rail */}
                        <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-px bg-border" />
                        {group.events.map((event) => (
                          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                            <div className="relative z-[1] shrink-0">
                              <EventNode event={event} projectId={data.issue.projectId} />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                                  <div className="mb-0.5 flex items-center gap-1.5">
                                    <UserAvatar user={event.user ?? undefined} className="h-5 w-5" />
                                    <span className="font-medium text-foreground">{event.user?.name ?? "Someone"}</span>
                                  </div>
                                  <EventBody
                                    event={event}
                                    timeline={data}
                                    previousStatusSince={statusSince.get(event.id) ?? null}
                                  />
                                </div>
                                <time
                                  dateTime={event.createdAt}
                                  title={fullDate(event.createdAt)}
                                  className="shrink-0 text-right text-[11px] leading-4 text-faint-foreground"
                                >
                                  <span className="block tabular-nums text-muted-foreground">{clock(event.createdAt)}</span>
                                  {relativeTime(event.createdAt, now)}
                                </time>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
