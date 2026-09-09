"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Paperclip, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { addComment, updateComment, deleteComment, uploadCommentAttachment, type CommentAttachmentInput } from "@/actions/comments";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_SIZE, isAllowedAttachment, formatFileSize } from "@/lib/attachments";
import { cn } from "@/lib/utils";

export interface IssueCommentAttachmentEntry {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface IssueCommentEntry {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  attachments: IssueCommentAttachmentEntry[];
}

interface PendingAttachment {
  localId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  uploading: boolean;
  error?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toIso(value: string | Date): string {
  return new Date(value).toISOString();
}

async function uploadFiles(
  files: File[],
  issueId: string,
  setPending: React.Dispatch<React.SetStateAction<PendingAttachment[]>>,
) {
  for (const file of files) {
    const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const error = file.size > MAX_ATTACHMENT_SIZE ? "Too large (max 10MB)" : !isAllowedAttachment(file.name) ? "Unsupported file type" : null;
    setPending((prev) => [
      ...prev,
      { localId, fileName: file.name, fileType: file.type, fileSize: file.size, uploading: !error, error: error ?? undefined },
    ]);
    if (error) continue;
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadCommentAttachment(issueId, formData);
      setPending((prev) =>
        prev.map((p) => (p.localId === localId ? { ...p, uploading: false, ...result } : p)),
      );
    } catch (err) {
      setPending((prev) =>
        prev.map((p) => (p.localId === localId ? { ...p, uploading: false, error: err instanceof Error ? err.message : "Upload failed" } : p)),
      );
    }
  }
}

function readyAttachments(pending: PendingAttachment[]): CommentAttachmentInput[] {
  return pending
    .filter((p): p is PendingAttachment & { url: string } => !!p.url && !p.error)
    .map((p) => ({ fileName: p.fileName, fileType: p.fileType, fileSize: p.fileSize, url: p.url }));
}

function AttachmentStaging({ pending, onRemove }: { pending: PendingAttachment[]; onRemove: (localId: string) => void }) {
  if (pending.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pending.map((p) => (
        <div
          key={p.localId}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
            p.error ? "border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400" : "border-border bg-muted/30 text-foreground",
          )}
        >
          {p.uploading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : <FileText className="h-3 w-3 shrink-0" />}
          <span className="max-w-32 truncate">{p.fileName}</span>
          {!p.uploading && !p.error && <span className="text-faint-foreground">{formatFileSize(p.fileSize)}</span>}
          {p.error && <span className="text-red-500">{p.error}</span>}
          <button type="button" onClick={() => onRemove(p.localId)} className="hover:text-red-400">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AttachmentView({ attachment }: { attachment: IssueCommentAttachmentEntry }) {
  const isImage = attachment.fileType.startsWith("image/");
  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block w-fit">
        <img src={attachment.url} alt={attachment.fileName} className="max-h-48 max-w-full rounded-md border border-border object-cover" />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      download={attachment.fileName}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs hover:bg-muted"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-40 truncate font-medium">{attachment.fileName}</span>
      <span className="shrink-0 text-faint-foreground">{formatFileSize(attachment.fileSize)}</span>
    </a>
  );
}

export function IssueDiscussion({
  issueId,
  comments,
  currentUser,
}: {
  issueId: string;
  comments: IssueCommentEntry[];
  currentUser?: { id: string; name: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const [localComments, setLocalComments] = React.useState(comments);
  const [commentText, setCommentText] = React.useState("");
  const [commentAttachments, setCommentAttachments] = React.useState<PendingAttachment[]>([]);
  const [posting, setPosting] = React.useState(false);
  const [replyingId, setReplyingId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replyAttachments, setReplyAttachments] = React.useState<PendingAttachment[]>([]);
  const [replying, setReplying] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);
  const replyFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const currentUserId = currentUser?.id;
  const topLevel = localComments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => localComments.filter((c) => c.parentId === id);

  function startReply(id: string) {
    setReplyingId(id);
    setReplyText("");
    setReplyAttachments([]);
    setEditingId(null);
  }

  function startEdit(c: IssueCommentEntry) {
    setEditingId(c.id);
    setEditText(c.body);
    setReplyingId(null);
  }

  async function submitTop() {
    const text = commentText.trim();
    const attachments = readyAttachments(commentAttachments);
    if ((!text && attachments.length === 0) || posting || commentAttachments.some((p) => p.uploading)) return;
    const tempId = `temp-${Date.now()}`;
    setLocalComments((prev) => [
      ...prev,
      {
        id: tempId,
        body: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: null,
        user: currentUser ?? null,
        attachments: attachments.map((a, i) => ({ id: `${tempId}-${i}`, ...a })),
      },
    ]);
    setCommentText("");
    setCommentAttachments([]);
    setPosting(true);
    try {
      const created = await addComment(issueId, text, undefined, attachments);
      setLocalComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                id: created.id,
                body: created.body,
                createdAt: toIso(created.createdAt),
                updatedAt: toIso(created.updatedAt),
                parentId: created.parentId,
                user: created.user,
                attachments: created.attachments,
              }
            : c,
        ),
      );
      router.refresh();
    } catch (err) {
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentText(text);
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  async function submitReply(parentId: string) {
    const text = replyText.trim();
    const attachments = readyAttachments(replyAttachments);
    if ((!text && attachments.length === 0) || replying || replyAttachments.some((p) => p.uploading)) return;
    const tempId = `temp-${Date.now()}`;
    const target = localComments.find((c) => c.id === parentId);
    const resolvedParentId = target?.parentId ?? parentId;
    setLocalComments((prev) => [
      ...prev,
      {
        id: tempId,
        body: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: resolvedParentId,
        user: currentUser ?? null,
        attachments: attachments.map((a, i) => ({ id: `${tempId}-${i}`, ...a })),
      },
    ]);
    setReplyingId(null);
    setReplyText("");
    setReplyAttachments([]);
    setReplying(true);
    try {
      const created = await addComment(issueId, text, parentId, attachments);
      setLocalComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                id: created.id,
                body: created.body,
                createdAt: toIso(created.createdAt),
                updatedAt: toIso(created.updatedAt),
                parentId: created.parentId,
                user: created.user,
                attachments: created.attachments,
              }
            : c,
        ),
      );
      router.refresh();
    } catch (err) {
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setReplying(false);
    }
  }

  async function submitEdit(commentId: string) {
    const text = editText.trim();
    if (!text || saving) return;
    const previous = localComments.find((c) => c.id === commentId)?.body ?? "";
    setLocalComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, body: text } : c)));
    setEditingId(null);
    setSaving(true);
    try {
      await updateComment(commentId, text);
      router.refresh();
    } catch (err) {
      setLocalComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, body: previous } : c)));
      toast.error(err instanceof Error ? err.message : "Failed to save comment");
    } finally {
      setSaving(false);
    }
  }

  async function remove(commentId: string) {
    const removed = localComments.filter((c) => c.id === commentId || c.parentId === commentId);
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
    try {
      await deleteComment(commentId);
      router.refresh();
    } catch (err) {
      setLocalComments((prev) => [...prev, ...removed]);
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }

  function renderMessage(c: IssueCommentEntry, isReply: boolean) {
    const isOwn = !!currentUserId && c.user?.id === currentUserId;
    const isEditing = editingId === c.id;
    const isPending = c.id.startsWith("temp-");
    const replies = isReply ? [] : repliesOf(c.id);

    return (
      <div key={c.id} className={cn("flex flex-col gap-2", isReply && "mt-2")}>
        <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
          <UserAvatar user={c.user ?? undefined} className={cn(isReply ? "h-5 w-5" : "h-7 w-7", "mb-4 shrink-0")} />

          <div className={cn("flex max-w-[78%] min-w-0 flex-col gap-1", isOwn ? "items-end" : "items-start")}>
            <div className="flex items-center gap-1.5 px-0.5 text-[11px] text-faint-foreground">
              {!isOwn && <span className="font-medium text-foreground">{c.user?.name ?? "Someone"}</span>}
              <span>
                {isPending ? "Sending..." : formatTime(c.createdAt)}
                {!isPending && c.updatedAt !== c.createdAt ? " · edited" : ""}
              </span>
            </div>

            {isEditing ? (
              <div className="flex w-full flex-col gap-1.5 rounded-lg border border-border bg-background p-2">
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-14 text-sm" autoFocus />
                <div className="flex items-center gap-1.5 self-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" variant="primary" onClick={() => submitEdit(c.id)} disabled={!editText.trim() || saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn("flex flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
                {c.body && (
                  <div
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                      isOwn ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground",
                      isPending && "opacity-60",
                    )}
                  >
                    {c.body}
                  </div>
                )}
                {c.attachments.length > 0 && (
                  <div className={cn("flex flex-col gap-1.5", isPending && "opacity-60")}>
                    {c.attachments.map((a) => (
                      <AttachmentView key={a.id} attachment={a} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isEditing && !isPending && (
              <div className={cn("flex items-center gap-2.5 px-0.5 text-[11px] text-faint-foreground", isOwn && "flex-row-reverse")}>
                <button type="button" onClick={() => startReply(c.id)} className="font-medium hover:text-foreground">
                  Reply
                </button>
                {isOwn && (
                  <button type="button" onClick={() => startEdit(c)} className="flex items-center gap-1 hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
                {isOwn && (
                  <button type="button" onClick={() => remove(c.id)} className="flex items-center gap-1 hover:text-red-400">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            )}

            {replyingId === c.id && (
              <div className="mt-1 flex w-full flex-col gap-1.5 rounded-lg border border-border bg-background p-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${c.user?.name ?? "this comment"}...`}
                  className="min-h-14 text-sm"
                  autoFocus
                />
                <AttachmentStaging pending={replyAttachments} onRemove={(id) => setReplyAttachments((prev) => prev.filter((p) => p.localId !== id))} />
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    title="Attach file"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) uploadFiles(files, issueId, setReplyAttachments);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setReplyingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => submitReply(c.id)}
                      disabled={(!replyText.trim() && readyAttachments(replyAttachments).length === 0) || replying || replyAttachments.some((p) => p.uploading)}
                    >
                      {replying ? "Posting..." : "Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {replies.length > 0 && (
          <div className="ml-9 flex flex-col border-l-2 border-border/70 pl-3">
            {replies.map((r) => renderMessage(r, true))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {topLevel.length > 0 ? (
        <div className="flex flex-col gap-4">{topLevel.map((c) => renderMessage(c, false))}</div>
      ) : (
        <p className="py-6 text-center text-sm text-faint-foreground">No comments yet. Start the discussion below.</p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-16 text-sm"
        />
        <AttachmentStaging pending={commentAttachments} onRemove={(id) => setCommentAttachments((prev) => prev.filter((p) => p.localId !== id))} />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            title="Attach file"
            onClick={() => commentFileInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={commentFileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) uploadFiles(files, issueId, setCommentAttachments);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submitTop}
            disabled={(!commentText.trim() && readyAttachments(commentAttachments).length === 0) || posting || commentAttachments.some((p) => p.uploading)}
          >
            {posting ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
