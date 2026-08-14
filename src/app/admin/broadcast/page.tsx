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

  const [imageUrl, setImageUrl] =
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
        "Please enter a message.",
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

              message:
                message.trim(),

              imageUrl:
                imageUrl.trim() ||
                null,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to send broadcast.",
        );
      }

      setSuccess(
        `Broadcast completed. Sent: ${result.data.sent}, Failed: ${result.data.failed}`,
      );

      setMessage("");
      setImageUrl("");
    } catch (err) {
      console.error(
        "Broadcast error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send broadcast.",
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

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Admin access required
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-md">

        {/* BACK */}

        <a
          href="/admin"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Admin Panel
        </a>

        {/* TITLE */}

        <h1 className="mt-5 text-3xl font-black">
          📢 Broadcast Message
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Send a message and optional
          image directly from your
          Telegram bot to all users.
        </p>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            ✅ {success}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={sendBroadcast}
          className="mt-6 space-y-5"
        >

          {/* IMAGE */}

          <div>
            <label className="text-sm font-bold text-white/70">
              🖼️ Image URL
            </label>

            <input
              type="url"
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(
                  event.target.value,
                )
              }
              placeholder="https://example.com/fight.jpg"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-white outline-none transition focus:border-white/30 placeholder:text-white/30"
            />

            <p className="mt-2 text-xs text-white/30">
              Optional. Leave empty to send
              text only.
            </p>
          </div>

          {/* MESSAGE */}

          <div>
            <label className="text-sm font-bold text-white/70">
              💬 Message
            </label>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder="Write your broadcast message..."
              rows={8}
              className="mt-2 w-full resize-none rounded-3xl border border-white/10 bg-white/10 p-5 text-white outline-none transition focus:border-white/30 placeholder:text-white/30"
            />
          </div>

          {/* PREVIEW */}

          <div className="rounded-2xl bg-white/5 p-4">

            <p className="text-xs font-bold text-white/40">
              PREVIEW
            </p>

            {imageUrl.trim() && (
              <img
                src={imageUrl}
                alt="Broadcast preview"
                className="mt-3 max-h-64 w-full rounded-2xl object-cover"
                onError={(
                  event,
                ) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            )}

            <p className="mt-3 whitespace-pre-wrap text-sm">
              {message ||
                "Your message preview will appear here..."}
            </p>

          </div>

          {/* SEND */}

          <button
            type="submit"
            disabled={
              sending ||
              !message.trim()
            }
            className="w-full rounded-2xl bg-white py-4 font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending
              ? "📤 Sending..."
              : "📢 Send to All Users"}
          </button>

        </form>
      </div>
    </main>
  );
}