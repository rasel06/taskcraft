"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTelegramLinkToken, telegramLinkUrl, disconnectTelegram, isTelegramConfigured } from "@/lib/notify/telegram";
import { sendSlackMessage, isSlackConfigured } from "@/lib/notify/slack";

export async function generateTelegramLinkCode() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!isTelegramConfigured()) throw new Error("Telegram isn't configured for this workspace yet.");

  const code = await createTelegramLinkToken(user.id);
  return { code, linkUrl: telegramLinkUrl(code) };
}

export async function disconnectTelegramAccount() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await disconnectTelegram(user.id);
  revalidatePath("/settings/notifications");
}

export async function setTelegramNotifications(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await prisma.user.update({ where: { id: user.id }, data: { notifyTelegram: enabled } });
  revalidatePath("/settings/notifications");
}

export async function sendSlackTestMessage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  if (!isSlackConfigured()) throw new Error("Slack isn't configured for this workspace yet.");
  const mention = user.slackUserId ? `<@${user.slackUserId}> ` : "";
  await sendSlackMessage(`${mention}👋 Test message from TaskCraft, triggered by ${user.name}.`);
}

export async function setSlackUserId(slackUserId: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = slackUserId?.trim() || null;
  if (trimmed && !/^[UW][A-Z0-9]{2,}$/i.test(trimmed)) {
    throw new Error("That doesn't look like a Slack member ID (should look like U0123ABCDE).");
  }

  await prisma.user.update({ where: { id: user.id }, data: { slackUserId: trimmed } });
  revalidatePath("/settings/notifications");
}

export async function setSlackNotifications(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  await prisma.user.update({ where: { id: user.id }, data: { notifySlack: enabled } });
  revalidatePath("/settings/notifications");
}
