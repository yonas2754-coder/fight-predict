import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  validateTelegramInitData,
} from "@/lib/telegram-auth";

export async function POST(
  request: NextRequest,
) {
  try {
    /*
     * Get request body
     */

    const body =
      await request.json();

    const {
      initData,
      message,
      imageUrl,
    } = body;

    /*
     * Validate Telegram authentication
     */

    if (
      typeof initData !== "string" ||
      !initData
    ) {
      return NextResponse.json(
        {
          error:
            "Telegram authentication required",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Validate message
     */

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Message is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Validate image URL
     * Image is optional
     */

    if (
      imageUrl !== null &&
      imageUrl !== undefined &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid image URL",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Validate Telegram user
     */

    const authResult =
      validateTelegramInitData(
        initData,
      );

    if (!authResult) {
      return NextResponse.json(
        {
          error:
            "Invalid Telegram authentication",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Telegram user
     */

    const telegramUser =
      authResult;

    /*
     * Find admin in database
     */

    const admin =
      await prisma.user.findUnique({
        where: {
          telegramId: String(
            telegramUser.id,
          ),
        },
      });

    /*
     * Admin doesn't exist
     */

    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Admin not found",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Check admin role
     */

    if (
      admin.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Admin access required",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Check bot token
     */

    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        {
          error:
            "TELEGRAM_BOT_TOKEN is not configured",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Get all users
     */

    const users =
      await prisma.user.findMany({
        select: {
          telegramId: true,
        },
      });

    /*
     * Counters
     */

    let sent = 0;
    let failed = 0;

    /*
     * Clean image URL
     */

    const cleanImageUrl =
      typeof imageUrl === "string"
        ? imageUrl.trim()
        : "";

    /*
     * Send to every user
     */

    for (const user of users) {
      try {
        let response: Response;

        /*
         * IMAGE + MESSAGE
         */

        if (cleanImageUrl) {
          response =
            await fetch(
              `https://api.telegram.org/bot${botToken}/sendPhoto`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  chat_id:
                    user.telegramId,

                  photo:
                    cleanImageUrl,

                  caption:
                    message.trim(),
                }),
              },
            );
        }

        /*
         * TEXT ONLY
         */

        else {
          response =
            await fetch(
              `https://api.telegram.org/bot${botToken}/sendMessage`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  chat_id:
                    user.telegramId,

                  text:
                    message.trim(),
                }),
              },
            );
        }

        /*
         * Check Telegram response
         */

        if (response.ok) {
          sent++;
        } else {
          failed++;

          const errorData =
            await response
              .json()
              .catch(
                () => null,
              );

          console.error(
            `Telegram broadcast failed for ${user.telegramId}:`,
            errorData,
          );
        }
      } catch (error) {
        failed++;

        console.error(
          `Failed to send broadcast to ${user.telegramId}`,
          error,
        );
      }
    }

    /*
     * Return result
     */

    return NextResponse.json({
      success: true,

      data: {
        total:
          users.length,

        sent,

        failed,
      },
    });
  } catch (error) {
    console.error(
      "Broadcast error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to send broadcast",
      },
      {
        status: 500,
      },
    );
  }
}