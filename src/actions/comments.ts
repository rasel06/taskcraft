"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessProject } from "@/lib/auth";
import { isAllowedAttachment, MAX_ATTACHMENT_SIZE } from "@/lib/attachments";
import { dispatchNotification, singleRecipient, appUrl } from "@/lib/notify";

const commentUserSelect = { select: { id: true, name: true, avatarUrl: true } } as const;
const commentInclude = { user: commentUserSelect, attachments: true } as const;

export interface CommentAttachmentInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

function snippet(body: string, max = 60) {
  return body.length > max ? `${body.slice(0, max)}…` : body;
}

function activitySnippet(body: string, attachmentCount: number) {
  const text = body.trim();
  if (text) return snippet(text);
  if (attachmentCount > 0) return `[${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}]`;
  return "";
}

async function requireCommentAccess(issueId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true } });
  if (!issue) throw new Error("Issue not found");
  if (!(await canAccessProject(issue.projectId, user))) {
    throw new Error("You don't have permission to discuss this issue");
  }
  return { user, projectId: issue.projectId };
}

export async function uploadCommentAttachment(issueId: string, formData: FormData): Promise<CommentAttachmentInput> {
  await requireCommentAccess(issueId);

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (file.size === 0) throw new Error("File is empty");
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("File is too large (max 10MB)");
  if (!isAllowedAttachment(file.name)) throw new Error("Unsupported file type");

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase();
  const storedName = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "comments");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), bytes);

  return {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    url: `/uploads/comments/${storedName}`,
  };
}

export async function addComment(
  issueId: string,
  body: string,
  parentId?: string | null,
  attachments?: CommentAttachmentInput[],
) {
  const text = body.trim();
  if (!text && !(attachments && attachments.length > 0)) throw new Error("Comment can't be empty");
  const { user, projectId } = await requireCommentAccess(issueId);

  let resolvedParentId: string | null = null;
  let parent: { id: string; user: { id: string; name: string } | null } | null = null;
  if (parentId) {
    const parentComment = await prisma.issueComment.findUnique({
      where: { id: parentId },
      select: { id: true, issueId: true, parentId: true, user: { select: { id: true, name: true } } },
    });
    if (!parentComment || parentComment.issueId !== issueId) throw new Error("Comment not found");
    // Flatten reply chains to a single level: always attach under the top-level comment.
    resolvedParentId = parentComment.parentId ?? parentComment.id;
    parent = parentComment.parentId
      ? await prisma.issueComment.findUnique({ where: { id: parentComment.parentId }, select: { id: true, user: { select: { id: true, name: true } } } })
      : parentComment;
  }

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.issueComment.create({
      data: {
        issueId,
        userId: user.id,
        body: text,
        parentId: resolvedParentId,
        attachments: attachments?.length ? { create: attachments } : undefined,
      },
      include: commentInclude,
    });
    const activityText = activitySnippet(text, attachments?.length ?? 0);
    await tx.issueActivity.create({
      data: resolvedParentId
        ? {
            issueId,
            field: "comment_reply",
            fromValue: parent?.user?.name ?? null,
            toValue: activityText,
            userId: user.id,
          }
        : { issueId, field: "comment", fromValue: null, toValue: activityText, userId: user.id },
    });
    await tx.issueLastView.upsert({
      where: { issueId_userId: { issueId, userId: user.id } },
      create: { issueId, userId: user.id },
      update: { viewedAt: new Date() },
    });
    return created;
  });

  revalidatePath("/", "layout");

  if (resolvedParentId && parent?.user && parent.user.id !== user.id) {
    const owner = await singleRecipient(parent.user.id);
    if (owner) {
      await dispatchNotification(
        [owner],
        `💬 ${user.name} replied to your message on issue ${issueId}\n"${snippet(text || "[attachment]")}"\n${appUrl(`/projects/${projectId}?issue=${issueId}&view=discussion`)}`,
        { skipSlack: true },
      );
    }
  }

  return comment;
}

export async function updateComment(commentId: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("Comment can't be empty");

  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const existing = await prisma.issueComment.findUnique({ where: { id: commentId } });
  if (!existing) throw new Error("Comment not found");
  if (existing.userId !== user.id) throw new Error("You can only edit your own comments");
  if (existing.body === text) return existing;

  const comment = await prisma.$transaction(async (tx) => {
    const updated = await tx.issueComment.update({
      where: { id: commentId },
      data: { body: text },
      include: commentInclude,
    });
    await tx.issueActivity.create({
      data: {
        issueId: existing.issueId,
        field: "comment_edited",
        fromValue: snippet(existing.body),
        toValue: snippet(text),
        userId: user.id,
      },
    });
    return updated;
  });

  revalidatePath("/", "layout");
  return comment;
}

export async function deleteComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const existing = await prisma.issueComment.findUnique({ where: { id: commentId } });
  if (!existing) throw new Error("Comment not found");
  if (existing.userId !== user.id) throw new Error("You can only delete your own comments");

  await prisma.$transaction(async (tx) => {
    await tx.issueComment.delete({ where: { id: commentId } });
    await tx.issueActivity.create({
      data: {
        issueId: existing.issueId,
        field: "comment_deleted",
        fromValue: snippet(existing.body),
        toValue: null,
        userId: user.id,
      },
    });
  });

  revalidatePath("/", "layout");
}

export async function markIssueViewed(issueId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.issueLastView.upsert({
    where: { issueId_userId: { issueId, userId: user.id } },
    create: { issueId, userId: user.id },
    update: { viewedAt: new Date() },
  });
}
