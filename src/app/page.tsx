"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";
import { getTelegramWebApp } from "@/lib/telegram";

type Fight = {
  id: string;
  title: string;
  description: string | null;

  fighterAName: string;
  fighterBName: string;

  fighterAProbability: number;
  fighterBProbability: number;

  status:
    | "UPCOMING"
    | "LIVE"
    | "FINISHED"
    | "CANCELLED";

  scheduledAt: string | null;

  _count?: {
    predictions: number;
  };
};

type SelectedFighter = "A" | "B" | null;

const AMOUNTS = [50, 100, 200, 500];

const MAX_WIN = 1_000_000;

export default function HomePage() {
  const {
    user,
    initData,
    loading: telegramLoading,
    isTelegram,
    refreshUser,
  } = useTelegram();

  const [fight, setFight] =
    useState<Fight | null>(null);

  const [loadingFight, setLoadingFight] =
    useState(true);

  const [selectedFighter, setSelectedFighter] =
    useState<SelectedFighter>(null);

  const [amount, setAmount] =
    useState(100);

  const [customAmount, setCustomAmount] =
    useState("");

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [showWithdrawMessage, setShowWithdrawMessage] =
    useState(false);

  const [placingPrediction, setPlacingPrediction] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    if (telegramLoading) {
      return;
    }

    loadFight();
  }, [telegramLoading]);

  async function loadFight() {
    try {
      setLoadingFight(true);
      setError("");

      const response =
        await fetch("/api/fights", {
          cache: "no-store",
        });

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to load fights",
        );
      }

      const fights: Fight[] =
        result.data ?? [];

      const activeFight =
        fights.find(
          (item) =>
            item.status === "LIVE",
        ) ??
        fights.find(
          (item) =>
            item.status === "UPCOMING",
        ) ??
        null;

      setFight(activeFight);
    } catch (error) {
      console.error(
        "Failed to load fight:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load fight",
      );
    } finally {
      setLoadingFight(false);
    }
  }

  const selectedFighterName =
    useMemo(() => {
      if (!fight) {
        return "";
      }

      if (selectedFighter === "A") {
        return fight.fighterAName;
      }

      if (selectedFighter === "B") {
        return fight.fighterBName;
      }

      return "";
    }, [
      fight,
      selectedFighter,
    ]);

  const selectedProbability =
    useMemo(() => {
      if (!fight) {
        return 0;
      }

      if (selectedFighter === "A") {
        return fight.fighterAProbability;
      }

      if (selectedFighter === "B") {
        return fight.fighterBProbability;
      }

      return 0;
    }, [
      fight,
      selectedFighter,
    ]);

  const potentialWin =
    useMemo(() => {
      if (
        amount <= 0 ||
        selectedProbability <= 0
      ) {
        return 0;
      }

      return Math.min(
        Math.floor(
          amount /
            (selectedProbability / 100),
        ),
        MAX_WIN,
      );
    }, [
      amount,
      selectedProbability,
    ]);

  function selectFighter(
    fighter: SelectedFighter,
  ) {
    if (!fight) {
      return;
    }

    if (fight.status !== "UPCOMING") {
      return;
    }

    setError("");
    setSuccess("");

    setSelectedFighter(fighter);

    const webApp =
      getTelegramWebApp();

    webApp?.HapticFeedback.impactOccurred(
      "light",
    );
  }

  function selectAmount(
    value: number,
  ) {
    if (
      value <= 0 ||
      !user ||
      value > user.balance
    ) {
      return;
    }

    setAmount(value);
    setCustomAmount("");

    const webApp =
      getTelegramWebApp();

    webApp?.HapticFeedback.impactOccurred(
      "light",
    );
  }

  function handleCustomAmount(
    value: string,
  ) {
    setCustomAmount(value);

    const numericValue =
      Number(value);

    if (
      Number.isFinite(numericValue) &&
      numericValue > 0
    ) {
      setAmount(
        Math.floor(numericValue),
      );
    }
  }

  function openConfirmation() {
    setError("");
    setSuccess("");

    if (!user) {
      setError(
        "You are not authenticated.",
      );
      return;
    }

    if (!fight) {
      setError(
        "No fight is available.",
      );
      return;
    }

    if (fight.status !== "UPCOMING") {
      setError(
        "Predictions are closed.",
      );
      return;
    }

    if (!selectedFighter) {
      setError(
        "Please select a fighter.",
      );
      return;
    }

    if (
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      setError(
        "Enter a valid prediction amount.",
      );
      return;
    }

    if (amount > user.balance) {
      setError(
        "Insufficient balance.",
      );
      return;
    }

    setShowConfirmation(true);
  }

  async function placePrediction() {
    if (!user || !fight) {
      return;
    }

    if (!selectedFighter) {
      return;
    }

    try {
      setPlacingPrediction(true);
      setError("");
      setSuccess("");

      const fighterName =
        selectedFighter === "A"
          ? fight.fighterAName
          : fight.fighterBName;

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
              selectedFighter:
                fighterName,
              amount,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to place prediction",
        );
      }

      const webApp =
        getTelegramWebApp();

      webApp?.HapticFeedback.notificationOccurred(
        "success",
      );

      setShowConfirmation(false);
      setSelectedFighter(null);
      setCustomAmount("");

      setSuccess(
        `Prediction placed on ${fighterName}!`,
      );

      await refreshUser();
      await loadFight();
    } catch (error) {
      console.error(
        "Prediction error:",
        error,
      );

      const webApp =
        getTelegramWebApp();

      webApp?.HapticFeedback.notificationOccurred(
        "error",
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to place prediction",
      );
    } finally {
      setPlacingPrediction(false);
    }
  }

  function openWithdraw() {
    setShowWithdrawMessage(true);

    const webApp =
      getTelegramWebApp();

    webApp?.HapticFeedback.impactOccurred(
      "light",
    );
  }

  /*
   * INVITE FRIENDS
   *
   * Opens Telegram's share/contact picker.
   */
  function inviteFriends() {
    const webApp =
      getTelegramWebApp();

    const appUrl =
      window.location.href;

    const shareText =
      "🥊 Join me on ETFC Fight and make your fight prediction!";

    const shareUrl =
      `https://t.me/share/url?url=${encodeURIComponent(
        appUrl,
      )}&text=${encodeURIComponent(
        shareText,
      )}`;

    if (webApp) {
      webApp.HapticFeedback.impactOccurred(
        "light",
      );

      webApp.openTelegramLink(
        shareUrl,
      );
    } else {
      window.open(
        shareUrl,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  if (telegramLoading) {
    return <LoadingScreen />;
  }

  if (!isTelegram) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl">
            📱
          </div>

          <h1 className="mt-5 text-3xl font-black">
            ETFC Fight
          </h1>

          <p className="mt-3 text-white/50">
            Please open this application
            inside Telegram.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Authentication Required
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Please reopen the Mini App
            from Telegram.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-28 text-white">
      <div className="mx-auto w-full max-w-md px-5 py-5">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/40">
              Welcome
            </p>

            <h1 className="text-2xl font-black">
              ETFC Fight
            </h1>

            <p className="mt-1 text-xs text-white/40">
              Welcome, {user.firstName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <a
                href="/admin"
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
              >
                ⚙️
              </a>
            )}

            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 font-black">
                {user.firstName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* PROMO */}

        <section className="mt-5 rounded-3xl bg-white p-5 text-black">
          <p className="text-sm font-bold text-black/50">
            ETFC Fight Prediction
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Win up to
          </h2>

          <p className="mt-1 text-4xl font-black">
            1,000,000
          </p>

          <p className="mt-2 text-sm text-black/50">
            points on a successful prediction.
          </p>

          <div className="mt-5 flex gap-2">
            <a
              href="/wallet"
              className="flex-1 rounded-xl bg-black px-4 py-3 text-center text-sm font-black text-white"
            >
              💰 Wallet
            </a>

            <button
              type="button"
              onClick={openWithdraw}
              className="flex-1 rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-black"
            >
              💸 Withdraw
            </button>
          </div>
        </section>

        {/* BALANCE */}

        <section className="mt-4 rounded-3xl bg-white/10 p-5">
          <p className="text-sm font-medium text-white/40">
            Your Balance
          </p>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <span className="text-4xl font-black">
                {user.balance.toLocaleString()}
              </span>

              <span className="ml-2 text-sm font-bold text-white/40">
                birr
              </span>
            </div>

            <a
              href="/wallet"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black"
            >
              Wallet
            </a>
          </div>
        </section>

        {/* MAX WIN MESSAGE */}

        <div className="mt-4 rounded-2xl border border-green-400/20 bg-green-400/10 p-4">
          <p className="text-sm font-black text-green-300">
            🏆 Win up to 1,000,000 birr
          </p>

          <p className="mt-1 text-xs text-green-300/60">
            Your final winnings depend on
            your prediction and the fight
            result.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            ✅ {success}
          </div>
        )}

        {/* FIGHT */}

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">
                Prediction
              </p>

              <h2 className="text-2xl font-black">
                ETFC Fight
              </h2>
            </div>

            <button
              type="button"
              onClick={loadFight}
              disabled={loadingFight}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
            >
              {loadingFight
                ? "..."
                : "Refresh"}
            </button>
          </div>

          {loadingFight ? (
            <FightSkeleton />
          ) : !fight ? (
            <EmptyFight />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-white/10">

              {/* FIGHT HEADER */}

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      fight.status === "LIVE"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {fight.status === "LIVE"
                      ? "🔴 LIVE"
                      : "UPCOMING"}
                  </span>

                  {fight.scheduledAt && (
                    <span className="text-xs text-white/40">
                      {formatDate(
                        fight.scheduledAt,
                      )}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-center text-2xl font-black">
                  {fight.title}
                </h3>

                {fight.description && (
                  <p className="mt-2 text-center text-sm text-white/40">
                    {fight.description}
                  </p>
                )}

                {/* FIGHTERS */}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <FighterCard
                    name={fight.fighterAName}
                    probability={
                      fight.fighterAProbability
                    }
                    selected={
                      selectedFighter === "A"
                    }
                    disabled={
                      fight.status !==
                      "UPCOMING"
                    }
                    onClick={() =>
                      selectFighter("A")
                    }
                    image="/fighters/sedo.jpg"
                  />

                  <FighterCard
                    name={fight.fighterBName}
                    probability={
                      fight.fighterBProbability
                    }
                    selected={
                      selectedFighter === "B"
                    }
                    disabled={
                      fight.status !==
                      "UPCOMING"
                    }
                    onClick={() =>
                      selectFighter("B")
                    }
                    image="/fighters/johnny.jpg"
                  />
                </div>

                {/* PROBABILITY */}

                <ProbabilityBar
                  fighterA={
                    fight.fighterAName
                  }
                  fighterB={
                    fight.fighterBName
                  }
                  probabilityA={
                    fight.fighterAProbability
                  }
                  probabilityB={
                    fight.fighterBProbability
                  }
                />
              </div>

              {/* PREDICTION AREA */}

              {fight.status ===
                "UPCOMING" && (
                <div className="border-t border-white/10 p-5">
                  <p className="text-sm font-bold text-white/50">
                    Prediction amount
                  </p>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {AMOUNTS.map(
                      (value) => {
                        const disabled =
                          value >
                          user.balance;

                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={
                              disabled
                            }
                            onClick={() =>
                              selectAmount(
                                value,
                              )
                            }
                            className={`rounded-xl py-3 text-sm font-black ${
                              amount ===
                                value &&
                              !customAmount
                                ? "bg-white text-black"
                                : "bg-white/10 text-white"
                            } disabled:cursor-not-allowed disabled:opacity-30`}
                          >
                            {value}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={user.balance}
                    value={customAmount}
                    onChange={(event) =>
                      handleCustomAmount(
                        event.target.value,
                      )
                    }
                    placeholder="Custom amount"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />

                  {selectedFighter && (
                    <div className="mt-4 rounded-2xl bg-white/5 p-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-white/40">
                          Selected
                        </span>

                        <span className="font-black">
                          {
                            selectedFighterName
                          }
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-sm text-white/40">
                          Probability
                        </span>

                        <span className="font-black">
                          {
                            selectedProbability
                          }
                          %
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-sm text-white/40">
                          Potential return
                        </span>

                        <span className="font-black text-green-300">
                          {potentialWin.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      openConfirmation
                    }
                    disabled={
                      !selectedFighter ||
                      amount <= 0 ||
                      amount >
                        user.balance
                    }
                    className="mt-4 w-full rounded-2xl bg-white py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {selectedFighter
                      ? `Predict ${selectedFighterName}`
                      : "Select a Fighter"}
                  </button>
                </div>
              )}

              {/* LIVE */}

              {fight.status ===
                "LIVE" && (
                <div className="border-t border-white/10 p-5 text-center">
                  <div className="text-4xl">
                    🔴
                  </div>

                  <p className="mt-2 font-black">
                    Fight is Live
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    Predictions are closed.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* HISTORY */}

        <a
          href="/history"
          className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 p-5"
        >
          <div>
            <p className="font-black">
              Prediction History
            </p>

            <p className="mt-1 text-sm text-white/40">
              View your previous predictions
            </p>
          </div>

          <span className="text-xl">
            →
          </span>
        </a>

        {/* INVITE FRIENDS */}

        <button
          type="button"
          onClick={inviteFriends}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-5 text-black transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-xl">
              👥
            </div>

            <div className="text-left">
              <p className="font-black">
                Invite Friends
              </p>

              <p className="mt-1 text-sm text-black/50">
                Invite your friends to ETFC Fight
              </p>
            </div>
          </div>

          <span className="text-xl">
            →
          </span>
        </button>

        {/* FOOTER */}

        <div className="py-8 text-center">
          <p className="text-xs text-white/20">
            ETFC Fight
          </p>

          <p className="mt-1 text-[10px] text-white/10">
            Predict responsibly
          </p>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}

      {showConfirmation && (
        <ConfirmationModal
          fighter={selectedFighterName}
          amount={amount}
          potentialWin={potentialWin}
          onCancel={() =>
            setShowConfirmation(false)
          }
          onConfirm={placePrediction}
          loading={placingPrediction}
        />
      )}

      {/* WITHDRAW MODAL */}

      {showWithdrawMessage && (
        <WithdrawModal
          onClose={() =>
            setShowWithdrawMessage(false)
          }
        />
      )}
    </main>
  );
}

/*
 * Fighter Card
 */

function FighterCard({
  name,
  probability,
  selected,
  disabled,
  onClick,
  image,
}: {
  name: string;
  probability: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  image: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`overflow-hidden rounded-2xl text-center transition ${
        selected
          ? "bg-white text-black"
          : "bg-white/5 text-white"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="relative h-36 w-full">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display =
              "none";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-2 left-0 right-0 text-center text-2xl">
          🥊
        </div>
      </div>

      <div className="p-4">
        <p className="font-black">
          {name}
        </p>

        <p
          className={`mt-1 text-2xl font-black ${
            selected
              ? "text-black"
              : "text-white"
          }`}
        >
          {probability}%
        </p>

        <p
          className={`mt-1 text-xs ${
            selected
              ? "text-black/50"
              : "text-white/40"
          }`}
        >
          {selected
            ? "Selected"
            : "Select"}
        </p>
      </div>
    </button>
  );
}

/*
 * Probability Bar
 */

function ProbabilityBar({
  fighterA,
  fighterB,
  probabilityA,
  probabilityB,
}: {
  fighterA: string;
  fighterB: string;
  probabilityA: number;
  probabilityB: number;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold">
          {fighterA}
        </span>

        <span className="text-white/40">
          VS
        </span>

        <span className="font-bold">
          {fighterB}
        </span>
      </div>

      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="bg-white"
          style={{
            width: `${probabilityA}%`,
          }}
        />

        <div
          className="bg-white/30"
          style={{
            width: `${probabilityB}%`,
          }}
        />
      </div>
    </div>
  );
}

/*
 * Confirmation Modal
 */

function ConfirmationModal({
  fighter,
  amount,
  potentialWin,
  onCancel,
  onConfirm,
  loading,
}: {
  fighter: string;
  amount: number;
  potentialWin: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-black">
        <div className="text-center">
          <div className="text-5xl">
            🥊
          </div>

          <h2 className="mt-4 text-2xl font-black">
            Confirm Prediction
          </h2>

          <p className="mt-2 text-black/40">
            You are predicting
          </p>

          <p className="mt-1 text-2xl font-black">
            {fighter}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-black/5 p-4">
          <div className="flex justify-between">
            <span className="text-sm text-black/40">
              Amount
            </span>

            <span className="font-black">
              {amount.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 flex justify-between">
            <span className="text-sm text-black/40">
              Potential return
            </span>

            <span className="font-black text-green-600">
              {potentialWin.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-black/40">
          Maximum possible return:{" "}
          {MAX_WIN.toLocaleString()} Birr
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-2xl bg-black/5 py-4 font-bold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-2xl bg-black py-4 font-black text-white disabled:opacity-50"
          >
            {loading
              ? "Placing..."
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * Withdraw Modal
 */

function WithdrawModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-black">
        <div className="text-center">
          <div className="text-5xl">
            💸
          </div>

          <h2 className="mt-4 text-2xl font-black">
            Withdraw
          </h2>

          <p className="mt-3 text-sm leading-6 text-black/50">
            Withdrawals will be available
            after the fight is completed
            and the final result has been
            confirmed.
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-black/5 p-4">
          <p className="text-sm font-bold">
            Withdrawal status
          </p>

          <p className="mt-1 text-sm text-black/50">
            🔒 Currently unavailable
          </p>

          <p className="mt-3 text-xs text-black/40">
            Once the fight is complete,
            eligible winnings can be
            processed according to the
            final result.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-black py-4 font-black text-white"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/*
 * Loading Screen
 */

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

        <p className="mt-4 text-sm text-white/50">
          Loading ETFC Fight...
        </p>
      </div>
    </main>
  );
}

/*
 * Fight Skeleton
 */

function FightSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-white/10 p-5">
      <div className="h-5 w-20 rounded bg-white/10" />

      <div className="mx-auto mt-6 h-7 w-48 rounded bg-white/10" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-52 rounded-2xl bg-white/5" />

        <div className="h-52 rounded-2xl bg-white/5" />
      </div>

      <div className="mt-6 h-3 rounded-full bg-white/5" />
    </div>
  );
}

/*
 * Empty Fight
 */

function EmptyFight() {
  return (
    <div className="rounded-3xl bg-white/10 p-8 text-center">
      <div className="text-6xl">
        🥊
      </div>

      <h2 className="mt-4 text-2xl font-black">
        No Fight Available
      </h2>

      <p className="mt-2 text-sm text-white/40">
        Check back later for the next
        ETFC fight.
      </p>

      <button
        type="button"
        onClick={() =>
          window.location.reload()
        }
        className="mt-5 rounded-xl bg-white px-5 py-3 font-black text-black"
      >
        Refresh
      </button>
    </div>
  );
}

/*
 * Date formatter
 */

function formatDate(
  value: string,
) {
  try {
    return new Date(
      value,
    ).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}