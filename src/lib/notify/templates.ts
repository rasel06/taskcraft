import {
  boldTg,
  boldSlack,
  codeTg,
  codeSlack,
  statusBadge,
  ACTION_COLORS,
  statusColor,
  escapeHtml,
  escapeMrkdwn,
  composeTg,
  composeSlack,
} from "@/lib/notify/render";
import type { ChangeText } from "@/lib/notify/format";

export interface RenderedMessage {
  tg: string;
  slack: string;
  color: string;
}

export function issueCreatedMessage(opts: { issueId: string; title: string; projectName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.create,
    tg: composeTg({
      emoji: "🆕",
      title: "New Issue",
      entity: `${codeTg(opts.issueId)} · ${escapeHtml(opts.projectName)}`,
      lines: [boldTg(opts.title)],
      actorName: opts.actorName,
      url: opts.url,
    }),
    slack: composeSlack({
      emoji: "🆕",
      title: "New Issue",
      entity: `${codeSlack(opts.issueId)} · ${escapeMrkdwn(opts.projectName)}`,
      lines: [boldSlack(opts.title)],
      actorName: opts.actorName,
      url: opts.url,
    }),
  };
}

export function issueUpdatedMessage(opts: { issueId: string; actorName: string; changeText: ChangeText; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.update,
    tg: composeTg({ emoji: "✏️", title: "Issue Updated", entity: codeTg(opts.issueId), lines: [opts.changeText.tg], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "✏️", title: "Issue Updated", entity: codeSlack(opts.issueId), lines: [opts.changeText.slack], actorName: opts.actorName, url: opts.url }),
  };
}

export function projectCreatedMessage(opts: { projectName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.create,
    tg: composeTg({ emoji: "📁", title: "New Project", entity: escapeHtml(opts.projectName), actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "📁", title: "New Project", entity: escapeMrkdwn(opts.projectName), actorName: opts.actorName, url: opts.url }),
  };
}

export function projectStatusMessage(opts: { projectName: string; actorName: string; from: string; to: string; url: string }): RenderedMessage {
  return {
    color: statusColor(opts.to),
    tg: composeTg({
      emoji: "📊",
      title: "Project Status Changed",
      entity: escapeHtml(opts.projectName),
      lines: [`${boldTg("Status")}: ${statusBadge(opts.from)} → ${boldTg(statusBadge(opts.to))}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
    slack: composeSlack({
      emoji: "📊",
      title: "Project Status Changed",
      entity: escapeMrkdwn(opts.projectName),
      lines: [`${boldSlack("Status")}: ${statusBadge(opts.from)} → ${boldSlack(statusBadge(opts.to))}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
  };
}

export function projectUpdatedMessage(opts: { projectName: string; actorName: string; changeText: ChangeText; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.update,
    tg: composeTg({ emoji: "✏️", title: "Project Updated", entity: escapeHtml(opts.projectName), lines: [opts.changeText.tg], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "✏️", title: "Project Updated", entity: escapeMrkdwn(opts.projectName), lines: [opts.changeText.slack], actorName: opts.actorName, url: opts.url }),
  };
}

export function memberAddedMessage(opts: { memberName: string; projectName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.create,
    tg: composeTg({ emoji: "➕", title: "Member Added", entity: escapeHtml(opts.projectName), lines: [`${boldTg(opts.memberName)} joined the project`], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "➕", title: "Member Added", entity: escapeMrkdwn(opts.projectName), lines: [`${boldSlack(opts.memberName)} joined the project`], actorName: opts.actorName, url: opts.url }),
  };
}

export function memberRemovedMessage(opts: { memberName: string; projectName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.remove,
    tg: composeTg({ emoji: "➖", title: "Member Removed", entity: escapeHtml(opts.projectName), lines: [`${boldTg(opts.memberName)} left the project`], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "➖", title: "Member Removed", entity: escapeMrkdwn(opts.projectName), lines: [`${boldSlack(opts.memberName)} left the project`], actorName: opts.actorName, url: opts.url }),
  };
}

export function roleChangedMessage(opts: { memberName: string; projectName: string; role: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.role,
    tg: composeTg({
      emoji: "🔑",
      title: "Role Changed",
      entity: escapeHtml(opts.projectName),
      lines: [`${boldTg(opts.memberName)} → ${boldTg(opts.role)}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
    slack: composeSlack({
      emoji: "🔑",
      title: "Role Changed",
      entity: escapeMrkdwn(opts.projectName),
      lines: [`${boldSlack(opts.memberName)} → ${boldSlack(opts.role)}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
  };
}

export function teamMemberAddedMessage(opts: { memberName: string; teamName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.create,
    tg: composeTg({ emoji: "➕", title: "Team Member Added", entity: escapeHtml(opts.teamName), lines: [`${boldTg(opts.memberName)} joined the team`], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "➕", title: "Team Member Added", entity: escapeMrkdwn(opts.teamName), lines: [`${boldSlack(opts.memberName)} joined the team`], actorName: opts.actorName, url: opts.url }),
  };
}

export function teamMemberRemovedMessage(opts: { memberName: string; teamName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.remove,
    tg: composeTg({ emoji: "➖", title: "Team Member Removed", entity: escapeHtml(opts.teamName), lines: [`${boldTg(opts.memberName)} left the team`], actorName: opts.actorName, url: opts.url }),
    slack: composeSlack({ emoji: "➖", title: "Team Member Removed", entity: escapeMrkdwn(opts.teamName), lines: [`${boldSlack(opts.memberName)} left the team`], actorName: opts.actorName, url: opts.url }),
  };
}

export function teamLeadChangedMessage(opts: { teamName: string; fromName: string; toName: string; actorName: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.role,
    tg: composeTg({
      emoji: "🔑",
      title: "Team Lead Changed",
      entity: escapeHtml(opts.teamName),
      lines: [`${boldTg(opts.fromName)} → ${boldTg(opts.toName)}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
    slack: composeSlack({
      emoji: "🔑",
      title: "Team Lead Changed",
      entity: escapeMrkdwn(opts.teamName),
      lines: [`${boldSlack(opts.fromName)} → ${boldSlack(opts.toName)}`],
      actorName: opts.actorName,
      url: opts.url,
    }),
  };
}

export function commentReplyMessage(opts: { actorName: string; issueId: string; snippet: string; url: string }): RenderedMessage {
  return {
    color: ACTION_COLORS.reply,
    tg: composeTg({
      emoji: "💬",
      title: "New Reply",
      entity: codeTg(opts.issueId),
      lines: [`“${escapeHtml(opts.snippet)}”`],
      actorName: opts.actorName,
      url: opts.url,
    }),
    slack: composeSlack({
      emoji: "💬",
      title: "New Reply",
      entity: codeSlack(opts.issueId),
      lines: [`“${escapeMrkdwn(opts.snippet)}”`],
      actorName: opts.actorName,
      url: opts.url,
    }),
  };
}
