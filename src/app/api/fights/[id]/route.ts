import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const fight = await prisma.fight.findUnique({
      where: {
        id,
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

    return NextResponse.json({
      success: true,
      data: fight,
    });
  } catch (error) {
    console.error("Get fight error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load fight",
      },
      {
        status: 500,
      },
    );
  }
}