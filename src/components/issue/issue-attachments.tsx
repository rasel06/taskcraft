"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Paperclip, Undo2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_SIZE,
  formatFileSize,
  isAllowedAttachment,
  isImageAttachment,
  type IssueAttachment,
} from "@/lib/attachments";
import { uploadIssueAttachment } from "@/actions/issues";
import { cn } from "@/lib/utils";

// A file picked in the browser but not uploaded yet. Uploading only happens
// when the user presses the form's save/create button.
export interface StagedFile {
  localId: string;
  file: File;
  previewUrl: string | null;
}

export function useStagedFiles() {
  const [staged, setStaged] = React.useState<StagedFile[]>([]);
  const stagedRef = React.useRef(staged);
  React.useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);

  React.useEffect(
    () => () => stagedRef.current.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl)),
    [],
  );

  const add = React.useCallback((files: File[]) => {
    const accepted: StagedFile[] = [];
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      if (!isAllowedAttachment(file.name)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      accepted.push({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: isImageAttachment(file.type) ? URL.createObjectURL(file) : null,
      });
    }
    if (accepted.length) setStaged((prev) => [...prev, ...accepted]);
  }, []);

  const remove = React.useCallback((localId: string) => {
    setStaged((prev) => {
      const target = prev.find((s) => s.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.localId !== localId);
    });
  }, []);

  const clear = React.useCallback(() => {
    setStaged((prev) => {
      prev.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
      return [];
    });
  }, []);

  return { staged, add, remove, clear };
}

