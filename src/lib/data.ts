import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import type { TeamWithProjects, UserLite, ProjectOverview, CycleOverview, CycleStatus } from "@/lib/types";
import type { IssueView } from "@/lib/issue-view";

type AuthUser = { id: string; role?: { permissions: string } | null } | null;

const issueInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  milestone: { select: { name: true } },
  project: { select: { name: true, team: { select: { identifier: true, isPrivate: true, id: true } } } },
} as const;

type RawIssue = {
  id: string;
  title: string;
  status: string;
  priority: string;
  labels: string;
  createdAt: Date;
  projectId: string;
  cycleId: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  milestone: { name: string } | null;
  project: { name: string; team: { identifier: string; isPrivate: boolean; id: string } };
};

function toIssueView(issue: RawIssue): IssueView {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    labels: issue.labels,
    createdAt: issue.createdAt.toISOString(),
    projectId: issue.projectId,
    projectName: issue.project.name,
    teamIdentifier: issue.project.team.identifier,
    milestoneName: issue.milestone?.name ?? null,
    cycleId: issue.cycleId,
    assignee: issue.assignee,
  };
}

function cycleStatus(startDate: Date, targetDate: Date): CycleStatus {
  const now = Date.now();
  if (now < startDate.getTime()) return "Upcoming";
  if (now > targetDate.getTime()) return "Completed";
  return "Active";
}

async function visibleTeamIds(user: AuthUser) {
  const teams = await prisma.team.findMany({ include: { members: { select: { userId: true } } } });
  return teams
    .filter((t) => !t.isPrivate || can(user, "view_all_teams") || t.members.some((m) => m.userId === user?.id))
    .map((t) => t.id);
}

export async function getAssignedIssues(userId: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { assigneeId: userId },
    orderBy: { updatedAt: "desc" },
    include: issueInclude,
  });
  return issues.map(toIssueView);
}

export async function getProjectIssues(projectId: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: issueInclude,
  });
  return issues.map(toIssueView);
}

export async function getTeamIssues(teamId: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { project: { teamId } },
    orderBy: { createdAt: "desc" },
    include: issueInclude,
  });
  return issues.map(toIssueView);
}

export async function getVisibleProjects(user: AuthUser, teamId?: string) {
  const teamIds = teamId ? [teamId] : await visibleTeamIds(user);
  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds }, isDraft: false },
    orderBy: { startDate: "asc" },
    include: {
      team: { select: { id: true, name: true, identifier: true } },
      lead: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { issues: true } },
    },
  });
  return projects;
}

export async function getProjectsOverview(
  user: AuthUser,
  teamId?: string,
): Promise<ProjectOverview[]> {
  const projects = await getVisibleProjects(user, teamId);
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    priority: p.priority,
    isDraft: p.isDraft,
    createdAt: p.createdAt.toISOString(),
    startDate: p.startDate?.toISOString() ?? null,
    targetDate: p.targetDate?.toISOString() ?? null,
    issueCount: p._count.issues,
    team: p.team,
    lead: p.lead,
  }));
}

export async function getAllVisibleIssues(user: AuthUser): Promise<IssueView[]> {
  const teamIds = await visibleTeamIds(user);
  const issues = await prisma.issue.findMany({
    where: { project: { teamId: { in: teamIds } } },
    orderBy: { createdAt: "desc" },
    include: issueInclude,
  });
  return issues.map(toIssueView);
}

export async function getVisibleTeams(user: AuthUser): Promise<TeamWithProjects[]> {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      projects: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, teamId: true, status: true, isDraft: true } },
      members: { select: { userId: true } },
      lead: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return teams
    .filter((team) => {
      if (!user) return !team.isPrivate;
      if (can(user, "view_all_teams")) return true;
      if (!team.isPrivate) return true;
      return team.members.some((m) => m.userId === user.id);
    })
    .map((team) => ({
      id: team.id,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      color: team.color,
      isPrivate: team.isPrivate,
      timezone: team.timezone,
      projects: team.projects,
      memberIds: team.members.map((m) => m.userId),
      lead: team.lead,
    }));
}

export async function getTeamCycles(teamId: string): Promise<CycleOverview[]> {
  const cycles = await prisma.cycle.findMany({
    where: { teamId },
    orderBy: { startDate: "desc" },
    include: { issues: { select: { status: true } } },
  });
  return cycles.map((c) => ({
    id: c.id,
    teamId: c.teamId,
    number: c.number,
    name: c.name,
    startDate: c.startDate.toISOString(),
    targetDate: c.targetDate.toISOString(),
    status: cycleStatus(c.startDate, c.targetDate),
    issueCount: c.issues.length,
    completedCount: c.issues.filter((i) => i.status === "Done" || i.status === "Cancelled").length,
  }));
}

export async function getCycleIssues(cycleId: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { cycleId },
    orderBy: { createdAt: "desc" },
    include: issueInclude,
  });
  return issues.map(toIssueView);
}

export async function getAllUsers(): Promise<UserLite[]> {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, avatarUrl: true, role: { select: { id: true, name: true } } },
  });
}

export async function getWorkspaceRoles() {
  return prisma.workspaceRole.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });
}
