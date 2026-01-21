"use client";

import { useState, useTransition } from "react";

import { toggleFollow } from "@/actions/follow";

export function FollowButton({
  targetUserId,
  initialFollowing,
  targetUsername,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  targetUsername: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          const previous = following;
          setFollowing(!previous);

          void (async () => {
            try {
              const result = await toggleFollow(targetUserId, targetUsername);
              setFollowing(result.following);
            } catch {
              setFollowing(previous);
            }
          })();
        });
      }}
      disabled={isPending}
      className={
        following
          ? "rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
          : "rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      }
    >
      {isPending ? "Working…" : following ? "Following" : "Follow"}
    </button>
  );
}
