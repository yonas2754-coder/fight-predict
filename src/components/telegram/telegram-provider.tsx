"use client";

import { useEffect } from "react";
import { getTelegramWebApp } from "@/lib/telegram";

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const webApp = getTelegramWebApp();

    if (!webApp) {
      console.log(
        "FightPredict is running outside Telegram.",
      );

      return;
    }

    webApp.ready();

    webApp.expand();

    console.log(
      "Telegram Mini App initialized",
    );

    console.log(
      "Telegram user:",
      webApp.initDataUnsafe.user,
    );
  }, []);

  return <>{children}</>;
}