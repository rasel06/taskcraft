import { prisma } from "@/lib/prisma";

export interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

const ISSUE_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assigneeId: "Assignee",
  milestoneId: "Milestone",
  cycleId: "Cycle",
  labels: "Labels",
};

const PROJECT_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  status: "Status",
  priority: "Priority",
  leadId: "Lead",
  startDate: "Start date",
  targetDate: "Target date",
};

function formatDateValue(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function resolveUserNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

export async function formatIssueChanges(changes: FieldChange[]): Promise<string> {
  const userIds = changes.filter((c) => c.field === "assigneeId").flatMap((c) => [c.from, c.to].filter((v): v is string => Boolean(v)));
  const names = await resolveUserNames(userIds);

  return changes
    .map((c) => {
      const label = ISSUE_FIELD_LABELS[c.field] ?? c.field;
      if (c.field === "assigneeId") {
        const from = c.from ? (names.get(c.from) ?? "Unknown") : "Unassigned";
        const to = c.to ? (names.get(c.to) ?? "Unknown") : "Unassigned";
        return `${label}: ${from} → ${to}`;
      }
      if (c.field === "description") return `${label} updated`;
      return `${label}: ${c.from ?? "—"} → ${c.to ?? "—"}`;
    })
    .join("\n");
}

export async function formatProjectChanges(changes: FieldChange[]): Promise<string> {
  const userIds = changes.filter((c) => c.field === "leadId").flatMap((c) => [c.from, c.to].filter((v): v is string => Boolean(v)));
  const names = await resolveUserNames(userIds);

  return changes
    .map((c) => {
      const label = PROJECT_FIELD_LABELS[c.field] ?? c.field;
      if (c.field === "leadId") {
        const from = c.from ? (names.get(c.from) ?? "Unknown") : "—";
        const to = c.to ? (names.get(c.to) ?? "Unknown") : "—";
        return `${label}: ${from} → ${to}`;
      }
      if (c.field === "startDate" || c.field === "targetDate") return `${label}: ${formatDateValue(c.from)} → ${formatDateValue(c.to)}`;
      if (c.field === "description") return `${label} updated`;
      return `${label}: ${c.from ?? "—"} → ${c.to ?? "—"}`;
    })
    .join("\n");
}
