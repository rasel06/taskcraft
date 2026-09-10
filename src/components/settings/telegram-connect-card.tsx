"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send, Copy, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  generateTelegramLinkCode,
  disconnectTelegramAccount,
  setTelegramNotifications,
} from "@/actions/notifications";

export function TelegramConnectCard({
  configured,
  connected,
  notifyEnabled,
}: {
  configured: boolean;
  connected: boolean;
  notifyEnabled: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [code, setCode] = React.useState<string | null>(null);
  const [linkUrl, setLinkUrl] = React.useState<string | null>(null);
  const [enabled, setEnabled] = React.useState(notifyEnabled);

  async function generate() {
    setPending(true);
    try {
      const result = await generateTelegramLinkCode();
      setCode(result.code);
      setLinkUrl(result.linkUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    try {
      await disconnectTelegramAccount();
      toast.success("Telegram disconnected");
      setCode(null);
      setLinkUrl(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setPending(false);
    }
  }

  async function toggle(value: boolean) {
    setEnabled(value);
    try {
      await setTelegramNotifications(value);
    } catch (err) {
      setEnabled(!value);
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  if (!configured) {
    return (
      <div className="max-w-md rounded-md border border-border p-4">
        <div className="text-sm text-foreground">Telegram</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Not available — this workspace hasn&apos;t configured a Telegram bot yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-foreground">Telegram</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {connected ? "Connected — you'll get project, issue, and reply notifications here." : "Get notifications for project and issue changes, and replies to your comments."}
          </p>
        </div>
        {connected && <Switch checked={enabled} onCheckedChange={toggle} />}
      </div>

      {connected ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={disconnect} disabled={pending}>
          <Unlink className="h-3.5 w-3.5" /> Disconnect
        </Button>
      ) : code ? (
        <div className="mt-3 flex flex-col gap-2 rounded-md bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            {linkUrl ? (
              <>
                Open Telegram and tap{" "}
                <a href={linkUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                  this link
                </a>
                , or send this code to the bot:
              </>
            ) : (
              "Message the workspace bot on Telegram with:"
            )}
          </p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-background px-2 py-1 text-sm font-mono text-foreground">/start {code}</code>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(`/start ${code}`);
                toast.success("Copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-faint-foreground">Code expires in 15 minutes.</p>
        </div>
      ) : (
        <Button variant="secondary" size="sm" className="mt-3" onClick={generate} disabled={pending}>
          <Send className="h-3.5 w-3.5" /> Connect Telegram
        </Button>
      )}
    </div>
  );
}
