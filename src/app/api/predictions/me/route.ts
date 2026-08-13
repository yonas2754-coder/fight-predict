import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function GET(
  request: NextRequest,
) {
  try {
    // ---------------------------------------------
    // Get Telegram initData
    // ---------------------------------------------

    const initData =
      request.headers.get(
        "x-telegram-init-data",
      );

    if (
      !initData ||
      typeof initData !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Telegram authentication is required",
        },
        {
          status: 401,
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
    // Get Telegram ID
    // ---------------------------------------------

    const telegramId =
      String(telegramUser.id);

    // ---------------------------------------------
    // Find user
    // ---------------------------------------------

    const user =
      await prisma.user.findUnique({
        where: {
          telegramId,
        },

        select: {
          id: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // ---------------------------------------------
    // Get prediction history
    // ---------------------------------------------

    const predictions =
      await prisma.prediction.findMany({
        where: {
          userId: user.id,
        },

        include: {
          fight: {
            select: {
              id: true,

              title: true,

              fighterAName: true,

              fighterBName: true,

              fighterAProbability: true,

              fighterBProbability: true,

              winner: true,

              status: true,

              scheduledAt: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 50,
      });

    // ---------------------------------------------
    // Return prediction history
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: predictions,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Prediction history error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to load prediction history",
      },
      {
        status: 500,
      },
    );
  }
}