import { headers } from "next/headers";

function firstIpFromHeader(value: string | null) {
  if (!value) return null;
  // x-forwarded-for can be a list: client, proxy1, proxy2
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  return first;
}

export function getClientIp() {
  const h = headers();

  // Prefer X-Forwarded-For (Vercel, most proxies)
  const xff = firstIpFromHeader(h.get("x-forwarded-for"));
  if (xff) return xff;

  // Some setups use X-Real-IP
  const xri = h.get("x-real-ip")?.trim();
  if (xri) return xri;

  return "unknown";
}
