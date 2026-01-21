import { prisma } from "@/lib/db/prisma";

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: Date }
  | { ok: false; remaining: 0; resetAt: Date };

function bucketId(bucket: string, windowMs: number) {
  // Bucket must include window so callers can change windows without collisions.
  return `${bucket}:${windowMs}`;
}

export async function rateLimit(input: {
  key: string;
  bucket: string;
  limit: number;
  windowMs: number;
}) : Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + input.windowMs);
  const bucket = bucketId(input.bucket, input.windowMs);

  // Keep this small and safe. DB migration must exist; otherwise Prisma will throw.
  // Note: This is a basic limiter; it is not perfectly race-free under high concurrency.
  const existing = await prisma.rateLimit.findUnique({
    where: { key_bucket: { key: input.key, bucket } },
    select: { count: true, resetAt: true },
  });

  if (!existing) {
    const created = await prisma.rateLimit.create({
      data: { key: input.key, bucket, count: 1, resetAt },
      select: { count: true, resetAt: true },
    });
    return { ok: true, remaining: Math.max(0, input.limit - created.count), resetAt: created.resetAt };
  }

  if (existing.resetAt <= now) {
    const refreshed = await prisma.rateLimit.update({
      where: { key_bucket: { key: input.key, bucket } },
      data: { count: 1, resetAt },
      select: { count: true, resetAt: true },
    });
    return { ok: true, remaining: Math.max(0, input.limit - refreshed.count), resetAt: refreshed.resetAt };
  }

  if (existing.count >= input.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated = await prisma.rateLimit.update({
    where: { key_bucket: { key: input.key, bucket } },
    data: { count: { increment: 1 } },
    select: { count: true, resetAt: true },
  });

  return { ok: true, remaining: Math.max(0, input.limit - updated.count), resetAt: updated.resetAt };
}

export async function requireRateLimit(input: {
  key: string;
  bucket: string;
  limit: number;
  windowMs: number;
}) {
  const res = await rateLimit(input);
  if (!res.ok) {
    const seconds = Math.max(1, Math.ceil((res.resetAt.getTime() - Date.now()) / 1000));
    throw new Error(`Rate limited. Try again in ${seconds}s.`);
  }
}
