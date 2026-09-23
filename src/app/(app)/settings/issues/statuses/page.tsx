import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getIssueStatuses, getIssueStatusUsage } from "@/lib/data";
import { WorkflowStatusesManager } from "@/components/settings/workflow-statuses";

export default async function IssueStatusesPage() {
  const currentUser = await getCurrentUser();
  const [statuses, usage] = await Promise.all([getIssueStatuses(), getIssueStatusUsage()]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-semibold text-foreground">Issue Statuses</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          The workflow issues move through. The order here is the column order on every board; the starred status is
          given to new issues. Columns can also be managed from a board&apos;s column headers.
        </p>
      </div>
      <WorkflowStatusesManager
        kind="issue"
        statuses={statuses}
        usage={usage}
        canManage={can(currentUser, "manage_issue_statuses")}
      />
    </div>
  );
}
