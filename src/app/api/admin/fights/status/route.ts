import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromInitData } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const {
      initData,
      fightId,
      status,
    } = body;

    await getAdminFromInitData(
      initData,
    );

    if (
      !fightId ||
      typeof fightId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Fight ID is required",
        },
        { status: 400 },
      );
    }

    const validStatuses = [
      "UPCOMING",
      "LIVE",
      "FINISHED",
      "CANCELLED",
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid fight status",
        },
        { status: 400 },
      );
    }

    const fight =
      await prisma.fight.update({
        where: {
          id: fightId,
        },

        data: {
          status,
        },
      });

    return NextResponse.json({
      success: true,
      data: fight,
    });
  } catch (error) {
    console.error(
      "Update fight status error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update fight",
      },
      { status: 500 },
    );
  }
}