import { redirect } from "next/navigation";
import { getCurrentUser, manageableIssueStatusProjectIds } from "@/lib/auth";
import { getVisibleTeams, getAllUsers, getIssueStatusesByProject, getIssueStatusPresets } from "@/lib/data";
import { can } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { IssueStatusesProvider } from "@/components/shared/issue-statuses-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [users, teams] = await Promise.all([getAllUsers(), getVisibleTeams(currentUser)]);
  const visibleProjectIds = teams.flatMap((t) => t.projects.map((p) => p.id));
  const canCreateProjects = can(currentUser, "create_projects");
  const [issueStatusesByProject, manageableProjectIds, issueStatusPresets] = await Promise.all([
    getIssueStatusesByProject(visibleProjectIds),
    manageableIssueStatusProjectIds(visibleProjectIds, currentUser),
    canCreateProjects ? getIssueStatusPresets() : Promise.resolve([]),
  ]);

  const safeCurrentUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatarUrl: currentUser.avatarUrl,
    role: currentUser.role ? { id: currentUser.role.id, name: currentUser.role.name } : null,
  };

  const permissions = {
    canManageMembers: can(currentUser, "manage_members"),
    canViewAuditLog: can(currentUser, "view_audit_log"),
    canCreateProjects,
  };

  return (
    <IssueStatusesProvider byProject={issueStatusesByProject} manageableProjectIds={manageableProjectIds}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar
          currentUser={safeCurrentUser}
          users={users}
          teams={teams}
          permissions={permissions}
          issueStatusPresets={issueStatusPresets}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pt-12 print:overflow-visible print:pt-0 md:pt-0">{children}</main>
      </div>
    </IssueStatusesProvider>
  );
}
