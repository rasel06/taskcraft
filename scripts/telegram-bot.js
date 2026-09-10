/* eslint-disable @typescript-eslint/no-require-imports */
// Standalone long-polling worker that links Telegram chats to TaskCraft
// users. Telegram can only push updates to a public HTTPS webhook or to a
// client that polls getUpdates - there's no public URL in local dev, so
// this script polls instead. Run it alongside `npm run dev`:
//
//   npm run telegram:bot
//
// A user links their account from Settings > Notifications: TaskCraft
// generates a one-time 6-digit code, the user sends "/start <code>" (or
// taps the t.me deep link) to the bot, and this script matches the code
// back to their account and saves their chat id.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Add it to .env and re-run.");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${token}`;
let offset = 0;

async function getUpdates() {
  const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
  if (!res.ok) throw new Error(`getUpdates failed: ${res.status}`);
  const data = await res.json();
  return data.result ?? [];
}

async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error("sendMessage failed:", err));
}

async function handleCode(chatId, code) {
  const token = await prisma.telegramLinkToken.findUnique({ where: { code }, include: { user: true } });
  if (!token || token.expiresAt < new Date()) {
    await sendMessage(chatId, "That code is invalid or expired. Generate a new one from TaskCraft > Settings > Notifications.");
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { telegramChatId: String(chatId), notifyTelegram: true } }),
    prisma.telegramLinkToken.delete({ where: { id: token.id } }),
  ]);

  await sendMessage(chatId, `Linked! You'll now get TaskCraft notifications here, ${token.user.name}.`);
  console.log(`Linked Telegram chat ${chatId} to user ${token.user.email}`);
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message?.text) return;
  const chatId = message.chat.id;

  const match = message.text.trim().match(/^\/(?:start|link)(?:@\w+)?\s+(\d{6})$/);
  if (match) {
    await handleCode(chatId, match[1]);
    return;
  }
  if (/^\/start$/.test(message.text.trim())) {
    await sendMessage(chatId, "Send /start followed by the 6-digit code from TaskCraft > Settings > Notifications to link your account.");
  }
}

async function poll() {
  console.log("Telegram bot poller running. Waiting for /start <code> messages...");
  for (;;) {
    try {
      const updates = await getUpdates();
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (err) {
      console.error("Poll error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

poll();
