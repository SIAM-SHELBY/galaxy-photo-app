import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PhotoViewer } from "@/components/photo/photo-viewer";
import { LikeButton } from "@/components/social/like-button";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { ShareLinkButton } from "@/components/social/share-link-button";
import { ReportButton } from "@/components/social/report-button";
import { Comments } from "@/components/social/comments";

export const dynamic = "force-dynamic";

type PostCommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: { username: string | null; name: string | null; image: string | null };
};

export default async function PostPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const photo = await prisma.photo.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
      caption: true,
      visibility: true,
      createdAt: true,
      authorId: true,
      author: { select: { username: true, name: true, image: true } },
      category: { select: { slug: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!photo) notFound();

  // Visibility rules:
  // - PUBLIC: anyone
  // - UNLISTED: anyone with link
  // - PRIVATE: only owner
  if (photo.visibility === "PRIVATE" && viewerId !== photo.authorId) {
    if (!viewerId) redirect("/signin");
    notFound();
  }

  const [liked, bookmarked, comments] = await Promise.all([
    viewerId
      ? prisma.like.findUnique({
          where: { userId_photoId: { userId: viewerId, photoId: photo.id } },
          select: { userId: true },
        })
      : null,
    viewerId
      ? prisma.bookmark.findUnique({
          where: { userId_photoId: { userId: viewerId, photoId: photo.id } },
          select: { userId: true },
        })
      : null,
    prisma.comment.findMany({
      where: { photoId: photo.id, hiddenAt: null },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { username: true, name: true, image: true } },
      },
    }) as unknown as PostCommentRow[],
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-neutral-600">
            {photo.author.username ? (
              <Link href={`/p/${photo.author.username}`} className="text-neutral-950 hover:underline">
                @{photo.author.username}
              </Link>
            ) : (
              <span className="text-neutral-950">{photo.author.name ?? ""}</span>
            )}
            <span className="px-2 text-neutral-300">/</span>
            <Link href={`/explore/${photo.category.slug}`} className="hover:underline">
              {photo.category.name}
            </Link>
          </div>
          {photo.caption ? <div className="text-sm text-neutral-900">{photo.caption}</div> : null}
        </div>
      </header>

      <section className="mt-6">
        <PhotoViewer assetUrl={photo.assetUrl} width={photo.width} height={photo.height} alt={photo.caption ?? ""} />
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-2">
        <LikeButton photoId={photo.id} initialLiked={Boolean(liked)} initialCount={photo._count.likes} />
        <BookmarkButton photoId={photo.id} initialBookmarked={Boolean(bookmarked)} />
        <ShareLinkButton />
        {viewerId && viewerId !== photo.authorId ? <ReportButton photoId={photo.id} /> : null}
        <div className="ml-auto text-xs text-neutral-500">{photo._count.comments} comments</div>
      </section>

      <section className="mt-10">
        <Comments
          photoId={photo.id}
          initialComments={comments.map((c: PostCommentRow) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
          canComment={Boolean(viewerId)}
        />
      </section>
    </div>
  );
}
