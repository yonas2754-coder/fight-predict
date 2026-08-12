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

  refreshUser: () => Promise<void>;

  showBackButton: (
    callback: () => void,
  ) => void;

  hideBackButton: () => void;
};

const TelegramContext =
  createContext<TelegramContextType>({
    user: null,
    initData: "",
    isTelegram: false,
    loading: true,

    refreshUser:
      async () => {},

    showBackButton:
      () => {},

    hideBackButton:
      () => {},
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

  async function refreshUser() {
    if (!initData) {
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
              initData,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to refresh user",
        );
      }

      setUser(
        result.data.user,
      );
    } catch (error) {
      console.error(
        "Failed to refresh user:",
        error,
      );
    }
  }

  function showBackButton(
    callback: () => void,
  ) {
    const webApp =
      getTelegramWebApp();

    if (!webApp) {
      return;
    }

    webApp.BackButton.show();
    webApp.BackButton.onClick(
      callback,
    );
  }

  function hideBackButton() {
    const webApp =
      getTelegramWebApp();

    if (!webApp) {
      return;
    }

    webApp.BackButton.hide();
  }

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

      document.documentElement.style.setProperty(
        "--tg-bg-color",
        webApp.themeParams.bg_color ||
          "#000000",
      );

      document.documentElement.style.setProperty(
        "--tg-text-color",
        webApp.themeParams.text_color ||
          "#ffffff",
      );

      document.documentElement.style.setProperty(
        "--tg-button-color",
        webApp.themeParams.button_color ||
          "#ffffff",
      );

      document.documentElement.style.setProperty(
        "--tg-button-text-color",
        webApp.themeParams
          .button_text_color ||
          "#000000",
      );

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
        refreshUser,
        showBackButton,
        hideBackButton,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}