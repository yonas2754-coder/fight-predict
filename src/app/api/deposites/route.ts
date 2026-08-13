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
      amount,
      transactionNumber,
      screenshotUrl,
    } = body;

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

    // ---------------------------------------------
    // Validate amount
    // ---------------------------------------------

    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid deposit amount",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate transaction number
    // ---------------------------------------------

    if (
      typeof transactionNumber !==
        "string" ||
      !transactionNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Telebirr transaction number is required",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate screenshot
    // ---------------------------------------------

    if (
      typeof screenshotUrl !==
        "string" ||
      !screenshotUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment screenshot is required",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Find user
    // ---------------------------------------------

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
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // ---------------------------------------------
    // Prevent duplicate transaction number
    // ---------------------------------------------

    const existingDeposit =
      await prisma.deposit.findFirst({
        where: {
          transactionNumber:
            transactionNumber.trim(),
        },
      });

    if (existingDeposit) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This Telebirr transaction number has already been submitted",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------
    // Create deposit
    // ---------------------------------------------

    const deposit =
      await prisma.deposit.create({
        data: {
          userId: user.id,

          amount,

          transactionNumber:
            transactionNumber.trim(),

          screenshotUrl,

          status: "PENDING",
        },
      });

    // ---------------------------------------------
    // Return deposit
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Deposit submitted successfully. Waiting for admin approval.",

        data: {
          deposit,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create deposit error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to submit deposit",
      },
      {
        status: 500,
      },
    );
  }
}