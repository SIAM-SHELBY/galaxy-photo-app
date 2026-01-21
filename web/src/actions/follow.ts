"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requireRateLimit } from "@/lib/security/rate-limit";

export async function toggleFollow(targetUserId: string, targetUsername?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const viewerId = session.user.id;

  await requireRateLimit({
    key: `user:${viewerId}`,
    bucket: "follow:toggle",
    limit: 10,
    windowMs: 60_000,
  });

  if (viewerId === targetUserId) throw new Error("Cannot follow yourself");

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: targetUserId,
      },
    },
    select: { followerId: true },
  });

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: targetUserId,
        },
      },
    });
  } else {
    await prisma.follow.create({
      data: {
        followerId: viewerId,
        followingId: targetUserId,
      },
    });
  }

  revalidatePath("/");
  if (targetUsername) revalidatePath(`/p/${targetUsername}`);

  return { following: !existing };
}
