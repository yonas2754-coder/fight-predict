"use client";

import { useEffect, useState } from "react";
import {
  getTelegramUser,
  getTelegramWebApp,
} from "@/lib/telegram";

export default function Home() {
  const [userName, setUserName] =
    useState("Telegram User");

  useEffect(() => {
    const user = getTelegramUser();

    if (user) {
      setUserName(
        user.first_name ||
          user.username ||
          "Telegram User",
      );
    }
  }, []);

  function handlePredict(fighter: string) {
    const webApp = getTelegramWebApp();

    webApp?.HapticFeedback.selectionChanged();

    alert(
      `You selected ${fighter}`,
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 pb-10 text-white">
      {/* Header */}

      <header className="mx-auto max-w-lg pt-8">
        <p className="text-sm text-white/50">
          Welcome
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          {userName}
        </h1>
      </header>

      {/* Fight */}

      <section className="mx-auto mt-8 max-w-lg">
        <div className="overflow-hidden rounded-3xl bg-white text-black shadow-2xl">
          {/* Fight header */}

          <div className="p-6 text-center">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              UPCOMING FIGHT
            </span>

            <h2 className="mt-5 text-3xl font-black">
              SEDO VS JOHNNY
            </h2>

            <p className="mt-2 text-sm text-black/50">
              MMA Prediction
            </p>
          </div>

          {/* Fighters */}

          <div className="grid grid-cols-2 border-t">
            {/* Sedo */}

            <button
              onClick={() =>
                handlePredict("Sedo")
              }
              className="border-r p-6 text-center transition active:scale-95"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
                🥊
              </div>

              <h3 className="mt-4 text-xl font-black">
                SEDO
              </h3>

              <p className="mt-2 text-4xl font-black">
                35%
              </p>

              <p className="mt-1 text-xs text-black/50">
                Probability
              </p>
            </button>

            {/* Johnny */}

            <button
              onClick={() =>
                handlePredict("Johnny")
              }
              className="p-6 text-center transition active:scale-95"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl">
                🥊
              </div>

              <h3 className="mt-4 text-xl font-black">
                JOHNNY
              </h3>

              <p className="mt-2 text-4xl font-black">
                65%
              </p>

              <p className="mt-1 text-xs text-black/50">
                Probability
              </p>
            </button>
          </div>

          {/* Probability bar */}

          <div className="flex h-3">
            <div
              className="bg-gray-400"
              style={{
                width: "35%",
              }}
            />

            <div
              className="bg-black"
              style={{
                width: "65%",
              }}
            />
          </div>
        </div>
      </section>

      {/* Balance */}

      <section className="mx-auto mt-6 max-w-lg">
        <div className="rounded-2xl bg-white/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">
                Virtual Balance
              </p>

              <p className="mt-1 text-2xl font-bold">
                1,000 points
              </p>
            </div>

            <div className="text-3xl">
              💰
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}

      <p className="mx-auto mt-8 max-w-lg text-center text-xs text-white/40">
        Virtual points only. No real-money
        wagering.
      </p>
    </main>
  );
}