"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function createTeam(input: {
  name: string;
  identifier: string;
  timezone: string;
  isPrivate: boolean;
  icon: string;
  color: string;
  cloneFromTeamId?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const name = input.name.trim();
  const identifier = input.identifier.trim().toUpperCase();

  if (!name) throw new Error("Team name is required");
  if (!/^[A-Z0-9]{2,4}$/.test(identifier)) {
    throw new Error("Identifier must be 2-4 uppercase letters/numbers");
  }

  const existing = await prisma.team.findUnique({ where: { identifier } });
  if (existing) throw new Error(`Identifier "${identifier}" is already in use`);

  const team = await prisma.team.create({
    data: {
      name,
      identifier,
      timezone: input.timezone,
      isPrivate: input.isPrivate,
      icon: input.icon,
      color: input.color,
      members: { create: { userId: user.id, role: "ADMIN" } },
    },
  });

  if (input.cloneFromTeamId) {
    const source = await prisma.team.findUnique({
      where: { id: input.cloneFromTeamId },
      include: { members: true },
    });
    if (source) {
      await prisma.teamMember.createMany({
        data: source.members
          .filter((m) => m.userId !== user.id)
          .map((m) => ({ teamId: team.id, userId: m.userId, role: m.role })),
      });
    }
  }

  revalidatePath("/", "layout");
  return team;
}

export async function updateTeam(
  teamId: string,
  input: { name?: string; timezone?: string; isPrivate?: boolean; icon?: string; color?: string },
) {
  const team = await prisma.team.update({ where: { id: teamId }, data: input });
  revalidatePath("/", "layout");
  return team;
}

export async function addTeamMember(teamId: string, userId: string) {
  const member = await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, userId },
    update: {},
  });
  revalidatePath(`/teams/${teamId}/settings`);
  return member;
}

export async function removeTeamMember(teamId: string, userId: string) {
  await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  revalidatePath(`/teams/${teamId}/settings`);
}
