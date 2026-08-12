import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram-auth";

export async function getAdminFromInitData(
  initData: string,
) {
  if (!initData) {
    throw new Error(
      "Telegram authentication is required",
    );
  }

  const telegram =
    validateTelegramInitData(initData);

  const telegramId =
    String(telegram.user.id);

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