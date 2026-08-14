"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";

export default function AdminPage() {
  const {
    user,
    loading,
  } = useTelegram();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Authentication required
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="text-center">
          <div className="text-5xl">
            🚫
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Access Denied
          </h1>

          <a
            href="/"
            className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-bold text-black"
          >
            Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header>
          <p className="text-sm text-white/40">
            Administration
          </p>

          <h1 className="text-3xl font-black">
            Admin Panel
          </h1>
        </header>

        <div className="mt-6 grid gap-4">

          {/* DEPOSITS */}

          <a
            href="/admin/deposits"
            className="rounded-3xl bg-white p-6 text-black"
          >
            <div className="text-4xl">
              💰
            </div>

            <h2 className="mt-4 text-xl font-black">
              Deposit Requests
            </h2>

            <p className="mt-1 text-sm text-black/40">
              Review Telebirr deposits and
              manage user balances.
            </p>

            <div className="mt-5 font-black">
              Open →
            </div>
          </a>

          {/* BROADCAST */}

          <a
            href="/admin/broadcast"
            className="rounded-3xl bg-blue-500 p-6 text-white"
          >
            <div className="text-4xl">
              📢
            </div>

            <h2 className="mt-4 text-xl font-black">
              Send Message
            </h2>

            <p className="mt-1 text-sm text-white/70">
              Send a message from the Telegram
              bot to all users.
            </p>

            <div className="mt-5 font-black">
              Broadcast →
            </div>
          </a>

          {/* HOME */}

          <a
            href="/"
            className="rounded-2xl bg-white/10 p-5"
          >
            ← Back to ETFC Fight
          </a>

        </div>
      </div>
    </main>
  );
}