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
      title,
      description,
      fighterAName,
      fighterBName,
      fighterAProbability,
      fighterBProbability,
      scheduledAt,
    } = body;

    await getAdminFromInitData(
      initData,
    );

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 },
      );
    }

    if (
      typeof fighterAName !== "string" ||
      !fighterAName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fighter A name is required",
        },
        { status: 400 },
      );
    }

    if (
      typeof fighterBName !== "string" ||
      !fighterBName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fighter B name is required",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(
        fighterAProbability,
      ) ||
      !Number.isInteger(
        fighterBProbability,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Probabilities must be whole numbers",
        },
        { status: 400 },
      );
    }

    if (
      fighterAProbability < 0 ||
      fighterBProbability < 0 ||
      fighterAProbability > 100 ||
      fighterBProbability > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Probabilities must be between 0 and 100",
        },
        { status: 400 },
      );
    }

    if (
      fighterAProbability +
        fighterBProbability !==
      100
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Probabilities must total 100%",
        },
        { status: 400 },
      );
    }

    const fight =
      await prisma.fight.create({
        data: {
          title: title.trim(),

          description:
            typeof description ===
            "string"
              ? description.trim()
              : null,

          fighterAName:
            fighterAName.trim(),

          fighterBName:
            fighterBName.trim(),

          fighterAProbability,

          fighterBProbability,

          scheduledAt:
            scheduledAt
              ? new Date(
                  scheduledAt,
                )
              : null,

          status: "UPCOMING",
        },
      });

    return NextResponse.json(
      {
        success: true,
        data: fight,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create fight error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create fight";

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