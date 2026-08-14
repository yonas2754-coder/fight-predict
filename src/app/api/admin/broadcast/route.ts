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
     * Read FormData
     */

    const formData =
      await request.formData();

    const initData =
      formData.get("initData");

    const message =
      formData.get("message");

    const image =
      formData.get("image");

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
     * Validate image
     */

    let imageFile: File | null =
      null;

    if (
      image instanceof File &&
      image.size > 0
    ) {
      imageFile = image;
    }

    /*
     * Validate Telegram authentication
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
     * Telegram bot token
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

    let sent = 0;
    let failed = 0;

    /*
     * Send to every user
     */

    for (const user of users) {
      try {
        let response: Response;

        /*
         * IMAGE + MESSAGE
         */

        if (imageFile) {
          const telegramForm =
            new FormData();

          telegramForm.append(
            "chat_id",
            user.telegramId,
          );

          telegramForm.append(
            "caption",
            message.trim(),
          );

          telegramForm.append(
            "photo",
            imageFile,
            imageFile.name,
          );

          response =
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
         * Check result
         */

        if (response.ok) {
          sent++;
        } else {
          failed++;

          const telegramError =
            await response
              .json()
              .catch(
                () => null,
              );

          console.error(
            `Telegram failed for ${user.telegramId}:`,
            telegramError,
          );
        }
      } catch (error) {
        failed++;

        console.error(
          `Failed to send to ${user.telegramId}:`,
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