"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, History, Paperclip } from "lucide-react";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityBadge, priorityStyle } from "@/components/shared/priority-icon";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
import { cn, formatDate } from "@/lib/utils";
import type { IssueView } from "@/lib/issue-view";

export function IssueRow({ issue, showProject }: { issue: IssueView; showProject?: boolean }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/projects/${issue.projectId}?issue=${issue.id}`)}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b border-l-4 border-border px-4 py-2.5 text-sm hover:bg-muted/50",
        priorityStyle(issue.priority).accent,
      )}
    >
      <StatusIcon status={issue.status} projectId={issue.projectId} />
      <span className="w-16 shrink-0 text-muted-foreground">{issue.id}</span>
      <span className="w-28 shrink-0">
        <PriorityBadge priority={issue.priority} />
      </span>
      <span className="min-w-0 flex-1 truncate text-foreground">{issue.title}</span>
      {issue.attachments.length > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 text-xs text-faint-foreground" title={issue.attachments.map((x) => x.fileName).join("\n")}>
          <Paperclip className="h-3.5 w-3.5" />
          <span className="tabular-nums">{issue.attachments.length}</span>
        </span>
      )}
      {showProject && <span className="w-32 shrink-0 truncate text-xs text-faint-foreground">{issue.projectName}</span>}
      <div className="flex shrink-0 items-center divide-x divide-border rounded-md border border-border/70 bg-muted/20">
        <button
          type="button"
          title="Open discussion"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/projects/${issue.projectId}?issue=${issue.id}&view=discussion`);
          }}
          className="relative flex items-center gap-1 rounded-l-md px-1.5 py-1 text-xs text-faint-foreground hover:bg-muted hover:text-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="tabular-nums">{issue.commentCount}</span>
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
      <span className="w-20 shrink-0 text-right text-xs text-faint-foreground">{formatDate(issue.createdAt)}</span>
      <AssigneeAvatars users={issue.assignees} className="h-5 w-5 shrink-0" />
    </div>
  );
}
