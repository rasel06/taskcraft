import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getWorkspaceRoles } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { MembersTable } from "@/components/settings/members-table";

export default async function MembersPage() {
  const currentUser = await getCurrentUser();
  if (!can(currentUser, "manage_members")) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Members</h1>
        </header>
        <div className="p-4 sm:p-6">
          <AccessDenied message="You don't have permission to manage members." />
        </div>
      </div>
    );
  }

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        bankId: true,
        fileNumber: true,
        mobile: true,
        avatarUrl: true,
        role: { select: { id: true, name: true } },
        teamMemberships: { include: { team: { select: { identifier: true } } } },
      },
    }),
    getWorkspaceRoles(),
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h1 className="flex-1 text-sm font-semibold text-foreground">Members</h1>
        <InviteMemberDialog roles={roles} />
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <MembersTable members={users} roles={roles} currentUserId={currentUser?.id} />
      </div>
    </div>
  );
}
