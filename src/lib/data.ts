import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { parseIssueAttachments } from "@/lib/attachments";
import {
  DEFAULT_ISSUE_STATUSES,
  DEFAULT_PROJECT_STATUSES,
  isClosedCategory,
  isProjectStatusCategory,
  type IssueStatusDef,
  type ProjectStatusDef,
} from "@/lib/project-status";
import type { TeamWithProjects, UserLite, ProjectOverview, CycleOverview, CycleStatus } from "@/lib/types";
import type { IssueView } from "@/lib/issue-view";

type AuthUser = { id: string; role?: { permissions: string } | null } | null;

function issueInclude(currentUserId?: string) {
  return {
    assignees: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    milestone: { select: { name: true } },
    project: { select: { name: true, team: { select: { identifier: true, isPrivate: true, id: true } } } },
    _count: { select: { comments: true } },
    comments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { userId: true, createdAt: true } },
    lastViews: currentUserId ? { where: { userId: currentUserId }, select: { viewedAt: true } } : false,
  } as const;
}

type RawIssue = {
  id: string;
  title: string;
  status: string;
  priority: string;
  labels: string;
  attachments: string;
  createdAt: Date;
  projectId: string;
  cycleId: string | null;
  assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
  milestone: { name: string } | null;
  project: { name: string; team: { identifier: string; isPrivate: boolean; id: string } };
  _count: { comments: number };
  comments: { userId: string | null; createdAt: Date }[];
  lastViews?: { viewedAt: Date }[] | false;
};

function toIssueView(issue: RawIssue, currentUserId?: string): IssueView {
  const latestComment = issue.comments[0];
  const lastViewedAt = (issue.lastViews || undefined)?.[0]?.viewedAt ?? null;
  const hasNewDiscussion =
    !!latestComment &&
    latestComment.userId !== currentUserId &&
    (!lastViewedAt || latestComment.createdAt > lastViewedAt);

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
    assignees: issue.assignees.map((a) => a.user),
    attachments: parseIssueAttachments(issue.attachments),
    commentCount: issue._count.comments,
    hasNewDiscussion,
  };
}

function cycleStatus(startDate: Date, targetDate: Date): CycleStatus {
  const now = Date.now();
  if (now < startDate.getTime()) return "Upcoming";
  if (now > targetDate.getTime()) return "Completed";
  return "Active";
}

function canSeeAllProjects(user: AuthUser) {
  return can(user, "view_all_teams") || can(user, "view_all_projects");
}

async function visibleTeamIds(user: AuthUser) {
  const teams = await prisma.team.findMany({ include: { members: { select: { userId: true } } } });
  return teams
    .filter((t) => can(user, "view_all_teams") || t.members.some((m) => m.userId === user?.id))
    .map((t) => t.id);
}

export async function getAssignedIssues(userId: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { assignees: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: issueInclude(userId),
  });
  return issues.map((i) => toIssueView(i, userId));
}

export async function getProjectIssues(projectId: string, currentUserId?: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: issueInclude(currentUserId),
  });
  return issues.map((i) => toIssueView(i, currentUserId));
}

export async function getTeamIssues(teamId: string, currentUserId?: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { project: { teamId } },
    orderBy: { createdAt: "desc" },
    include: issueInclude(currentUserId),
  });
  return issues.map((i) => toIssueView(i, currentUserId));
}

export async function getVisibleProjects(user: AuthUser, teamId?: string) {
  const teamIds = teamId ? [teamId] : await visibleTeamIds(user);
  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
      isDraft: false,
      ...(canSeeAllProjects(user) ? {} : { members: { some: { userId: user?.id ?? "" } } }),
    },
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
    where: {
      project: {
        teamId: { in: teamIds },
        ...(canSeeAllProjects(user) ? {} : { members: { some: { userId: user?.id ?? "" } } }),
      },
    },
    orderBy: { createdAt: "desc" },
    include: issueInclude(user?.id),
  });
  return issues.map((i) => toIssueView(i, user?.id));
}

