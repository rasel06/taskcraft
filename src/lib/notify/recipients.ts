import { prisma } from "@/lib/prisma";

export interface NotifiableUser {
  id: string;
  name: string;
  telegramChatId: string | null;
  notifyTelegram: boolean;
  slackUserId: string | null;
  notifySlack: boolean;
}

const notifiableSelect = {
  id: true,
  name: true,
  telegramChatId: true,
  notifyTelegram: true,
  slackUserId: true,
  notifySlack: true,
} as const;

// Everyone who should hear about a project-level change: its lead plus
// every ProjectMember, deduped.
export async function projectRecipients(projectId: string): Promise<NotifiableUser[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      lead: { select: notifiableSelect },
      members: { select: { user: { select: notifiableSelect } } },
    },
  });
  if (!project) return [];

  const byId = new Map<string, NotifiableUser>();
  byId.set(project.lead.id, project.lead);
  for (const m of project.members) byId.set(m.user.id, m.user);
  return Array.from(byId.values());
}

// Recipients for an issue: its project's members/lead, plus any assignees
// who aren't already covered.
export async function issueRecipients(projectId: string, assigneeIds: string[]): Promise<NotifiableUser[]> {
  const recipients = await projectRecipients(projectId);
  const covered = new Set(recipients.map((u) => u.id));
  const missingIds = assigneeIds.filter((id) => !covered.has(id));
  if (missingIds.length > 0) {
    const extra = await prisma.user.findMany({ where: { id: { in: missingIds } }, select: notifiableSelect });
    recipients.push(...extra);
  }
  return recipients;
}

// Everyone who should hear about a team-level change: its lead plus every
// TeamMember, deduped.
export async function teamRecipients(teamId: string): Promise<NotifiableUser[]> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      lead: { select: notifiableSelect },
      members: { select: { user: { select: notifiableSelect } } },
    },
  });
  if (!team) return [];

  const byId = new Map<string, NotifiableUser>();
  if (team.lead) byId.set(team.lead.id, team.lead);
  for (const m of team.members) byId.set(m.user.id, m.user);
  return Array.from(byId.values());
}

export async function singleRecipient(userId: string | null | undefined): Promise<NotifiableUser | null> {
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: notifiableSelect });
}
