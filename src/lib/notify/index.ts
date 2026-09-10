import { sendTelegramMessage } from "@/lib/notify/telegram";
import { sendSlackMessage } from "@/lib/notify/slack";
import { logNotification } from "@/lib/notify/log";
import type { NotifiableUser } from "@/lib/notify/recipients";

export { projectRecipients, issueRecipients, teamRecipients, singleRecipient } from "@/lib/notify/recipients";
export type { NotifiableUser } from "@/lib/notify/recipients";

export function appUrl(path: string) {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export interface NotifyMessage {
  tg: string;
  slack: string;
  color?: string;
}

export interface NotifyContext {
  event: string;
  issueId?: string;
  projectId?: string;
}

// Fire-and-forget dispatch to whichever channels are configured. Never
// throws - a Telegram/Slack outage must never fail the DB write that
// triggered the notification. Every attempt (per channel, per recipient)
// is written to NotificationLog for audit, regardless of outcome.
export async function dispatchNotification(
  recipients: NotifiableUser[],
  message: NotifyMessage,
  context: NotifyContext,
  options?: { skipSlack?: boolean; slackMentionOnly?: boolean },
) {
  const jobs: Promise<unknown>[] = [];
  const base = { event: context.event, issueId: context.issueId ?? null, projectId: context.projectId ?? null, message: message.tg, color: message.color };

  for (const user of recipients) {
    if (user.notifyTelegram && user.telegramChatId) {
      const target = user.telegramChatId;
      jobs.push(
        sendTelegramMessage(target, message.tg)
          .then(() => logNotification({ ...base, channel: "telegram", status: "sent", target, recipientId: user.id }))
          .catch((err) => {
            console.error(`[notify] telegram failed for user ${user.id}:`, err);
            return logNotification({ ...base, channel: "telegram", status: "failed", error: String(err), target, recipientId: user.id });
          }),
      );
    }
  }

  if (!options?.skipSlack) {
    const mentions = recipients.filter((u) => u.notifySlack && u.slackUserId).map((u) => `<@${u.slackUserId}>`);
    if (!options?.slackMentionOnly || mentions.length > 0) {
      const text = mentions.length ? `${mentions.join(" ")} ${message.slack}` : message.slack;
      jobs.push(
        sendSlackMessage(text, { color: message.color })
          .then(() => logNotification({ ...base, channel: "slack", status: "sent", message: text }))
          .catch((err) => {
            console.error("[notify] slack failed:", err);
            return logNotification({ ...base, channel: "slack", status: "failed", error: String(err), message: text });
          }),
      );
    }
  }

  await Promise.allSettled(jobs);
}
