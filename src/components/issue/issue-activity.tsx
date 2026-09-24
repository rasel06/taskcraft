import * as React from "react";

// One row of an issue's audit trail (IssueActivity), shared by the issue
// dialog's Activity tab and the card's Timeline dialog.
export interface IssueActivityEntry {
  id: string;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

// Maps ids stored in activity values (users, milestones, cycles) to names.
export type NameResolver = (id: string) => string | undefined;

export const ACTIVITY_FIELD_LABELS: Record<string, string> = {
  created: "Issue",
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assignees: "Assignees",
  milestoneId: "Milestone",
  cycleId: "Cycle",
  labels: "Labels",
  attachments: "Attachments",
};

export function formatActivityValue(field: string, value: string | null, resolve: NameResolver): string {
  if (field === "assignees") {
    const ids = value ? value.split(",").filter(Boolean) : [];
    if (ids.length === 0) return "Unassigned";
    return ids.map((id) => resolve(id) ?? "Unknown").join(", ");
  }
  if (!value) return "—";
  if (field === "milestoneId" || field === "cycleId") return resolve(value) ?? "Unknown";
  if (field === "description" || field === "title") return value.length > 40 ? `${value.slice(0, 40)}…` : value;
  return value;
}

export function renderActivityText(entry: IssueActivityEntry, resolve: NameResolver): React.ReactNode {
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
  if (entry.field === "description") return <>updated the <span className="text-foreground">description</span></>;
  return (
    <>
      changed <span className="text-foreground">{ACTIVITY_FIELD_LABELS[entry.field] ?? entry.field}</span>{" "}
      from <span className="text-foreground">{formatActivityValue(entry.field, entry.fromValue, resolve)}</span>{" "}
      to <span className="text-foreground">{formatActivityValue(entry.field, entry.toValue, resolve)}</span>
    </>
  );
}

export function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
