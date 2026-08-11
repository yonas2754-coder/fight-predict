import { NextRequest, NextResponse } from "next/server";

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

    const initData =
      body?.initData;

    if (
      typeof initData !== "string" ||
      !initData
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Telegram initData is required",
        },
        {
          status: 400,
        },
      );
    }

    const telegram =
      validateTelegramInitData(
        initData,
      );

    const telegramUser =
      telegram.user;

    const user =
      await prisma.user.upsert({
        where: {
          telegramId:
            String(telegramUser.id),
        },

        update: {
          username:
            telegramUser.username,

          firstName:
            telegramUser.first_name,

          lastName:
            telegramUser.last_name,

          photoUrl:
            telegramUser.photo_url,
        },

        create: {
          telegramId:
            String(telegramUser.id),

          username:
            telegramUser.username,

          firstName:
            telegramUser.first_name,

          lastName:
            telegramUser.last_name,

          photoUrl:
            telegramUser.photo_url,

          balance: 1000,

          transactions: {
            create: {
              type:
                "INITIAL_BALANCE",

              amount: 1000,

              description:
                "Initial virtual points",
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      data: {
        user: {
          id: user.id,

          telegramId:
            user.telegramId,

          username:
            user.username,

          firstName:
            user.firstName,

          lastName:
            user.lastName,

          photoUrl:
            user.photoUrl,

          balance:
            user.balance,

          role:
            user.role,
        },
      },
    });
  } catch (error) {
    console.error(
      "Telegram authentication error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Telegram authentication failed",
      },
      {
        status: 401,
      },
    );
  }
}