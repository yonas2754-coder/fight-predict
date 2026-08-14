import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: NextRequest) {
  const update = await req.json();

  const message = update.message;

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text;

  if (text === "/start") {
    await sendMessage(
      chatId,
      "🥊 Welcome to FightPredict!\n\nUse /help to see available commands."
    );
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      `🥊 FightPredict Bot

/start - Start the bot
/help - Show help
/fights - Show available fights`
    );
  }

  if (text === "/fights") {
    await sendMessage(
      chatId,
      "🔥 Available fights:\n\nSedo vs Johnny\n\nUse /predict to make your prediction."
    );
  }

  return NextResponse.json({ ok: true });
}

async function sendMessage(chatId: number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  );
}