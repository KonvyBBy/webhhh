import { getCache, setCache, CACHE_KEYS, CACHE_TTL, clearCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { getDb } from "@/lib/json-db";

const API_BASE = process.env.LZT_API_BASE || "https://prod-api.lzt.market";
const API_TOKEN = process.env.LZT_API_TOKEN || "";

interface RequestOptions {
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined) url.searchParams.set(key, String(val));
    });
  }

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (options.body) fetchOptions.body = JSON.stringify(options.body);

  const start = Date.now();
  try {
    const res = await fetch(url.toString(), fetchOptions);
    const duration = Date.now() - start;
    let data: T;
    try {
      data = await res.json();
    } catch {
      data = {} as T;
    }

    logger.api(options.method || "GET", endpoint, res.status, { duration: `${duration}ms` });

    if (!res.ok) {
      const errData = data as Record<string, unknown>;
      let errMsg = errData?.errors ? String(errData.errors) : `HTTP ${res.status}`;
      if (errMsg.toLowerCase().includes("технические") || errMsg.toLowerCase().includes("technical works")) {
        errMsg = "LZT Market is currently under maintenance. Please try again later.";
      }
      throw new Error(errMsg);
    }

    return data;
  } catch (err) {
    logger.error(`LZT API request failed: ${options.method || "GET"} ${endpoint}`, { error: String(err) });
    throw err;
  }
}

export interface ProductsResult {
  items: Record<string, unknown>[];
  total: number;
}

function getMarkup(): number {
  try { return getDb().settings.get().markup || 1.0; } catch { return 1.0; }
}

function applyMarkup(items: Record<string, unknown>[]): Record<string, unknown>[] {
  const markup = getMarkup();
  if (markup === 1.0) return items;
  return items.map((item) => {
    const price = Number(item.price) || 0;
    return { ...item, originalPrice: price, price: price * markup };
  });
}

function applyMarkupToItem(item: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!item) return null;
  const markup = getMarkup();
  if (markup === 1.0) return item;
  const price = Number(item.price) || 0;
  return { ...item, originalPrice: price, price: price * markup };
}

export const lztService = {
  async getProducts(category = "", page = 1, filters?: Record<string, string | number | boolean | undefined>): Promise<ProductsResult> {
    const filterHash = filters ? JSON.stringify(filters) : "";
    const cacheKey = CACHE_KEYS.products(category, page) + filterHash;
    const cached = getCache<ProductsResult>(cacheKey);
    if (cached) return cached;

    const params: Record<string, string | number | boolean | undefined> = { page, ...filters };
    const path = category ? `/${category}` : "/";
    const data = await request<Record<string, unknown>>(path, { params });

    const items = (data.items as Record<string, unknown>[]) || [];
    const total = (data.totalItems as number) || (data.total as number) || items.length;
    const result = { items: applyMarkup(items), total };
    setCache(cacheKey, result, CACHE_TTL.USER_ITEMS);
    return result;
  },

  async getProductDetail(itemId: number | string): Promise<{ item: Record<string, unknown> | null }> {
    const cacheKey = CACHE_KEYS.product(itemId);
    const cached = getCache<{ item: Record<string, unknown> | null }>(cacheKey);
    if (cached) return cached;

    const data = await request<Record<string, unknown>>(`/${itemId}`);
    const item = applyMarkupToItem((data.item as Record<string, unknown>) || null);

    const result = { item };
    setCache(cacheKey, result, CACHE_TTL.PRODUCT_DETAIL);
    return result;
  },

  async getProfile(): Promise<Record<string, unknown> | null> {
    const data = await request<Record<string, unknown>>("/me");
    return (data.user as Record<string, unknown>) || null;
  },

  async getUserItems(userId: number, page = 1): Promise<ProductsResult> {
    const cacheKey = CACHE_KEYS.userItems(userId, page);
    const cached = getCache<ProductsResult>(cacheKey);
    if (cached) return cached;

    const data = await request<Record<string, unknown>>(`/user/${userId}/items`, { params: { page } });
    const items = (data.items as Record<string, unknown>[]) || [];
    const total = (data.totalItems as number) || items.length || 0;
    const result = { items, total };
    setCache(cacheKey, result, CACHE_TTL.USER_ITEMS);
    return result;
  },

  async fastBuy(itemId: number | string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/${itemId}/fast-buy`, { method: "POST" });
  },

  invalidateCache(pattern?: string): void {
    if (pattern) clearCache(pattern);
    else {
      clearCache("products:");
      clearCache("product:");
    }
  },
};
