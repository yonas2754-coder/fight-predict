import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is not configured",
  );
}

export const bot = new TelegramBot(token);