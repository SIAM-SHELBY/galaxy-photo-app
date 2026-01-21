"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ExploreGrid } from "@/components/explore/explore-grid";

type ExplorePhoto = {
  id: string;
  assetUrl: string;
  width: number;
  height: number;
  createdAt: string;
  category: { slug: string; name: string };
};

type Cursor = { cursorId: string; cursorCreatedAt: string } | null;

export function ExploreInfinite({
  initialPhotos,
  initialCursor,
  categorySlug,
}: {
  initialPhotos: ExplorePhoto[];
  initialCursor: Cursor;
  categorySlug: string;
}) {
  const [photos, setPhotos] = useState<ExplorePhoto[]>(initialPhotos);
  const [cursor, setCursor] = useState<Cursor>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canLoadMore = cursor !== null;

  const fetchUrl = useMemo(() => {
    const base = new URL("/api/explore", window.location.origin);
    base.searchParams.set("category", categorySlug);
    base.searchParams.set("limit", "30");
    if (cursor) {
      base.searchParams.set("cursorId", cursor.cursorId);
      base.searchParams.set("cursorCreatedAt", cursor.cursorCreatedAt);
    }
    return base.toString();
  }, [categorySlug, cursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!canLoadMore || loading) return;

        setLoading(true);
        void (async () => {
          try {
            const res = await fetch(fetchUrl, { method: "GET" });
            if (!res.ok) return;
            const json = (await res.json()) as { photos: ExplorePhoto[]; nextCursor: Cursor };

            setPhotos((prev) => {
              const existing = new Set(prev.map((p) => p.id));
              const merged = [...prev];
              for (const p of json.photos) if (!existing.has(p.id)) merged.push(p);
              return merged;
            });
            setCursor(json.nextCursor);
          } finally {
            setLoading(false);
          }
        })();
      },
      { rootMargin: "800px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [fetchUrl, canLoadMore, loading]);

  return (
    <div className="space-y-6">
      <ExploreGrid
        photos={photos.map((p) => ({
          id: p.id,
          assetUrl: p.assetUrl,
          width: p.width,
          height: p.height,
        }))}
      />

      <div ref={sentinelRef} />

      {loading ? <div className="text-sm text-neutral-500">Loading…</div> : null}
      {!canLoadMore && photos.length > 0 ? (
        <div className="text-sm text-neutral-500">End of results.</div>
      ) : null}
    </div>
  );
}
