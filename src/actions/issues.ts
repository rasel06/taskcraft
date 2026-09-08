"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/auth";

export interface CreateIssueInput {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
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
        assigneeId: input.assigneeId || null,
        creatorId: user?.id || null,
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        cycleId: input.cycleId || null,
        labels: (input.labels ?? []).join(","),
        attachments: (input.attachments ?? []).join(","),
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
  return issue;
}

const TRACKED_FIELDS = ["title", "description", "status", "priority", "assigneeId", "milestoneId", "cycleId", "labels"] as const;

export async function updateIssue(
  issueId: string,
  input: Partial<{
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: string | null;
    milestoneId: string | null;
    cycleId: string | null;
    labels: string[];
  }>,
) {
  const user = await getCurrentUser();
  const before = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!before) throw new Error("Issue not found");

  const { labels, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (labels !== undefined) data.labels = labels.join(",");

  const issue = await prisma.$transaction(async (tx) => {
    const updated = await tx.issue.update({ where: { id: issueId }, data });

    for (const field of TRACKED_FIELDS) {
      const fromValue = (before as unknown as Record<string, string | null>)[field];
      const toValue = (updated as unknown as Record<string, string | null>)[field];
      if (fromValue === toValue || !(field in data)) continue;
      await tx.issueActivity.create({
        data: { issueId, field, fromValue: fromValue ?? null, toValue: toValue ?? null, userId: user?.id || null },
      });
    }

    return updated;
  });

  revalidatePath("/", "layout");
  return issue;
}

export async function deleteIssue(issueId: string) {
  await requirePermission("delete_issues");
  await prisma.issue.delete({ where: { id: issueId } });
  revalidatePath("/", "layout");
}
