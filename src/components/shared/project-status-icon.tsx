import { Circle, CircleDot, CircleCheck, CircleSlash, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatusDef, ProjectStatusCategory } from "@/lib/project-status";

const CATEGORY_ICON: Record<ProjectStatusCategory, typeof Circle> = {
  backlog: CircleDashed,
  planned: Circle,
  started: CircleDot,
  completed: CircleCheck,
  canceled: CircleSlash,
};

// Icon for a database-driven project status: shape from its category, color
// from its configured hex. Unknown names (e.g. a status deleted meanwhile)
// fall back to a gray dashed circle.
export function ProjectStatusIcon({
  status,
  statuses,
  className,
}: {
  status: string | ProjectStatusDef;
  statuses?: ProjectStatusDef[];
  className?: string;
}) {
  const def = typeof status === "string" ? statuses?.find((s) => s.name === status) : status;
  const Icon = def ? CATEGORY_ICON[def.category] : CircleDashed;
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", !def && "text-muted-foreground", className)}
      style={def ? { color: def.color } : undefined}
      strokeWidth={2.25}
    />
  );
}
