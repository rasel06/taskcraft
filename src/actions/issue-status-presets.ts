"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { isHexColor, isProjectStatusCategory } from "@/lib/project-status";

// The workspace issue-status preset library and adding presets to a project's
// workflow. Everything here is admin-only ("manage_issue_statuses"). Removing,
// reordering and choosing the default within a project use the generic status
// actions in ./statuses.ts.

interface PresetInput {
  name: string;
  color: string;
  category: string;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function validate(input: PresetInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Status name is required");
  if (name.length > 40) throw new Error("Status name must be 40 characters or fewer");
  if (!isHexColor(input.color)) throw new Error("Pick a valid color");
  if (!isProjectStatusCategory(input.category)) throw new Error("Pick a valid category");
  return { name, color: input.color.toLowerCase(), category: input.category };
}

async function assertPresetNameFree(name: string, exceptId?: string) {
  const all = await prisma.issueStatusPreset.findMany({ select: { id: true, name: true } });
  if (all.some((p) => p.id !== exceptId && same(p.name, name))) throw new Error(`A status named "${name}" already exists`);
}

function revalidate() {
  revalidatePath("/settings/projects/statuses");
  revalidatePath("/", "layout");
}

export async function createIssueStatusPreset(input: PresetInput) {
  await requirePermission("manage_issue_statuses");
  const data = validate(input);
  await assertPresetNameFree(data.name);
  const last = await prisma.issueStatusPreset.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
  const preset = await prisma.issueStatusPreset.create({ data: { ...data, position: (last?.position ?? -1) + 1 } });
  revalidate();
  return preset;
}

// Edits carry over to every project using the preset; a rename also renames
// the status on those projects' issues.
export async function updateIssueStatusPreset(id: string, input: PresetInput) {
  await requirePermission("manage_issue_statuses");
  const data = validate(input);
  const before = await prisma.issueStatusPreset.findUnique({ where: { id }, include: { statuses: true } });
  if (!before) throw new Error("Status not found");
  await assertPresetNameFree(data.name, id);

  const renamed = before.name !== data.name;
  if (renamed) {
    const clash = await prisma.issueStatus.findFirst({
      where: {
        projectId: { in: before.statuses.map((s) => s.projectId) },
        presetId: { not: id },
        name: data.name,
      },
      select: { project: { select: { name: true } } },
    });
    if (clash) throw new Error(`Project "${clash.project.name}" already has a status named "${data.name}"`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueStatusPreset.update({ where: { id }, data });
    for (const status of before.statuses) {
      await tx.issueStatus.update({ where: { id: status.id }, data });
      if (renamed) {
        await tx.issue.updateMany({
          where: { projectId: status.projectId, status: status.name },
          data: { status: data.name },
        });
      }
    }
  });
  revalidate();
}

export async function deleteIssueStatusPreset(id: string) {
  await requirePermission("manage_issue_statuses");
  const inUse = await prisma.issueStatus.count({ where: { presetId: id } });
  if (inUse > 0) {
    throw new Error(`Used by ${inUse} project${inUse === 1 ? "" : "s"}. Remove it from their workflows first.`);
  }
  await prisma.issueStatusPreset.delete({ where: { id } });
  revalidate();
}

export async function reorderIssueStatusPresets(orderedIds: string[]) {
  await requirePermission("manage_issue_statuses");
  const existing = await prisma.issueStatusPreset.findMany({ select: { id: true } });
  const known = new Set(existing.map((p) => p.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) {
    throw new Error("Status list is out of date, refresh and try again");
  }
  await prisma.$transaction(
    orderedIds.map((id, position) => prisma.issueStatusPreset.update({ where: { id }, data: { position } })),
  );
  revalidate();
}

export async function setIssueStatusPresetPreselected(id: string, preselected: boolean) {
  await requirePermission("manage_issue_statuses");
  await prisma.issueStatusPreset.update({ where: { id }, data: { preselected } });
  revalidate();
}

// Add a preset to a project's workflow, as the last column.
export async function addIssueStatusPresetToProject(projectId: string, presetId: string) {
  await requirePermission("manage_issue_statuses");
  const [preset, project] = await Promise.all([
    prisma.issueStatusPreset.findUnique({ where: { id: presetId } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
  ]);
  if (!preset) throw new Error("Status not found");
  if (!project) throw new Error("Project not found");

  const existing = await prisma.issueStatus.findMany({ where: { projectId }, select: { name: true, presetId: true, position: true } });
  if (existing.some((s) => s.presetId === presetId || same(s.name, preset.name))) {
    throw new Error(`"${preset.name}" is already in this project`);
  }
  await prisma.issueStatus.create({
    data: {
      projectId,
      presetId,
      name: preset.name,
      color: preset.color,
      category: preset.category,
      position: Math.max(-1, ...existing.map((s) => s.position)) + 1,
      isDefault: existing.length === 0,
    },
  });
  revalidate();
}
