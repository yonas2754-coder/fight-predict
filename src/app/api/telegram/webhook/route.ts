import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = 641429123;

const users = new Set<number>();

const predictions = new Map<
  number,
  "johnny" | "sedo"
>();

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "FightPredict Telegram bot is running",
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // =========================
    // MESSAGE
    // =========================

    const message = update.message;

    if (message) {
      const chatId = message.chat.id;
      const userId = message.from?.id;
      const text = message.text?.trim() || "";

      if (!userId) {
        return NextResponse.json({ ok: true });
      }

      // Register user
      users.add(chatId);

      // =========================
      // /start
      // =========================

      if (text === "/start") {
        await sendMessage(
          chatId,
          `🥊 FightPredict

Welcome to FightPredict!

🔥 MMA Fight Prediction

Johnny vs Sedo

Choose the fighter you think will win.`,
          {
            inline_keyboard: [
              [
                {
                  text: "🥊 Johnny",
                  callback_data: "predict_johnny",
                },
                {
                  text: "🥊 Sedo",
                  callback_data: "predict_sedo",
                },
              ],
            ],
          }
        );

        return NextResponse.json({ ok: true });
      }

      // =========================
      // /help
      // =========================

      if (text === "/help") {
        await sendMessage(
          chatId,
          `🥊 FightPredict

Commands:

/start - Start FightPredict
/fights - View current fight
/help - Show help

🔥 Current fight:
Johnny vs Sedo`
        );

        return NextResponse.json({ ok: true });
      }

      // =========================
      // /fights
      // =========================

      if (text === "/fights") {
        await sendFight(chatId);

        return NextResponse.json({ ok: true });
      }

      // =========================
      // /broadcast
      // =========================

      if (text.startsWith("/broadcast")) {
        if (userId !== ADMIN_ID) {
          await sendMessage(
            chatId,
            "❌ You are not authorized to use this command."
          );

          return NextResponse.json({ ok: true });
        }

        const broadcast = text
          .replace("/broadcast", "")
          .trim();

        if (!broadcast) {
          await sendMessage(
            chatId,
            `⚠️ Please provide a message.

Example:

/broadcast 🥊 Fight starts tonight!`
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
          `📢 Broadcast complete.

👥 Users: ${users.size}
✅ Sent: ${sent}
❌ Failed: ${failed}`
        );

        return NextResponse.json({ ok: true });
      }

      // =========================
      // UNKNOWN COMMAND
      // =========================

      if (text.startsWith("/")) {
        await sendMessage(
          chatId,
          "❓ Unknown command.\n\nUse /help to see available commands."
        );
      }

      return NextResponse.json({ ok: true });
    }

    // =========================
    // CALLBACK BUTTON
    // =========================

    const callbackQuery = update.callback_query;

    if (callbackQuery) {
      const callbackId = callbackQuery.id;
      const chatId = callbackQuery.message?.chat?.id;
      const userId = callbackQuery.from?.id;
      const data = callbackQuery.data;

      if (!chatId || !userId) {
        return NextResponse.json({ ok: true });
      }

      users.add(chatId);

      // =========================
      // JOHNNY PREDICTION
      // =========================

      if (data === "predict_johnny") {
        predictions.set(userId, "johnny");

        await answerCallback(
          callbackId,
          "Your prediction: Johnny 🥊"
        );

        await sendMessage(
          chatId,
          `✅ Prediction recorded!

🥊 Your pick:
Johnny

🔥 Fight:
Johnny vs Sedo

Good luck!`
        );

        return NextResponse.json({ ok: true });
      }

      // =========================
      // SEDO PREDICTION
      // =========================

      if (data === "predict_sedo") {
        predictions.set(userId, "sedo");

        await answerCallback(
          callbackId,
          "Your prediction: Sedo 🥊"
        );

        await sendMessage(
          chatId,
          `✅ Prediction recorded!

🥊 Your pick:
Sedo

🔥 Fight:
Johnny vs Sedo

Good luck!`
        );

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================
// SEND MESSAGE
// ======================================

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: {
    inline_keyboard: {
      text: string;
      callback_data: string;
    }[][];
  }
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

          ...(replyMarkup && {
            reply_markup: replyMarkup,
          }),
        }),
      }
    );

    const data = await response.json();

    return data.ok === true;
  } catch (error) {
    console.error(
      "Telegram sendMessage error:",
      error
    );

    return false;
  }
}

// ======================================
// SHOW FIGHT
// ======================================

async function sendFight(chatId: number) {
  await sendMessage(
    chatId,
    `🔥 CURRENT MMA FIGHT

🥊 Johnny
       VS
🥊 Sedo

Who do you predict will win?`,
    {
      inline_keyboard: [
        [
          {
            text: "🥊 Johnny",
            callback_data: "predict_johnny",
          },
          {
            text: "🥊 Sedo",
            callback_data: "predict_sedo",
          },
        ],
      ],
    }
  );
}

// ======================================
// ANSWER BUTTON CLICK
// ======================================

async function answerCallback(
  callbackQueryId: string,
  text: string
) {
  try {
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: false,
        }),
      }
    );
  } catch (error) {
    console.error(
      "Telegram callback error:",
      error
    );
  }
}