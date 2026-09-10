import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

// Generates a short-lived one-time code the user pastes into Telegram
// (as /start CODE) to link their chat to their TaskCraft account.
export async function createTelegramLinkToken(userId: string): Promise<string> {
  await prisma.telegramLinkToken.deleteMany({ where: { userId } });
  const code = randomInt(100000, 999999).toString();
  await prisma.telegramLinkToken.create({
    data: { userId, code, expiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS) },
  });
  return code;
}

export function telegramLinkUrl(code: string): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) return null;
  return `https://t.me/${username}?start=${code}`;
}

export async function disconnectTelegram(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { telegramChatId: null, notifyTelegram: false } });
}
