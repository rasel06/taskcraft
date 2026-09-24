"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentUser, canManageIssueStatuses } from "@/lib/auth";
import { isHexColor, isProjectStatusCategory, type StatusKind } from "@/lib/project-status";
import type { Prisma } from "@prisma/client";

// Project and issue statuses are two tables with the same shape; these actions
// serve both. Project statuses are workspace-wide; issue statuses belong to one
// project, so every issue call carries that `projectId`. Project.status /
// Issue.status store the status *name*, so renames and deletes cascade to the
// owning rows here.

interface StatusInput {
  name: string;
  color: string;
  category: string;
}

const LABEL = { project: "project", issue: "issue" } as const;

function assertKind(kind: string): asserts kind is StatusKind {
  if (kind !== "project" && kind !== "issue") throw new Error("Unknown status type");
}

type Tx = Prisma.TransactionClient | typeof prisma;

// Both delegates share a shape; IssueStatus only adds `projectId`, so type them
// as the issue one. `scopeWhere` only ever adds projectId for issue statuses.
function statusTable(kind: StatusKind, tx: Tx = prisma) {
  return (kind === "issue" ? tx.issueStatus : tx.projectStatus) as unknown as Tx["issueStatus"];
}

interface Scope {
  kind: StatusKind;
  // Set for issue statuses (the owning project); null for project statuses.
  projectId: string | null;
}

// Row filter for the status table within a scope.
function scopeWhere(scope: Scope): { projectId?: string } {
  return scope.projectId ? { projectId: scope.projectId } : {};
}

function moveOwners(scope: Scope, tx: Tx, from: string, to: string) {
  if (scope.kind === "issue") {
    return tx.issue.updateMany({ where: { projectId: scope.projectId!, status: from }, data: { status: to } });
  }
  return tx.project.updateMany({ where: { status: from }, data: { status: to } });
}

function countOwners(scope: Scope, name: string) {
  if (scope.kind === "issue") return prisma.issue.count({ where: { projectId: scope.projectId!, status: name } });
  return prisma.project.count({ where: { status: name } });
}

async function authorize(kind: string, projectId?: string | null): Promise<Scope> {
  assertKind(kind);
  if (kind === "project") {
    await requirePermission("manage_project_statuses");
    return { kind, projectId: null };
  }
  if (!projectId) throw new Error("Project is required");
  const user = await getCurrentUser();
  if (!(await canManageIssueStatuses(projectId, user))) {
    throw new Error("Only an admin or this project's lead/admin can manage its statuses");
  }
  return { kind, projectId };
}

// Fetch a status and make sure it belongs to the scope being edited.
async function findInScope(scope: Scope, id: string) {
  const row = await statusTable(scope.kind).findFirst({ where: { id, ...scopeWhere(scope) } });
  if (!row) throw new Error("Status not found");
  return row;
}

function validate(input: StatusInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Status name is required");
  if (name.length > 40) throw new Error("Status name must be 40 characters or fewer");
  if (!isHexColor(input.color)) throw new Error("Pick a valid color");
  if (!isProjectStatusCategory(input.category)) throw new Error("Pick a valid category");
  return { name, color: input.color.toLowerCase(), category: input.category };
}

async function assertNameFree(scope: Scope, name: string, exceptId?: string) {
  // Case-insensitive uniqueness, done in JS so it behaves the same on SQLite and Postgres.
  const all = await statusTable(scope.kind).findMany({ where: scopeWhere(scope), select: { id: true, name: true } });
  if (all.some((s) => s.id !== exceptId && s.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A ${LABEL[scope.kind]} status named "${name}" already exists${scope.projectId ? " in this project" : ""}`);
  }
}

function revalidate(scope: Scope) {
  revalidatePath("/settings/projects/statuses");
  revalidatePath("/", "layout");
}

export async function createStatus(kindArg: StatusKind, input: StatusInput, projectId?: string | null) {
  // Issue statuses come from the preset library (issue-status-presets.ts);
  // names, colors and categories are edited there, not per project.
  if (kindArg === "issue") throw new Error("Issue statuses are managed from the status presets");
  const scope = await authorize(kindArg, projectId);
  const data = validate(input);
  await assertNameFree(scope, data.name);

  const last = await statusTable(scope.kind).findFirst({
    where: scopeWhere(scope),
    orderBy: { position: "desc" },
    select: { position: true },
  });
  // projectId is present exactly when the table has that column (issue statuses).
  const createData = { ...data, ...scopeWhere(scope), position: (last?.position ?? -1) + 1 };
  const status = await statusTable(scope.kind).create({ data: createData as Prisma.IssueStatusUncheckedCreateInput });
  revalidate(scope);
  return status;
}

export async function updateStatus(kindArg: StatusKind, id: string, input: StatusInput, projectId?: string | null) {
  // Issue statuses come from the preset library (issue-status-presets.ts);
  // names, colors and categories are edited there, not per project.
  if (kindArg === "issue") throw new Error("Issue statuses are managed from the status presets");
  const scope = await authorize(kindArg, projectId);
  const data = validate(input);
  const before = await findInScope(scope, id);
  await assertNameFree(scope, data.name, id);

  const status = await prisma.$transaction(async (tx) => {
    const updated = await statusTable(scope.kind, tx).update({ where: { id }, data });
    if (before.name !== data.name) await moveOwners(scope, tx, before.name, data.name);
    return updated;
  });
  revalidate(scope);
  return status;
}

export async function setDefaultStatus(kindArg: StatusKind, id: string, projectId?: string | null) {
  const scope = await authorize(kindArg, projectId);
  await findInScope(scope, id);

  await prisma.$transaction(async (tx) => {
    await statusTable(scope.kind, tx).updateMany({ where: { ...scopeWhere(scope), isDefault: true }, data: { isDefault: false } });
    await statusTable(scope.kind, tx).update({ where: { id }, data: { isDefault: true } });
  });
  revalidate(scope);
}

export async function reorderStatuses(kindArg: StatusKind, orderedIds: string[], projectId?: string | null) {
  const scope = await authorize(kindArg, projectId);
  const existing = await statusTable(scope.kind).findMany({ where: scopeWhere(scope), select: { id: true } });
  const known = new Set(existing.map((s) => s.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) {
    throw new Error("Status list is out of date, refresh and try again");
  }

  await prisma.$transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await statusTable(scope.kind, tx).update({ where: { id }, data: { position } });
    }
  });
  revalidate(scope);
}

// Rows on the deleted status are moved to `replacementId` so none are left
// pointing at a status that no longer exists.
export async function deleteStatus(
  kindArg: StatusKind,
  id: string,
  replacementId?: string | null,
  projectId?: string | null,
) {
  const scope = await authorize(kindArg, projectId);
  const target = await findInScope(scope, id);
  if (target.isDefault) throw new Error("Make another status the default before deleting this one");

  const total = await statusTable(scope.kind).count({ where: scopeWhere(scope) });
  if (total <= 1) throw new Error("At least one status is required");

  const inUse = await countOwners(scope, target.name);
  let replacementName: string | null = null;
  if (inUse > 0) {
    if (!replacementId || replacementId === id) throw new Error(`Choose a status to move existing ${LABEL[scope.kind]}s to`);
    const replacement = await findInScope(scope, replacementId).catch(() => null);
    if (!replacement) throw new Error("Replacement status not found");
    replacementName = replacement.name;
  }

  await prisma.$transaction(async (tx) => {
    if (replacementName) await moveOwners(scope, tx, target.name, replacementName);
    await statusTable(scope.kind, tx).delete({ where: { id } });
  });
  revalidate(scope);
  return { moved: inUse, to: replacementName };
}
