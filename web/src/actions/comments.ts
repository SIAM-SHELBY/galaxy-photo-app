"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assertCanViewPhoto } from "@/lib/photos/permissions";
import { moderateCommentText } from "@/lib/security/moderation";
import { requireRateLimit } from "@/lib/security/rate-limit";

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  hiddenAt: Date | null;
  author: { username: string | null; name: string | null; image: string | null };
};

export async function addComment(input: { photoId: string; body: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await requireRateLimit({
    key: `user:${session.user.id}`,
    bucket: "comment:create",
    limit: 10,
    windowMs: 60_000,
  });

  await assertCanViewPhoto(input.photoId, session.user.id);

  const body = input.body.trim();
  const moderation = moderateCommentText(body);
  if (!moderation.ok) throw new Error("Comment rejected by moderation");

  const comment = await prisma.comment.create({
    data: {
      photoId: input.photoId,
      authorId: session.user.id,
      body,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { username: true, name: true, image: true } },
    },
  });

  revalidatePath(`/post/${input.photoId}`);
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function listComments(photoId: string) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  await assertCanViewPhoto(photoId, viewerId);

  const comments: CommentRow[] = await prisma.comment.findMany({
    where: { photoId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      createdAt: true,
      hiddenAt: true,
      author: { select: { username: true, name: true, image: true } },
    },
  });

  const visible = comments.filter((c: CommentRow) => c.hiddenAt === null);
  return visible.map((c: CommentRow) => ({ ...c, createdAt: c.createdAt.toISOString() }));
}
