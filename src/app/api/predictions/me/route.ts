import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function GET(
  request: NextRequest,
) {
  try {
    const initData =
      request.headers.get(
        "x-telegram-init-data",
      );

    if (!initData) {
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

    const telegram =
      validateTelegramInitData(
        initData,
      );

    const user =
      await prisma.user.findUnique({
        where: {
          telegramId: String(
            telegram.user.id,
          ),
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

        include: {
          fight: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,

      data: predictions,
    });
  } catch (error) {
    console.error(
      "Failed to load predictions:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load predictions",
      },
      {
        status: 500,
      },
    );
  }
}