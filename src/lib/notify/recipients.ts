import { prisma } from "@/lib/prisma";

export interface NotifiableUser {
  id: string;
  name: string;
  telegramChatId: string | null;
  notifyTelegram: boolean;
}

const notifiableSelect = { id: true, name: true, telegramChatId: true, notifyTelegram: true } as const;

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

// Recipients for an issue: its project's members/lead, plus the assignee
// if they aren't already covered.
export async function issueRecipients(projectId: string, assigneeId: string | null): Promise<NotifiableUser[]> {
  const recipients = await projectRecipients(projectId);
  if (assigneeId && !recipients.some((u) => u.id === assigneeId)) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: notifiableSelect });
    if (assignee) recipients.push(assignee);
  }
  return recipients;
}

export async function singleRecipient(userId: string | null | undefined): Promise<NotifiableUser | null> {
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: notifiableSelect });
}
