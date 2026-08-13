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

  // Modal State for Fayda ID Details
  const [showFaydaModal, setShowFaydaModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Configurable Admin Details
  const ADMIN_TELEBIRR_NO = "0930327375";
  const ADMIN_FAYDA_ID = "1029 3847 5612"; 
  const ADMIN_NAME = "Yonas";

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
        throw new Error(result.error || "Failed to load wallet");
      }

      setDeposits(result.data.deposits || []);
      setTransactions(result.data.transactions || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load wallet"
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function submitDeposit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    if (!transactionNumber.trim()) {
      setError("Enter your Telebirr transaction number.");
      return;
    }

    try {
      setSubmitting(true);

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
        throw new Error(result.error || "Failed to submit deposit");
      }

      setSuccess(
        "Deposit submitted successfully! Admin will verify your transaction."
      );

      setAmount("");
      setTransactionNumber("");
      setScreenshot(null);

      const fileInput = document.getElementById(
        "screenshot"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadWallet();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to submit deposit"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleCopyFayda = () => {
    navigator.clipboard.writeText(ADMIN_FAYDA_ID.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="text-center">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-4 text-2xl font-black">Authentication Required</h1>
          <p className="mt-2 text-sm text-white/40">
            Please open the application from Telegram.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-10 text-white relative">
      <div className="mx-auto w-full max-w-md px-5 py-5">
        {/* Header */}
        <header className="flex items-center gap-3">
          <a
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl transition-all hover:bg-white/20"
          >
            ←
          </a>

          <div>
            <p className="text-xs text-white/40">Account</p>
            <h1 className="text-2xl font-black">Wallet</h1>
          </div>
        </header>

        {/* Balance Card */}
        <section className="mt-6 rounded-3xl bg-white p-6 text-black shadow-lg">
          <p className="text-sm font-medium text-black/50">Available Balance</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-5xl font-black">
              {user.balance.toLocaleString()}
            </span>
            <span className="ml-2 text-sm font-bold text-black/50">
              points
            </span>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Telebirr & Verified Merchant Details */}
        <section className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
              💳
            </div>

            <div>
              <h2 className="font-black">Add Balance</h2>
              <p className="text-xs text-white/40">
                Deposit using Telebirr
              </p>
            </div>
          </div>

          {/* Official Admin & Payment Verification Box */}
          <div className="mt-5 rounded-2xl bg-white/5 p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                  Recipient Identity
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {ADMIN_NAME}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                ✓ Verified Admin
              </span>
            </div>

            {/* Clickable Admin Fayda ID Banner */}
            <button
              type="button"
              onClick={() => setShowFaydaModal(true)}
              className="w-full text-left rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 transition-all hover:bg-emerald-900/40 active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🪪</span>
                  <p className="text-xs font-bold text-emerald-300">
                    National Fayda ID Verified
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400 group-hover:underline">
                  View Details 🔍
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-white/80">
                FIN: <span className="font-bold text-emerald-400">{ADMIN_FAYDA_ID}</span>
              </p>
            </button>

            {/* Telebirr Account Number & Holder */}
            <div className="flex items-center justify-between rounded-xl bg-black/40 p-3">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                  Telebirr Account ({ADMIN_NAME})
                </p>
                <p className="mt-0.5 font-mono text-lg font-black text-emerald-400">
                  {ADMIN_TELEBIRR_NO}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(ADMIN_TELEBIRR_NO)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Deposit Form */}
          <form onSubmit={submitDeposit} className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-bold">Amount (ETB)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-emerald-500/50 placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Telebirr Transaction Number
              </label>
              <input
                type="text"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Enter 10-digit transaction ID"
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 font-mono text-white outline-none focus:border-emerald-500/50 placeholder:text-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="screenshot"
                className="block text-sm font-bold"
              >
                Payment Screenshot
              </label>

              <input
                id="screenshot"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  setScreenshot(e.target.files?.[0] || null)
                }
                className="mt-1.5 block w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/50 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-white/20"
              />

              {screenshot && (
                <p className="mt-2 text-xs text-emerald-400">
                  Selected: {screenshot.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-2xl bg-white py-4 font-black text-black transition-all hover:bg-slate-100 active:scale-[0.99] disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit Deposit"}
            </button>
          </form>
        </section>

        {/* Deposit History */}
        <section className="mt-8">
          <h2 className="text-xl font-black">Deposit History</h2>

          {loadingData ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              Loading history...
            </div>
          ) : deposits.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              No deposits submitted yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {deposits.map((deposit) => (
                <DepositCard key={deposit.id} deposit={deposit} />
              ))}
            </div>
          )}
        </section>

        {/* Transactions Section */}
        <section className="mt-8">
          <h2 className="text-xl font-black">Transactions</h2>

          {transactions.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/40">
              No transactions yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Admin Fayda ID Details Modal Popup */}
      {showFaydaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/10 p-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪪</span>
                <h3 className="font-bold text-white text-base">
                  Official Fayda Verification
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowFaydaModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Text Content */}
            <div className="mt-4 space-y-4 text-center">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                <div className="text-4xl mb-2">🇪🇹</div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Verified Merchant FIN
                </p>
                <p className="mt-2 font-mono text-2xl font-black text-white tracking-wider">
                  {ADMIN_FAYDA_ID}
                </p>
                <p className="text-[11px] text-white/40 mt-2">
                  National ID Program • Federal Democratic Republic of Ethiopia
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3 flex items-center justify-between text-xs text-left">
                <div>
                  <p className="text-white/40 text-[10px] uppercase font-semibold">
                    Account Holder
                  </p>
                  <p className="font-bold text-white mt-0.5">
                    {ADMIN_NAME}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyFayda}
                  className="rounded-lg bg-emerald-500/20 text-emerald-300 px-3 py-1.5 font-bold hover:bg-emerald-500/30 transition-all"
                >
                  {copied ? "Copied! ✓" : "Copy FIN"}
                </button>
              </div>

              <p className="text-[11px] text-white/40 leading-relaxed">
                🛡️ Verified against the national digital identification registry for secure payment handling.
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowFaydaModal(false)}
              className="mt-5 w-full rounded-xl bg-white/10 py-3 font-bold text-xs text-white hover:bg-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function DepositCard({ deposit }: { deposit: Deposit }) {
  const statusStyle = {
    PENDING: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    REJECTED: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="font-black text-lg">
          +{deposit.amount.toLocaleString()} ETB
        </span>

        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-bold ${statusStyle[deposit.status]}`}
        >
          {deposit.status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <div>
          <span className="block text-[10px] text-white/30 uppercase font-semibold">
            Txn ID
          </span>
          <span className="font-mono text-white/80">{deposit.transactionNumber}</span>
        </div>

        <p className="text-[11px] text-white/30">
          {formatDate(deposit.createdAt)}
        </p>
      </div>

      {deposit.adminNote && (
        <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-white/60">
          <strong>Note:</strong> {deposit.adminNote}
        </p>
      )}
    </div>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const positive =
    transaction.type === "DEPOSIT" ||
    transaction.type === "WIN" ||
    transaction.type === "REFUND" ||
    transaction.type === "INITIAL_BALANCE";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
      <div>
        <p className="font-bold">{getTransactionName(transaction.type)}</p>
        <p className="mt-1 text-xs text-white/30">
          {formatDate(transaction.createdAt)}
        </p>
      </div>

      <span
        className={`font-black ${
          positive ? "text-emerald-300" : "text-rose-300"
        }`}
      >
        {positive ? "+" : "-"}
        {Math.abs(transaction.amount).toLocaleString()}
      </span>
    </div>
  );
}

function getTransactionName(type: Transaction["type"]) {
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

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="mt-4 text-sm text-white/40">Loading wallet...</p>
      </div>
    </main>
  );
}