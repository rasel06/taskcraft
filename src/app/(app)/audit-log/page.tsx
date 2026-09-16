import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AccessDenied } from "@/components/shared/access-denied";
import { AuditLogTable } from "@/components/settings/audit-log-table";

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!can(user, "view_audit_log")) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-5 py-3">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Audit log</h1>
        </header>
        <div className="p-4 sm:p-6">
          <AccessDenied message="You don't have permission to view the audit log." />
        </div>
      </div>
    );
  }

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { recipient: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border px-5 py-3">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h1 className="flex-1 text-sm font-semibold text-foreground">Audit log</h1>
        <span className="text-xs text-faint-foreground">Last {logs.length} notification{logs.length === 1 ? "" : "s"} sent</span>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {logs.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-faint-foreground">
            No notifications have been sent yet.
          </p>
        ) : (
          <AuditLogTable
            logs={logs.map((log) => ({
              id: log.id,
              channel: log.channel,
              event: log.event,
              status: log.status,
              error: log.error,
              message: log.message,
              createdAt: log.createdAt.toISOString(),
              recipient: log.recipient,
            }))}
          />
        )}
      </div>
    </div>
  );
}
