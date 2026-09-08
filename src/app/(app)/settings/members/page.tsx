import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getWorkspaceRoles } from "@/lib/data";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AccessDenied } from "@/components/shared/access-denied";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { EditMemberDialog } from "@/components/settings/edit-member-dialog";
import { ResetPasswordDialog } from "@/components/settings/reset-password-dialog";
import { DeleteMemberDialog } from "@/components/settings/delete-member-dialog";

export default async function MembersPage() {
  const currentUser = await getCurrentUser();
  if (!can(currentUser, "manage_members")) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-sm font-semibold text-foreground">Members</h1>
        <AccessDenied message="You don't have permission to manage members." />
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Members</h1>
        <InviteMemberDialog roles={roles} />
      </div>
      <ul className="flex max-w-2xl flex-col gap-1">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <UserAvatar user={u} className="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate text-sm text-foreground">
                {u.name}
                {u.role && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {u.role.name}
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              <div className="truncate text-[11px] text-faint-foreground">
                Bank {u.bankId ?? "—"} · File {u.fileNumber ?? "—"} · Mobile {u.mobile ?? "—"}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {u.teamMemberships.map((m) => (
                <span key={m.id} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {m.team.identifier}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2.5 border-l border-border pl-3">
              <EditMemberDialog
                member={{
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  bankId: u.bankId,
                  fileNumber: u.fileNumber,
                  mobile: u.mobile,
                  avatarUrl: u.avatarUrl,
                  role: u.role,
                }}
                roles={roles}
              />
              <ResetPasswordDialog userId={u.id} name={u.name} />
              {u.id !== currentUser?.id && <DeleteMemberDialog userId={u.id} name={u.name} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
