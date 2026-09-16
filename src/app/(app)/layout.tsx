import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleTeams, getAllUsers } from "@/lib/data";
import { can } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [users, teams] = await Promise.all([getAllUsers(), getVisibleTeams(currentUser)]);

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
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar currentUser={safeCurrentUser} users={users} teams={teams} permissions={permissions} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pt-12 print:overflow-visible print:pt-0 md:pt-0">{children}</main>
    </div>
  );
}
