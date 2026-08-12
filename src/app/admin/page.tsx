"use client";

import { useEffect, useState } from "react";

import { useTelegram } from "@/components/telegram/telegram-provider";

type Fight = {
  id: string;
  title: string;
  description: string | null;

  fighterAName: string;
  fighterBName: string;

  fighterAProbability: number;
  fighterBProbability: number;

  winner: string | null;

  status:
    | "UPCOMING"
    | "LIVE"
    | "FINISHED"
    | "CANCELLED";

  scheduledAt: string | null;

  _count: {
    predictions: number;
  };
};

export default function AdminPage() {
const {
  user,
  initData,
  loading: telegramLoading,
  isTelegram,
  showBackButton,
  hideBackButton,
} = useTelegram();

  const [fights, setFights] =
    useState<Fight[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);
useEffect(() => {
  if (
    telegramLoading ||
    !isTelegram ||
    !user ||
    user.role !== "ADMIN"
  ) {
    return;
  }

  showBackButton(() => {
    window.location.href = "/";
  });

  return () => {
    hideBackButton();
  };
}, [
  telegramLoading,
  isTelegram,
  user,
  showBackButton,
  hideBackButton,
]);

  async function loadFights() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/fights",
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
            "Failed to load fights",
        );
      }

      setFights(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load fights",
      );
    } finally {
      setLoading(false);
    }
  }

  if (telegramLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isTelegram) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <div className="text-5xl">
            📱
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Open in Telegram
          </h1>

          <p className="mt-2 text-white/50">
            This admin panel is only available
            inside Telegram.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Authenticating...</p>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <div className="text-5xl">
            🔒
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Access Denied
          </h1>

          <p className="mt-2 text-white/50">
            Administrator access is required.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-sm text-white/40">
            Fight Predict
          </p>

          <h1 className="text-3xl font-black">
            Admin Panel
          </h1>
        </header>

        <button
          type="button"
          onClick={() =>
            setShowCreate(true)
          }
          className="w-full rounded-2xl bg-white px-5 py-4 font-black text-black"
        >
          + Create Fight
        </button>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">
              Fights
            </h2>

            <button
              type="button"
              onClick={loadFights}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white/10 p-6 text-center">
              Loading fights...
            </div>
          ) : fights.length === 0 ? (
            <div className="rounded-3xl bg-white/10 p-6 text-center">
              No fights yet.
            </div>
          ) : (
            <div className="space-y-4">
              {fights.map((fight) => (
                <FightCard
                  key={fight.id}
                  fight={fight}
                  initData={initData}
                  onUpdated={loadFights}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <CreateFightModal
          initData={initData}
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={async () => {
            setShowCreate(false);
            await loadFights();
          }}
        />
      )}
    </main>
  );
}


function FightCard({
  fight,
  initData,
  onUpdated,
}: {
  fight: Fight;
  initData: string;
  onUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function changeStatus(
    status: string,
  ) {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/fights/status",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,
              fightId: fight.id,
              status,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to update fight",
        );
      }

      await onUpdated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update fight",
      );
    } finally {
      setLoading(false);
    }
  }

  async function settleFight(
    winner: string,
  ) {
    const confirmed =
      window.confirm(
        `Set ${winner} as the winner?\n\nThis will permanently settle all pending predictions.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/fights/settle",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,
              fightId: fight.id,
              winner,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to settle fight",
        );
      }

      await onUpdated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to settle fight",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white/10 p-5">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
            fight.status,
          )}`}
        >
          {fight.status}
        </span>

        <span className="text-xs text-white/40">
          {fight._count.predictions}{" "}
          predictions
        </span>
      </div>

      <h3 className="mt-4 text-xl font-black">
        {fight.title}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-4 text-center">
          <p className="font-black">
            {fight.fighterAName}
          </p>

          <p className="mt-2 text-3xl font-black">
            {fight.fighterAProbability}%
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 text-center">
          <p className="font-black">
            {fight.fighterBName}
          </p>

          <p className="mt-2 text-3xl font-black">
            {fight.fighterBProbability}%
          </p>
        </div>
      </div>

      {fight.winner && (
        <div className="mt-4 rounded-2xl bg-green-500/10 p-4 text-center">
          <p className="text-xs text-green-300/60">
            WINNER
          </p>

          <p className="mt-1 text-xl font-black text-green-300">
            🏆 {fight.winner}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {fight.status ===
          "UPCOMING" && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              changeStatus("LIVE")
            }
            className="w-full rounded-xl bg-white py-3 font-black text-black disabled:opacity-50"
          >
            {loading
              ? "Updating..."
              : "Start Fight"}
          </button>
        )}

        {fight.status === "LIVE" && (
          <>
            <p className="mb-2 text-center text-xs font-bold uppercase text-white/40">
              Select Winner
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  settleFight(
                    fight.fighterAName,
                  )
                }
                className="rounded-xl bg-white py-3 font-black text-black disabled:opacity-50"
              >
                🏆{" "}
                {fight.fighterAName}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  settleFight(
                    fight.fighterBName,
                  )
                }
                className="rounded-xl bg-white py-3 font-black text-black disabled:opacity-50"
              >
                🏆{" "}
                {fight.fighterBName}
              </button>
            </div>
          </>
        )}

        {fight.status ===
          "FINISHED" && (
          <div className="rounded-xl bg-white/5 p-3 text-center text-sm text-white/40">
            Fight settled
          </div>
        )}

        {fight.status !==
          "FINISHED" &&
          fight.status !==
            "CANCELLED" && (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                changeStatus(
                  "CANCELLED",
                )
              }
              className="w-full rounded-xl border border-red-500/20 py-3 text-sm font-bold text-red-300 disabled:opacity-50"
            >
              Cancel Fight
            </button>
          )}
      </div>
    </div>
  );
}



