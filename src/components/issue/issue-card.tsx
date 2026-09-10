"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, History } from "lucide-react";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
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
  const router = useRouter();

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => router.push(`/projects/${issue.projectId}?issue=${issue.id}`)}
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
        <div className="flex items-center gap-2">
          <div className="flex items-center divide-x divide-border rounded-md border border-border/70 bg-muted/20">
            <button
              type="button"
              title="Open discussion"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${issue.projectId}?issue=${issue.id}&view=discussion`);
              }}
              className="relative flex items-center gap-1 rounded-l-md px-1.5 py-1 text-faint-foreground hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] tabular-nums">{issue.commentCount}</span>
              {issue.hasNewDiscussion && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" title="New discussion" />
              )}
            </button>
            <button
              type="button"
              title="Open activity"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${issue.projectId}?issue=${issue.id}&view=activity`);
              }}
              className="flex items-center rounded-r-md px-1.5 py-1 text-faint-foreground hover:bg-muted hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
            </button>
          </div>
          <AssigneeAvatars users={issue.assignees} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
