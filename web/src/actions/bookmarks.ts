"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assertCanViewPhoto } from "@/lib/photos/permissions";
import { requireRateLimit } from "@/lib/security/rate-limit";

export async function toggleBookmark(photoId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await requireRateLimit({
    key: `user:${userId}`,
    bucket: "bookmark:toggle",
    limit: 20,
    windowMs: 60_000,
  });

  await assertCanViewPhoto(photoId, userId);

  const existing = await prisma.bookmark.findUnique({
    where: { userId_photoId: { userId, photoId } },
    select: { userId: true },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { userId_photoId: { userId, photoId } } });
  } else {
    await prisma.bookmark.create({ data: { userId, photoId } });
  }

  revalidatePath(`/post/${photoId}`);
  return { bookmarked: !existing };
}
