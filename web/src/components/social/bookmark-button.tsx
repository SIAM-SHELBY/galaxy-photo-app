"use client";

import { useState, useTransition } from "react";

import { toggleBookmark } from "@/actions/bookmarks";

export function BookmarkButton({
  photoId,
  initialBookmarked,
}: {
  photoId: string;
  initialBookmarked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          const prev = bookmarked;
          setBookmarked(!prev);

          void (async () => {
            try {
              const res = await toggleBookmark(photoId);
              setBookmarked(res.bookmarked);
            } catch {
              setBookmarked(prev);
            }
          })();
        });
      }}
      className={
        bookmarked
          ? "rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
          : "rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
      }
    >
      {isPending ? "Working…" : bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
