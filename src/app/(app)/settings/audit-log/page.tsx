import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

function plainText(message: string): string {
  return message
    .replace(/<[^>]+>/g, "")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const EVENT_LABELS: Record<string, string> = {
  issue_created: "Issue created",
  issue_updated: "Issue updated",
  project_created: "Project created",
  project_updated: "Project updated",
  project_status_changed: "Project status changed",
  project_member_added: "Member added",
  project_member_removed: "Member removed",
  project_member_role_changed: "Member role changed",
  comment_reply: "Comment reply",
  team_lead_changed: "Team lead changed",
  team_member_added: "Team member added",
  team_member_removed: "Team member removed",
};

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!can(user, "view_audit_log")) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-sm font-semibold text-foreground">Audit log</h1>
        <AccessDenied message="You don't have permission to view the audit log." />
      </div>
    );
  }

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { recipient: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-semibold text-foreground">Audit log</h1>
        <span className="text-xs text-faint-foreground">Last {logs.length} notification{logs.length === 1 ? "" : "s"} sent</span>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-faint-foreground">
          No notifications have been sent yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Channel</th>
                <th className="px-3 py-2 font-medium">Recipient</th>
                <th className="px-3 py-2 font-medium">Message</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-faint-foreground">
                    {log.createdAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">{EVENT_LABELS[log.event] ?? log.event}</td>
                  <td className="whitespace-nowrap px-3 py-2 capitalize text-muted-foreground">{log.channel}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {log.recipient ? (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <UserAvatar user={log.recipient} className="h-4 w-4" /> {log.recipient.name}
                      </span>
                    ) : (
                      <span className="text-faint-foreground">Channel broadcast</span>
                    )}
                  </td>
                  <td className="max-w-md px-3 py-2 text-muted-foreground">
                    <span className="line-clamp-2">{plainText(log.message)}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        log.status === "sent"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                      )}
                      title={log.error ?? undefined}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
