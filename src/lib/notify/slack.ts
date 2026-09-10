export function isSlackConfigured() {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

export async function sendSlackMessage(text: string, options?: { color?: string }) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const payload = options?.color
    ? { attachments: [{ color: options.color, text, mrkdwn_in: ["text"] }] }
    : { text, mrkdwn: true };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed: ${res.status} ${body}`);
  }
}
