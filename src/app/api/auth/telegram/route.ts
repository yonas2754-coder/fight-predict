import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function POST(
  request: NextRequest,
) {
  try {
    // ---------------------------------------------
    // Read request body
    // ---------------------------------------------

    const body =
      await request.json();

    const initData =
      body?.initData;

    // ---------------------------------------------
    // Validate initData
    // ---------------------------------------------

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

    // ---------------------------------------------
    // Validate Telegram authentication
    // ---------------------------------------------

    const telegramUser =
      validateTelegramInitData(
        initData,
      );

    if (!telegramUser) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid Telegram authentication",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------
    // Create or update user
    // ---------------------------------------------

    const telegramId =
      String(telegramUser.id);

    const user =
      await prisma.user.upsert({
        where: {
          telegramId,
        },

        // -----------------------------------------
        // Existing user
        // -----------------------------------------

        update: {
          username:
            telegramUser.username ??
            null,

          firstName:
            telegramUser.first_name,

          lastName:
            telegramUser.last_name ??
            null,

          photoUrl:
            telegramUser.photo_url ??
            null,
        },

        // -----------------------------------------
        // New user
        // -----------------------------------------

        create: {
          telegramId,

          username:
            telegramUser.username ??
            null,

          firstName:
            telegramUser.first_name,

          lastName:
            telegramUser.last_name ??
            null,

          photoUrl:
            telegramUser.photo_url ??
            null,

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

    // ---------------------------------------------
    // Return user
    // ---------------------------------------------

    return NextResponse.json(
      {
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
      },
      {
        status: 200,
      },
    );
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
        status: 500,
      },
    );
  }
}