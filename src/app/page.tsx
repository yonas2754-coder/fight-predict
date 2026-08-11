"use client";

import { useTelegram } from "@/components/telegram/telegram-provider";

export default function Home() {
  const {
    user,
    isTelegram,
    loading,
  } = useTelegram();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-5xl">
            🥊
          </div>

          <p className="mt-4 text-white/60">
            Connecting to Telegram...
          </p>
        </div>
      </main>
    );
  }

  if (!isTelegram) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 text-center">
          <div className="text-6xl">
            📱
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Fight Predict
          </h1>

          <p className="mt-4 text-white/60">
            Please open this application
            from Telegram.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-white/10 p-6">
          <div className="flex items-center gap-4">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl">
                👤
              </div>
            )}

            <div>
              <p className="text-sm text-white/50">
                Welcome
              </p>

              <h1 className="text-2xl font-black">
                {user?.firstName}
              </h1>

              {user?.username && (
                <p className="text-sm text-white/50">
                  @{user.username}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-white/50">
              Virtual Balance
            </p>

            <p className="mt-1 text-3xl font-black">
              {(
                user?.balance ?? 0
              ).toLocaleString()}{" "}
              points
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 text-black">
          <div className="text-center">
            <span className="text-sm font-bold uppercase text-black/40">
              Upcoming Fight
            </span>

            <h2 className="mt-3 text-3xl font-black">
              Sedo
              <span className="mx-3 text-black/30">
                VS
              </span>
              Johnny
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/5 p-5 text-center">
              <div className="text-4xl">
                🥊
              </div>

              <h3 className="mt-3 text-xl font-black">
                Sedo
              </h3>

              <p className="mt-2 text-3xl font-black">
                35%
              </p>
            </div>

            <div className="rounded-2xl bg-black/5 p-5 text-center">
              <div className="text-4xl">
                🥊
              </div>

              <h3 className="mt-3 text-xl font-black">
                Johnny
              </h3>

              <p className="mt-2 text-3xl font-black">
                65%
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}