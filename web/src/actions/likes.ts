"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assertCanViewPhoto } from "@/lib/photos/permissions";
import { requireRateLimit } from "@/lib/security/rate-limit";

export async function toggleLike(photoId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await requireRateLimit({
    key: `user:${userId}`,
    bucket: "like:toggle",
    limit: 30,
    windowMs: 60_000,
  });

  await assertCanViewPhoto(photoId, userId);

  const existing = await prisma.like.findUnique({
    where: { userId_photoId: { userId, photoId } },
    select: { userId: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { userId_photoId: { userId, photoId } } });
  } else {
    await prisma.like.create({ data: { userId, photoId } });
  }

  const likeCount = await prisma.like.count({ where: { photoId } });
  revalidatePath(`/post/${photoId}`);

  return { liked: !existing, likeCount };
}
