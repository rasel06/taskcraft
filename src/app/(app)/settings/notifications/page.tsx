import { LocalToggleList } from "@/components/settings/local-toggle-list";

export default function NotificationsPage() {
  return (
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
  );
}
