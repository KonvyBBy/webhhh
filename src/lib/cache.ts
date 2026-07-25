interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) store.delete(key);
  }
}

export function getCacheKeys(pattern?: string): string[] {
  const keys = Array.from(store.keys());
  if (!pattern) return keys;
  return keys.filter((k) => k.startsWith(pattern));
}

export const CACHE_KEYS = {
  products: (category: string, page: number) => `products:${category}:${page}`,
  product: (id: number | string) => `product:${id}`,
  categories: "categories",
  userItems: (userId: number, page: number) => `userItems:${userId}:${page}`,
};

export const CACHE_TTL = {
  PRODUCT_LIST: 30_000,
  PRODUCT_DETAIL: 60_000,
  CATEGORIES: 300_000,
  USER_ITEMS: 30_000,
};

// Simple in-memory rate limiter
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxReqs: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxReqs - 1 };
  }
  entry.count++;
  if (entry.count > maxReqs) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxReqs - entry.count };
}

export function rateLimitIP(ip: string, maxReqs = 60, windowMs = 60_000) {
  return rateLimit(`ratelimit:${ip}`, maxReqs, windowMs);
}
