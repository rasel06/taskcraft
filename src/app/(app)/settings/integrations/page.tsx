import { GithubConnectButton } from "@/components/settings/github-connect-button";
import { SlackTestButton } from "@/components/settings/slack-test-button";
import { isSlackConfigured } from "@/lib/notify/slack";

export default function IntegrationsPage() {
  const slackConfigured = isSlackConfigured();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-sm font-semibold text-foreground">Integrations</h1>
      <div className="flex max-w-md items-center justify-between rounded-md border border-border p-4">
        <div>
          <div className="text-sm text-foreground">GitHub</div>
          <p className="text-xs text-muted-foreground">Not connected</p>
        </div>
        <GithubConnectButton />
      </div>
      <div className="flex max-w-md items-center justify-between rounded-md border border-border p-4">
        <div>
          <div className="text-sm text-foreground">Slack</div>
          <p className="text-xs text-muted-foreground">
            {slackConfigured
              ? "Connected — project, issue, and reply updates post to the configured channel."
              : "Not configured — set SLACK_WEBHOOK_URL to enable."}
          </p>
        </div>
        {slackConfigured && <SlackTestButton />}
      </div>
    </div>
  );
}
