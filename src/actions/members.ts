"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, hashPassword, destroyAllSessionsForUser } from "@/lib/auth";
import { parsePermissions } from "@/lib/permissions";

async function requireManageMembers() {
  return requirePermission("manage_members");
}

async function hasOtherMemberManager(excludeUserId: string) {
  const roles = await prisma.workspaceRole.findMany({ select: { id: true, permissions: true } });
  const managerRoleIds = roles.filter((r) => parsePermissions(r.permissions).includes("manage_members")).map((r) => r.id);
  if (managerRoleIds.length === 0) return false;
  const count = await prisma.user.count({ where: { roleId: { in: managerRoleIds }, id: { not: excludeUserId } } });
  return count > 0;
}

export async function listMembers() {
  await requireManageMembers();
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { teamMemberships: { include: { team: true } }, role: true },
  });
}

const UNIQUE_FIELD_LABELS: Record<string, string> = {
  email: "email",
  bankId: "bank ID",
  fileNumber: "file number",
  mobile: "mobile number",
};

async function assertUnique(field: "email" | "bankId" | "fileNumber" | "mobile", value: string, excludeUserId?: string) {
  const existing = await prisma.user.findFirst({
    where: { [field]: value, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
  });
  if (existing) throw new Error(`Another member already uses this ${UNIQUE_FIELD_LABELS[field]}`);
}

export async function createMember(input: {
  name: string;
  email: string;
  bankId: string;
  fileNumber: string;
  mobile: string;
  password: string;
  roleId: string | null;
}) {
  await requireManageMembers();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const bankId = input.bankId.trim();
  const fileNumber = input.fileNumber.trim();
  const mobile = input.mobile.trim();
  if (!name || !email || !bankId || !fileNumber || !mobile) {
    throw new Error("Name, email, bank ID, file number, and mobile are required");
  }
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters");

  await assertUnique("email", email);
  await assertUnique("bankId", bankId);
  await assertUnique("fileNumber", fileNumber);
  await assertUnique("mobile", mobile);

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name, email, bankId, fileNumber, mobile, passwordHash, roleId: input.roleId },
  });

  revalidatePath("/settings/members");
  return user;
}

export async function updateMember(
  userId: string,
  input: { name: string; email: string; bankId: string; fileNumber: string; mobile: string; roleId: string | null },
) {
  const admin = await requireManageMembers();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const bankId = input.bankId.trim();
  const fileNumber = input.fileNumber.trim();
  const mobile = input.mobile.trim();
  if (!name || !email || !bankId || !fileNumber || !mobile) {
    throw new Error("Name, email, bank ID, file number, and mobile are required");
  }

  if (userId === admin.id) {
    const newRole = input.roleId ? await prisma.workspaceRole.findUnique({ where: { id: input.roleId } }) : null;
    const keepsManageMembers = newRole ? parsePermissions(newRole.permissions).includes("manage_members") : false;
    if (!keepsManageMembers && !(await hasOtherMemberManager(userId))) {
      throw new Error("You're the only member who can manage members — assign that role to someone else first");
    }
  }

  await assertUnique("email", email, userId);
  await assertUnique("bankId", bankId, userId);
  await assertUnique("fileNumber", fileNumber, userId);
  await assertUnique("mobile", mobile, userId);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, bankId, fileNumber, mobile, roleId: input.roleId },
  });

  revalidatePath("/settings/members");
  revalidatePath("/", "layout");
  return user;
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  await requireManageMembers();
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await destroyAllSessionsForUser(userId);
  revalidatePath("/settings/members");
}

export async function deleteMember(userId: string) {
  const admin = await requireManageMembers();
  if (userId === admin.id) throw new Error("You can't delete your own account");

  const leadsProjects = await prisma.project.count({ where: { leadId: userId } });
  if (leadsProjects > 0) {
    throw new Error("Reassign their projects to a different lead before deleting this member");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings/members");
  revalidatePath("/", "layout");
}
