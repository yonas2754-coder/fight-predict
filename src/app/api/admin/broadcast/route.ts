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
    const body =
      await request.json();

    const {
      initData,
      message,
    } = body;

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
     * IMPORTANT:
     * Your current validation function
     * returns TelegramUser directly.
     */

    const telegramUser =
      authResult;

    /*
     * Find admin
     */

    const admin =
      await prisma.user.findUnique({
        where: {
          telegramId: String(
            telegramUser.id,
          ),
        },
      });

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

    if (admin.role !== "ADMIN") {
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
     * Get all users
     */

    const users =
      await prisma.user.findMany({
        select: {
          telegramId: true,
        },
      });

    let sent = 0;
    let failed = 0;

    /*
     * Send Telegram message
     */

    for (const user of users) {
      try {
        const response =
          await fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
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

        if (response.ok) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(
          `Failed to send message to ${user.telegramId}`,
          error,
        );

        failed++;
      }
    }

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