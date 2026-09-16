"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { dispatchNotification, issueRecipients, appUrl } from "@/lib/notify";
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
  attachments?: string[];
}

export async function createIssue(input: CreateIssueInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Issue title is required");
  if (!input.projectId) throw new Error("Project is required");

  const user = await getCurrentUser();
  const assigneeIds = Array.from(new Set(input.assigneeIds ?? []));

  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error("Project not found");

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
        status: input.status,
        priority: input.priority,
        creatorId: user?.id || null,
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        cycleId: input.cycleId || null,
        labels: (input.labels ?? []).join(","),
        attachments: (input.attachments ?? []).join(","),
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
  }>,
) {
  const user = await getCurrentUser();
  const before = await prisma.issue.findUnique({ where: { id: issueId }, include: { assignees: true } });
  if (!before) throw new Error("Issue not found");

  const { labels, assigneeIds, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (labels !== undefined) data.labels = labels.join(",");

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
