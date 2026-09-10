import { LocalToggleList } from "@/components/settings/local-toggle-list";
import { TelegramConnectCard } from "@/components/settings/telegram-connect-card";
import { SlackConnectCard } from "@/components/settings/slack-connect-card";
import { getCurrentUser } from "@/lib/auth";
import { isTelegramConfigured } from "@/lib/notify/telegram";
import { isSlackConfigured } from "@/lib/notify/slack";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-sm font-semibold text-foreground">Notifications</h1>
        <LocalToggleList
          storageKey="taskcraft.notifications"
          items={[
            { key: "assigned", label: "Issue assigned to you", description: "Notify when you're set as assignee", defaultOn: true },
            { key: "mentions", label: "Mentions", description: "Notify when someone mentions you" },
            { key: "statusChanges", label: "Status changes", description: "Notify on status changes for issues you follow" },
            { key: "digest", label: "Weekly digest", description: "A summary email every Monday" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chat notifications</h2>
        <TelegramConnectCard
          configured={isTelegramConfigured()}
          connected={Boolean(user?.telegramChatId)}
          notifyEnabled={user?.notifyTelegram ?? false}
        />
        <SlackConnectCard
          configured={isSlackConfigured()}
          slackUserId={user?.slackUserId ?? null}
          notifyEnabled={user?.notifySlack ?? true}
        />
      </div>
    </div>
  );
}
