"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getTelegramWebApp } from "@/lib/telegram";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type TelegramContextType = {
  telegramUser: TelegramUser | null;
  initData: string;
  isTelegram: boolean;
  loading: boolean;
};

const TelegramContext =
  createContext<TelegramContextType>({
    telegramUser: null,
    initData: "",
    isTelegram: false,
    loading: true,
  });

export function useTelegram() {
  return useContext(TelegramContext);
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [telegramUser, setTelegramUser] =
    useState<TelegramUser | null>(null);

  const [initData, setInitData] =
    useState("");

  const [isTelegram, setIsTelegram] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const webApp =
      getTelegramWebApp();

    if (!webApp) {
      setLoading(false);
      return;
    }

    setIsTelegram(true);

    webApp.ready();

    webApp.expand();

    setInitData(
      webApp.initData || "",
    );

    if (webApp.initDataUnsafe?.user) {
      setTelegramUser(
        webApp.initDataUnsafe.user as TelegramUser,
      );
    }

    setLoading(false);
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        telegramUser,
        initData,
        isTelegram,
        loading,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}