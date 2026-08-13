"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";
import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  selectedFighter: string;
  amount: number;
  status: "PENDING" | "WON" | "LOST" | "CANCELLED";
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
  const { initData, loading: telegramLoading } = useTelegram();

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    if (!initData) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/predictions/history", {
        method: "GET",
        headers: {
          "x-telegram-init-data": initData,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load history");
      }

      setPredictions(result.data.predictions);
    } catch (err) {
      console.error("History error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load prediction history"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!telegramLoading) {
      loadHistory();
    }
  }, [initData, telegramLoading]);

  // Loading Telegram state
  if (telegramLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-5">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Initializing Telegram...
        </div>
      </main>
    );
  }

  // Not in Telegram state
  if (!initData) {
    return (
      <main className="mx-auto max-w-md p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Please open this application inside Telegram.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24 text-slate-900 dark:text-slate-100">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Prediction History
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track your past fight selections and outcomes
          </p>
        </div>
        {predictions.length > 0 && !loading && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {predictions.length} Total
          </span>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">
            No predictions placed yet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your active and completed predictions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      )}
    </main>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const getStatusBadge = (status: Prediction["status"]) => {
    switch (status) {
      case "WON":
        return {
          label: "WON",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
          dotClass: "bg-emerald-500",
        };
      case "LOST":
        return {
          label: "LOST",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40",
          dotClass: "bg-rose-500",
        };
      case "CANCELLED":
        return {
          label: "CANCELLED",
          badgeClass: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
          dotClass: "bg-slate-400",
        };
      default:
        return {
          label: "PENDING",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
          dotClass: "bg-amber-500 animate-pulse",
        };
    }
  };

  const statusConfig = getStatusBadge(prediction.status);

  const formattedDate = new Date(prediction.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      {/* Top Header: Match Title & Status Badge */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {prediction.fight.title}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {prediction.fight.fighterAName} <span className="text-slate-400 dark:text-slate-600">vs</span> {prediction.fight.fighterBName}
          </p>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Grid Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Your Pick
          </p>
          <p className="mt-0.5 text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {prediction.selectedFighter}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Amount Staked
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            {prediction.amount.toLocaleString()} pts
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Potential Payout
          </p>
          <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            +{prediction.potentialWin.toLocaleString()} pts
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Date Placed
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Fight Result Banner (if winner exists) */}
      {prediction.fight.winner && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Official Winner
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            🏆 {prediction.fight.winner}
          </span>
        </div>
      )}
    </article>
  );
}

// Skeleton Loader component for a clean loading state
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}