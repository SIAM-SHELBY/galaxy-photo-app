"use server";

import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assertCanViewPhoto } from "@/lib/photos/permissions";
import { requireRateLimit } from "@/lib/security/rate-limit";

export async function reportPhoto(photoId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const reporterId = session.user.id;

  await requireRateLimit({
    key: `user:${reporterId}`,
    bucket: "report:create",
    limit: 5,
    windowMs: 60_000,
  });

  if (!photoId) throw new Error("Missing photo id");
  await assertCanViewPhoto(photoId, reporterId);

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, authorId: true },
  });
  if (!photo) throw new Error("Not found");
  if (photo.authorId === reporterId) throw new Error("Cannot report your own post");

  const existing = await prisma.report.findFirst({
    where: {
      reporterId,
      status: "OPEN",
      targetType: "PHOTO",
      photoId,
    },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.report.create({
    data: {
      reporterId,
      targetType: "PHOTO",
      reason: "Inappropriate",
      photoId,
    },
    select: { id: true },
  });
}
