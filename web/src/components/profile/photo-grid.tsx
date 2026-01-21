import Image from "next/image";
import Link from "next/link";

export function PhotoGrid({
  photos,
}: {
  photos: Array<{
    id: string;
    assetUrl: string;
    width: number;
    height: number;
  }>;
}) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        No photos yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <Link
          key={p.id}
          href={`/post/${p.id}`}
          className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
        >
          <Image
            src={p.assetUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.01]"
          />
        </Link>
      ))}
    </div>
  );
}
