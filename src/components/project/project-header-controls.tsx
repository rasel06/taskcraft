"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { updateProject } from "@/actions/projects";
import { PRIORITIES } from "@/lib/constants";
import { ProjectStatusIcon } from "@/components/shared/project-status-icon";
import type { ProjectStatusDef } from "@/lib/project-status";

export function ProjectHeaderControls({
  projectId,
  status,
  priority,
  statuses,
}: {
  projectId: string;
  status: string;
  priority: string;
  statuses: ProjectStatusDef[];
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={async (v) => {
          try {
            await updateProject(projectId, { status: v });
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update status");
          }
        }}
      >
        <SelectTrigger className="h-7 w-auto gap-1.5 text-xs">
          <ProjectStatusIcon status={status} statuses={statuses} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.name} icon={<ProjectStatusIcon status={s} />}>
              {s.name}
            </SelectItem>
          ))}
          {/* Keep a project's current status selectable even if it was removed from settings. */}
          {!statuses.some((s) => s.name === status) && (
            <SelectItem value={status} icon={<ProjectStatusIcon status={status} />}>
              {status}
            </SelectItem>
          )}
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
