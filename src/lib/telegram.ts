import type { TelegramWebApp } from "@/types/telegram";

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

export function getTelegramUser() {
  const webApp = getTelegramWebApp();

  return webApp?.initDataUnsafe?.user ?? null;
}

export function getTelegramInitData() {
  const webApp = getTelegramWebApp();

  return webApp?.initData ?? "";
}