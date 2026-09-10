"use client";

import * as React from "react";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { setSlackUserId, setSlackNotifications } from "@/actions/notifications";

export function SlackConnectCard({
  configured,
  slackUserId,
  notifyEnabled,
}: {
  configured: boolean;
  slackUserId: string | null;
  notifyEnabled: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [enabled, setEnabled] = React.useState(notifyEnabled);

  async function save() {
    setPending(true);
    try {
      await setSlackUserId(value);
      toast.success("Slack account linked");
      setValue("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link");
    } finally {
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    try {
      await setSlackUserId(null);
      toast.success("Slack account unlinked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink");
    } finally {
      setPending(false);
    }
  }

  async function toggle(next: boolean) {
    setEnabled(next);
    try {
      await setSlackNotifications(next);
    } catch (err) {
      setEnabled(!next);
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  if (!configured) {
    return (
      <div className="max-w-md rounded-md border border-border p-4">
        <div className="text-sm text-foreground">Slack</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Not available — this workspace hasn&apos;t configured a Slack webhook yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-foreground">Slack</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {slackUserId
              ? "Linked — you'll be @mentioned in the team channel for updates and replies."
              : "Add your Slack member ID to get @mentioned on updates and replies."}
          </p>
        </div>
        {slackUserId && <Switch checked={enabled} onCheckedChange={toggle} />}
      </div>

      {slackUserId ? (
        <div className="mt-3 flex items-center gap-2">
          <code className="rounded bg-muted/40 px-2 py-1 text-sm font-mono text-foreground">{slackUserId}</code>
          <Button variant="outline" size="sm" onClick={disconnect} disabled={pending}>
            <Unlink className="h-3.5 w-3.5" /> Unlink
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-faint-foreground">
            Find yours in Slack: click your profile → <span className="font-medium">More</span> →{" "}
            <span className="font-medium">Copy member ID</span>.
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="U0123ABCDE"
              className="h-8 font-mono text-sm"
            />
            <Button variant="secondary" size="sm" onClick={save} disabled={pending || !value.trim()}>
              <Link2 className="h-3.5 w-3.5" /> Link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
