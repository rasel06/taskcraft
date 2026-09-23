import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProjectStatuses, getProjectStatusUsage } from "@/lib/data";
import { WorkflowStatusesManager } from "@/components/settings/workflow-statuses";

export default async function ProjectStatusesPage() {
  const currentUser = await getCurrentUser();
  const [statuses, usage] = await Promise.all([getProjectStatuses(), getProjectStatusUsage()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-semibold text-foreground">Project Statuses</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          The status lifecycle every project moves through, in order. The starred status is given to new projects.
        </p>
      </div>
      <WorkflowStatusesManager
        kind="project"
        statuses={statuses}
        usage={usage}
        canManage={can(currentUser, "manage_project_statuses")}
      />
    </div>
  );
}
