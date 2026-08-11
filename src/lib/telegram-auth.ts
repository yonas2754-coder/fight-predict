import "server-only";

import crypto from "crypto";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type TelegramAuthResult = {
  user: TelegramUser;
  authDate: number;
};

export function validateTelegramInitData(
  initData: string,
): TelegramAuthResult {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured",
    );
  }

  if (!initData) {
    throw new Error(
      "Telegram initData is missing",
    );
  }

  const params =
    new URLSearchParams(initData);

  const receivedHash =
    params.get("hash");

  if (!receivedHash) {
    throw new Error(
      "Telegram hash is missing",
    );
  }

  params.delete("hash");

  const dataCheckString =
    Array.from(params.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b),
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

  const receivedBuffer =
    Buffer.from(
      receivedHash,
      "hex",
    );

  const calculatedBuffer =
    Buffer.from(
      calculatedHash,
      "hex",
    );

  if (
    receivedBuffer.length !==
    calculatedBuffer.length
  ) {
    throw new Error(
      "Invalid Telegram authentication",
    );
  }

  if (
    !crypto.timingSafeEqual(
      receivedBuffer,
      calculatedBuffer,
    )
  ) {
    throw new Error(
      "Invalid Telegram authentication",
    );
  }

  const authDateValue =
    params.get("auth_date");

  if (!authDateValue) {
    throw new Error(
      "Telegram auth_date is missing",
    );
  }

  const authDate =
    Number(authDateValue);

  if (!Number.isFinite(authDate)) {
    throw new Error(
      "Invalid Telegram auth_date",
    );
  }

  const now =
    Math.floor(
      Date.now() / 1000,
    );

  const maxAge =
    60 * 60 * 24;

  if (
    now - authDate >
    maxAge
  ) {
    throw new Error(
      "Telegram authentication has expired",
    );
  }

  const userValue =
    params.get("user");

  if (!userValue) {
    throw new Error(
      "Telegram user is missing",
    );
  }

  const user =
    JSON.parse(userValue) as TelegramUser;

  return {
    user,
    authDate,
  };
}