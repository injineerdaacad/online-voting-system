
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

const cache = new Map();
let keysByTime = [];

function normalizeKey(question, lang) {
  return `${lang}:${(question || "").toLowerCase().trim().replace(/\s+/g, " ")}`;
}

function prune() {
  const now = Date.now();
  while (keysByTime.length > 0 && keysByTime.length >= MAX_ENTRIES) {
    const oldest = keysByTime.shift();
    if (oldest) cache.delete(oldest);
  }
  for (const [k, v] of cache.entries()) {
    if (now - v.ts > TTL_MS) {
      cache.delete(k);
      keysByTime = keysByTime.filter((x) => x !== k);
    }
  }
}

export function getCachedReply(question, lang) {
  const key = normalizeKey(question, lang);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    keysByTime = keysByTime.filter((x) => x !== key);
    return null;
  }
  return entry.reply;
}

export function setCachedReply(question, lang, reply) {
  prune();
  const key = normalizeKey(question, lang);
  cache.set(key, { reply, ts: Date.now() });
  keysByTime.push(key);
}