"use client";

import { useEffect, useState } from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";

type Prediction = {
  id: string;
  selectedFighter: string;
  amount: number;
  potentialWin: number;
  status:
    | "PENDING"
    | "WON"
    | "LOST"
    | "CANCELLED";
  createdAt: string;

  fight: {
    id: string;
    title: string;
    fighterAName: string;
    fighterBName: string;
    fighterAProbability: number;
    fighterBProbability: number;
    status: string;
    scheduledAt: string | null;
  };
};

export default function PredictionHistory() {
  const { initData } = useTelegram();

  const [predictions, setPredictions] =
    useState<Prediction[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadPredictions() {
      if (!initData) {
        return;
      }

      try {
        const response = await fetch(
          "/api/predictions/me",
          {
            headers: {
              "x-telegram-init-data":
                initData,
            },
          },
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load predictions",
          );
        }

        setPredictions(
          result.data,
        );
      } catch (error) {
        console.error(
          "Prediction history error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadPredictions();
  }, [initData]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/10 p-6 text-center">
        Loading predictions...
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="rounded-3xl bg-white/10 p-8 text-center">
        <div className="text-5xl">
          🥊
        </div>

        <h2 className="mt-4 text-xl font-black">
          No predictions yet
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Your prediction history will appear here.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-black">
        Prediction History
      </h2>

      <div className="space-y-4">
        {predictions.map(
          (prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
            />
          ),
        )}
      </div>
    </section>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: Prediction;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-white/40">
          {prediction.fight.status}
        </p>

        <StatusBadge
          status={prediction.status}
        />
      </div>

      <h3 className="mt-3 text-xl font-black">
        {prediction.fight.fighterAName}

        <span className="mx-2 text-white/30">
          VS
        </span>

        {prediction.fight.fighterBName}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-white/40">
            Selected
          </p>

          <p className="mt-1 font-black">
            {prediction.selectedFighter}
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-white/40">
            Amount
          </p>

          <p className="mt-1 font-black">
            {prediction.amount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-white/5 p-4">
        <div className="flex justify-between">
          <span className="text-sm text-white/40">
            Potential payout
          </span>

          <span className="font-black">
            {prediction.potentialWin.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-white/30">
        {formatDate(
          prediction.createdAt,
        )}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Prediction["status"];
}) {
  const styles = {
    PENDING:
      "bg-yellow-500/20 text-yellow-300",

    WON:
      "bg-green-500/20 text-green-300",

    LOST:
      "bg-red-500/20 text-red-300",

    CANCELLED:
      "bg-white/10 text-white/50",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(
  value: string,
) {
  return new Date(value).toLocaleString();
}