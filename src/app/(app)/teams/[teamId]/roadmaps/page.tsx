import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessTeam } from "@/lib/auth";
import { getProjectsOverview } from "@/lib/data";
import { RoadmapTimeline } from "@/components/project/roadmap-timeline";
import { AccessDenied } from "@/components/shared/access-denied";
import { Lock, Map } from "lucide-react";

export default async function TeamRoadmapsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessTeam(teamId, user);
  const projects = allowed ? await getProjectsOverview(user, teamId) : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <h1 className="text-sm font-semibold text-foreground">{team.name}</h1>
        {team.isPrivate && <Lock className="h-3.5 w-3.5 text-faint-foreground" />}
        <span className="text-sm text-faint-foreground">Roadmap</span>
      </header>
      {!allowed ? (
        <AccessDenied />
      ) : projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-faint-foreground">
          <Map className="h-8 w-8" />
          <p className="text-sm">No published projects yet</p>
        </div>
      ) : (
        <RoadmapTimeline projects={projects} />
      )}
    </div>
  );
}
