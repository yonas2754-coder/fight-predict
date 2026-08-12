"use client";

export default function ConfirmationModal({
  fighter,
  amount,
  onCancel,
  onConfirm,
  loading,
}: {
  fighter: string;
  amount: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-black">
        <div className="text-center">
          <div className="text-5xl">
            🥊
          </div>

          <h2 className="mt-4 text-2xl font-black">
            Confirm Prediction
          </h2>

          <p className="mt-2 text-black/50">
            You selected
          </p>

          <p className="mt-1 text-2xl font-black">
            {fighter}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-black/5 p-4 text-center">
          <p className="text-sm text-black/40">
            Prediction amount
          </p>

          <p className="mt-1 text-3xl font-black">
            {amount.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-black/40">
            virtual points
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl bg-black/5 py-4 font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-black py-4 font-black text-white disabled:opacity-50"
          >
            {loading
              ? "Placing..."
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}