"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { cloudinaryBlurUrl, cloudinaryDisplayUrl } from "@/lib/cloudinary/urls";

export function PhotoViewer({
  assetUrl,
  width,
  height,
  alt,
  sizes,
}: {
  assetUrl: string;
  width: number;
  height: number;
  alt?: string;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  const aspectRatio = useMemo(() => {
    const safeW = Number.isFinite(width) && width > 0 ? width : 1;
    const safeH = Number.isFinite(height) && height > 0 ? height : 1;
    return `${safeW}/${safeH}`;
  }, [width, height]);

  const previewSrc = useMemo(() => cloudinaryDisplayUrl(assetUrl, { width: 2200 }), [assetUrl]);
  const fullscreenSrc = useMemo(() => cloudinaryDisplayUrl(assetUrl, { width: 3200 }), [assetUrl]);
  const blurSrc = useMemo(() => cloudinaryBlurUrl(assetUrl), [assetUrl]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.documentElement.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left"
        aria-label="Open fullscreen"
      >
        <div
          className="relative w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
          style={{ aspectRatio }}
        >
          <div
            aria-hidden
            className={
              loaded
                ? "absolute inset-0 opacity-0"
                : "absolute inset-0 opacity-100 transition-opacity"
            }
            style={{
              backgroundImage: `url(${blurSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(24px)",
              transform: "scale(1.05)",
            }}
          />
          <Image
            src={previewSrc}
            alt={alt ?? ""}
            fill
            sizes={sizes ?? "(max-width: 768px) 100vw, 768px"}
            className={
              loaded
                ? "object-contain opacity-100 transition-opacity"
                : "object-contain opacity-0 transition-opacity"
            }
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/90"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="absolute right-3 top-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              Close
            </button>
          </div>

          <div className="mx-auto flex h-full w-full max-w-5xl items-center px-4">
            <div className="relative w-full" style={{ aspectRatio }}>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${blurSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(24px)",
                  transform: "scale(1.05)",
                  opacity: 0.8,
                }}
              />
              <Image
                src={fullscreenSrc}
                alt={alt ?? ""}
                fill
                sizes="100vw"
                className="object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
