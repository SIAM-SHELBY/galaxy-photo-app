import Image from "next/image";
import Link from "next/link";

import { cloudinaryThumbUrl } from "@/lib/cloudinary/urls";

export function ExploreGrid({
  photos,
}: {
  photos: Array<{
    id: string;
    assetUrl: string;
    width: number;
    height: number;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <Link
          key={p.id}
          href={`/post/${p.id}`}
          className="block overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
          style={{ aspectRatio: `${p.width}/${p.height}` }}
        >
          <div className="relative h-full w-full">
            <Image
              src={cloudinaryThumbUrl(p.assetUrl, { width: 900 })}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
