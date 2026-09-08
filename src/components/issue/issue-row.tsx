import Link from "next/link";
import { StatusIcon } from "@/components/shared/status-icon";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/utils";
import type { IssueView } from "@/lib/issue-view";

export function IssueRow({ issue, showProject }: { issue: IssueView; showProject?: boolean }) {
  return (
    <Link
      href={`/projects/${issue.projectId}?issue=${issue.id}`}
      className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm hover:bg-muted/50"
    >
      <StatusIcon status={issue.status} />
      <span className="w-16 shrink-0 text-muted-foreground">{issue.id}</span>
      <PriorityIcon priority={issue.priority} />
      <span className="min-w-0 flex-1 truncate text-foreground">{issue.title}</span>
      {showProject && <span className="shrink-0 text-xs text-faint-foreground">{issue.projectName}</span>}
      <span className="w-20 shrink-0 text-xs text-faint-foreground">{formatDate(issue.createdAt)}</span>
      <UserAvatar user={issue.assignee} className="h-5 w-5 shrink-0" />
    </Link>
  );
}
