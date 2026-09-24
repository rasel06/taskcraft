import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  getVisibleTeams,
  getProjectStatuses,
  getProjectStatusUsage,
  getIssueStatusPresets,
  getIssueStatusPresetUsage,
  getIssueStatusesByProject,
  getIssueStatusUsage,
} from "@/lib/data";
import { WorkflowStatusesManager } from "@/components/settings/workflow-statuses";
import { IssueStatusPresetLibrary, ProjectWorkflowEditor } from "@/components/settings/issue-workflow";
import { IssueStatusProjectPicker } from "@/components/settings/issue-status-project-picker";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "workflows", label: "Project workflows", hint: "Which issue statuses each project uses, and their order" },
  { key: "presets", label: "Status presets", hint: "The library of issue statuses projects choose from" },
  { key: "lifecycle", label: "Project lifecycle", hint: "The statuses a project itself moves through" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default async function ProjectStatusesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; project?: string }>;
}) {
  const [{ tab: tabParam, project: requested }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : "workflows";
  const canManageIssue = can(currentUser, "manage_issue_statuses");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-semibold text-foreground">Statuses</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Issue statuses are chosen per project from a shared preset library. Only admins can change them.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border" aria-label="Status settings">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/settings/projects/statuses?tab=${t.key}`}
            title={t.hint}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t.key
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "workflows" && <WorkflowsTab requested={requested} canManage={canManageIssue} user={currentUser} />}
      {tab === "presets" && <PresetsTab canManage={canManageIssue} />}
      {tab === "lifecycle" && <LifecycleTab canManage={can(currentUser, "manage_project_statuses")} />}
    </div>
  );
}

async function WorkflowsTab({
  requested,
  canManage,
  user,
}: {
  requested?: string;
  canManage: boolean;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const teams = await getVisibleTeams(user);
  const projects = teams.flatMap((t) => t.projects.map((p) => ({ id: p.id, name: p.name, teamIdentifier: t.identifier })));
  if (projects.length === 0) return <p className="text-sm text-muted-foreground">You don&apos;t have access to any projects yet.</p>;

  const byProject = await getIssueStatusesByProject(projects.map((p) => p.id));
  const selected = projects.find((p) => p.id === requested) ?? projects[0];
  const [presets, usage] = await Promise.all([getIssueStatusPresets(), getIssueStatusUsage(selected.id)]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <IssueStatusProjectPicker
          value={selected.id}
          projects={projects.map((p) => ({ ...p, statusCount: byProject[p.id]?.length ?? 0 }))}
        />
        <span className="text-xs text-faint-foreground">The order here is the column order on the project&apos;s board.</span>
      </div>
      <ProjectWorkflowEditor
        key={selected.id}
        projectId={selected.id}
        statuses={byProject[selected.id] ?? []}
        presets={presets}
        usage={usage}
        canManage={canManage}
      />
    </div>
  );
}

async function PresetsTab({ canManage }: { canManage: boolean }) {
  const [presets, usage] = await Promise.all([getIssueStatusPresets(), getIssueStatusPresetUsage()]);
  return <IssueStatusPresetLibrary presets={presets} usage={usage} canManage={canManage} />;
}

async function LifecycleTab({ canManage }: { canManage: boolean }) {
  const [statuses, usage] = await Promise.all([getProjectStatuses(), getProjectStatusUsage()]);
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">
        The lifecycle every project moves through, in order. The starred status is given to new projects.
      </p>
      <WorkflowStatusesManager kind="project" statuses={statuses} usage={usage} canManage={canManage} />
    </div>
  );
}
