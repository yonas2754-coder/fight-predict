const TELEGRAM_API =
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function telegramBotRequest(
  method: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `${TELEGRAM_API}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    console.error("Telegram Bot API error:", data);

    throw new Error(
      data.description ||
        "Telegram Bot API request failed",
    );
  }

  return data;
}