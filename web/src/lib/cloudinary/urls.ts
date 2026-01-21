function transformCloudinaryUrl(assetUrl: string, transformation: string) {
  // Works for standard delivery URLs like:
  // https://res.cloudinary.com/<cloud>/image/upload/<publicId>
  // https://res.cloudinary.com/<cloud>/image/upload/v123/<publicId>
  const marker = "/image/upload/";
  const idx = assetUrl.indexOf(marker);
  if (idx === -1) return assetUrl;

  const before = assetUrl.slice(0, idx + marker.length);
  const after = assetUrl.slice(idx + marker.length);
  return `${before}${transformation}/${after}`;
}

export function cloudinaryThumbUrl(assetUrl: string, opts: { width: number }) {
  // High-quality thumbnail sized for grid; keep aspect ratio.
  // q_auto:best prioritizes quality over compression.
  const t = `f_auto,q_auto:best,c_limit,w_${Math.max(1, Math.floor(opts.width))}`;
  return transformCloudinaryUrl(assetUrl, t);
}

export function cloudinaryDisplayUrl(assetUrl: string, opts: { width: number }) {
  // Large display (post page / fullscreen). Keep original framing (no crop).
  // dpr_auto keeps images sharp on HiDPI screens without always over-downloading.
  const w = Math.max(1, Math.floor(opts.width));
  const t = `f_auto,q_auto:best,c_limit,w_${w},dpr_auto`;
  return transformCloudinaryUrl(assetUrl, t);
}

export function cloudinaryBlurUrl(assetUrl: string) {
  // Lightweight blurred placeholder. This is intentionally tiny.
  const t = "f_auto,q_1,w_40,e_blur:1000,c_limit";
  return transformCloudinaryUrl(assetUrl, t);
}
