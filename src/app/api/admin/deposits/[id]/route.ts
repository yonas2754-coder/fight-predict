import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getAdminFromInitData,
} from "@/lib/get-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // ---------------------------------------------
    // Get deposit ID
    // ---------------------------------------------

    const { id } =
      await context.params;

    // ---------------------------------------------
    // Read body
    // ---------------------------------------------

    const body =
      await request.json();

    const {
      initData,
      action,
      adminNote,
    } = body;

    // ---------------------------------------------
    // Validate authentication
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

    // ---------------------------------------------
    // Check admin
    // ---------------------------------------------

    await getAdminFromInitData(
      initData,
    );

    // ---------------------------------------------
    // Validate action
    // ---------------------------------------------

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Action must be APPROVE or REJECT",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // APPROVE
    // ---------------------------------------------

    if (action === "APPROVE") {
      const result =
        await prisma.$transaction(
          async (tx) => {
            const deposit =
              await tx.deposit.findUnique(
                {
                  where: {
                    id,
                  },
                },
              );

            if (!deposit) {
              throw new Error(
                "DEPOSIT_NOT_FOUND",
              );
            }

            if (
              deposit.status !==
              "PENDING"
            ) {
              throw new Error(
                "DEPOSIT_ALREADY_REVIEWED",
              );
            }

            // Update deposit

            const updatedDeposit =
              await tx.deposit.update({
                where: {
                  id,
                },

                data: {
                  status: "APPROVED",

                  adminNote:
                    typeof adminNote ===
                      "string" &&
                    adminNote.trim()
                      ? adminNote.trim()
                      : null,

                  reviewedAt:
                    new Date(),
                },
              });

            // Increase balance

            const updatedUser =
              await tx.user.update({
                where: {
                  id: deposit.userId,
                },

                data: {
                  balance: {
                    increment:
                      deposit.amount,
                  },
                },
              });

            // Create transaction

            const transaction =
              await tx.transaction.create(
                {
                  data: {
                    userId:
                      deposit.userId,

                    type: "DEPOSIT",

                    amount:
                      deposit.amount,

                    description:
                      `Telebirr deposit approved. Transaction: ${deposit.transactionNumber}`,
                  },
                },
              );

            return {
              deposit:
                updatedDeposit,

              user: {
                id: updatedUser.id,

                balance:
                  updatedUser.balance,
              },

              transaction,
            };
          },
        );

      return NextResponse.json({
        success: true,

        message:
          "Deposit approved successfully",

        data: result,
      });
    }

    // ---------------------------------------------
    // REJECT
    // ---------------------------------------------

    const deposit =
      await prisma.deposit.findUnique({
        where: {
          id,
        },
      });

    if (!deposit) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Deposit not found",
        },
        {
          status: 404,
        },
      );
    }

    if (
      deposit.status !== "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This deposit has already been reviewed",
        },
        {
          status: 409,
        },
      );
    }

    const rejectedDeposit =
      await prisma.deposit.update({
        where: {
          id,
        },

        data: {
          status: "REJECTED",

          adminNote:
            typeof adminNote ===
              "string" &&
            adminNote.trim()
              ? adminNote.trim()
              : null,

          reviewedAt:
            new Date(),
        },
      });

    return NextResponse.json({
      success: true,

      message:
        "Deposit rejected successfully",

      data: {
        deposit:
          rejectedDeposit,
      },
    });
  } catch (error) {
    console.error(
      "Review deposit error:",
      error,
    );

    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "DEPOSIT_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Deposit not found",
          },
          {
            status: 404,
          },
        );
      }

      if (
        error.message ===
        "DEPOSIT_ALREADY_REVIEWED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This deposit has already been reviewed",
          },
          {
            status: 409,
          },
        );
      }

      if (
        error.message ===
          "Admin access required" ||
        error.message ===
          "User not found"
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
          "Failed to review deposit",
      },
      {
        status: 500,
      },
    );
  }
}