"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";



type Instructions = {
  method: string;
  accountName: string;
  accountNumber: string;
  instructions: string[];
};

export default function DepositPage() {
  const {
    initData,
    user,
  } = useTelegram();

  const [
    instructions,
    setInstructions,
  ] = useState<Instructions | null>(
    null,
  );

  const [amount, setAmount] =
    useState("");

  const [
    transactionNumber,
    setTransactionNumber,
  ] = useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ---------------------------------------------
  // Load payment instructions
  // ---------------------------------------------

  useEffect(() => {
    async function loadInstructions() {
      try {
        const response =
          await fetch(
            "/api/deposits/instructions",
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load payment instructions",
          );
        }

        setInstructions(
          result.data,
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load instructions",
        );
      }
    }

    loadInstructions();
  }, []);

  // ---------------------------------------------
  // File selection
  // ---------------------------------------------

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(
        selectedFile.type,
      )
    ) {
      setError(
        "Please select a JPG, PNG, or WEBP image.",
      );

      return;
    }

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Screenshot must be smaller than 5MB.",
      );

      return;
    }

    setError("");

    setFile(selectedFile);

    const url =
      URL.createObjectURL(
        selectedFile,
      );

    setPreviewUrl(url);
  }

  // ---------------------------------------------
  // Submit deposit
  // ---------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!initData) {
      setError(
        "Telegram authentication is not available.",
      );

      return;
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isInteger(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid deposit amount.",
      );

      return;
    }

    if (
      !transactionNumber.trim()
    ) {
      setError(
        "Enter your Telebirr transaction number.",
      );

      return;
    }

    if (!file) {
      setError(
        "Upload your payment screenshot.",
      );

      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------
      // Upload screenshot
      // -----------------------------------------

      const uploadData =
        new FormData();

      uploadData.append(
        "initData",
        initData,
      );

      uploadData.append(
        "file",
        file,
      );

      const uploadResponse =
        await fetch(
          "/api/deposits/upload",
          {
            method: "POST",
            body: uploadData,
          },
        );

      const uploadResult =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadResult.error ||
            "Screenshot upload failed",
        );
      }

      const screenshotUrl =
        uploadResult.data.url;

      // -----------------------------------------
      // Create deposit
      // -----------------------------------------

      const depositResponse =
        await fetch(
          "/api/deposits",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,

              amount:
                numericAmount,

              transactionNumber:
                transactionNumber.trim(),

              screenshotUrl,
            }),
          },
        );

      const depositResult =
        await depositResponse.json();

      if (!depositResponse.ok) {
        throw new Error(
          depositResult.error ||
            "Failed to submit deposit",
        );
      }

      setMessage(
        "Deposit submitted successfully. Please wait for admin approval.",
      );

      setAmount("");

      setTransactionNumber("");

      setFile(null);

      setPreviewUrl("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Deposit submission failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Add Balance
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Current balance:{" "}
          <strong>
            {user?.balance ?? 0}
          </strong>
        </p>
      </div>

      {instructions && (
        <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Pay with Telebirr
          </h2>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Account name
            </p>

            <p className="font-semibold">
              {
                instructions.accountName
              }
            </p>

            <p className="mt-3 text-sm text-gray-500">
              Telebirr account
            </p>

            <p className="text-xl font-bold">
              {
                instructions.accountNumber
              }
            </p>
          </div>

          <ol className="mt-4 space-y-2 text-sm">
            {instructions.instructions.map(
              (
                instruction,
                index,
              ) => (
                <li
                  key={index}
                >
                  {index + 1}.{" "}
                  {instruction}
                </li>
              ),
            )}
          </ol>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Amount
          </label>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value,
              )
            }
            placeholder="Enter amount"
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Telebirr transaction number
          </label>

          <input
            type="text"
            value={
              transactionNumber
            }
            onChange={(event) =>
              setTransactionNumber(
                event.target.value,
              )
            }
            placeholder="Example: TX123456789"
            className="w-full rounded-xl border px-4 py-3 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Payment screenshot
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleFileChange
            }
            className="w-full rounded-xl border p-3"
          />

          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG or WEBP. Maximum
            5MB.
          </p>
        </div>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border">
            <img
              src={previewUrl}
              alt="Payment screenshot preview"
              className="max-h-80 w-full object-contain"
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit Deposit"}
        </button>
      </form>
    </main>
  );
}