import { NextRequest, NextResponse } from "next/server";
import { telegramBotRequest } from "@/lib/telegram-bot";

const MINI_APP_URL =
  process.env.NEXT_PUBLIC_MINI_APP_URL;

const WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(
  request: NextRequest,
) {
  try {
    /*
     * Check Telegram webhook secret
     */
    const secret =
      request.headers.get(
        "x-telegram-bot-api-secret-token",
      );

    if (
      !WEBHOOK_SECRET ||
      secret !== WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Check Mini App URL
     */
    if (!MINI_APP_URL) {
      console.error(
        "NEXT_PUBLIC_MINI_APP_URL is missing",
      );

      return NextResponse.json(
        {
          error: "Mini App URL is not configured",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Get Telegram update
     */
    const update = await request.json();

    console.log(
      "Telegram update:",
      JSON.stringify(update, null, 2),
    );

    /*
     * Telegram message
     */
    const message = update.message;

    if (!message) {
      return NextResponse.json({
        ok: true,
      });
    }

    const chatId = message.chat?.id;

    if (!chatId) {
      return NextResponse.json({
        ok: true,
      });
    }

    /*
     * User information
     */
    const user = message.from;

    console.log(
      "Telegram user:",
      user?.id,
      user?.username,
    );

    /*
     * Message text
     */
    const text =
      typeof message.text === "string"
        ? message.text
        : "";

    /*
     * /start
     */
    if (text.startsWith("/start")) {
      const startParameter =
        text.split(" ")[1] || null;

      console.log(
        "Start parameter:",
        startParameter,
      );

      await sendWelcomeMessage(chatId);

      return NextResponse.json({
        ok: true,
      });
    }

    /*
     * /play
     */
    if (text === "/play") {
      await sendPlayMessage(chatId);

      return NextResponse.json({
        ok: true,
      });
    }

    /*
     * /help
     */
    if (text === "/help") {
      await telegramBotRequest(
        "sendMessage",
        {
          chat_id: chatId,

          text:
            `🥊 FightPredict Help\n\n` +
            `🎮 /play - Open FightPredict\n` +
            `ℹ️ /help - Show help`,
        },
      );

      return NextResponse.json({
        ok: true,
      });
    }

    /*
     * Any other message
     */
    await sendPlayMessage(chatId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error,
    );

    /*
     * Telegram expects a response.
     */
    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * Welcome message
 */
async function sendWelcomeMessage(
  chatId: number | string,
) {
  await telegramBotRequest(
    "sendMessage",
    {
      chat_id: chatId,

      text:
        `🥊 Welcome to FightPredict!\n\n` +
        `🔥 Predict upcoming fights\n` +
        `🏆 Win up to 1,000,000 ETB\n` +
        `💰 Start playing now!\n\n` +
        `👇 Tap the button below to play.`,

      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎮 Play FightPredict",

              web_app: {
                url: MINI_APP_URL,
              },
            },
            
          ],
        ],
      },
    },
  );
}

/*
 * Play message
 */
async function sendPlayMessage(
  chatId: number | string,
) {
  await telegramBotRequest(
    "sendMessage",
    {
      chat_id: chatId,

      text:
        `🥊 FightPredict\n\n` +
        `Ready to make your prediction?\n\n` +
        `👇 Open the Mini App:`,

      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎮 Play FightPredict",

              web_app: {
                url: MINI_APP_URL,
              },
            },
          ],
        ],
      },
    },
  );
}