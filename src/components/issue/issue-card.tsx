"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { PriorityBadge, PriorityIcon, priorityStyle } from "@/components/shared/priority-icon";
import { AssigneeAvatars } from "@/components/shared/assignee-avatars";
import { cn, formatDate } from "@/lib/utils";
import { isImageAttachment } from "@/lib/attachments";
import { AttachmentPreviewDialog } from "@/components/issue/issue-attachments";
import { IssueTimelineButton } from "@/components/issue/issue-timeline";
import type { IssueView } from "@/lib/issue-view";

export function IssueCard({
  issue,
  draggable,
  onDragStart,
  showProject,
  collapsed = false,
  onToggleCollapse,
}: {
  issue: IssueView;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  showProject?: boolean;
  // Collapsed cards show a single line (id, title, priority, assignees).
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const router = useRouter();
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  // Image attachments with their index in the full attachment list (for the preview dialog).
  const images = issue.attachments
    .map((a, index) => ({ ...a, index }))
    .filter((a) => isImageAttachment(a.fileType));
  const open = () => router.push(`/projects/${issue.projectId}?issue=${issue.id}`);
  const cardClass = cn(
    "flex cursor-grab rounded-md border border-l-[5px] border-border shadow-sm hover:border-input active:cursor-grabbing",
    priorityStyle(issue.priority).accent,
    priorityStyle(issue.priority).tint,
  );

  const collapseButton = onToggleCollapse && (
    <button
      type="button"
      title={collapsed ? "Expand card" : "Collapse card"}
      aria-expanded={!collapsed}
      onClick={(e) => {
        e.stopPropagation();
        onToggleCollapse();
      }}
      className="-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-faint-foreground hover:bg-muted hover:text-foreground"
    >
      {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );

  if (collapsed) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={open}
        title={issue.title}
        className={cn(cardClass, "items-center gap-1.5 px-2 py-1.5")}
      >
        {collapseButton}
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{issue.id}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-foreground">{issue.title}</span>
        <PriorityIcon priority={issue.priority} className="h-3.5 w-3.5" />
        <AssigneeAvatars users={issue.assignees} className="h-4 w-4" max={2} />
      </div>
    );
  }

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={open}
        className={cn(cardClass, "flex-col gap-2 p-2.5")}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            {collapseButton}
            <span className="text-xs font-medium text-muted-foreground">{issue.id}</span>
          </span>
          <PriorityBadge priority={issue.priority} />
        </div>
        {images.length > 0 && <CoverSlideshow images={images} onOpen={setPreviewIndex} />}
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
              <IssueTimelineButton
                issueId={issue.id}
                projectId={issue.projectId}
                className="flex items-center rounded-r-md px-1.5 py-1 text-faint-foreground hover:bg-muted hover:text-foreground"
              />
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

// Card cover: a single image, or a slideshow (arrows, dots, counter) when the
// issue has several images. Clicking the image opens the full preview dialog.
function CoverSlideshow({
  images,
  onOpen,
}: {
  images: { url: string; fileName: string; index: number }[];
  onOpen: (attachmentIndex: number) => void;
}) {
  const [slide, setSlide] = React.useState(0);
  const count = images.length;
  const current = Math.min(slide, count - 1);

  function go(e: React.MouseEvent, delta: number) {
    e.stopPropagation();
    setSlide((current + delta + count) % count);
  }

  return (
    <div className="group/cover relative overflow-hidden rounded border border-border">
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            title={`Preview ${img.fileName}`}
            tabIndex={i === current ? 0 : -1}
            aria-hidden={i !== current}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(img.index);
            }}
            className="block w-full shrink-0 cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.fileName} loading="lazy" draggable={false} className="h-28 w-full object-cover" />
          </button>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            title="Previous image"
            onClick={(e) => go(e, -1)}
            className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover/cover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Next image"
            onClick={(e) => go(e, 1)}
            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover/cover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
            {current + 1}/{count}
          </span>
          <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                title={`Image ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSlide(i);
                }}
                className={cn(
                  "h-1.5 rounded-full bg-white/70 shadow transition-all",
                  i === current ? "w-3.5 bg-white" : "w-1.5",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
