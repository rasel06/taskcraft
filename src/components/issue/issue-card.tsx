"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, History, Paperclip } from "lucide-react";
import { PriorityBadge, priorityStyle } from "@/components/shared/priority-icon";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
import { cn, formatDate } from "@/lib/utils";
import { isImageAttachment } from "@/lib/attachments";
import { AttachmentPreviewDialog, isPreviewableAttachment } from "@/components/issue/issue-attachments";
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
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const coverIndex = issue.attachments.findIndex((a) => isImageAttachment(a.fileType));
  const cover = coverIndex >= 0 ? issue.attachments[coverIndex] : undefined;
  const firstPreviewable = issue.attachments.findIndex(isPreviewableAttachment);

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={() => router.push(`/projects/${issue.projectId}?issue=${issue.id}`)}
        className={cn(
          "flex cursor-grab flex-col gap-2 rounded-md border border-l-[5px] border-border p-2.5 shadow-sm hover:border-input active:cursor-grabbing",
          priorityStyle(issue.priority).accent,
          priorityStyle(issue.priority).tint,
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{issue.id}</span>
          <PriorityBadge priority={issue.priority} />
        </div>
        {cover && (
          <button
            type="button"
            title={`Preview ${cover.fileName}`}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex(coverIndex);
            }}
            className="block w-full cursor-zoom-in overflow-hidden rounded border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.url} alt={cover.fileName} loading="lazy" draggable={false} className="h-28 w-full object-cover" />
          </button>
        )}
        <p className="line-clamp-2 text-sm text-foreground">{issue.title}</p>
        {showProject && <span className="text-xs text-faint-foreground">{issue.projectName}</span>}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-faint-foreground">{formatDate(issue.createdAt)}</span>
          <div className="flex items-center gap-2">
            {issue.attachments.length > 0 && (
              <button
                type="button"
                title={issue.attachments.map((a) => a.fileName).join("\n")}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(firstPreviewable >= 0 ? firstPreviewable : 0);
                }}
                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-faint-foreground hover:bg-muted hover:text-foreground"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="text-[10px] tabular-nums">{issue.attachments.length}</span>
              </button>
            )}
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
      {issue.attachments.length > 0 && (
        <AttachmentPreviewDialog attachments={issue.attachments} index={previewIndex} onIndexChange={setPreviewIndex} />
      )}
    </>
  );
}
