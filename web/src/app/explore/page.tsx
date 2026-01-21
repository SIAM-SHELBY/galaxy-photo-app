import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { ExploreInfinite } from "@/components/explore/explore-infinite";

export const dynamic = "force-dynamic";

type ExploreCategoryItem = { slug: string; name: string };
type ExplorePhotoItem = {
  id: string;
  assetUrl: string;
  width: number;
  height: number;
  createdAt: Date;
  category: { slug: string; name: string };
};

export default async function ExplorePage() {
  const categories: ExploreCategoryItem[] = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  const photos: ExplorePhotoItem[] = await prisma.photo.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 30,
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
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
        <h1 className="text-xl font-semibold tracking-tight">Explore</h1>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/explore"
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
        >
          All
        </Link>
        {categories.map((c: ExploreCategoryItem) => (
          <Link
            key={c.slug}
            href={`/explore/${c.slug}`}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        <ExploreInfinite
          initialPhotos={photos.map((p: ExplorePhotoItem) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          }))}
          initialCursor={nextCursor}
          categorySlug="all"
        />
      </section>
    </div>
  );
}
