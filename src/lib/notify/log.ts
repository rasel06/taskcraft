import { prisma } from "@/lib/prisma";

// Best-effort audit write - a logging failure must never take down the
// notification send it's recording, so every error is swallowed here.
export async function logNotification(entry: {
  channel: "telegram" | "slack";
  event: string;
  status: "sent" | "failed";
  error?: string;
  message: string;
  color?: string;
  target?: string | null;
  recipientId?: string | null;
  issueId?: string | null;
  projectId?: string | null;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        channel: entry.channel,
        event: entry.event,
        status: entry.status,
        error: entry.error ?? null,
        message: entry.message,
        color: entry.color ?? null,
        target: entry.target ?? null,
        recipientId: entry.recipientId ?? null,
        issueId: entry.issueId ?? null,
        projectId: entry.projectId ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed to write audit log:", err);
  }
}
