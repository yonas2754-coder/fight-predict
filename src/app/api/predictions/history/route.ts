import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  validateTelegramInitData,
} from "@/lib/telegram-auth";

export async function GET(
  request: NextRequest,
) {
  try {
    const initData =
      request.headers.get(
        "x-telegram-init-data",
      );

    if (
      typeof initData !== "string" ||
      !initData
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

    const telegramId =
      String(telegramUser.id);

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

    const predictions =
      await prisma.prediction.findMany({
        where: {
          userId: user.id,
        },

        select: {
          id: true,
          selectedFighter: true,
          amount: true,
          status: true,
          potentialWin: true,
          createdAt: true,

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

    return NextResponse.json({
      success: true,

      data: {
        predictions,
      },
    });
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