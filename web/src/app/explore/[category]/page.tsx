import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function ExploreCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const categorySlug = params.category;

  const categories: ExploreCategoryItem[] = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  const current = categories.find((c: ExploreCategoryItem) => c.slug === categorySlug);
  if (!current) notFound();

  const photos: ExplorePhotoItem[] = await prisma.photo.findMany({
    where: { visibility: "PUBLIC", category: { slug: categorySlug } },
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
            className={
              c.slug === categorySlug
                ? "rounded-full bg-neutral-900 px-3 py-1.5 text-sm text-white"
                : "rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
            }
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
          categorySlug={categorySlug}
        />
      </section>
    </div>
  );
}
