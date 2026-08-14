import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  validateTelegramInitData,
} from "@/lib/telegram-auth";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
) {
  try {
    console.log("Broadcast API started");

    /*
     * Read multipart/form-data
     */

    const formData =
      await request.formData();

    const initData =
      formData.get("initData");

    const message =
      formData.get("message");

    const image =
      formData.get("image");

    console.log("Has initData:", !!initData);
    console.log("Has message:", !!message);
    console.log("Has image:", image instanceof File);

    /*
     * Validate initData
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
        { status: 401 },
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
          error: "Message is required",
        },
        { status: 400 },
      );
    }

    /*
     * Validate Telegram user
     */

    const telegramUser =
      validateTelegramInitData(
        initData,
      );

    if (!telegramUser) {
      return NextResponse.json(
        {
          error:
            "Invalid Telegram authentication",
        },
        { status: 401 },
      );
    }

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
          error: "Admin not found",
        },
        { status: 404 },
      );
    }

    /*
     * Check admin role
     */

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Admin access required",
        },
        { status: 403 },
      );
    }

    /*
     * Bot token
     */

    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        {
          error:
            "TELEGRAM_BOT_TOKEN is missing",
        },
        { status: 500 },
      );
    }

    /*
     * Get users
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
     * Check image
     */

    const imageFile =
      image instanceof File &&
      image.size > 0
        ? image
        : null;

    /*
     * Send messages
     */

    for (const user of users) {
      try {
        let telegramResponse;

        /*
         * IMAGE + MESSAGE
         */

        if (imageFile) {
          const telegramForm =
            new FormData();

          telegramForm.append(
            "chat_id",
            String(user.telegramId),
          );

          telegramForm.append(
            "caption",
            message.trim(),
          );

          telegramForm.append(
            "photo",
            imageFile,
          );

          telegramResponse =
            await fetch(
              `https://api.telegram.org/bot${botToken}/sendPhoto`,
              {
                method: "POST",
                body: telegramForm,
              },
            );
        }

        /*
         * TEXT ONLY
         */

        else {
          telegramResponse =
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
                    String(
                      user.telegramId,
                    ),

                  text:
                    message.trim(),
                }),
              },
            );
        }

        const telegramResult =
          await telegramResponse
            .json()
            .catch(() => null);

        if (
          telegramResponse.ok &&
          telegramResult?.ok
        ) {
          sent++;
        } else {
          failed++;

          console.error(
            "Telegram error:",
            telegramResult,
          );
        }
      } catch (error) {
        failed++;

        console.error(
          `Failed for ${user.telegramId}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,

      data: {
        total: users.length,
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error(
      "Broadcast API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Broadcast failed",
      },
      {
        status: 500,
      },
    );
  }
}