import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fights = await prisma.fight.findMany({
      where: {
        status: {
          in: ["UPCOMING", "LIVE"],
        },
      },

      orderBy: {
        scheduledAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: fights,
    });
  } catch (error) {
    console.error("Failed to load fights:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load fights",
      },
      {
        status: 500,
      },
    );
  }
}