"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";
import {
  useEffect,
  useState,
} from "react";



type Prediction = {
  id: string;
  selectedFighter: string;
  amount: number;
  status:
    | "PENDING"
    | "WON"
    | "LOST"
    | "CANCELLED";
  potentialWin: number;
  createdAt: string;

  fight: {
    id: string;
    title: string;
    fighterAName: string;
    fighterBName: string;
    fighterAProbability: number;
    fighterBProbability: number;
    winner: string | null;
    status: string;
    scheduledAt: string | null;
  };
};

export default function HistoryPage() {
  const {
    initData,
    loading: telegramLoading,
  } = useTelegram();

  const [predictions, setPredictions] =
    useState<Prediction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadHistory() {
    if (!initData) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/predictions/history",
          {
            method: "GET",

            headers: {
              "x-telegram-init-data":
                initData,
            },

            cache: "no-store",
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to load history",
        );
      }

      setPredictions(
        result.data.predictions,
      );
    } catch (error) {
      console.error(
        "History error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load prediction history",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!telegramLoading) {
      loadHistory();
    }
  }, [
    initData,
    telegramLoading,
  ]);

  if (telegramLoading) {
    return (
      <main className="p-5">
        Loading Telegram...
      </main>
    );
  }

  if (!initData) {
    return (
      <main className="p-5">
        <div className="rounded-xl bg-yellow-50 p-4 text-yellow-800">
          Please open the app
          inside Telegram.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Prediction History
        </h1>

        <p className="text-sm text-gray-500">
          Your previous predictions
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-5 text-center">
          Loading history...
        </div>
      ) : predictions.length ===
        0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="font-semibold">
            No predictions yet
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Your predictions will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map(
            (prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={
                  prediction
                }
              />
            ),
          )}
        </div>
      )}
    </main>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: Prediction;
}) {
  const statusClass =
    prediction.status === "WON"
      ? "bg-green-100 text-green-700"
      : prediction.status ===
          "LOST"
        ? "bg-red-100 text-red-700"
        : prediction.status ===
            "CANCELLED"
          ? "bg-gray-100 text-gray-700"
          : "bg-yellow-100 text-yellow-700";

  const date =
    new Date(
      prediction.createdAt,
    ).toLocaleString();

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">
            {prediction.fight.title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {prediction.fight.fighterAName}
            {" vs "}
            {prediction.fight.fighterBName}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
        >
          {prediction.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">
            Your prediction
          </p>

          <p className="font-bold">
            {prediction.selectedFighter}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Amount
          </p>

          <p className="font-bold">
            {prediction.amount} points
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Potential win
          </p>

          <p className="font-bold">
            {prediction.potentialWin} points
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Date
          </p>

          <p className="text-sm">
            {date}
          </p>
        </div>
      </div>

      {prediction.fight.winner && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          Winner:{" "}
          <strong>
            {prediction.fight.winner}
          </strong>
        </div>
      )}
    </article>
  );
}