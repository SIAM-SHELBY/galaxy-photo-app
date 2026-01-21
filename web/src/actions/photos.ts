"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth/session";
import { cloudinary } from "@/lib/cloudinary/server";
import { prisma } from "@/lib/db/prisma";
import { requireRateLimit } from "@/lib/security/rate-limit";

export type PhotoVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  return categories;
}

export async function createPhotoPost(input: {
  categorySlug: string;
  caption?: string | null;
  visibility?: PhotoVisibility;

  // Cloudinary result
  cloudinaryPublicId: string;
  assetUrl: string;
  width: number;
  height: number;
  format?: string | null;
  bytes?: number | null;

  // EXIF (optional)
  exifMake?: string | null;
  exifModel?: string | null;
  exifLensModel?: string | null;
  exifFNumber?: number | null;
  exifExposureTime?: string | null;
  exifIso?: number | null;
  exifFocalLength?: number | null;
  exifTakenAt?: Date | string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await requireRateLimit({
    key: `user:${session.user.id}`,
    bucket: "photo:create",
    limit: 10,
    windowMs: 60_000,
  });

  const caption = input.caption?.trim() ? input.caption.trim() : null;
  const visibility = input.visibility ?? "PUBLIC";

  if (!input.categorySlug) throw new Error("Category is required");
  if (!input.cloudinaryPublicId) throw new Error("Missing Cloudinary public id");
  if (!input.assetUrl) throw new Error("Missing asset URL");

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("Cloudinary env vars are missing");

  // Basic URL safety: require Cloudinary delivery URL for this cloud.
  let assetHostOk = false;
  try {
    const u = new URL(input.assetUrl);
    assetHostOk = u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.startsWith(`/${cloudName}/`);
  } catch {
    assetHostOk = false;
  }
  if (!assetHostOk) throw new Error("Invalid asset URL");

  // Enforce folder prefix; public_id can include folders.
  const requiredPrefix = "galaxy/photos/original/";
  if (!input.cloudinaryPublicId.startsWith(requiredPrefix)) throw new Error("Invalid Cloudinary public id");
  if (input.cloudinaryPublicId.includes("..")) throw new Error("Invalid Cloudinary public id");

  // Verify uploaded resource exists and use Cloudinary as the source of truth.
  const resource = (await cloudinary.api.resource(input.cloudinaryPublicId, {
    resource_type: "image",
  })) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
  };

  if (!resource?.public_id || resource.public_id !== input.cloudinaryPublicId) throw new Error("Invalid upload");
  if (!resource.secure_url) throw new Error("Invalid upload");

  const width = Number(resource.width);
  const height = Number(resource.height);
  const bytes = Number(resource.bytes);
  if (!Number.isFinite(width) || width <= 0 || width > 10_000) throw new Error("Invalid width");
  if (!Number.isFinite(height) || height <= 0 || height > 10_000) throw new Error("Invalid height");
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > 25 * 1024 * 1024) throw new Error("Invalid file size");

  const format = (resource.format ?? "").toLowerCase();
  const allowedFormats = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
  if (!allowedFormats.has(format)) throw new Error("Unsupported image format");

  const category = await prisma.category.findUnique({
    where: { slug: input.categorySlug },
    select: { id: true },
  });
  if (!category) throw new Error("Invalid category");

  const exifTakenAt =
    typeof input.exifTakenAt === "string"
      ? new Date(input.exifTakenAt)
      : input.exifTakenAt ?? null;

  const photo = await prisma.photo.create({
    data: {
      authorId: session.user.id,
      categoryId: category.id,
      caption,
      visibility,

      cloudinaryPublicId: resource.public_id,
      assetUrl: resource.secure_url,
      width,
      height,
      format,
      bytes,

      exifMake: input.exifMake ?? null,
      exifModel: input.exifModel ?? null,
      exifLensModel: input.exifLensModel ?? null,
      exifFNumber: input.exifFNumber ?? null,
      exifExposureTime: input.exifExposureTime ?? null,
      exifIso: input.exifIso ?? null,
      exifFocalLength: input.exifFocalLength ?? null,
      exifTakenAt: exifTakenAt instanceof Date && !Number.isNaN(exifTakenAt.valueOf()) ? exifTakenAt : null,
    },
    select: {
      id: true,
      authorId: true,
      createdAt: true,
    },
  });

  // Revalidate key pages. We'll revalidate specific profile paths when we have username.
  revalidatePath("/");

  return photo;
}

export async function listUserPhotosByUsername(username: string) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return [];

  const where =
    viewerId === user.id
      ? { authorId: user.id }
      : { authorId: user.id, visibility: "PUBLIC" as const };

  return prisma.photo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
      caption: true,
      visibility: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
    },
  });
}
