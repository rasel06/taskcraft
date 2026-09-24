import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { can } from "@/lib/permissions";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a database session.
 *
 * Cookie creation is intentionally NOT done here.
 * The login Route Handler owns the HTTP response and is responsible
 * for setting the session cookie.
 */
export async function createSession(userId: string) {
  return prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
}

/**
 * Destroys the current session and removes the session cookie.
 *
 * This remains a Server Action use-case, so cookies() is appropriate here.
 */
export async function destroySession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await prisma.session
      .delete({
        where: { id: sessionId },
      })
      .catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session
        .delete({
          where: { id: session.id },
        })
        .catch(() => {});
    }

    return null;
  }

  return session.user;
}

export async function isTeamMember(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  return !!membership;
}

type AuthUser = {
  id: string;
  role?: {
    permissions: string;
  } | null;
} | null;

export async function requirePermission(key: Parameters<typeof can>[1]) {
  const user = await getCurrentUser();

  if (!user || !can(user, key)) {
    throw new Error("You don't have permission to do this");
  }

  return user;
}

export async function canAccessTeam(teamId: string, user: AuthUser) {
  if (!user) {
    return false;
  }

  if (can(user, "view_all_teams")) {
    return true;
  }

  return isTeamMember(teamId, user.id);
}

// Workspace admins (manage_teams permission) can manage any team;
// everyone else can only manage a team they actually belong to.
export async function canManageTeam(teamId: string, user: AuthUser) {
  if (!user) {
    return false;
  }

  if (can(user, "manage_teams")) {
    return true;
  }

  return isTeamMember(teamId, user.id);
}

export async function requireTeamManage(teamId: string) {
  const user = await getCurrentUser();

  if (!user || !(await canManageTeam(teamId, user))) {
    throw new Error("You don't have permission to manage this team");
  }

  return user;
}

export async function canAccessProject(projectId: string, user: AuthUser) {
  if (!user) {
    return false;
  }

  if (can(user, "view_all_teams") || can(user, "view_all_projects")) {
    return true;
  }

  return isProjectMember(projectId, user.id);
}

export async function isProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return !!membership;
}

// Workspace admins (manage_teams permission) can manage any project;
// everyone else can only manage a project they actually belong to.
export async function canManageProject(projectId: string, user: AuthUser) {
  if (!user) {
    return false;
  }

  if (can(user, "manage_teams")) {
    return true;
  }

  return isProjectMember(projectId, user.id);
}

export async function requireProjectManage(projectId: string) {
  const user = await getCurrentUser();

  if (!user || !(await canManageProject(projectId, user))) {
    throw new Error("You don't have permission to manage this project");
  }

  return user;
}

// A project's issue workflow can be managed by anyone with the workspace
// "manage_issue_statuses" permission, or by that project's lead / ADMIN member.
export async function canManageIssueStatuses(projectId: string, user: AuthUser) {
  if (!user) return false;
  if (can(user, "manage_issue_statuses")) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { leadId: true, members: { where: { userId: user.id }, select: { role: true } } },
  });
  if (!project) return false;
  return project.leadId === user.id || project.members.some((m) => m.role === "ADMIN");
}

// Project ids (among `projectIds`) whose issue workflow `user` can manage.
export async function manageableIssueStatusProjectIds(projectIds: string[], user: AuthUser): Promise<string[]> {
  if (!user || projectIds.length === 0) return [];
  if (can(user, "manage_issue_statuses")) return projectIds;

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
      OR: [{ leadId: user.id }, { members: { some: { userId: user.id, role: "ADMIN" } } }],
    },
    select: { id: true },
  });
  return projects.map((p) => p.id);
}

export interface IssueEditAccess {
  canEdit: boolean;
  reason: string | null;
}

// Who may edit an issue:
// - a workspace admin (manage_teams permission, same marker as canManageProject),
// - the project's lead or the leader of the project's team,
// - the issue's creator, but only until someone else has posted in its discussion.
export async function getIssueEditAccess(issueId: string, user: AuthUser): Promise<IssueEditAccess> {
  if (!user) return { canEdit: false, reason: "Not signed in" };

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { creatorId: true, project: { select: { leadId: true, team: { select: { leadId: true } } } } },
  });
  if (!issue) return { canEdit: false, reason: "Issue not found" };

  if (can(user, "manage_teams")) return { canEdit: true, reason: null };
  if (issue.project.leadId === user.id || issue.project.team.leadId === user.id) return { canEdit: true, reason: null };

  if (issue.creatorId && issue.creatorId === user.id) {
    // Comments from anyone other than the creator (including deleted users) lock it.
    const othersInDiscussion = await prisma.issueComment.count({
      where: { issueId, OR: [{ userId: { not: user.id } }, { userId: null }] },
    });
    if (othersInDiscussion === 0) return { canEdit: true, reason: null };
    return {
      canEdit: false,
      reason: "The discussion has started, so only the project/team lead or an admin can edit this issue now.",
    };
  }

  return {
    canEdit: false,
    reason: "Only the issue's creator (before others join the discussion), the project/team lead or an admin can edit this issue.",
  };
}

export async function requireIssueEdit(issueId: string) {
  const user = await getCurrentUser();
  const access = await getIssueEditAccess(issueId, user);
  if (!access.canEdit) throw new Error(access.reason ?? "You can't edit this issue");
  return user;
}
