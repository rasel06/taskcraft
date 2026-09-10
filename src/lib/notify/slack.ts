export function isSlackConfigured() {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

export async function sendSlackMessage(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed: ${res.status} ${body}`);
  }
}