export async function uploadStagedFiles(projectId: string, staged: StagedFile[]): Promise<IssueAttachment[]> {
  const uploaded: IssueAttachment[] = [];
  for (const s of staged) {
    const formData = new FormData();
    formData.append("file", s.file);
    try {
      uploaded.push(await uploadIssueAttachment(projectId, formData));
    } catch (err) {
      throw new Error(`${s.file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
    }
  }
  return uploaded;
}

export function AttachmentPickerButton({
  onPick,
  className,
  label,
  disabled,
}: {
  onPick: (files: File[]) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-7 items-center justify-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50",
          className,
        )}
        title="Attach files"
      >
        <Paperclip className="h-4 w-4" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onPick(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

interface TileProps {
  name: string;
  type: string;
  size: number;
  href: string | null;
  previewUrl: string | null;
  badge?: string;
  dimmed?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
  onPreview?: () => void;
  disabled?: boolean;
}

function AttachmentTile({ name, type, size, href, previewUrl, badge, dimmed, onRemove, onRestore, onPreview, disabled }: TileProps) {
  const body = (
    <>
      <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-t-md bg-muted/40">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-7 w-7 text-faint-foreground" />
        )}
      </div>
      <div className="flex flex-col px-2 py-1.5">
        <span className="truncate text-xs font-medium text-foreground" title={name}>
          {name}
        </span>
        <span className="text-[10px] text-faint-foreground">
          {formatFileSize(size)}
          {badge && <span className="ml-1 text-primary">· {badge}</span>}
        </span>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "group relative w-32 overflow-hidden rounded-md border border-border bg-background",
        dimmed && "opacity-40",
      )}
    >
      {onPreview && !dimmed ? (
        <button type="button" onClick={onPreview} className="block w-full text-left" title={`Preview ${name}`}>
          {body}
        </button>
      ) : href && !dimmed ? (
        <a href={href} target="_blank" rel="noreferrer" download={isImageAttachment(type) ? undefined : name} className="block">
          {body}
        </a>
      ) : (
        body
      )}
      {onRemove && !dimmed && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          title="Remove attachment"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {onRestore && dimmed && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRestore}
          title="Undo remove"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground shadow-sm"
        >
          <Undo2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function AttachmentGrid({
  saved = [],
  removedUrls,
  staged = [],
  onRemoveSaved,
  onRestoreSaved,
  onRemoveStaged,
  onPreviewSaved,
  disabled,
}: {
  saved?: IssueAttachment[];
  removedUrls?: Set<string>;
  staged?: StagedFile[];
  onRemoveSaved?: (url: string) => void;
  onRestoreSaved?: (url: string) => void;
  onRemoveStaged?: (localId: string) => void;
  onPreviewSaved?: (index: number) => void;
  disabled?: boolean;
}) {
  if (saved.length === 0 && staged.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {saved.map((a, i) => (
        <AttachmentTile
          key={a.url}
          name={a.fileName}
          type={a.fileType}
          size={a.fileSize}
          href={a.url}
          previewUrl={isImageAttachment(a.fileType) ? a.url : null}
          dimmed={removedUrls?.has(a.url)}
          onRemove={onRemoveSaved ? () => onRemoveSaved(a.url) : undefined}
          onRestore={onRestoreSaved ? () => onRestoreSaved(a.url) : undefined}
          onPreview={onPreviewSaved && isPreviewableAttachment(a) ? () => onPreviewSaved(i) : undefined}
          disabled={disabled}
        />
      ))}
      {staged.map((s) => (
        <AttachmentTile
          key={s.localId}
          name={s.file.name}
          type={s.file.type}
          size={s.file.size}
          href={s.previewUrl}
          previewUrl={s.previewUrl}
          badge="unsaved"
          onRemove={onRemoveStaged ? () => onRemoveStaged(s.localId) : undefined}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function isPdfAttachment(a: IssueAttachment) {
  return a.fileType === "application/pdf" || a.fileName.toLowerCase().endsWith(".pdf");
}

export function isPreviewableAttachment(a: IssueAttachment) {
  return isImageAttachment(a.fileType) || isPdfAttachment(a);
}

// Full-size preview for images and PDFs, with prev/next across the issue's
// attachments. Other file types fall back to a download prompt.
export function AttachmentPreviewDialog({
  attachments,
  index,
  onIndexChange,
}: {
  attachments: IssueAttachment[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const current = index !== null ? attachments[index] : undefined;
  const count = attachments.length;

  function step(delta: number) {
    if (index === null || count < 2) return;
    onIndexChange((index + delta + count) % count);
  }

  return (
    <Dialog open={!!current} onOpenChange={(next) => !next && onIndexChange(null)}>
      <DialogContent
        size="xl"
        className="flex h-[85vh] flex-col overflow-hidden"
        // Events inside a portal still bubble through the React tree, so keep
        // clicks/drags here from reaching a parent issue card or board column.
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
      >
        {current && (
          <>
            <DialogHeader className="shrink-0 pr-12">
              <DialogTitle className="truncate" title={current.fileName}>
                {current.fileName}
              </DialogTitle>
              <div className="flex items-center gap-3 text-xs text-faint-foreground">
                <span>{formatFileSize(current.fileSize)}</span>
                {count > 1 && (
                  <span className="tabular-nums">
                    {index! + 1} / {count}
                  </span>
                )}
                <a href={current.url} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <a href={current.url} download={current.fileName} className="flex items-center gap-1 hover:text-foreground">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </DialogHeader>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/30">
              {isImageAttachment(current.fileType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.url} alt={current.fileName} draggable={false} className="max-h-full max-w-full object-contain" />
              ) : isPdfAttachment(current) ? (
                <iframe key={current.url} src={current.url} title={current.fileName} className="h-full w-full border-0 bg-white" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                  <FileText className="h-10 w-10 text-faint-foreground" />
                  <span>No preview available for this file type.</span>
                  <a
                    href={current.url}
                    download={current.fileName}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              )}

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    title="Previous"
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    title="Next"
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {count > 1 && (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border px-4 py-2">
                {attachments.map((a, i) => (
                  <button
                    key={a.url}
                    type="button"
                    onClick={() => onIndexChange(i)}
                    title={a.fileName}
                    className={cn(
                      "flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/40",
                      i === index ? "border-primary ring-1 ring-primary" : "border-border opacity-70 hover:opacity-100",
                    )}
                  >
                    {isImageAttachment(a.fileType) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex flex-col items-center text-[9px] font-medium uppercase text-faint-foreground">
                        <FileText className="h-4 w-4" />
                        {a.fileName.split(".").pop()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
