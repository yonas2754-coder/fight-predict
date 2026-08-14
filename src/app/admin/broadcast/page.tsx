"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";

export default function BroadcastPage() {
  const {
    user,
    initData,
    loading,
  } = useTelegram();

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  async function sendBroadcast(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError(
        "Please enter a message",
      );

      return;
    }

    try {
      setSending(true);

      const response =
        await fetch(
          "/api/admin/broadcast",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,
              message: message.trim(),
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to send broadcast",
        );
      }

      setSuccess(
        `Message sent to ${result.data.sent} users`,
      );

      setMessage("");
    } catch (error) {
      console.error(
        "Broadcast error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to send message",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Admin access required
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-md">

        <a
          href="/admin"
          className="text-sm text-white/50"
        >
          ← Admin Panel
        </a>

        <h1 className="mt-5 text-3xl font-black">
          📢 Broadcast Message
        </h1>

        <p className="mt-2 text-sm text-white/50">
          This message will be sent directly
          from your Telegram bot to all users.
        </p>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            ✅ {success}
          </div>
        )}

        <form
          onSubmit={sendBroadcast}
          className="mt-6"
        >
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value,
              )
            }
            placeholder="Write your message..."
            rows={8}
            className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 text-white outline-none placeholder:text-white/30"
          />

          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold text-white/40">
              PREVIEW
            </p>

            <p className="mt-2 whitespace-pre-wrap">
              {message ||
                "Your message preview will appear here..."}
            </p>
          </div>

          <button
            type="submit"
            disabled={
              sending ||
              !message.trim()
            }
            className="mt-5 w-full rounded-2xl bg-white py-4 font-black text-black disabled:opacity-40"
          >
            {sending
              ? "Sending..."
              : "📢 Send to All Users"}
          </button>
        </form>

      </div>
    </main>
  );
}