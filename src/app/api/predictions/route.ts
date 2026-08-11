import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      initData,
      fightId,
      selectedFighter,
      amount,
    } = body;

    if (
      typeof initData !== "string" ||
      !initData
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram authentication is required",
        },
        {
          status: 401,
        },
      );
    }

    if (
      typeof fightId !== "string" ||
      !fightId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Fight ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      selectedFighter !== "Sedo" &&
      selectedFighter !== "Johnny"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid fighter",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid prediction amount",
        },
        {
          status: 400,
        },
      );
    }

    const telegram = validateTelegramInitData(
      initData,
    );

    const telegramId = String(
      telegram.user.id,
    );

    const user = await prisma.user.findUnique({
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

    const fight = await prisma.fight.findUnique({
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

    if (fight.status !== "UPCOMING") {
      return NextResponse.json(
        {
          success: false,
          error: "Predictions are closed",
        },
        {
          status: 400,
        },
      );
    }

    if (amount > user.balance) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient balance",
        },
        {
          status: 400,
        },
      );
    }

    const probability =
      selectedFighter === fight.fighterAName
        ? fight.fighterAProbability
        : fight.fighterBProbability;

    const potentialWin = Math.floor(
      (amount * 100) / probability,
    );

    const prediction =
      await prisma.$transaction(async (tx) => {
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

        if (updatedUser.count !== 1) {
          throw new Error(
            "Insufficient balance",
          );
        }

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
      });

    const updatedUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          balance: true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        data: {
          prediction,

          balance:
            updatedUser?.balance ?? 0,
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