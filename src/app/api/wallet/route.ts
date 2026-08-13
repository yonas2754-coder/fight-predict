import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request.json();

    const initData = body.initData;

    if (!initData) {
      return NextResponse.json(
        {
          error: "Telegram authentication required",
        },
        {
          status: 401,
        },
      );
    }

    const telegramUser =
      validateTelegramInitData(initData);

    if (!telegramUser) {
      return NextResponse.json(
        {
          error: "Invalid Telegram authentication",
        },
        {
          status: 401,
        },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          telegramId: String(
            telegramUser.id,
          ),
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    const deposits =
      await prisma.deposit.findMany({
        where: {
          userId: user.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 50,
      });

    const transactions =
      await prisma.transaction.findMany({
        where: {
          userId: user.id,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 50,
      });

    return NextResponse.json({
      data: {
        balance: user.balance,
        deposits,
        transactions,
      },
    });
  } catch (error) {
    console.error(
      "Wallet error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load wallet",
      },
      {
        status: 500,
      },
    );
  }
}