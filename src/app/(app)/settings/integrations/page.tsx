import { GithubConnectButton } from "@/components/settings/github-connect-button";

export default function IntegrationsPage() {
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
    </div>
  );
}
