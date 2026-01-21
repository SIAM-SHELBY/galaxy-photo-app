import Image from "next/image";
import Link from "next/link";

import { cloudinaryThumbUrl } from "@/lib/cloudinary/urls";

export function FeedGrid({
  photos,
}: {
  photos: Array<{
    id: string;
    assetUrl: string;
    width: number;
    height: number;
    author: { username: string | null; name: string | null; image: string | null };
  }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {photos.map((p) => (
        <article key={p.id} className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <div className="h-6 w-6 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
              {p.author.image ? (
                <Image
                  src={p.author.image}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 object-cover"
                />
              ) : null}
            </div>
            <span className="font-medium text-neutral-950">
              {p.author.username ? `@${p.author.username}` : p.author.name ?? ""}
            </span>
          </div>

          <Link
            href={`/post/${p.id}`}
            className="block overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
            style={{ aspectRatio: `${p.width}/${p.height}` }}
          >
            <div className="relative h-full w-full">
              <Image
                src={cloudinaryThumbUrl(p.assetUrl, { width: 1400 })}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
