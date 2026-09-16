"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

const VALID_KEYS = new Set(PERMISSIONS.map((p) => p.key));

function sanitizePermissions(keys: string[]): PermissionKey[] {
  return Array.from(new Set(keys.filter((k) => VALID_KEYS.has(k as PermissionKey)))) as PermissionKey[];
}

export async function createRole(input: { name: string; permissions: string[] }) {
  await requirePermission("manage_roles");

  const name = input.name.trim();
  if (!name) throw new Error("Role name is required");

  const existing = await prisma.workspaceRole.findUnique({ where: { name } });
  if (existing) throw new Error(`A role named "${name}" already exists`);

  const role = await prisma.workspaceRole.create({
    data: { name, permissions: sanitizePermissions(input.permissions).join(",") },
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function updateRole(roleId: string, input: { name?: string; permissions?: string[] }) {
  await requirePermission("manage_roles");

  const data: { name?: string; permissions?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Role name is required");
    const existing = await prisma.workspaceRole.findFirst({ where: { name, id: { not: roleId } } });
    if (existing) throw new Error(`A role named "${name}" already exists`);
    data.name = name;
  }
  if (input.permissions !== undefined) {
    data.permissions = sanitizePermissions(input.permissions).join(",");
  }

  const role = await prisma.workspaceRole.update({ where: { id: roleId }, data });
  revalidatePath("/settings/roles");
  revalidatePath("/members");
  revalidatePath("/", "layout");
  return role;
}

export async function deleteRole(roleId: string) {
  await requirePermission("manage_roles");

  const role = await prisma.workspaceRole.findUnique({ where: { id: roleId }, include: { _count: { select: { users: true } } } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Built-in roles can't be deleted");
  if (role._count.users > 0) throw new Error("Reassign members off this role before deleting it");

  await prisma.workspaceRole.delete({ where: { id: roleId } });
  revalidatePath("/settings/roles");
}
