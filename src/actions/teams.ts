"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireTeamManage } from "@/lib/auth";
import { dispatchNotification, teamRecipients, appUrl } from "@/lib/notify";
import { teamMemberAddedMessage, teamMemberRemovedMessage, teamLeadChangedMessage } from "@/lib/notify/templates";

export async function createTeam(input: {
  name: string;
  identifier: string;
  timezone: string;
  isPrivate: boolean;
  icon: string;
  color: string;
  leadId?: string | null;
  cloneFromTeamId?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const name = input.name.trim();
  const identifier = input.identifier.trim().toUpperCase();
  const leadId = input.leadId || user.id;

  if (!name) throw new Error("Team name is required");
  if (!/^[A-Z0-9]{2,4}$/.test(identifier)) {
    throw new Error("Identifier must be 2-4 uppercase letters/numbers");
  }

  const existing = await prisma.team.findUnique({ where: { identifier } });
  if (existing) throw new Error(`Identifier "${identifier}" is already in use`);

  const lead = await prisma.user.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Team lead not found");

  const memberIds = new Set([user.id, leadId]);
  const team = await prisma.team.create({
    data: {
      name,
      identifier,
      timezone: input.timezone,
      isPrivate: input.isPrivate,
      icon: input.icon,
      color: input.color,
      leadId,
      members: {
        create: Array.from(memberIds).map((id) => ({ userId: id, role: id === leadId ? "ADMIN" : "MEMBER" })),
      },
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
          .filter((m) => !memberIds.has(m.userId))
          .map((m) => ({ teamId: team.id, userId: m.userId, role: m.role })),
      });
    }
  }

  revalidatePath("/", "layout");
  return team;
}

export async function updateTeam(
  teamId: string,
  input: { name?: string; timezone?: string; isPrivate?: boolean; icon?: string; color?: string; leadId?: string },
) {
  await requireTeamManage(teamId);
  const actor = await getCurrentUser();
  const before = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true, leadId: true, lead: { select: { name: true } } },
  });
  if (!before) throw new Error("Team not found");

  if (input.leadId) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: input.leadId } },
      create: { teamId, userId: input.leadId, role: "ADMIN" },
      update: {},
    });
  }
  const team = await prisma.team.update({ where: { id: teamId }, data: input });
  revalidatePath("/", "layout");

  if (input.leadId && input.leadId !== before.leadId) {
    const newLead = await prisma.user.findUnique({ where: { id: input.leadId }, select: { name: true } });
    const recipients = await teamRecipients(teamId);
    if (recipients.length > 0) {
      await dispatchNotification(
        recipients,
        teamLeadChangedMessage({
          teamName: team.name,
          fromName: before.lead?.name ?? "Unassigned",
          toName: newLead?.name ?? "Unknown",
          actorName: actor?.name ?? "someone",
          url: appUrl(`/teams/${teamId}/settings`),
        }),
        { event: "team_lead_changed" },
      );
    }
  }

  return team;
}

export async function addTeamMember(teamId: string, userId: string) {
  await requireTeamManage(teamId);
  const actor = await getCurrentUser();
  const [team, addedUser] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  const member = await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, userId },
    update: {},
  });
  revalidatePath(`/teams/${teamId}/settings`);

  if (team) {
    const recipients = await teamRecipients(teamId);
    if (recipients.length > 0) {
      await dispatchNotification(
        recipients,
        teamMemberAddedMessage({
          memberName: addedUser?.name ?? "Someone",
          teamName: team.name,
          actorName: actor?.name ?? "someone",
          url: appUrl(`/teams/${teamId}/settings`),
        }),
        { event: "team_member_added" },
      );
    }
  }

  return member;
}

export async function removeTeamMember(teamId: string, userId: string) {
  await requireTeamManage(teamId);
  const actor = await getCurrentUser();
  if (actor?.id === userId) throw new Error("You can't remove yourself from a team.");
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { leadId: true, name: true } });
  if (team?.leadId === userId) throw new Error("Can't remove the team lead. Assign a new lead first.");

  const recipients = await teamRecipients(teamId);
  const removedUser = recipients.find((u) => u.id === userId);

  await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  revalidatePath(`/teams/${teamId}/settings`);

  if (team && recipients.length > 0) {
    await dispatchNotification(
      recipients,
      teamMemberRemovedMessage({
        memberName: removedUser?.name ?? "A member",
        teamName: team.name,
        actorName: actor?.name ?? "someone",
        url: appUrl(`/teams/${teamId}/settings`),
      }),
      { event: "team_member_removed" },
    );
  }
}
