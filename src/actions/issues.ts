"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission, canAccessProject } from "@/lib/auth";
import {
  isAllowedAttachment,
  MAX_ATTACHMENT_SIZE,
  parseIssueAttachments,
  serializeIssueAttachments,
  type IssueAttachment,
} from "@/lib/attachments";
import { dispatchNotification, issueRecipients, appUrl } from "@/lib/notify";
import { getIssueStatuses } from "@/lib/data";
import { formatIssueChanges, type FieldChange } from "@/lib/notify/format";
import { issueCreatedMessage, issueUpdatedMessage } from "@/lib/notify/templates";

export interface CreateIssueInput {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeIds?: string[];
  projectId: string;
  milestoneId?: string | null;
  cycleId?: string | null;
  labels?: string[];
  attachments?: IssueAttachment[];
}

const ISSUE_UPLOAD_PREFIX = "/uploads/issues/";

// Only keep attachments that point at files we stored ourselves.
function sanitizeAttachments(attachments: IssueAttachment[] | undefined): IssueAttachment[] {
  return parseIssueAttachments(JSON.stringify(attachments ?? [])).filter(
    (a) => a.url.startsWith(ISSUE_UPLOAD_PREFIX) && !a.url.includes(".."),
  );
}

function attachmentNames(raw: string): string | null {
  return parseIssueAttachments(raw).map((a) => a.fileName).join(", ") || null;
}

// Resolve a requested status against the database-driven workflow. An empty
// value falls back to the default status; unknown names are rejected.
async function resolveIssueStatus(status: string | undefined) {
  const statuses = await getIssueStatuses();
  if (!status) return (statuses.find((s) => s.isDefault) ?? statuses[0]).name;
  if (!statuses.some((s) => s.name === status)) throw new Error(`"${status}" is not a valid issue status`);
  return status;
}

export async function uploadIssueAttachment(projectId: string, formData: FormData): Promise<IssueAttachment> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!(await canAccessProject(projectId, user))) throw new Error("You don't have access to this project");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (file.size === 0) throw new Error("File is empty");
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error("File is too large (max 10MB)");
  if (!isAllowedAttachment(file.name)) throw new Error("Unsupported file type");

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase();
  const storedName = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "issues");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storedName), bytes);

  return {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    url: `${ISSUE_UPLOAD_PREFIX}${storedName}`,
  };
}

export async function createIssue(input: CreateIssueInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Issue title is required");
  if (!input.projectId) throw new Error("Project is required");

  const user = await getCurrentUser();
  const assigneeIds = Array.from(new Set(input.assigneeIds ?? []));

  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error("Project not found");
  const status = await resolveIssueStatus(input.status);

  const issue = await prisma.$transaction(async (tx) => {
    const team = await tx.team.update({
      where: { id: project.teamId },
      data: { issueCounter: { increment: 1 } },
    });
    const created = await tx.issue.create({
      data: {
        id: `${team.identifier}-${team.issueCounter}`,
        number: team.issueCounter,
        title,
        description: input.description?.trim() || null,
        status,
        priority: input.priority,
        creatorId: user?.id || null,
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        cycleId: input.cycleId || null,
        labels: (input.labels ?? []).join(","),
        attachments: serializeIssueAttachments(sanitizeAttachments(input.attachments)),
        assignees: { create: assigneeIds.map((userId) => ({ userId })) },
      },
    });
    await tx.issueActivity.create({
      data: {
        issueId: created.id,
        field: "created",
        fromValue: null,
        toValue: created.status,
        userId: user?.id || null,
      },
    });
    return created;
  });

  revalidatePath("/", "layout");

  const recipients = await issueRecipients(input.projectId, assigneeIds);
  if (recipients.length > 0) {
    await dispatchNotification(
      recipients,
      issueCreatedMessage({
        issueId: issue.id,
        title: issue.title,
        projectName: project.name,
        actorName: user?.name ?? "someone",
        url: appUrl(`/projects/${project.id}?issue=${issue.id}`),
      }),
      { event: "issue_created", issueId: issue.id, projectId: project.id },
    );
  }

  return issue;
}

