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

export async function createSession(userId: string) {
  const session = await prisma.session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { include: { role: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function isTeamMember(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return !!membership;
}

type AuthUser = { id: string; role?: { permissions: string } | null } | null;

export async function requirePermission(key: Parameters<typeof can>[1]) {
  const user = await getCurrentUser();
  if (!user || !can(user, key)) throw new Error("You don't have permission to do this");
  return user;
}

export async function canAccessTeam(teamId: string, user: AuthUser) {
  if (!user) return false;
  if (can(user, "view_all_teams")) return true;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return false;
  if (!team.isPrivate) return true;
  return isTeamMember(teamId, user.id);
}

// Workspace admins (manage_teams permission) can manage any team; everyone
// else can only manage a team they actually belong to.
export async function canManageTeam(teamId: string, user: AuthUser) {
  if (!user) return false;
  if (can(user, "manage_teams")) return true;
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
  if (!user) return false;
  if (can(user, "view_all_teams")) return true;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { team: true } });
  if (!project) return false;
  if (!project.team.isPrivate) return true;
  return isTeamMember(project.teamId, user.id);
}
