"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CreateCycleInput {
  teamId: string;
  name?: string;
  startDate: string;
  targetDate: string;
}

export async function createCycle(input: CreateCycleInput) {
  if (!input.teamId) throw new Error("Team is required");
  if (!input.startDate || !input.targetDate) throw new Error("Start and target dates are required");

  const startDate = new Date(input.startDate);
  const targetDate = new Date(input.targetDate);
  if (targetDate <= startDate) throw new Error("Target date must be after the start date");

  const cycle = await prisma.$transaction(async (tx) => {
    const team = await tx.team.update({
      where: { id: input.teamId },
      data: { cycleCounter: { increment: 1 } },
    });
    return tx.cycle.create({
      data: {
        teamId: input.teamId,
        number: team.cycleCounter,
        name: input.name?.trim() || null,
        startDate,
        targetDate,
      },
    });
  });

  revalidatePath(`/teams/${input.teamId}/cycles`);
  return cycle;
}

export async function updateCycle(
  cycleId: string,
  input: { name?: string | null; startDate?: string; targetDate?: string },
) {
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const startDate = input.startDate ? new Date(input.startDate) : cycle.startDate;
  const targetDate = input.targetDate ? new Date(input.targetDate) : cycle.targetDate;
  if (targetDate <= startDate) throw new Error("Target date must be after the start date");

  const updated = await prisma.cycle.update({
    where: { id: cycleId },
    data: {
      name: input.name === undefined ? undefined : input.name?.trim() || null,
      startDate,
      targetDate,
    },
  });

  revalidatePath(`/teams/${cycle.teamId}/cycles`);
  return updated;
}

export async function deleteCycle(cycleId: string) {
  const cycle = await prisma.cycle.delete({ where: { id: cycleId } });
  revalidatePath(`/teams/${cycle.teamId}/cycles`);
}
