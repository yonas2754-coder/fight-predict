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

  const [image, setImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file.",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Image must be smaller than 10MB.",
      );
      return;
    }

    setError("");

    setImage(file);

    setPreview(
      URL.createObjectURL(file),
    );
  }

  function removeImage() {
    setImage(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview("");
  }

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

      /*
       * FormData allows us to send
       * both text and an actual image file.
       */

      const formData =
        new FormData();

      formData.append(
        "initData",
        initData,
      );

      formData.append(
        "message",
        message.trim(),
      );

      if (image) {
        formData.append(
          "image",
          image,
        );
      }

      const response =
        await fetch(
          "/api/admin/broadcast",
          {
            method: "POST",
            body: formData,
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
      removeImage();
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

        <a
          href="/admin"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Admin Panel
        </a>

        <h1 className="mt-5 text-3xl font-black">
          📢 Broadcast Message
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Send a message and optional
          image directly from your
          Telegram bot.
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

        <form
          onSubmit={sendBroadcast}
          className="mt-6 space-y-5"
        >

          {/* IMAGE UPLOAD */}

          <div>
            <label className="text-sm font-bold text-white/70">
              🖼️ Image
            </label>

            {!image ? (
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 transition hover:bg-white/10">
                <span className="text-4xl">
                  📷
                </span>

                <span className="mt-3 text-sm font-bold">
                  Select Image
                </span>

                <span className="mt-1 text-xs text-white/40">
                  PNG, JPG, WEBP · Max 10MB
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />
              </label>
            ) : (
              <div className="mt-2 overflow-hidden rounded-3xl border border-white/10 bg-white/5">

                <img
                  src={preview}
                  alt="Selected image"
                  className="max-h-72 w-full object-cover"
                />

                <div className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {image.name}
                    </p>

                    <p className="text-xs text-white/40">
                      {(
                        image.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeImage
                    }
                    className="ml-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
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

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-3 max-h-64 w-full rounded-2xl object-cover"
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