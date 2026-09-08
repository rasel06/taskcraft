"use client";

import { PriorityIcon } from "@/components/shared/priority-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/utils";
import type { IssueView } from "@/lib/issue-view";

export function IssueCard({
  issue,
  draggable,
  onDragStart,
  showProject,
}: {
  issue: IssueView;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  showProject?: boolean;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col gap-2 rounded-md border border-border bg-background p-2.5 shadow-sm hover:border-input active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{issue.id}</span>
        <PriorityIcon priority={issue.priority} />
      </div>
      <p className="line-clamp-2 text-sm text-foreground">{issue.title}</p>
      {showProject && <span className="text-xs text-faint-foreground">{issue.projectName}</span>}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-faint-foreground">{formatDate(issue.createdAt)}</span>
        <UserAvatar user={issue.assignee} className="h-5 w-5" />
      </div>
    </div>
  );
}
