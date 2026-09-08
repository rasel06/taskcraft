import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleTeams, getAllUsers } from "@/lib/data";
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
    isWorkspaceAdmin: currentUser.isWorkspaceAdmin,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar currentUser={safeCurrentUser} users={users} teams={teams} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
