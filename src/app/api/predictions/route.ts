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

    const body = await request.json();

    const {
      initData,
      fightId,
      selectedFighter,
      amount,
    } = body;

    // ---------------------------------------------
    // Validate Telegram authentication
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
    // Validate fight ID
    // ---------------------------------------------

    if (
      typeof fightId !== "string" ||
      !fightId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fight ID is required",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate fighter
    // ---------------------------------------------

    if (
      typeof selectedFighter !== "string" ||
      !selectedFighter
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fighter selection is required",
        },
        {
          status: 400,
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
            "Invalid prediction amount",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Find user
    // ---------------------------------------------

    const telegramId =
      String(telegramUser.id);

    const user =
      await prisma.user.findUnique({
        where: {
          telegramId,
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
    // Find fight
    // ---------------------------------------------

    const fight =
      await prisma.fight.findUnique({
        where: {
          id: fightId,
        },
      });

    if (!fight) {
      return NextResponse.json(
        {
          success: false,
          error: "Fight not found",
        },
        {
          status: 404,
        },
      );
    }

    // ---------------------------------------------
    // Check fight status
    // ---------------------------------------------

    if (fight.status !== "UPCOMING") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Predictions are closed",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Check fighter
    // ---------------------------------------------

    let probability: number;

    if (
      selectedFighter ===
      fight.fighterAName
    ) {
      probability =
        fight.fighterAProbability;
    } else if (
      selectedFighter ===
      fight.fighterBName
    ) {
      probability =
        fight.fighterBProbability;
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected fighter does not belong to this fight",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate probability
    // ---------------------------------------------

    if (
      !Number.isInteger(
        probability,
      ) ||
      probability <= 0 ||
      probability > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid fighter probability",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Check balance
    // ---------------------------------------------

    if (amount > user.balance) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Insufficient balance",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Calculate potential winnings
    // ---------------------------------------------

    const potentialWin =
      Math.floor(
        (amount * 100) /
          probability,
      );

    // ---------------------------------------------
    // Create prediction transaction
    // ---------------------------------------------

    const prediction =
      await prisma.$transaction(
        async (tx) => {
          // Re-check balance inside
          // transaction to prevent
          // concurrent bets.

          const updatedUser =
            await tx.user.updateMany({
              where: {
                id: user.id,

                balance: {
                  gte: amount,
                },
              },

              data: {
                balance: {
                  decrement: amount,
                },
              },
            });

          if (
            updatedUser.count !== 1
          ) {
            throw new Error(
              "INSUFFICIENT_BALANCE",
            );
          }

          // Create prediction

          const newPrediction =
            await tx.prediction.create({
              data: {
                userId: user.id,

                fightId: fight.id,

                selectedFighter,

                amount,

                potentialWin,

                status: "PENDING",
              },
            });

          // Create wallet transaction

          await tx.transaction.create({
            data: {
              userId: user.id,

              type: "PREDICTION",

              amount: -amount,

              description:
                `Prediction on ${selectedFighter}`,
            },
          });

          return newPrediction;
        },
      );

    // ---------------------------------------------
    // Get updated balance
    // ---------------------------------------------

    const updatedUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          balance: true,
        },
      });

    // ---------------------------------------------
    // Return response
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: true,

        data: {
          prediction,

          balance:
            updatedUser?.balance ??
            0,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Prediction error:",
      error,
    );

    // ---------------------------------------------
    // Insufficient balance
    // ---------------------------------------------

    if (
      error instanceof Error &&
      error.message ===
        "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Insufficient balance",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // General error
    // ---------------------------------------------

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Prediction failed",
      },
      {
        status: 500,
      },
    );
  }
}