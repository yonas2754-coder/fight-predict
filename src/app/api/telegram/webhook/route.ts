import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = 641429123;

const users = new Set<number>();

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "FightPredict Telegram webhook is running",
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text?.trim() || "";

    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    users.add(chatId);

    if (text === "/start") {
      await sendMessage(
        chatId,
        `🥊 Welcome to FightPredict!

Predict upcoming fights and follow the action.

🔥 Available commands:
/fights - View available fights
/help - Show help`
      );
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        `🥊 FightPredict

/fights - View available fights
/help - Show available commands`
      );
    }

    if (text === "/fights") {
      await sendMessage(
        chatId,
        `🔥 AVAILABLE FIGHTS

🥊 Sedo vs Johnny

Make your prediction and good luck!`
      );
    }

    if (text.startsWith("/broadcast")) {
      if (userId !== ADMIN_ID) {
        await sendMessage(
          chatId,
          "❌ You are not authorized."
        );

        return NextResponse.json({ ok: true });
      }

      const broadcast = text
        .replace("/broadcast", "")
        .trim();

      if (!broadcast) {
        await sendMessage(
          chatId,
          "⚠️ Example:\n\n/broadcast Fight night is coming! 🥊"
        );

        return NextResponse.json({ ok: true });
      }

      let sent = 0;
      let failed = 0;

      for (const userChatId of users) {
        const success = await sendMessage(
          userChatId,
          broadcast
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      await sendMessage(
        chatId,
        `📢 BROADCAST COMPLETE

👥 Users: ${users.size}
✅ Sent: ${sent}
❌ Failed: ${failed}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }
}

async function sendMessage(
  chatId: number,
  text: string
): Promise<boolean> {
  try {
    const response = await fetch(
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

    const data = await response.json();

    return data.ok === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}