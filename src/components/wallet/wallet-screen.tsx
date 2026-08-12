"use client";

import { useEffect, useState } from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";

type Transaction = {
  id: string;
  type:
    | "INITIAL_BALANCE"
    | "PREDICTION"
    | "WIN"
    | "REFUND";
  amount: number;
  description: string | null;
  createdAt: string;
};

export default function WalletScreen() {
  const { initData } = useTelegram();

  const [balance, setBalance] =
    useState(0);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadWallet() {
      if (!initData) {
        return;
      }

      try {
        const response = await fetch(
          "/api/wallet",
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
              "Failed to load wallet",
          );
        }

        setBalance(
          result.data.balance,
        );

        setTransactions(
          result.data.transactions,
        );
      } catch (error) {
        console.error(
          "Wallet loading error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [initData]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/10 p-6 text-center">
        Loading wallet...
      </div>
    );
  }

  return (
    <section>
      <div className="rounded-3xl bg-white p-6 text-black">
        <p className="text-sm font-bold text-black/40">
          AVAILABLE BALANCE
        </p>

        <p className="mt-2 text-4xl font-black">
          {balance.toLocaleString()}
        </p>

        <p className="mt-1 text-sm text-black/40">
          Virtual points
        </p>
      </div>

      <div className="mt-5">
        <h2 className="mb-4 text-xl font-black">
          Transactions
        </h2>

        {transactions.length === 0 ? (
          <div className="rounded-3xl bg-white/10 p-6 text-center text-white/50">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(
              (transaction) => {
                const positive =
                  transaction.amount > 0;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-2xl bg-white/10 p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {getTransactionTitle(
                          transaction.type,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {transaction.description ||
                          "Transaction"}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {formatDate(
                          transaction.createdAt,
                        )}
                      </p>
                    </div>

                    <p
                      className={`text-lg font-black ${
                        positive
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {transaction.amount.toLocaleString()}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function getTransactionTitle(
  type: Transaction["type"],
) {
  switch (type) {
    case "INITIAL_BALANCE":
      return "Starting Balance";

    case "PREDICTION":
      return "Prediction";

    case "WIN":
      return "Prediction Won";

    case "REFUND":
      return "Refund";

    default:
      return "Transaction";
  }
}

function formatDate(
  value: string,
) {
  return new Date(value).toLocaleString();
}