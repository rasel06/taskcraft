"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword, destroyAllSessionsForUser } from "@/lib/auth";

export async function updateProfile(userId: string, input: { name: string; avatarUrl?: string | null }) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, avatarUrl: input.avatarUrl ?? null },
  });
  revalidatePath("/", "layout");
  return user;
}

export async function changeOwnPassword(input: { currentPassword: string; newPassword: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  if (input.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await destroyAllSessionsForUser(user.id);
  revalidatePath("/settings/security");
}
