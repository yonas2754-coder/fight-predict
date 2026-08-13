"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";
import {
  useEffect,
  useState,
} from "react";


type DepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type DepositUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  balance: number;
};

type Deposit = {
  id: string;
  userId: string;
  amount: number;
  transactionNumber: string;
  screenshotUrl: string | null;
  status: DepositStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: DepositUser;
};

export default function AdminDepositsPage() {
  const {
    initData,
    user,
    loading: telegramLoading,
  } = useTelegram();

  const [deposits, setDeposits] =
    useState<Deposit[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [reviewingId, setReviewingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  // ---------------------------------------------
  // Load deposits
  // ---------------------------------------------

  async function loadDeposits() {
    if (!initData) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/deposits",
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
            "Failed to load deposits",
        );
      }

      setDeposits(
        result.data.deposits,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load deposits",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!telegramLoading) {
      loadDeposits();
    }
  }, [
    initData,
    telegramLoading,
  ]);

  // ---------------------------------------------
  // Review deposit
  // ---------------------------------------------

  async function reviewDeposit(
    depositId: string,
    action:
      | "APPROVE"
      | "REJECT",
  ) {
    if (!initData) {
      setError(
        "Telegram authentication is required",
      );

      return;
    }

    const confirmMessage =
      action === "APPROVE"
        ? "Are you sure this Telebirr payment has been verified?"
        : "Are you sure you want to reject this deposit?";

    if (
      !window.confirm(
        confirmMessage,
      )
    ) {
      return;
    }

    try {
      setReviewingId(
        depositId,
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/deposits/${depositId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,
              action,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to review deposit",
        );
      }

      // Reload deposits

      await loadDeposits();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to review deposit",
      );
    } finally {
      setReviewingId(null);
    }
  }

  // ---------------------------------------------
  // Authentication loading
  // ---------------------------------------------

  if (telegramLoading) {
    return (
      <main className="p-6 text-white">
        <p className="text-white/70">
          Loading Telegram...
        </p>
      </main>
    );
  }

  // ---------------------------------------------
  // Admin check
  // ---------------------------------------------

  if (!user) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          Please open this page
          inside Telegram.
        </div>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          You do not have permission
          to access the admin
          dashboard.
        </div>
      </main>
    );
  }

  // ---------------------------------------------
  // Dashboard
  // ---------------------------------------------

  return (
    <main className="mx-auto w-full max-w-6xl p-4 pb-24 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Deposit Dashboard
          </h1>

          <p className="text-sm text-white/50">
            Review Telebirr deposits
          </p>
        </div>

        <button
          onClick={loadDeposits}
          disabled={loading}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
          Loading deposits...
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/50">
          No deposits found.
        </div>
      ) : (
        <div className="space-y-5">
          {deposits.map(
            (deposit) => (
              <DepositCard
                key={deposit.id}
                deposit={deposit}
                reviewing={
                  reviewingId ===
                  deposit.id
                }
                onApprove={() =>
                  reviewDeposit(
                    deposit.id,
                    "APPROVE",
                  )
                }
                onReject={() =>
                  reviewDeposit(
                    deposit.id,
                    "REJECT",
                  )
                }
                onImageClick={() =>
                  setSelectedImage(
                    deposit.screenshotUrl,
                  )
                }
              />
            ),
          )}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={selectedImage}
              alt="Telebirr payment screenshot"
              className="max-h-[85vh] max-w-full rounded-xl border border-white/20 object-contain"
            />

            <button
              onClick={() =>
                setSelectedImage(null)
              }
              className="absolute right-2 top-2 rounded-full bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// --------------------------------------------------
// Deposit Card
// --------------------------------------------------

function DepositCard({
  deposit,
  reviewing,
  onApprove,
  onReject,
  onImageClick,
}: {
  deposit: Deposit;
  reviewing: boolean;
  onApprove: () => void;
  onReject: () => void;
  onImageClick: () => void;
}) {
  const userName = [
    deposit.user.firstName,
    deposit.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const date =
    new Date(
      deposit.createdAt,
    ).toLocaleString();

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-md">
      <div className="p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Screenshot */}

          <div className="w-full md:w-64">
            {deposit.screenshotUrl ? (
              <button
                onClick={
                  onImageClick
                }
                className="block w-full overflow-hidden rounded-xl border border-white/10 transition-transform active:scale-95"
              >
                <img
                  src={
                    deposit.screenshotUrl
                  }
                  alt="Telebirr payment"
                  className="h-48 w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/40">
                No screenshot
              </div>
            )}
          </div>

          {/* Information */}

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {userName ||
                    "Unknown user"}
                </h2>

                {deposit.user
                  .username && (
                  <p className="text-sm font-medium text-emerald-400">
                    @
                    {
                      deposit.user
                        .username
                    }
                  </p>
                )}
              </div>

              <StatusBadge
                status={
                  deposit.status
                }
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info
                label="Amount"
                value={`${deposit.amount} ETB`}
              />

              <Info
                label="Transaction number"
                value={
                  deposit.transactionNumber
                }
              />

              <Info
                label="User balance"
                value={`${deposit.user.balance} points`}
              />

              <Info
                label="Submitted"
                value={date}
              />
            </div>

            {deposit.adminNote && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold text-white/50">
                  Admin note
                </p>

                <p className="mt-1 text-sm text-white/90">
                  {deposit.adminNote}
                </p>
              </div>
            )}

            {/* Actions */}

            {deposit.status ===
              "PENDING" && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={
                    onApprove
                  }
                  disabled={
                    reviewing
                  }
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {reviewing
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  onClick={
                    onReject
                  }
                  disabled={
                    reviewing
                  }
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-3 font-bold text-white transition-all hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// --------------------------------------------------
// Info
// --------------------------------------------------

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-white/50">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-white">
        {value}
      </p>
    </div>
  );
}

// --------------------------------------------------
// Status Badge
// --------------------------------------------------

function StatusBadge({
  status,
}: {
  status: DepositStatus;
}) {
  const styles = {
    PENDING:
      "bg-amber-500/20 text-amber-300 border-amber-500/30",
    APPROVED:
      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    REJECTED:
      "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}