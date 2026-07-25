import { lztService } from "./lzt.service";

export interface ProductQuery {
  category?: string;
  page?: number;
  [key: string]: unknown;
}

export const productService = {
  async getProducts(query: Record<string, unknown> = {}) {
    const category = (query.category as string) || "";
    const page = (query.page as number) || 1;
    const filters: Record<string, string | number | boolean | undefined> = {};
    for (const [key, val] of Object.entries(query)) {
      if (key === "category" || key === "page") continue;
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === undefined) {
        filters[key] = val as string | number | boolean | undefined;
      } else if (typeof val === "string") {
        filters[key] = val;
      }
    }
    return lztService.getProducts(category, page, filters);
  },

  async getProductDetail(itemId: number | string) {
    return lztService.getProductDetail(itemId);
  },

  async getProfile() {
    return lztService.getProfile();
  },

  async getUserItems(userId: number, page = 1) {
    return lztService.getUserItems(userId, page);
  },
};
