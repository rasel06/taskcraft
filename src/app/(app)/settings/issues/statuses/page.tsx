import { getCurrentUser, manageableIssueStatusProjectIds } from "@/lib/auth";
import { getVisibleTeams, getIssueStatuses, getIssueStatusUsage } from "@/lib/data";
import { WorkflowStatusesManager } from "@/components/settings/workflow-statuses";
import { IssueStatusProjectPicker } from "@/components/settings/issue-status-project-picker";

export default async function IssueStatusesPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const [{ project: requested }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const teams = await getVisibleTeams(currentUser);
  const projects = teams.flatMap((t) => t.projects.map((p) => ({ id: p.id, name: p.name, teamIdentifier: t.identifier })));
  const manageable = new Set(await manageableIssueStatusProjectIds(projects.map((p) => p.id), currentUser));

  // Default to the first project the user can manage, else the first visible one.
  const selected =
    projects.find((p) => p.id === requested) ?? projects.find((p) => manageable.has(p.id)) ?? projects[0];

  const [statuses, usage] = selected
    ? await Promise.all([getIssueStatuses(selected.id), getIssueStatusUsage(selected.id)])
    : [[], {}];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-semibold text-foreground">Issue Statuses</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Each project has its own issue workflow. The order here is the column order on that project&apos;s board; the
          starred status is given to its new issues. Admins and the project&apos;s lead or admin members can change it,
          here or from the project board&apos;s column headers.
        </p>
      </div>

      {selected ? (
        <>
          <IssueStatusProjectPicker
            value={selected.id}
            projects={projects.map((p) => ({ ...p, canManage: manageable.has(p.id) }))}
          />
          <WorkflowStatusesManager
            key={selected.id}
            kind="issue"
            projectId={selected.id}
            statuses={statuses}
            usage={usage}
            canManage={manageable.has(selected.id)}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">You don&apos;t have access to any projects yet.</p>
      )}
    </div>
  );
}
