import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getClientIp } from "@/lib/security/ip";
import { requireRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

function parseCursor(searchParams: URLSearchParams) {
  const id = searchParams.get("cursorId");
  const createdAt = searchParams.get("cursorCreatedAt");
  if (!id || !createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.valueOf())) return null;
  return { id, createdAt: date };
}

export async function GET(req: Request) {
  const ip = getClientIp();
  await requireRateLimit({
    key: `ip:${ip}`,
    bucket: "api:explore",
    limit: 240,
    windowMs: 60_000,
  });

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit") ?? "30")));
  const cursor = parseCursor(url.searchParams);

  const baseWhere: Prisma.PhotoWhereInput = { visibility: "PUBLIC" };

  const categoryWhere: Prisma.PhotoWhereInput =
    category && category !== "all" ? { category: { slug: category } } : {};

  // Cursor pagination stable by (createdAt desc, id desc)
  const where: Prisma.PhotoWhereInput =
    cursor === null
      ? { ...baseWhere, ...categoryWhere }
      : {
          AND: [
            { ...baseWhere, ...categoryWhere },
            {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            },
          ],
        };

  const photos = await prisma.photo.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      assetUrl: true,
      width: true,
      height: true,
      createdAt: true,
      category: { select: { slug: true, name: true } },
    },
  });

  const nextCursor =
    photos.length === 0
      ? null
      : {
          cursorId: photos[photos.length - 1]!.id,
          cursorCreatedAt: photos[photos.length - 1]!.createdAt.toISOString(),
        };

  return NextResponse.json({ photos, nextCursor });
}
