import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessTeam } from "@/lib/auth";
import { getAllUsers } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { TeamSettingsForm } from "@/components/team/team-settings-form";
import { TeamMembersManager } from "@/components/team/team-members-manager";
import { Lock } from "lucide-react";

export default async function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, isWorkspaceAdmin: true } },
        },
      },
    },
  });
  if (!team) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessTeam(teamId, user);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <h1 className="text-sm font-semibold text-foreground">{team.name}</h1>
        {team.isPrivate && <Lock className="h-3.5 w-3.5 text-faint-foreground" />}
        <span className="text-sm text-faint-foreground">Settings</span>
      </header>
      {!allowed ? (
        <AccessDenied />
      ) : (
        <div className="flex flex-col gap-8 p-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General</h2>
            <TeamSettingsForm team={team} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members</h2>
            <TeamMembersManager
              teamId={team.id}
              members={team.members.map((m) => ({ userId: m.userId, role: m.role, user: m.user }))}
              allUsers={await getAllUsers()}
            />
          </section>
        </div>
      )}
    </div>
  );
}
