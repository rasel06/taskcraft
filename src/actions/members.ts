"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, destroyAllSessionsForUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isWorkspaceAdmin) throw new Error("Only workspace admins can manage members");
  return user;
}

export async function listMembers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { teamMemberships: { include: { team: true } } },
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
  isWorkspaceAdmin: boolean;
}) {
  await requireAdmin();

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
    data: { name, email, bankId, fileNumber, mobile, passwordHash, isWorkspaceAdmin: input.isWorkspaceAdmin },
  });

  revalidatePath("/settings/members");
  return user;
}

export async function updateMember(
  userId: string,
  input: { name: string; email: string; bankId: string; fileNumber: string; mobile: string; isWorkspaceAdmin: boolean },
) {
  const admin = await requireAdmin();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const bankId = input.bankId.trim();
  const fileNumber = input.fileNumber.trim();
  const mobile = input.mobile.trim();
  if (!name || !email || !bankId || !fileNumber || !mobile) {
    throw new Error("Name, email, bank ID, file number, and mobile are required");
  }

  if (userId === admin.id && !input.isWorkspaceAdmin) {
    const otherAdmins = await prisma.user.count({ where: { isWorkspaceAdmin: true, id: { not: userId } } });
    if (otherAdmins === 0) throw new Error("You are the only workspace admin — promote someone else first");
  }

  await assertUnique("email", email, userId);
  await assertUnique("bankId", bankId, userId);
  await assertUnique("fileNumber", fileNumber, userId);
  await assertUnique("mobile", mobile, userId);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, bankId, fileNumber, mobile, isWorkspaceAdmin: input.isWorkspaceAdmin },
  });

  revalidatePath("/settings/members");
  revalidatePath("/", "layout");
  return user;
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await destroyAllSessionsForUser(userId);
  revalidatePath("/settings/members");
}

export async function deleteMember(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't delete your own account");

  const leadsProjects = await prisma.project.count({ where: { leadId: userId } });
  if (leadsProjects > 0) {
    throw new Error("Reassign their projects to a different lead before deleting this member");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings/members");
  revalidatePath("/", "layout");
}
