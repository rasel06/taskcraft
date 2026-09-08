"use client";

import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { updateProject } from "@/actions/projects";
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";

const STATUS_DOT: Record<string, string> = {
  Backlog: "bg-zinc-600",
  Planned: "bg-zinc-400",
  Active: "bg-indigo-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-red-700",
};

export function ProjectHeaderControls({
  projectId,
  status,
  priority,
}: {
  projectId: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={async (v) => {
          await updateProject(projectId, { status: v });
          router.refresh();
        }}
      >
        <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status] ?? "bg-zinc-600"}`} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROJECT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={priority}
        onValueChange={async (v) => {
          await updateProject(projectId, { priority: v });
          router.refresh();
        }}
      >
        <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
          <PriorityIcon priority={priority} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
