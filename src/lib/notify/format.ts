import { prisma } from "@/lib/prisma";
import { boldTg, boldSlack, statusBadge, priorityBadge } from "@/lib/notify/render";

export interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface ChangeText {
  tg: string;
  slack: string;
}

const ISSUE_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  status: "Status",
  priority: "Priority",
  assignees: "Assignees",
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

function splitIds(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

async function resolveUserNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

export async function formatIssueChanges(changes: FieldChange[]): Promise<ChangeText> {
  const userIds = changes
    .filter((c) => c.field === "assignees")
    .flatMap((c) => [...splitIds(c.from), ...splitIds(c.to)]);
  const names = await resolveUserNames(userIds);

  const lines = changes.map((c) => {
    const label = ISSUE_FIELD_LABELS[c.field] ?? c.field;

    if (c.field === "assignees") {
      const toNames = (id: string) => names.get(id) ?? "Unknown";
      const from = splitIds(c.from).map(toNames).join(", ") || "Unassigned";
      const to = splitIds(c.to).map(toNames).join(", ") || "Unassigned";
      return { tg: `${boldTg(label)}: ${from} → ${boldTg(to)}`, slack: `${boldSlack(label)}: ${from} → ${boldSlack(to)}` };
    }
    if (c.field === "status") {
      return { tg: `${boldTg(label)}: ${statusBadge(c.from ?? "—")} → ${boldTg(statusBadge(c.to ?? "—"))}`, slack: `${boldSlack(label)}: ${statusBadge(c.from ?? "—")} → ${boldSlack(statusBadge(c.to ?? "—"))}` };
    }
    if (c.field === "priority") {
      return { tg: `${boldTg(label)}: ${priorityBadge(c.from ?? "—")} → ${boldTg(priorityBadge(c.to ?? "—"))}`, slack: `${boldSlack(label)}: ${priorityBadge(c.from ?? "—")} → ${boldSlack(priorityBadge(c.to ?? "—"))}` };
    }
    if (c.field === "description") {
      return { tg: `${boldTg(label)} updated`, slack: `${boldSlack(label)} updated` };
    }
    return { tg: `${boldTg(label)}: ${c.from ?? "—"} → ${boldTg(c.to ?? "—")}`, slack: `${boldSlack(label)}: ${c.from ?? "—"} → ${boldSlack(c.to ?? "—")}` };
  });

  return { tg: lines.map((l) => l.tg).join("\n"), slack: lines.map((l) => l.slack).join("\n") };
}

export async function formatProjectChanges(changes: FieldChange[]): Promise<ChangeText> {
  const userIds = changes.filter((c) => c.field === "leadId").flatMap((c) => [c.from, c.to].filter((v): v is string => Boolean(v)));
  const names = await resolveUserNames(userIds);

  const lines = changes.map((c) => {
    const label = PROJECT_FIELD_LABELS[c.field] ?? c.field;

    if (c.field === "leadId") {
      const from = c.from ? (names.get(c.from) ?? "Unknown") : "—";
      const to = c.to ? (names.get(c.to) ?? "Unknown") : "—";
      return { tg: `${boldTg(label)}: ${from} → ${boldTg(to)}`, slack: `${boldSlack(label)}: ${from} → ${boldSlack(to)}` };
    }
    if (c.field === "status") {
      return { tg: `${boldTg(label)}: ${statusBadge(c.from ?? "—")} → ${boldTg(statusBadge(c.to ?? "—"))}`, slack: `${boldSlack(label)}: ${statusBadge(c.from ?? "—")} → ${boldSlack(statusBadge(c.to ?? "—"))}` };
    }
    if (c.field === "priority") {
      return { tg: `${boldTg(label)}: ${priorityBadge(c.from ?? "—")} → ${boldTg(priorityBadge(c.to ?? "—"))}`, slack: `${boldSlack(label)}: ${priorityBadge(c.from ?? "—")} → ${boldSlack(priorityBadge(c.to ?? "—"))}` };
    }
    if (c.field === "startDate" || c.field === "targetDate") {
      return { tg: `${boldTg(label)}: ${formatDateValue(c.from)} → ${boldTg(formatDateValue(c.to))}`, slack: `${boldSlack(label)}: ${formatDateValue(c.from)} → ${boldSlack(formatDateValue(c.to))}` };
    }
    if (c.field === "description") {
      return { tg: `${boldTg(label)} updated`, slack: `${boldSlack(label)} updated` };
    }
    return { tg: `${boldTg(label)}: ${c.from ?? "—"} → ${boldTg(c.to ?? "—")}`, slack: `${boldSlack(label)}: ${c.from ?? "—"} → ${boldSlack(c.to ?? "—")}` };
  });

  return { tg: lines.map((l) => l.tg).join("\n"), slack: lines.map((l) => l.slack).join("\n") };
}
