import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromInitData } from "@/lib/admin";

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const {
      initData,
      fightId,
      winner,
    } = body;

    await getAdminFromInitData(
      initData,
    );

    if (
      typeof fightId !== "string" ||
      !fightId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Fight ID is required",
        },
        { status: 400 },
      );
    }

    if (
      typeof winner !== "string" ||
      !winner
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Winner is required",
        },
        { status: 400 },
      );
    }

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
        { status: 404 },
      );
    }

    if (
      winner !==
        fight.fighterAName &&
      winner !==
        fight.fighterBName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Winner must be one of the fighters",
        },
        { status: 400 },
      );
    }

    if (
      fight.status === "FINISHED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fight has already been settled",
        },
        { status: 400 },
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const predictions =
            await tx.prediction.findMany(
              {
                where: {
                  fightId: fight.id,

                  status: "PENDING",
                },
              },
            );

          let winners = 0;
          let losers = 0;

          for (
            const prediction of predictions
          ) {
            const won =
              prediction.selectedFighter ===
              winner;

            if (won) {
              await tx.prediction.update(
                {
                  where: {
                    id: prediction.id,
                  },

                  data: {
                    status: "WON",
                  },
                },
              );

              await tx.user.update({
                where: {
                  id: prediction.userId,
                },

                data: {
                  balance: {
                    increment:
                      prediction.potentialWin,
                  },
                },
              });

              await tx.transaction.create(
                {
                  data: {
                    userId:
                      prediction.userId,

                    type: "WIN",

                    amount:
                      prediction.potentialWin,

                    description:
                      `Won prediction on ${fight.title}`,
                  },
                },
              );

              winners++;
            } else {
              await tx.prediction.update(
                {
                  where: {
                    id: prediction.id,
                  },

                  data: {
                    status: "LOST",
                  },
                },
              );

              losers++;
            }
          }

          const updatedFight =
            await tx.fight.update({
              where: {
                id: fight.id,
              },

              data: {
                winner,
                status: "FINISHED",
              },
            });

          return {
            fight: updatedFight,
            winners,
            losers,
          };
        },
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Settlement error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to settle fight";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message ===
          "Admin access required"
            ? 403
            : 500,
      },
    );
  }
}