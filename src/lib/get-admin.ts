import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function getAdminFromInitData(
  initData: string,
) {
  if (
    typeof initData !== "string" ||
    !initData
  ) {
    throw new Error(
      "Telegram authentication is required",
    );
  }

  const telegramUser =
    validateTelegramInitData(initData);

  if (!telegramUser) {
    throw new Error(
      "Invalid Telegram authentication",
    );
  }

  const telegramId =
    String(telegramUser.id);

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

  if (user.role !== "ADMIN") {
    throw new Error(
      "Admin access required",
    );
  }

  return user;
}