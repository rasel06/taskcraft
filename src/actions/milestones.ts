"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function addMilestone(projectId: string, input: { name: string; description?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Milestone name is required");
  const milestone = await prisma.milestone.create({
    data: { projectId, name, description: input.description?.trim() || null },
  });
  revalidatePath(`/projects/${projectId}`);
  return milestone;
}

export async function updateMilestone(
  milestoneId: string,
  input: { name?: string; description?: string | null },
) {
  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: input,
  });
  revalidatePath(`/projects/${milestone.projectId}`);
  return milestone;
}

export async function deleteMilestone(milestoneId: string) {
  const milestone = await prisma.milestone.delete({ where: { id: milestoneId } });
  revalidatePath(`/projects/${milestone.projectId}`);
}
