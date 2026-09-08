"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProjectManage } from "@/lib/auth";

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
  const managementFields = ["name", "description", "leadId", "startDate", "targetDate"] as const;
  if (managementFields.some((f) => f in input)) {
    await requireProjectManage(projectId);
  }
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

export async function addProjectMember(projectId: string, userId: string) {
  await requireProjectManage(projectId);
  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId },
    update: {},
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return member;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireProjectManage(projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { leadId: true } });
  if (project?.leadId === userId) throw new Error("Can't remove the project lead. Assign a new lead first.");
  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  revalidatePath(`/projects/${projectId}/settings`);
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: "ADMIN" | "MEMBER") {
  await requireProjectManage(projectId);
  const member = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return member;
}
