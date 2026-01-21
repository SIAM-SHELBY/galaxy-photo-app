"use client";

import { useState, useTransition } from "react";

import { toggleLike } from "@/actions/likes";

export function LikeButton({
  photoId,
  initialLiked,
  initialCount,
}: {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          const prevLiked = liked;
          const prevCount = count;
          const nextLiked = !prevLiked;

          setLiked(nextLiked);
          setCount(Math.max(0, prevCount + (nextLiked ? 1 : -1)));

          void (async () => {
            try {
              const res = await toggleLike(photoId);
              setLiked(res.liked);
              setCount(res.likeCount);
            } catch {
              setLiked(prevLiked);
              setCount(prevCount);
            }
          })();
        });
      }}
      className={
        liked
          ? "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          : "rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
      }
    >
      {isPending ? "Working…" : liked ? `Liked · ${count}` : `Like · ${count}`}
    </button>
  );
}
