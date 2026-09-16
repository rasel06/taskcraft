export const PERMISSIONS = [
  {
    key: "manage_members",
    label: "Manage members",
    description: "Invite, edit, remove workspace members and reset their passwords",
  },
  {
    key: "manage_roles",
    label: "Manage roles",
    description: "Create, edit, and delete custom roles and their permissions",
  },
  {
    key: "manage_teams",
    label: "Manage teams",
    description: "Edit team settings, privacy, and team membership",
  },
  {
    key: "delete_issues",
    label: "Delete issues",
    description: "Permanently delete issues",
  },
  {
    key: "view_all_teams",
    label: "View all teams",
    description: "See every team, public or private, without being a member",
  },
  {
    key: "view_all_projects",
    label: "View all projects",
    description: "See every project in a visible team, not just ones you're assigned to",
  },
  {
    key: "view_audit_log",
    label: "View audit log",
    description: "See the full history of notification messages sent to Telegram and Slack",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export function parsePermissions(csv: string | null | undefined): PermissionKey[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as PermissionKey[];
}

export function can(
  user: { role?: { permissions: string } | null } | null | undefined,
  key: PermissionKey,
): boolean {
  if (!user?.role) return false;
  return parsePermissions(user.role.permissions).includes(key);
}
