import Image from "next/image";

import { FollowButton } from "@/components/profile/follow-button";

function initials(nameOrEmail: string) {
  const value = nameOrEmail.trim();
  if (!value) return "?";

  const parts = value.split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]).join("");
  return letters.toUpperCase();
}

export function ProfileHeader({
  viewerId,
  user,
  stats,
  isFollowing,
}: {
  viewerId: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
  };
  stats: {
    photoCount: number;
    followerCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
}) {
  const displayName = user.name ?? user.username;
  const subtitle = user.username;

  const canFollow = viewerId !== null && viewerId !== user.id;

  return (
    <header className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-700">
              {initials(user.name ?? user.email ?? user.username)}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
            {canFollow ? (
              <FollowButton
                targetUserId={user.id}
                targetUsername={user.username}
                initialFollowing={isFollowing}
              />
            ) : null}
          </div>

          <p className="text-sm text-neutral-600">@{subtitle}</p>

          {user.bio ? (
            <p className="max-w-prose text-sm leading-6 text-neutral-800">{user.bio}</p>
          ) : null}

          <div className="flex gap-4 pt-2 text-sm text-neutral-700">
            <div>
              <span className="font-medium text-neutral-950">{stats.photoCount}</span> photos
            </div>
            <div>
              <span className="font-medium text-neutral-950">{stats.followerCount}</span> followers
            </div>
            <div>
              <span className="font-medium text-neutral-950">{stats.followingCount}</span> following
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
