// Formatting helpers shared by the Telegram (HTML parse_mode) and Slack
// (mrkdwn) message builders in templates.ts.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeMrkdwn(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function boldTg(s: string): string {
  return `<b>${escapeHtml(s)}</b>`;
}

export function boldSlack(s: string): string {
  return `*${escapeMrkdwn(s)}*`;
}

export function codeTg(s: string): string {
  return `<code>${escapeHtml(s)}</code>`;
}

export function codeSlack(s: string): string {
  return `\`${escapeMrkdwn(s)}\``;
}

// Action-type accent color for the Slack sidebar bar.
export const ACTION_COLORS = {
  create: "#22c55e",
  update: "#3b82f6",
  remove: "#ef4444",
  role: "#a855f7",
  reply: "#0ea5e9",
} as const;

const STATUS_DOT: Record<string, string> = {
  Backlog: "⚪",
  Todo: "🟡",
  "In Progress": "🔵",
  "In Review": "🟣",
  Planned: "🟡",
  Active: "🔵",
  Done: "🟢",
  Completed: "🟢",
  Cancelled: "🔴",
};

const STATUS_COLOR: Record<string, string> = {
  Backlog: "#94a3b8",
  Todo: "#eab308",
  "In Progress": "#3b82f6",
  "In Review": "#a855f7",
  Planned: "#eab308",
  Active: "#3b82f6",
  Done: "#22c55e",
  Completed: "#22c55e",
  Cancelled: "#ef4444",
};

const PRIORITY_DOT: Record<string, string> = {
  Urgent: "🔴",
  High: "🟠",
  Medium: "🟡",
  Low: "🔵",
  "No priority": "⚪",
};

export function statusBadge(status: string): string {
  return `${STATUS_DOT[status] ?? "⚪"} ${status}`;
}

export function priorityBadge(priority: string): string {
  return `${PRIORITY_DOT[priority] ?? "⚪"} ${priority}`;
}

// Slack sidebar color for a status-change notification, so the bar itself
// signals whether the move was "good" (green), neutral, or a cancellation.
export function statusColor(status: string): string {
  return STATUS_COLOR[status] ?? ACTION_COLORS.update;
}

// Shared skeleton every notification is built on, so every event type
// reads the same way: a bold headline, an italic context line, the body
// (already-formatted lines specific to the event), then a quiet footer
// with who did it and a link back into the app. `entity` may carry inline
// markup (e.g. a <code> issue id) - it is NOT escaped, so callers must
// build it from already-safe/escaped pieces.
export function composeTg(opts: { emoji: string; title: string; entity?: string; lines?: string[]; actorName: string; url: string }): string {
  const parts = [`${opts.emoji} ${boldTg(opts.title)}`];
  if (opts.entity) parts.push(`<i>${opts.entity}</i>`);
  if (opts.lines && opts.lines.length > 0) {
    parts.push("");
    parts.push(opts.lines.join("\n"));
  }
  parts.push("");
  parts.push(`👤 ${escapeHtml(opts.actorName)}  ·  🔗 <a href="${opts.url}">Open in TaskCraft</a>`);
  return parts.join("\n");
}

export function composeSlack(opts: { emoji: string; title: string; entity?: string; lines?: string[]; actorName: string; url: string }): string {
  const parts = [`${opts.emoji} ${boldSlack(opts.title)}`];
  if (opts.entity) parts.push(`_${opts.entity}_`);
  if (opts.lines && opts.lines.length > 0) {
    parts.push("");
    parts.push(opts.lines.join("\n"));
  }
  parts.push("");
  parts.push(`👤 ${escapeMrkdwn(opts.actorName)}  ·  🔗 <${opts.url}|Open in TaskCraft>`);
  return parts.join("\n");
}
