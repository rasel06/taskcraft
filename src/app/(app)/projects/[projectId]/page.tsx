import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canAccessProject, canManageIssueStatuses, getIssueEditAccess } from "@/lib/auth";
import { getProjectIssues, getAllUsers, getProjectStatuses, getIssueStatuses, getActivityReferenceNames } from "@/lib/data";
import { ProjectIssueStatusesProvider } from "@/components/shared/issue-statuses-context";
import { can } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { Board } from "@/components/board/board";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProjectHeaderControls } from "@/components/project/project-header-controls";
import { MilestonesPanel } from "@/components/project/milestones-panel";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { IssueDetailModal } from "@/components/issue/issue-detail-modal";
import { parseIssueAttachments } from "@/lib/attachments";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, Settings } from "lucide-react";
import Link from "next/link";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ issue?: string; view?: string }>;
}) {
  const { projectId } = await params;
  const { issue: issueId, view } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: true,
      lead: true,
      milestones: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) notFound();

  const user = await getCurrentUser();
  const allowed = await canAccessProject(projectId, user);
  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border px-5 py-3">
          <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
        </header>
        <AccessDenied message="This project belongs to a private team." />
      </div>
    );
  }

  const [issues, users, statuses, issueStatuses, canManageStatuses] = await Promise.all([
    getProjectIssues(projectId, user?.id),
    getAllUsers(),
    getProjectStatuses(),
    getIssueStatuses(projectId),
    canManageIssueStatuses(projectId, user),
  ]);
  const selectedIssue = issueId ? issues.find((i) => i.id === issueId) : undefined;
  const fullSelectedIssue = selectedIssue
    ? await prisma.issue.findUnique({
        where: { id: selectedIssue.id },
        include: {
          assignees: { select: { userId: true } },
          activity: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, name: true, avatarUrl: true } }, attachments: true },
          },
        },
      })
    : null;
  const [editAccess, activityNames] = fullSelectedIssue
    ? await Promise.all([getIssueEditAccess(fullSelectedIssue.id, user), getActivityReferenceNames(fullSelectedIssue.activity)])
    : [null, {}];

  return (
    <ProjectIssueStatusesProvider projectId={projectId} statuses={issueStatuses} canManage={canManageStatuses}>
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-col gap-2 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-faint-foreground">{project.team.identifier}</span>
            <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
            {project.isDraft && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">Draft</span>}
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/projects/${project.id}/settings`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Project settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <CreateIssueDialog
                projects={[{ id: project.id, name: project.name, teamId: project.teamId, status: project.status, isDraft: project.isDraft, teamIdentifier: project.team.identifier }]}
                users={users}
                defaultProjectId={project.id}
                trigger={
                  <Button variant="primary" size="sm">
                    <Plus className="h-3.5 w-3.5" /> New issue
                  </Button>
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProjectHeaderControls projectId={project.id} status={project.status} priority={project.priority} statuses={statuses} />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserAvatar user={project.lead} className="h-4 w-4" /> {project.lead.name}
            </span>
            {(project.startDate || project.targetDate) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.startDate)} - {formatDate(project.targetDate)}
              </span>
            )}
          </div>
        </header>
        <Board issues={issues} projectId={project.id} />
      </div>

      <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border p-4 lg:flex">
        {project.description && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brief</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Milestones</h3>
          <MilestonesPanel projectId={project.id} milestones={project.milestones} />
        </div>
      </aside>

      {fullSelectedIssue && (
        <IssueDetailModal
          key={fullSelectedIssue.id}
          issue={{
            id: fullSelectedIssue.id,
            projectId: fullSelectedIssue.projectId,
            projectName: project.name,
            title: fullSelectedIssue.title,
            description: fullSelectedIssue.description,
            status: fullSelectedIssue.status,
            priority: fullSelectedIssue.priority,
            labels: fullSelectedIssue.labels,
            attachments: parseIssueAttachments(fullSelectedIssue.attachments),
            createdAt: fullSelectedIssue.createdAt.toISOString(),
            assigneeIds: fullSelectedIssue.assignees.map((a) => a.userId),
            team: { name: project.team.name, icon: project.team.icon, color: project.team.color },
            activity: fullSelectedIssue.activity.map((a) => ({
              id: a.id,
              field: a.field,
              fromValue: a.fromValue,
              toValue: a.toValue,
              createdAt: a.createdAt.toISOString(),
              user: a.user,
            })),
            activityNames,
            comments: fullSelectedIssue.comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
              parentId: c.parentId,
              user: c.user,
              attachments: c.attachments.map((a) => ({ id: a.id, fileName: a.fileName, fileType: a.fileType, fileSize: a.fileSize, url: a.url })),
            })),
          }}
          users={users}
          currentUser={user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : undefined}
          canDelete={can(user, "delete_issues")}
          canEdit={editAccess?.canEdit ?? false}
          editBlockedReason={editAccess?.reason}
          initialTab={view === "activity" ? "activity" : "discussion"}
        />
      )}
    </div>
    </ProjectIssueStatusesProvider>
  );
}
