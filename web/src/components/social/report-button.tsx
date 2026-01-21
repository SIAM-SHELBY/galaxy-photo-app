"use client";

import { useState, useTransition } from "react";

import { reportPhoto } from "@/actions/reports";

export function ReportButton({ photoId }: { photoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending || done}
        onClick={() => {
          setError(null);
          startTransition(() => {
            void (async () => {
              try {
                await reportPhoto(photoId);
                setDone(true);
              } catch {
                setError("Could not submit report.");
              }
            })();
          });
        }}
        className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
      >
        {done ? "Reported" : isPending ? "Reporting…" : "Report"}
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
