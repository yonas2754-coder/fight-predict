import crypto from "crypto";

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramAuthResult =
  | TelegramUser
  | null;

export function validateTelegramInitData(
  initData: string,
): TelegramAuthResult {
  try {
    if (!initData) {
      return null;
    }

    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error(
        "TELEGRAM_BOT_TOKEN is missing",
      );

      return null;
    }

    const params =
      new URLSearchParams(initData);

    const hash = params.get("hash");

    if (!hash) {
      return null;
    }

    params.delete("hash");

    const dataCheckString =
      Array.from(params.entries())
        .sort(([keyA], [keyB]) =>
          keyA.localeCompare(keyB),
        )
        .map(
          ([key, value]) =>
            `${key}=${value}`,
        )
        .join("\n");

    const secretKey =
      crypto
        .createHmac(
          "sha256",
          "WebAppData",
        )
        .update(botToken)
        .digest();

    const calculatedHash =
      crypto
        .createHmac(
          "sha256",
          secretKey,
        )
        .update(dataCheckString)
        .digest("hex");

    if (calculatedHash !== hash) {
      return null;
    }

    const userData =
      params.get("user");

    if (!userData) {
      return null;
    }

    const user =
      JSON.parse(
        userData,
      ) as TelegramUser;

    if (!user.id) {
      return null;
    }

    return user;
  } catch (error) {
    console.error(
      "Telegram authentication error:",
      error,
    );

    return null;
  }
}