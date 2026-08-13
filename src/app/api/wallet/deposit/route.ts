import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request.json();

    const {
      initData,
      amount,
      transactionNumber,
      screenshot,
    } = body;

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

    const depositAmount =
      Number(amount);

    if (
      !Number.isInteger(
        depositAmount,
      ) ||
      depositAmount <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid deposit amount",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !transactionNumber ||
      typeof transactionNumber !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Transaction number is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Prevent duplicate transaction
     * numbers.
     */

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
          error:
            "This transaction number has already been submitted",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Basic screenshot validation.
     *
     * The screenshot is NOT stored in the
     * database yet.
     *
     * In the next step we should upload it
     * to proper file storage.
     */

    let screenshotUrl: string | null =
      null;

    if (
      screenshot &&
      typeof screenshot === "string"
    ) {
      /*
       * Temporary placeholder.
       *
       * Do NOT store a huge base64 string
       * in PostgreSQL.
       *
       * We'll replace this with Cloudinary,
       * S3, or another storage provider.
       */
      screenshotUrl = null;
    }

    const deposit =
      await prisma.deposit.create({
        data: {
          userId: user.id,
          amount: depositAmount,
          transactionNumber:
            transactionNumber.trim(),
          screenshotUrl,
          status: "PENDING",
        },
      });

    return NextResponse.json(
      {
        data: {
          deposit,
        },

        message:
          "Deposit submitted successfully",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Deposit error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to submit deposit",
      },
      {
        status: 500,
      },
    );
  }
}