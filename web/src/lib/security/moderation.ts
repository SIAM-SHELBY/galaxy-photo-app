const DEFAULT_BLOCKLIST = [
  // Keep intentionally small; extend via env.
  "spam",
];

function normalize(s: string) {
  return s.toLowerCase();
}

function getBlocklist() {
  const env = process.env.MODERATION_BLOCKLIST;
  if (!env) return DEFAULT_BLOCKLIST;
  const extra = env
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_BLOCKLIST, ...extra.map(normalize)]));
}

function countUrls(text: string) {
  const matches = text.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

export function moderateCommentText(input: string): { ok: true } | { ok: false; reason: string } {
  const text = input.trim();
  if (!text) return { ok: false, reason: "empty" };
  if (text.length > 1000) return { ok: false, reason: "too_long" };

  if (countUrls(text) > 2) return { ok: false, reason: "too_many_links" };

  const n = normalize(text);
  for (const term of getBlocklist()) {
    if (!term) continue;
    if (n.includes(term)) return { ok: false, reason: "blocked_term" };
  }

  // Basic anti-garbage: lots of repeated characters.
  if (/(.)\1{14,}/.test(text)) return { ok: false, reason: "repeated_chars" };

  return { ok: true };
}
