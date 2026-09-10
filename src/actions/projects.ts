"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProjectManage, getCurrentUser } from "@/lib/auth";
import { dispatchNotification, projectRecipients, appUrl } from "@/lib/notify";
import { formatProjectChanges, type FieldChange } from "@/lib/notify/format";
import {
  projectCreatedMessage,
  projectStatusMessage,
  projectUpdatedMessage,
  memberAddedMessage,
  memberRemovedMessage,
  roleChangedMessage,
} from "@/lib/notify/templates";

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

  const actor = await getCurrentUser();

  const existing = await prisma.project.findFirst({
    where: { teamId: input.teamId, name: { equals: name } },
    select: { id: true },
  });
  if (existing) throw new Error(`A project named "${name}" already exists in this team`);

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

  const recipients = await projectRecipients(project.id);
  if (recipients.length > 0) {
    await dispatchNotification(
      recipients,
      projectCreatedMessage({ projectName: project.name, actorName: actor?.name ?? "someone", url: appUrl(`/projects/${project.id}`) }),
      { event: "project_created", projectId: project.id },
    );
  }

  if (!input.isDraft) {
    redirect(`/projects/${project.id}`);
  }

  return project;
}

export async function updateProjectStatus(projectId: string, status: string) {
  const actor = await getCurrentUser();
  const before = await prisma.project.findUnique({ where: { id: projectId }, select: { status: true, name: true } });
  const project = await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath(`/projects/${projectId}`);

  if (before && before.status !== status) {
    const recipients = await projectRecipients(projectId);
    if (recipients.length > 0) {
      await dispatchNotification(
        recipients,
        projectStatusMessage({
          projectName: project.name,
          actorName: actor?.name ?? "someone",
          from: before.status,
          to: status,
          url: appUrl(`/projects/${projectId}`),
        }),
        { event: "project_status_changed", projectId },
      );
    }
  }

  return project;
}

const PROJECT_TRACKED_FIELDS = ["name", "description", "status", "priority", "leadId", "startDate", "targetDate"] as const;

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

  const actor = await getCurrentUser();
  const before = await prisma.project.findUnique({ where: { id: projectId } });
  if (!before) throw new Error("Project not found");

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Project name is required");
    input = { ...input, name };
    const existing = await prisma.project.findFirst({
      where: { teamId: before.teamId, name: { equals: name }, NOT: { id: projectId } },
      select: { id: true },
    });
    if (existing) throw new Error(`A project named "${name}" already exists in this team`);
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

  const changes: FieldChange[] = [];
  for (const field of PROJECT_TRACKED_FIELDS) {
    if (!(field in input)) continue;
    const fromRaw = (before as unknown as Record<string, string | Date | null>)[field];
    const toRaw = (project as unknown as Record<string, string | Date | null>)[field];
    const fromValue = fromRaw instanceof Date ? fromRaw.toISOString() : fromRaw;
    const toValue = toRaw instanceof Date ? toRaw.toISOString() : toRaw;
    if (fromValue === toValue) continue;
    changes.push({ field, from: fromValue ?? null, to: toValue ?? null });
  }

  if (changes.length > 0) {
    const recipients = await projectRecipients(projectId);
    if (recipients.length > 0) {
      const changeText = await formatProjectChanges(changes);
      await dispatchNotification(
        recipients,
        projectUpdatedMessage({
          projectName: project.name,
          actorName: actor?.name ?? "someone",
          changeText,
          url: appUrl(`/projects/${projectId}`),
        }),
        { event: "project_updated", projectId },
      );
    }
  }

  return project;
}

export async function addProjectMember(projectId: string, userId: string) {
  await requireProjectManage(projectId);
  const actor = await getCurrentUser();
  const [project, addedUser] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId },
    update: {},
  });
  revalidatePath(`/projects/${projectId}/settings`);

  if (project) {
    const recipients = await projectRecipients(projectId);
    if (recipients.length > 0) {
      await dispatchNotification(
        recipients,
        memberAddedMessage({
          memberName: addedUser?.name ?? "Someone",
          projectName: project.name,
          actorName: actor?.name ?? "someone",
          url: appUrl(`/projects/${projectId}/settings`),
        }),
        { event: "project_member_added", projectId },
      );
    }
  }

  return member;
}

export async function removeProjectMember(projectId: string, userId: string) {
  await requireProjectManage(projectId);
  const actor = await getCurrentUser();
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { leadId: true, name: true } });
  if (project?.leadId === userId) throw new Error("Can't remove the project lead. Assign a new lead first.");

  const recipients = await projectRecipients(projectId);
  const removedUser = recipients.find((u) => u.id === userId);

  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  revalidatePath(`/projects/${projectId}/settings`);

  if (project && recipients.length > 0) {
    await dispatchNotification(
      recipients,
      memberRemovedMessage({
        memberName: removedUser?.name ?? "A member",
        projectName: project.name,
        actorName: actor?.name ?? "someone",
        url: appUrl(`/projects/${projectId}/settings`),
      }),
      { event: "project_member_removed", projectId },
    );
  }
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: "ADMIN" | "MEMBER") {
  await requireProjectManage(projectId);
  const actor = await getCurrentUser();
  const [project, targetUser] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  const member = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });
  revalidatePath(`/projects/${projectId}/settings`);

  if (project) {
    const recipients = await projectRecipients(projectId);
    if (recipients.length > 0) {
      await dispatchNotification(
        recipients,
        roleChangedMessage({
          memberName: targetUser?.name ?? "A member",
          projectName: project.name,
          role,
          actorName: actor?.name ?? "someone",
          url: appUrl(`/projects/${projectId}/settings`),
        }),
        { event: "project_member_role_changed", projectId },
      );
    }
  }

  return member;
}