function getStatusStyle(
  status: Fight["status"],
) {
  switch (status) {
    case "UPCOMING":
      return "bg-yellow-500/20 text-yellow-300";

    case "LIVE":
      return "bg-red-500/20 text-red-300";

    case "FINISHED":
      return "bg-green-500/20 text-green-300";

    case "CANCELLED":
      return "bg-white/10 text-white/40";

    default:
      return "bg-white/10 text-white/50";
  }
}


function CreateFightModal({
  initData,
  onClose,
  onCreated,
}: {
  initData: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [fighterAName, setFighterAName] =
    useState("Sedo");

  const [fighterBName, setFighterBName] =
    useState("Johnny");

  const [fighterAProbability, setFighterAProbability] =
    useState(35);

  const [fighterBProbability, setFighterBProbability] =
    useState(65);

  const [scheduledAt, setScheduledAt] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function createFight(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      fighterAProbability +
        fighterBProbability !==
      100
    ) {
      setError(
        "Probabilities must total 100%.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/fights/create",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              initData,
              title,
              description,
              fighterAName,
              fighterBName,
              fighterAProbability,
              fighterBProbability,
              scheduledAt:
                scheduledAt || null,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to create fight",
        );
      }

      await onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create fight",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-black">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">
            Create Fight
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/5 px-3 py-2"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={createFight}
          className="space-y-4"
        >
          <Field
            label="Fight Title"
            value={title}
            onChange={setTitle}
            placeholder="Sedo vs Johnny"
          />

          <div>
            <label className="text-sm font-bold">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Fight description..."
              rows={3}
              className="mt-2 w-full rounded-xl bg-black/5 p-3 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Fighter A"
              value={fighterAName}
              onChange={
                setFighterAName
              }
              placeholder="Sedo"
            />

            <Field
              label="Fighter B"
              value={fighterBName}
              onChange={
                setFighterBName
              }
              placeholder="Johnny"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Probabilities
            </label>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-black/40">
                  {fighterAName || "Fighter A"}
                </p>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    fighterAProbability
                  }
                  onChange={(event) =>
                    setFighterAProbability(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                  className="w-full rounded-xl bg-black/5 p-3 text-center text-xl font-black outline-none"
                />
              </div>

              <div>
                <p className="mb-1 text-xs text-black/40">
                  {fighterBName || "Fighter B"}
                </p>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    fighterBProbability
                  }
                  onChange={(event) =>
                    setFighterBProbability(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                  className="w-full rounded-xl bg-black/5 p-3 text-center text-xl font-black outline-none"
                />
              </div>
            </div>

            <p
              className={`mt-2 text-center text-sm font-bold ${
                fighterAProbability +
                  fighterBProbability ===
                100
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Total:{" "}
              {fighterAProbability +
                fighterBProbability}
              %
            </p>
          </div>

          <div>
            <label className="text-sm font-bold">
              Scheduled Time
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) =>
                setScheduledAt(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl bg-black/5 p-3 outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-4 font-black text-white disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Fight"}
          </button>
        </form>
      </div>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl bg-black/5 p-3 outline-none"
      />
    </div>
  );
}