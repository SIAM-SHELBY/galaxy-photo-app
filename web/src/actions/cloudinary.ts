"use server";

import { randomUUID } from "crypto";

import { auth } from "@/lib/auth/session";
import { cloudinary } from "@/lib/cloudinary/server";
import { requireRateLimit } from "@/lib/security/rate-limit";

export async function createCloudinaryImageUploadSignature() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await requireRateLimit({
    key: `user:${session.user.id}`,
    bucket: "cloudinary:signature",
    limit: 10,
    windowMs: 60_000,
  });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  if (!cloudName || !apiKey) {
    throw new Error("Cloudinary env vars are missing");
  }

  // Fixed folder prevents users from uploading into arbitrary locations.
  // public_id is server-generated to prevent overwrite/path tricks.
  const folder = "galaxy/photos/original";
  const publicId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      public_id: publicId,
      timestamp,
      // Note: do NOT sign 'file' itself. The client sends it in multipart form-data.
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId,
  };
}
