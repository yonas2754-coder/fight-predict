"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";

export default function Home() {
  const {
    telegramUser,
    isTelegram,
    loading,
  } = useTelegram();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 text-center">
        <div className="text-6xl">
          🥊
        </div>

        <h1 className="mt-5 text-3xl font-bold">
          Fight Predict
        </h1>

        {!isTelegram && (
          <div className="mt-6 rounded-xl bg-yellow-500/20 p-4 text-yellow-300">
            Open this application
            from Telegram.
          </div>
        )}

        {isTelegram &&
          telegramUser && (
            <div className="mt-6">
              <p className="text-white/50">
                Welcome
              </p>

              <p className="mt-2 text-xl font-bold">
                {telegramUser.first_name}
              </p>

              {telegramUser.username && (
                <p className="mt-1 text-white/50">
                  @{telegramUser.username}
                </p>
              )}

              <div className="mt-6 rounded-xl bg-white/10 p-4">
                <p className="text-sm text-white/50">
                  Telegram ID
                </p>

                <p className="mt-1 font-mono">
                  {telegramUser.id}
                </p>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}