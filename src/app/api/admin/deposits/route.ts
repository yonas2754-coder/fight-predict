import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromInitData } from "@/lib/get-admin";

export async function GET(
  request: NextRequest,
) {
  try {
    // ---------------------------------------------
    // Get Telegram authentication
    // ---------------------------------------------

    const initData =
      request.headers.get(
        "x-telegram-init-data",
      );

    if (
      !initData ||
      typeof initData !== "string"
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

    // ---------------------------------------------
    // Check admin
    // ---------------------------------------------

    await getAdminFromInitData(
      initData,
    );

    // ---------------------------------------------
    // Get deposits
    // ---------------------------------------------

    const deposits =
      await prisma.deposit.findMany({
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              balance: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });

    return NextResponse.json({
      success: true,

      data: {
        deposits,
      },
    });
  } catch (error) {
    console.error(
      "Admin deposits error:",
      error,
    );

    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "Telegram authentication is required"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          {
            status: 401,
          },
        );
      }

      if (
        error.message ===
        "Invalid Telegram authentication"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          {
            status: 401,
          },
        );
      }

      if (
        error.message ===
        "User not found"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          {
            status: 404,
          },
        );
      }

      if (
        error.message ===
        "Admin access required"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          {
            status: 403,
          },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load deposits",
      },
      {
        status: 500,
      },
    );
  }
}