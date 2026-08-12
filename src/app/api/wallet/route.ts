import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function GET(request: NextRequest) {
  try {
    const initData = request.headers.get(
      "x-telegram-init-data",
    );

    if (!initData) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram authentication is required",
        },
        { status: 401 },
      );
    }

    const telegram = validateTelegramInitData(initData);

    const telegramId = String(telegram.user.id);

    const user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
      select: {
        id: true,
        balance: true,
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: user.balance,
        transactions: user.transactions,
      },
    });
  } catch (error) {
    console.error("Wallet error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load wallet",
      },
      { status: 500 },
    );
  }
}