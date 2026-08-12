import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromInitData } from "@/lib/admin";

export async function GET(
  request: NextRequest,
) {
  try {
    const initData =
      request.headers.get(
        "x-telegram-init-data",
      );

    await getAdminFromInitData(
      initData || "",
    );

    const fights =
      await prisma.fight.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          _count: {
            select: {
              predictions: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      data: fights,
    });
  } catch (error) {
    console.error(
      "Admin fights error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load fights";

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