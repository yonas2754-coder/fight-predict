import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function getAdminFromInitData(
  initData: string,
) {
  // ---------------------------------------------
  // Check initData
  // ---------------------------------------------

  if (
    !initData ||
    typeof initData !== "string"
  ) {
    throw new Error(
      "Telegram authentication is required",
    );
  }

  // ---------------------------------------------
  // Validate Telegram authentication
  // ---------------------------------------------

  const telegramUser =
    validateTelegramInitData(
      initData,
    );

  if (!telegramUser) {
    throw new Error(
      "Invalid Telegram authentication",
    );
  }

  // ---------------------------------------------
  // Get Telegram ID
  // ---------------------------------------------

  const telegramId =
    String(telegramUser.id);

  // ---------------------------------------------
  // Find user
  // ---------------------------------------------

  const user =
    await prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

  if (!user) {
    throw new Error(
      "User not found",
    );
  }

  // ---------------------------------------------
  // Check admin role
  // ---------------------------------------------

  if (user.role !== "ADMIN") {
    throw new Error(
      "Admin access required",
    );
  }

  // ---------------------------------------------
  // Return admin
  // ---------------------------------------------

  return user;
}