export async function getVisibleTeams(user: AuthUser): Promise<TeamWithProjects[]> {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, teamId: true, status: true, isDraft: true, members: { select: { userId: true } } },
      },
      members: { select: { userId: true } },
      lead: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const seeAllProjects = canSeeAllProjects(user);

  return teams
    .filter((team) => {
      if (!user) return false;
      if (can(user, "view_all_teams")) return true;
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
      projects: team.projects
        .filter((p) => seeAllProjects || p.members.some((m) => m.userId === user?.id))
        .map((p) => ({ id: p.id, name: p.name, teamId: p.teamId, status: p.status, isDraft: p.isDraft })),
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
  const closed = await getClosedIssueStatusNames();
  return cycles.map((c) => ({
    id: c.id,
    teamId: c.teamId,
    number: c.number,
    name: c.name,
    startDate: c.startDate.toISOString(),
    targetDate: c.targetDate.toISOString(),
    status: cycleStatus(c.startDate, c.targetDate),
    issueCount: c.issues.length,
    completedCount: c.issues.filter((i) => closed.has(i.status)).length,
  }));
}

export async function getCycleIssues(cycleId: string, currentUserId?: string): Promise<IssueView[]> {
  const issues = await prisma.issue.findMany({
    where: { cycleId },
    orderBy: { createdAt: "desc" },
    include: issueInclude(currentUserId),
  });
  return issues.map((i) => toIssueView(i, currentUserId));
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

export interface ProjectStatusReportRow {
  id: string;
  name: string;
  status: string;
  priority: string;
  isDraft: boolean;
  team: { id: string; name: string; identifier: string };
  lead: { id: string; name: string; avatarUrl: string | null };
  startDate: string | null;
  targetDate: string | null;
  total: number;
  counts: Record<string, number>;
  progressPct: number;
}

// Backs both report views: project progress (issues done+cancelled / total)
// and the project-by-status breakdown table.
export async function getProjectsStatusReport(user: AuthUser): Promise<ProjectStatusReportRow[]> {
  const teamIds = await visibleTeamIds(user);
  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
      ...(canSeeAllProjects(user) ? {} : { members: { some: { userId: user?.id ?? "" } } }),
    },
    orderBy: { name: "asc" },
    include: {
      team: { select: { id: true, name: true, identifier: true } },
      lead: { select: { id: true, name: true, avatarUrl: true } },
      issues: { select: { status: true } },
    },
  });

  const issueStatuses = await getIssueStatuses();
  const closedNames = new Set(issueStatuses.filter((s) => isClosedCategory(s.category)).map((s) => s.name));

  return projects.map((p) => {
    const counts: Record<string, number> = {};
    for (const s of issueStatuses) counts[s.name] = 0;
    for (const i of p.issues) counts[i.status] = (counts[i.status] ?? 0) + 1;
    const total = p.issues.length;
    const closed = p.issues.filter((i) => closedNames.has(i.status)).length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      isDraft: p.isDraft,
      team: p.team,
      lead: p.lead,
      startDate: p.startDate?.toISOString() ?? null,
      targetDate: p.targetDate?.toISOString() ?? null,
      total,
      counts,
      progressPct: total > 0 ? Math.round((closed / total) * 100) : 0,
    };
  });
}

export interface MemberReportRow {
  id: string;
  name: string;
  email: string;
  bankId: string | null;
  avatarUrl: string | null;
  role: { id: string; name: string } | null;
  teams: string[];
  projectCount: number;
  assignedIssueCount: number;
  createdIssueCount: number;
}

export async function getMembersReport(): Promise<MemberReportRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      bankId: true,
      avatarUrl: true,
      role: { select: { id: true, name: true } },
      teamMemberships: { select: { team: { select: { identifier: true } } } },
      _count: { select: { projectMemberships: true, assignedIssues: true, createdIssues: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    bankId: u.bankId,
    avatarUrl: u.avatarUrl,
    role: u.role,
    teams: u.teamMemberships.map((tm) => tm.team.identifier),
    projectCount: u._count.projectMemberships,
    assignedIssueCount: u._count.assignedIssues,
    createdIssueCount: u._count.createdIssues,
  }));
}

// Project statuses are workspace-wide and database driven. The table is seeded
// with the original five-step lifecycle the first time it's read while empty.
export async function getProjectStatuses(): Promise<ProjectStatusDef[]> {
  let rows = await prisma.projectStatus.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  if (rows.length === 0) {
    await prisma.projectStatus.createMany({ data: DEFAULT_PROJECT_STATUSES });
    rows = await prisma.projectStatus.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  }
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    category: isProjectStatusCategory(r.category) ? r.category : "planned",
    position: r.position,
    isDefault: r.isDefault,
  }));
}

export async function getProjectStatusUsage(): Promise<Record<string, number>> {
  const groups = await prisma.project.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
}

function toStatusDef(r: { id: string; name: string; color: string; category: string; position: number; isDefault: boolean }) {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    category: isProjectStatusCategory(r.category) ? r.category : ("planned" as const),
    position: r.position,
    isDefault: r.isDefault,
  };
}

// Issue workflow statuses (board columns), database driven. Seeded with the
// original five columns the first time the table is read while empty.
export async function getIssueStatuses(): Promise<IssueStatusDef[]> {
  let rows = await prisma.issueStatus.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  if (rows.length === 0) {
    await prisma.issueStatus.createMany({ data: DEFAULT_ISSUE_STATUSES });
    rows = await prisma.issueStatus.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  }
  return rows.map(toStatusDef);
}

export async function getIssueStatusUsage(): Promise<Record<string, number>> {
  const groups = await prisma.issue.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
}

// Names of statuses whose category counts as closed (completed or canceled).
export async function getClosedIssueStatusNames(): Promise<Set<string>> {
  const statuses = await getIssueStatuses();
  return new Set(statuses.filter((s) => isClosedCategory(s.category)).map((s) => s.name));
}