const TRACKED_FIELDS = ["title", "description", "status", "priority", "milestoneId", "cycleId", "labels"] as const;

export async function updateIssue(
  issueId: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeIds: string[];
    milestoneId: string | null;
    cycleId: string | null;
    labels: string[];
    attachments: IssueAttachment[];
  }>,
) {
  const user = await getCurrentUser();
  const before = await prisma.issue.findUnique({ where: { id: issueId }, include: { assignees: true } });
  if (!before) throw new Error("Issue not found");
  if (input.status !== undefined && input.status !== before.status) await resolveIssueStatus(input.status);

  const { labels, assigneeIds, attachments, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (labels !== undefined) data.labels = labels.join(",");
  if (attachments !== undefined) data.attachments = serializeIssueAttachments(sanitizeAttachments(attachments));

  const changes: FieldChange[] = [];
  const beforeAssigneeIds = before.assignees.map((a) => a.userId);

  const issue = await prisma.$transaction(async (tx) => {
    const updated = await tx.issue.update({ where: { id: issueId }, data });

    for (const field of TRACKED_FIELDS) {
      const fromValue = (before as unknown as Record<string, string | null>)[field];
      const toValue = (updated as unknown as Record<string, string | null>)[field];
      if (fromValue === toValue || !(field in data)) continue;
      changes.push({ field, from: fromValue ?? null, to: toValue ?? null });
      await tx.issueActivity.create({
        data: { issueId, field, fromValue: fromValue ?? null, toValue: toValue ?? null, userId: user?.id || null },
      });
    }

    if (attachments !== undefined && before.attachments !== updated.attachments) {
      const fromValue = attachmentNames(before.attachments);
      const toValue = attachmentNames(updated.attachments);
      changes.push({ field: "attachments", from: fromValue, to: toValue });
      await tx.issueActivity.create({
        data: { issueId, field: "attachments", fromValue, toValue, userId: user?.id || null },
      });
    }

    if (assigneeIds !== undefined) {
      const nextIds = Array.from(new Set(assigneeIds));
      const beforeSet = new Set(beforeAssigneeIds);
      const nextSet = new Set(nextIds);
      if (user && beforeSet.has(user.id) && !nextSet.has(user.id)) {
        throw new Error("You can't unassign yourself from an issue.");
      }
      const sameSet = beforeSet.size === nextSet.size && beforeAssigneeIds.every((id) => nextSet.has(id));
      if (!sameSet) {
        await tx.issueAssignee.deleteMany({ where: { issueId } });
        if (nextIds.length > 0) {
          await tx.issueAssignee.createMany({ data: nextIds.map((userId) => ({ issueId, userId })) });
        }
        changes.push({ field: "assignees", from: beforeAssigneeIds.join(",") || null, to: nextIds.join(",") || null });
        await tx.issueActivity.create({
          data: {
            issueId,
            field: "assignees",
            fromValue: beforeAssigneeIds.join(",") || null,
            toValue: nextIds.join(",") || null,
            userId: user?.id || null,
          },
        });
      }
    }

    return updated;
  });

  revalidatePath("/", "layout");

  if (changes.length > 0) {
    const finalAssigneeIds = assigneeIds !== undefined ? Array.from(new Set(assigneeIds)) : beforeAssigneeIds;
    const recipients = await issueRecipients(issue.projectId, finalAssigneeIds);
    if (recipients.length > 0) {
      const changeText = await formatIssueChanges(changes);
      await dispatchNotification(
        recipients,
        issueUpdatedMessage({
          issueId: issue.id,
          actorName: user?.name ?? "someone",
          changeText,
          url: appUrl(`/projects/${issue.projectId}?issue=${issue.id}`),
        }),
        { event: "issue_updated", issueId: issue.id, projectId: issue.projectId },
      );
    }
  }

  return issue;
}

export async function deleteIssue(issueId: string) {
  await requirePermission("delete_issues");
  await prisma.issue.delete({ where: { id: issueId } });
  revalidatePath("/", "layout");
}
