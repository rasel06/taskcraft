import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessTeam } from "@/lib/auth";
import { getTeamIssues, getAllUsers } from "@/lib/data";
import { Board } from "@/components/board/board";
import { AccessDenied } from "@/components/shared/access-denied";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";

export default async function TeamIssuesPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { projects: true } });
  if (!team) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessTeam(teamId, user);
  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col">
        <TeamHeader name={team.name} isPrivate={team.isPrivate} />
        <AccessDenied />
      </div>
    );
  }

  const [issues, users] = await Promise.all([getTeamIssues(teamId), getAllUsers()]);
  const projects = team.projects.map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    status: p.status,
    isDraft: p.isDraft,
    teamIdentifier: team.identifier,
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TeamHeader name={team.name} isPrivate={team.isPrivate}>
        <CreateIssueDialog
          projects={projects}
          users={users}
          trigger={
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> New issue
            </Button>
          }
        />
      </TeamHeader>
      <Board issues={issues} showProject={team.projects.length > 1} />
    </div>
  );
}

function TeamHeader({ name, isPrivate, children }: { name: string; isPrivate: boolean; children?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-5 py-3">
      <h1 className="text-sm font-semibold text-foreground">{name}</h1>
      {isPrivate && <Lock className="h-3.5 w-3.5 text-faint-foreground" />}
      <span className="text-sm text-faint-foreground">Issues</span>
      <div className="ml-auto">{children}</div>
    </header>
  );
}
