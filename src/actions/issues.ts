"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    return tx.issue.create({
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
  });

  revalidatePath("/", "layout");
  return issue;
}

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
  const { labels, ...rest } = input;
  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      ...rest,
      labels: labels !== undefined ? labels.join(",") : undefined,
    },
  });
  revalidatePath("/", "layout");
  return issue;
}

export async function deleteIssue(issueId: string) {
  await prisma.issue.delete({ where: { id: issueId } });
  revalidatePath("/", "layout");
}
