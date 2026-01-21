"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FeedGrid } from "@/components/feed/feed-grid";

type FeedPhoto = {
  id: string;
  assetUrl: string;
  width: number;
  height: number;
  createdAt: string;
  author: { username: string | null; name: string | null; image: string | null };
};

type Cursor = { cursorId: string; cursorCreatedAt: string } | null;

export function FeedInfinite({
  initialPhotos,
  initialCursor,
}: {
  initialPhotos: FeedPhoto[];
  initialCursor: Cursor;
}) {
  const [photos, setPhotos] = useState<FeedPhoto[]>(initialPhotos);
  const [cursor, setCursor] = useState<Cursor>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const canLoadMore = cursor !== null;

  const fetchUrl = useMemo(() => {
    const base = new URL("/api/feed", window.location.origin);
    base.searchParams.set("limit", "20");
    if (cursor) {
      base.searchParams.set("cursorId", cursor.cursorId);
      base.searchParams.set("cursorCreatedAt", cursor.cursorCreatedAt);
    }
    return base.toString();
  }, [cursor]);

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
            const json = (await res.json()) as { photos: FeedPhoto[]; nextCursor: Cursor };

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
      <FeedGrid photos={photos.map((p) => ({ ...p }))} />
      <div ref={sentinelRef} />
      {loading ? <div className="text-sm text-neutral-500">Loading…</div> : null}
      {!canLoadMore && photos.length > 0 ? (
        <div className="text-sm text-neutral-500">End of feed.</div>
      ) : null}
      {photos.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No photos yet. Follow photographers to populate your feed.
        </div>
      ) : null}
    </div>
  );
}
