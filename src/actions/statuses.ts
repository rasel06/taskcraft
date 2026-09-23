"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { isHexColor, isProjectStatusCategory, type StatusKind } from "@/lib/project-status";
import type { Prisma } from "@prisma/client";

// Project and issue statuses are two tables with the same shape; these actions
// serve both. Project.status / Issue.status store the status *name*, so renames
// and deletes cascade to the owning rows here.

interface StatusInput {
  name: string;
  color: string;
  category: string;
}

const PERMISSION = {
  project: "manage_project_statuses",
  issue: "manage_issue_statuses",
} as const;

const LABEL = { project: "project", issue: "issue" } as const;

function assertKind(kind: string): asserts kind is StatusKind {
  if (kind !== "project" && kind !== "issue") throw new Error("Unknown status type");
}

type Tx = Prisma.TransactionClient | typeof prisma;

// Both delegates have identical signatures, so treat them as the project one.
function statusTable(kind: StatusKind, tx: Tx = prisma) {
  return (kind === "issue" ? tx.issueStatus : tx.projectStatus) as unknown as Tx["projectStatus"];
}

function moveOwners(kind: StatusKind, tx: Tx, from: string, to: string) {
  if (kind === "issue") return tx.issue.updateMany({ where: { status: from }, data: { status: to } });
  return tx.project.updateMany({ where: { status: from }, data: { status: to } });
}

function countOwners(kind: StatusKind, name: string) {
  if (kind === "issue") return prisma.issue.count({ where: { status: name } });
  return prisma.project.count({ where: { status: name } });
}

async function authorize(kind: string) {
  assertKind(kind);
  await requirePermission(PERMISSION[kind]);
  return kind;
}

function validate(input: StatusInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Status name is required");
  if (name.length > 40) throw new Error("Status name must be 40 characters or fewer");
  if (!isHexColor(input.color)) throw new Error("Pick a valid color");
  if (!isProjectStatusCategory(input.category)) throw new Error("Pick a valid category");
  return { name, color: input.color.toLowerCase(), category: input.category };
}

async function assertNameFree(kind: StatusKind, name: string, exceptId?: string) {
  // Case-insensitive uniqueness, done in JS so it behaves the same on SQLite and Postgres.
  const all = await statusTable(kind).findMany({ select: { id: true, name: true } });
  if (all.some((s) => s.id !== exceptId && s.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A ${LABEL[kind]} status named "${name}" already exists`);
  }
}

function revalidate(kind: StatusKind) {
  revalidatePath(kind === "issue" ? "/settings/issues/statuses" : "/settings/projects/statuses");
  revalidatePath("/", "layout");
}

export async function createStatus(kindArg: StatusKind, input: StatusInput) {
  const kind = await authorize(kindArg);
  const data = validate(input);
  await assertNameFree(kind, data.name);

  const last = await statusTable(kind).findFirst({ orderBy: { position: "desc" }, select: { position: true } });
  const status = await statusTable(kind).create({ data: { ...data, position: (last?.position ?? -1) + 1 } });
  revalidate(kind);
  return status;
}

export async function updateStatus(kindArg: StatusKind, id: string, input: StatusInput) {
  const kind = await authorize(kindArg);
  const data = validate(input);
  const before = await statusTable(kind).findUnique({ where: { id } });
  if (!before) throw new Error("Status not found");
  await assertNameFree(kind, data.name, id);

  const status = await prisma.$transaction(async (tx) => {
    const updated = await statusTable(kind, tx).update({ where: { id }, data });
    if (before.name !== data.name) await moveOwners(kind, tx, before.name, data.name);
    return updated;
  });
  revalidate(kind);
  return status;
}

export async function setDefaultStatus(kindArg: StatusKind, id: string) {
  const kind = await authorize(kindArg);
  const target = await statusTable(kind).findUnique({ where: { id } });
  if (!target) throw new Error("Status not found");

  await prisma.$transaction(async (tx) => {
    await statusTable(kind, tx).updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    await statusTable(kind, tx).update({ where: { id }, data: { isDefault: true } });
  });
  revalidate(kind);
}

export async function reorderStatuses(kindArg: StatusKind, orderedIds: string[]) {
  const kind = await authorize(kindArg);
  const existing = await statusTable(kind).findMany({ select: { id: true } });
  const known = new Set(existing.map((s) => s.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) {
    throw new Error("Status list is out of date, refresh and try again");
  }

  await prisma.$transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await statusTable(kind, tx).update({ where: { id }, data: { position } });
    }
  });
  revalidate(kind);
}

// Rows on the deleted status are moved to `replacementId` so none are left
// pointing at a status that no longer exists.
export async function deleteStatus(kindArg: StatusKind, id: string, replacementId?: string | null) {
  const kind = await authorize(kindArg);
  const target = await statusTable(kind).findUnique({ where: { id } });
  if (!target) throw new Error("Status not found");
  if (target.isDefault) throw new Error("Make another status the default before deleting this one");

  const total = await statusTable(kind).count();
  if (total <= 1) throw new Error("At least one status is required");

  const inUse = await countOwners(kind, target.name);
  let replacementName: string | null = null;
  if (inUse > 0) {
    if (!replacementId || replacementId === id) throw new Error(`Choose a status to move existing ${LABEL[kind]}s to`);
    const replacement = await statusTable(kind).findUnique({ where: { id: replacementId } });
    if (!replacement) throw new Error("Replacement status not found");
    replacementName = replacement.name;
  }

  await prisma.$transaction(async (tx) => {
    if (replacementName) await moveOwners(kind, tx, target.name, replacementName);
    await statusTable(kind, tx).delete({ where: { id } });
  });
  revalidate(kind);
  return { moved: inUse, to: replacementName };
}
