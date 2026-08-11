"use client";

import { useEffect, useState } from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";

type Fight = {
  id: string;
  title: string;
  description: string | null;

  fighterAName: string;
  fighterBName: string;

  fighterAProbability: number;
  fighterBProbability: number;

  status: string;

  scheduledAt: string | null;
};

export default function Home() {
  const {
    user,
    initData,
    isTelegram,
    loading: telegramLoading,
  } = useTelegram();

  const [fight, setFight] =
    useState<Fight | null>(null);

  const [loadingFight, setLoadingFight] =
    useState(true);

  const [selectedFighter, setSelectedFighter] =
    useState<string | null>(null);

  const [amount, setAmount] =
    useState(100);

  const [predictionLoading, setPredictionLoading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadFight() {
      try {
        const response =
          await fetch("/api/fights");

        const result =
          await response.json();

        if (result.success) {
          setFight(
            result.data[0] ?? null,
          );
        }
      } catch (error) {
        console.error(
          "Failed to load fight:",
          error,
        );
      } finally {
        setLoadingFight(false);
      }
    }

    loadFight();
  }, []);

  async function makePrediction() {
    if (!fight) {
      return;
    }

    if (!selectedFighter) {
      setMessage(
        "Select a fighter first.",
      );

      return;
    }

    if (amount <= 0) {
      setMessage(
        "Enter a valid amount.",
      );

      return;
    }

    if (amount > (user?.balance ?? 0)) {
      setMessage(
        "You don't have enough points.",
      );

      return;
    }

    setPredictionLoading(true);
    setMessage(null);

    try {
      const response =
        await fetch(
          "/api/predictions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,

              fightId: fight.id,

              selectedFighter,

              amount,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Prediction failed",
        );
      }

      setMessage(
        `Prediction placed! Potential payout: ${result.data.prediction.potentialWin} points.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Prediction failed",
      );
    } finally {
      setPredictionLoading(false);
    }
  }

  if (telegramLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Connecting...</p>
      </main>
    );
  }

  if (!isTelegram) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <div className="text-6xl">
            📱
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Fight Predict
          </h1>

          <p className="mt-3 text-white/50">
            Open this Mini App from Telegram.
          </p>
        </div>
      </main>
    );
  }

  if (loadingFight) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Loading fight...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">
              Welcome
            </p>

            <h1 className="text-2xl font-black">
              {user?.firstName}
            </h1>
          </div>

          <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
            <p className="text-xs text-white/50">
              Balance
            </p>

            <p className="font-black">
              {(user?.balance ?? 0).toLocaleString()}
            </p>
          </div>
        </header>

        {!fight && (
          <div className="rounded-3xl bg-white/10 p-8 text-center">
            <div className="text-5xl">
              🥊
            </div>

            <h2 className="mt-4 text-xl font-black">
              No upcoming fight
            </h2>
          </div>
        )}

        {fight && (
          <>
            <section className="rounded-3xl bg-white p-6 text-black">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">
                  {fight.status}
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {fight.fighterAName}
                  <span className="mx-2 text-black/30">
                    VS
                  </span>
                  {fight.fighterBName}
                </h2>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFighter(
                      fight.fighterAName,
                    )
                  }
                  className={`rounded-2xl p-5 text-center transition ${
                    selectedFighter ===
                    fight.fighterAName
                      ? "bg-black text-white"
                      : "bg-black/5"
                  }`}
                >
                  <div className="text-4xl">
                    🥊
                  </div>

                  <p className="mt-3 text-xl font-black">
                    {fight.fighterAName}
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {fight.fighterAProbability}%
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFighter(
                      fight.fighterBName,
                    )
                  }
                  className={`rounded-2xl p-5 text-center transition ${
                    selectedFighter ===
                    fight.fighterBName
                      ? "bg-black text-white"
                      : "bg-black/5"
                  }`}
                >
                  <div className="text-4xl">
                    🥊
                  </div>

                  <p className="mt-3 text-xl font-black">
                    {fight.fighterBName}
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {fight.fighterBProbability}%
                  </p>
                </button>
              </div>
            </section>

            <section className="mt-5 rounded-3xl bg-white/10 p-6">
              <h3 className="text-lg font-black">
                Prediction Amount
              </h3>

              <div className="mt-4 flex items-center gap-3">
                {[50, 100, 250, 500].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setAmount(value)
                      }
                      className={`rounded-xl px-3 py-2 text-sm font-bold ${
                        amount === value
                          ? "bg-white text-black"
                          : "bg-white/10"
                      }`}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="mt-4 w-full rounded-2xl bg-white px-4 py-4 text-xl font-bold text-black outline-none"
              />

              <button
                type="button"
                disabled={
                  predictionLoading
                }
                onClick={
                  makePrediction
                }
                className="mt-4 w-full rounded-2xl bg-white py-4 font-black text-black disabled:opacity-50"
              >
                {predictionLoading
                  ? "Placing..."
                  : `Predict ${selectedFighter ?? "a fighter"}`}
              </button>

              {message && (
                <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
                  {message}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}