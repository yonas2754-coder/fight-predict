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
      <main className="p-6">
        <p>
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
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          Please open this page
          inside Telegram.
        </div>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="p-6">
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
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
    <main className="mx-auto w-full max-w-6xl p-4 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Deposit Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Review Telebirr deposits
          </p>
        </div>

        <button
          onClick={loadDeposits}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-6 text-center">
          Loading deposits...
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-gray-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
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
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />

            <button
              onClick={() =>
                setSelectedImage(null)
              }
              className="absolute right-2 top-2 rounded-full bg-black px-4 py-2 text-white"
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
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Screenshot */}

          <div className="w-full md:w-64">
            {deposit.screenshotUrl ? (
              <button
                onClick={
                  onImageClick
                }
                className="block w-full overflow-hidden rounded-xl border"
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
              <div className="flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
                No screenshot
              </div>
            )}
          </div>

          {/* Information */}

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {userName ||
                    "Unknown user"}
                </h2>

                {deposit.user
                  .username && (
                  <p className="text-sm text-gray-500">
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
              <div className="mt-4 rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500">
                  Admin note
                </p>

                <p className="mt-1 text-sm">
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
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
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
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
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
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-medium">
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
      "bg-yellow-100 text-yellow-800",
    APPROVED:
      "bg-green-100 text-green-800",
    REJECTED:
      "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}