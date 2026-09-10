import { sendTelegramMessage } from "@/lib/notify/telegram";
import { sendSlackMessage } from "@/lib/notify/slack";
import type { NotifiableUser } from "@/lib/notify/recipients";

export { projectRecipients, issueRecipients, singleRecipient } from "@/lib/notify/recipients";
export type { NotifiableUser } from "@/lib/notify/recipients";

export function appUrl(path: string) {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

// Fire-and-forget dispatch to whichever channels are configured. Never
// throws - a WhatsApp/Telegram/Slack outage must never fail the DB write
// that triggered the notification.
export async function dispatchNotification(
  recipients: NotifiableUser[],
  message: string,
  options?: { slackText?: string; skipSlack?: boolean },
) {
  const jobs: Promise<unknown>[] = [];

  for (const user of recipients) {
    if (user.notifyTelegram && user.telegramChatId) {
      jobs.push(
        sendTelegramMessage(user.telegramChatId, message).catch((err) =>
          console.error(`[notify] telegram failed for user ${user.id}:`, err),
        ),
      );
    }
  }

  if (!options?.skipSlack) {
    jobs.push(
      sendSlackMessage(options?.slackText ?? message).catch((err) => console.error("[notify] slack failed:", err)),
    );
  }

  await Promise.allSettled(jobs);
}
