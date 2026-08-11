"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getTelegramWebApp } from "@/lib/telegram";

type User = {
  id: string;
  telegramId: string;

  username: string | null;

  firstName: string;
  lastName: string | null;

  photoUrl: string | null;

  balance: number;

  role: "USER" | "ADMIN";
};

type TelegramContextType = {
  user: User | null;
  initData: string;
  isTelegram: boolean;
  loading: boolean;
};

const TelegramContext =
  createContext<TelegramContextType>({
    user: null,
    initData: "",
    isTelegram: false,
    loading: true,
  });

export function useTelegram() {
  return useContext(
    TelegramContext,
  );
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [initData, setInitData] =
    useState("");

  const [isTelegram, setIsTelegram] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function initialize() {
      const webApp =
        getTelegramWebApp();

      if (!webApp) {
        setLoading(false);
        return;
      }

      setIsTelegram(true);

      webApp.ready();
      webApp.expand();

      const data =
        webApp.initData || "";

      setInitData(data);

      if (!data) {
        console.error(
          "Telegram initData is missing",
        );

        setLoading(false);
        return;
      }

      try {
        const response =
          await fetch(
            "/api/auth/telegram",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                initData: data,
              }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Authentication failed",
          );
        }

        setUser(
          result.data.user,
        );
      } catch (error) {
        console.error(
          "Telegram authentication failed:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        user,
        initData,
        isTelegram,
        loading,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}