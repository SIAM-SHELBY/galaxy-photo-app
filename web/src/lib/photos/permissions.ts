import { prisma } from "@/lib/db/prisma";

export async function assertCanViewPhoto(photoId: string, viewerId: string | null) {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { id: true, authorId: true, visibility: true },
  });

  if (!photo) throw new Error("Not found");

  if (photo.visibility === "PUBLIC") return;
  if (photo.visibility === "UNLISTED") return;

  // PRIVATE
  if (!viewerId) throw new Error("Unauthorized");
  if (photo.authorId !== viewerId) throw new Error("Not found");
}
