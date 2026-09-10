"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendSlackTestMessage } from "@/actions/notifications";

export function SlackTestButton() {
  const [pending, setPending] = React.useState(false);

  async function send() {
    setPending(true);
    try {
      await sendSlackTestMessage();
      toast.success("Test message sent to Slack");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={send} disabled={pending}>
      Send test message
    </Button>
  );
}
