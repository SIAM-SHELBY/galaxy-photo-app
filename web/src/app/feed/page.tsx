import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { FeedInfinite } from "@/components/feed/feed-infinite";

export const dynamic = "force-dynamic";

type FeedPhotoItem = {
  id: string;
  assetUrl: string;
  width: number;
  height: number;
  createdAt: Date;
  author: { username: string | null; name: string | null; image: string | null };
};

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const viewerId = session.user.id;

  const photos: FeedPhotoItem[] = await prisma.photo.findMany({
    where: {
      visibility: "PUBLIC",
      OR: [
        { authorId: viewerId },
        { author: { followers: { some: { followerId: viewerId } } } },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 20,
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
      createdAt: true,
      author: { select: { username: true, name: true, image: true } },
    },
  });

  const nextCursor =
    photos.length === 0
      ? null
      : {
          cursorId: photos[photos.length - 1]!.id,
          cursorCreatedAt: photos[photos.length - 1]!.createdAt.toISOString(),
        };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
      </header>

      <section className="mt-8">
        <FeedInfinite
          initialPhotos={photos.map((p: FeedPhotoItem) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          }))}
          initialCursor={nextCursor}
        />
      </section>
    </div>
  );
}
