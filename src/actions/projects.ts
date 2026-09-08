"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export interface CreateProjectInput {
  name: string;
  description?: string;
  teamId: string;
  leadId: string;
  memberIds: string[];
  startDate?: string | null;
  targetDate?: string | null;
  priority: string;
  isDraft: boolean;
  milestones: { name: string; description?: string }[];
}

export async function createProject(input: CreateProjectInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");
  if (!input.teamId) throw new Error("Team is required");
  if (!input.leadId) throw new Error("Project lead is required");

  const project = await prisma.project.create({
    data: {
      name,
      description: input.description?.trim() || null,
      teamId: input.teamId,
      leadId: input.leadId,
      priority: input.priority,
      status: input.isDraft ? "Backlog" : "Planned",
      isDraft: input.isDraft,
      startDate: input.startDate ? new Date(input.startDate) : null,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      members: {
        create: Array.from(new Set([input.leadId, ...input.memberIds])).map((userId) => ({
          userId,
          role: userId === input.leadId ? "ADMIN" : "MEMBER",
        })),
      },
      milestones: {
        create: input.milestones
          .filter((m) => m.name.trim())
          .map((m) => ({ name: m.name.trim(), description: m.description?.trim() || null })),
      },
    },
  });

  revalidatePath("/", "layout");

  if (!input.isDraft) {
    redirect(`/projects/${project.id}`);
  }

  return project;
}

export async function updateProjectStatus(projectId: string, status: string) {
  const project = await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function updateProject(
  projectId: string,
  input: Partial<{
    name: string;
    description: string | null;
    status: string;
    priority: string;
    leadId: string;
    startDate: string | null;
    targetDate: string | null;
  }>,
) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...input,
      startDate: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : undefined,
      targetDate: input.targetDate !== undefined ? (input.targetDate ? new Date(input.targetDate) : null) : undefined,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/roadmaps");
  return project;
}
