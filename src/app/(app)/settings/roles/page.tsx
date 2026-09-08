import { getCurrentUser } from "@/lib/auth";
import { can, PERMISSIONS } from "@/lib/permissions";
import { getWorkspaceRoles } from "@/lib/data";
import { AccessDenied } from "@/components/shared/access-denied";
import { RoleFormDialog } from "@/components/settings/role-form-dialog";
import { DeleteRoleDialog } from "@/components/settings/delete-role-dialog";

const PERMISSION_LABEL: Record<string, string> = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.label]));

export default async function RolesPage() {
  const currentUser = await getCurrentUser();
  if (!can(currentUser, "manage_roles")) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-sm font-semibold text-foreground">Roles</h1>
        <AccessDenied message="You don't have permission to manage roles." />
      </div>
    );
  }

  const roles = await getWorkspaceRoles();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Roles</h1>
        <RoleFormDialog />
      </div>
      <ul className="flex max-w-2xl flex-col gap-2">
        {roles.map((r) => {
          const keys = r.permissions.split(",").filter(Boolean);
          return (
            <li key={r.id} className="flex flex-col gap-2 rounded-md border border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{r.name}</span>
                {r.isSystem && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">Built-in</span>
                )}
                <span className="text-xs text-faint-foreground">{r._count.users} members</span>
                <div className="ml-auto flex items-center gap-2.5">
                  <RoleFormDialog role={r} />
                  {!r.isSystem && <DeleteRoleDialog roleId={r.id} name={r.name} />}
                </div>
              </div>
              {keys.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {keys.map((k) => (
                    <span key={k} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {PERMISSION_LABEL[k] ?? k}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-faint-foreground">No permissions</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
