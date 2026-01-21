import { notFound } from "next/navigation";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PhotoGrid } from "@/components/profile/photo-grid";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username;

  const [session, profile] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        _count: {
          select: {
            photos: true,
            followers: true,
            following: true,
          },
        },
      },
    }),
  ]);

  if (!profile?.username) notFound();

  const viewerId = session?.user?.id ?? null;

  const isFollowing =
    viewerId && viewerId !== profile.id
      ? Boolean(
          await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: profile.id,
              },
            },
            select: { followerId: true },
          })
        )
      : false;

  const photos = await prisma.photo.findMany({
    where:
      viewerId === profile.id
        ? { authorId: profile.id }
        : { authorId: profile.id, visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ProfileHeader
        viewerId={viewerId}
        user={{
          id: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email,
          image: profile.image,
          bio: profile.bio,
        }}
        stats={{
          photoCount: profile._count.photos,
          followerCount: profile._count.followers,
          followingCount: profile._count.following,
        }}
        isFollowing={isFollowing}
      />

      <section className="mt-10">
        <PhotoGrid photos={photos} />
      </section>
    </div>
  );
}
