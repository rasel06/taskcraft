import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const projectFilter = searchParams.get("project") ?? undefined;
  const teamFilter = searchParams.get("team")?.toUpperCase() ?? undefined;

  const user = await getCurrentUser();

  const teams = await prisma.team.findMany({
    include: { members: { select: { userId: true } } },
  });
  const visibleTeamIds = teams
    .filter((t) => !t.isPrivate || user?.isWorkspaceAdmin || t.members.some((m) => m.userId === user?.id))
    .map((t) => t.id);

  if (q.length === 0 && !projectFilter && !teamFilter) {
    return NextResponse.json({ issues: [], projects: [] });
  }

  const [issues, projects] = await Promise.all([
    prisma.issue.findMany({
      where: {
        project: {
          teamId: { in: visibleTeamIds },
          id: projectFilter,
          team: teamFilter ? { identifier: teamFilter } : undefined,
        },
        OR: q
          ? [{ title: { contains: q } }, { id: { contains: q.toUpperCase() } }, { description: { contains: q } }]
          : undefined,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { project: { select: { name: true, team: { select: { identifier: true } } } } },
    }),
    projectFilter || teamFilter
      ? []
      : prisma.project.findMany({
          where: {
            teamId: { in: visibleTeamIds },
            name: q ? { contains: q } : undefined,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: { team: { select: { identifier: true } } },
        }),
  ]);

  return NextResponse.json({
    issues: issues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      projectId: i.projectId,
      projectName: i.project.name,
      teamIdentifier: i.project.team.identifier,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      teamIdentifier: p.team.identifier,
    })),
  });
}
