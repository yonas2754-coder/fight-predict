"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";

type Deposit = {
  id: string;
  amount: number;
  transactionNumber: string;
  screenshotUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
};

type Transaction = {
  id: string;
  type:
    | "INITIAL_BALANCE"
    | "DEPOSIT"
    | "PREDICTION"
    | "WIN"
    | "REFUND";
  amount: number;
  description: string | null;
  createdAt: string;
};

export default function WalletPage() {
  const { user, initData, loading } = useTelegram();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [amount, setAmount] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");

  const [screenshot, setScreenshot] = useState<File | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && user) {
      loadWallet();
    }
  }, [loading, user]);

  async function loadWallet() {
    try {
      setLoadingData(true);
      setError("");

      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData,
        }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load wallet",
        );
      }

      setDeposits(result.data.deposits || []);
      setTransactions(result.data.transactions || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load wallet",
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function submitDeposit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!transactionNumber.trim()) {
      setError("Enter your Telebirr transaction number.");
      return;
    }

    try {
      setSubmitting(true);

      /*
       * For now the API receives the screenshot
       * as a base64 string.
       *
       * Later we can replace this with Cloudinary,
       * S3, Supabase Storage, etc.
       */

      let screenshotData = "";

      if (screenshot) {
        screenshotData = await fileToBase64(screenshot);
      }

      const response = await fetch("/api/wallet/deposit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          initData,
          amount: Math.floor(numericAmount),
          transactionNumber: transactionNumber.trim(),
          screenshot: screenshotData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to submit deposit",
        );
      }

      setSuccess(
        "Deposit submitted successfully. Please wait for admin approval.",
      );

      setAmount("");
      setTransactionNumber("");
      setScreenshot(null);

      const fileInput =
        document.getElementById(
          "screenshot",
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadWallet();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit deposit",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="text-center">
          <div className="text-5xl">🔐</div>

          <h1 className="mt-4 text-2xl font-black">
            Authentication Required
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Please open the application from Telegram.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-10 text-white">
      <div className="mx-auto w-full max-w-md px-5 py-5">
        {/* Header */}

        <header className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl"
          >
            ←
          </a>

          <div>
            <p className="text-xs text-white/40">
              Account
            </p>

            <h1 className="text-2xl font-black">
              Wallet
            </h1>
          </div>
        </header>

        {/* Balance */}

        <section className="mt-6 rounded-3xl bg-white p-6 text-black">
          <p className="text-sm font-medium text-black/40">
            Available Balance
          </p>

          <div className="mt-2">
            <span className="text-5xl font-black">
              {user.balance.toLocaleString()}
            </span>

            <span className="ml-2 text-sm font-bold text-black/40">
              points
            </span>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Success */}

        {success && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            ✅ {success}
          </div>
        )}

        {/* Telebirr */}

        <section className="mt-6 rounded-3xl bg-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
              💳
            </div>

            <div>
              <h2 className="font-black">
                Add Balance
              </h2>

              <p className="text-xs text-white/40">
                Deposit using Telebirr
              </p>
            </div>
          </div>

          {/* Payment instructions */}

          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-bold">
              Telebirr Payment
            </p>

            <p className="mt-2 text-sm text-white/50">
              Send your payment to the official
              Telebirr account provided by the
              administrator.
            </p>

            <div className="mt-4 rounded-xl bg-black/30 p-3">
              <p className="text-xs text-white/40">
                Telebirr Account
              </p>

              <p className="mt-1 font-black">
                Contact Admin
              </p>
            </div>
          </div>

          {/* Deposit form */}

          <form
            onSubmit={submitDeposit}
            className="mt-5"
          >
            <label className="text-sm font-bold">
              Amount
            </label>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              placeholder="Enter amount"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-white/30"
            />

            <label className="mt-5 block text-sm font-bold">
              Telebirr Transaction Number
            </label>

            <input
              type="text"
              value={transactionNumber}
              onChange={(event) =>
                setTransactionNumber(
                  event.target.value,
                )
              }
              placeholder="Enter transaction number"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none placeholder:text-white/30"
            />

            <label
              htmlFor="screenshot"
              className="mt-5 block text-sm font-bold"
            >
              Payment Screenshot
            </label>

            <input
              id="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setScreenshot(
                  event.target.files?.[0] ||
                    null,
                )
              }
              className="mt-2 block w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/50"
            />

            {screenshot && (
              <p className="mt-2 text-xs text-white/40">
                Selected: {screenshot.name}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-white py-4 font-black text-black disabled:opacity-40"
            >
              {submitting
                ? "Submitting..."
                : "Submit Deposit"}
            </button>
          </form>
        </section>

        {/* Deposit History */}

        <section className="mt-6">
          <h2 className="text-xl font-black">
            Deposit History
          </h2>

          {loadingData ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              Loading...
            </div>
          ) : deposits.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              No deposits yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {deposits.map((deposit) => (
                <DepositCard
                  key={deposit.id}
                  deposit={deposit}
                />
              ))}
            </div>
          )}
        </section>

        {/* Transactions */}

        <section className="mt-7">
          <h2 className="text-xl font-black">
            Transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              No transactions yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {transactions.map(
                (transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DepositCard({
  deposit,
}: {
  deposit: Deposit;
}) {
  const statusStyle = {
    PENDING:
      "bg-yellow-500/10 text-yellow-300",
    APPROVED:
      "bg-green-500/10 text-green-300",
    REJECTED:
      "bg-red-500/10 text-red-300",
  };

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="font-black">
          +{deposit.amount.toLocaleString()}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[deposit.status]}`}
        >
          {deposit.status}
        </span>
      </div>

      <p className="mt-2 text-xs text-white/40">
        Transaction:{" "}
        {deposit.transactionNumber}
      </p>

      <p className="mt-1 text-xs text-white/30">
        {formatDate(deposit.createdAt)}
      </p>

      {deposit.adminNote && (
        <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-white/50">
          Admin: {deposit.adminNote}
        </p>
      )}
    </div>
  );
}

function TransactionCard({
  transaction,
}: {
  transaction: Transaction;
}) {
  const positive =
    transaction.type === "DEPOSIT" ||
    transaction.type === "WIN" ||
    transaction.type === "REFUND" ||
    transaction.type ===
      "INITIAL_BALANCE";

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
      <div>
        <p className="font-bold">
          {getTransactionName(
            transaction.type,
          )}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {formatDate(
            transaction.createdAt,
          )}
        </p>
      </div>

      <span
        className={`font-black ${
          positive
            ? "text-green-300"
            : "text-red-300"
        }`}
      >
        {positive ? "+" : "-"}
        {Math.abs(
          transaction.amount,
        ).toLocaleString()}
      </span>
    </div>
  );
}

function getTransactionName(
  type: Transaction["type"],
) {
  switch (type) {
    case "INITIAL_BALANCE":
      return "Initial Balance";

    case "DEPOSIT":
      return "Telebirr Deposit";

    case "PREDICTION":
      return "Prediction";

    case "WIN":
      return "Prediction Win";

    case "REFUND":
      return "Refund";

    default:
      return "Transaction";
  }
}

function formatDate(
  value: string,
) {
  try {
    return new Date(
      value,
    ).toLocaleString();
  } catch {
    return "";
  }
}

function fileToBase64(
  file: File,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () =>
        resolve(
          String(reader.result),
        );

      reader.onerror = reject;

      reader.readAsDataURL(file);
    },
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />

        <p className="mt-4 text-sm text-white/40">
          Loading wallet...
        </p>
      </div>
    </main>
  );
}