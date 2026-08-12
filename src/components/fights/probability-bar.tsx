"use client";

export default function ProbabilityBar({
  fighterA,
  fighterB,
  probabilityA,
  probabilityB,
}: {
  fighterA: string;
  fighterB: string;
  probabilityA: number;
  probabilityB: number;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm font-bold">
        <span>
          {fighterA}
        </span>

        <span>
          {probabilityA}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black"
          style={{
            width: `${probabilityA}%`,
          }}
        />
      </div>

      <div className="mt-3 mb-2 flex justify-between text-sm font-bold">
        <span>
          {fighterB}
        </span>

        <span>
          {probabilityB}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black"
          style={{
            width: `${probabilityB}%`,
          }}
        />
      </div>
    </div>
  );
}