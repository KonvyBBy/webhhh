import ItemGrid from "@/components/ItemGrid";
import PaginationClient from "@/components/PaginationClient";
import FilterBar from "@/components/FilterBar";
import { productService } from "@/services/product.service";
import { CATEGORY_TITLES } from "@/lib/constants";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  let items: Record<string, unknown>[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const filters: Record<string, string | number | boolean | undefined> = { category, page, order_by: "price_to_up" };
    for (const [key, val] of Object.entries(sp)) {
      if (key === "page") continue;
      if (typeof val === "string") filters[key] = val;
    }
    if (category === "riot" && !filters["valorant_level_min"]) {
      filters["valorant_level_min"] = 1;
    }
    const data = await productService.getProducts(filters);
    items = data.items;
    total = data.total;
  } catch (err) {
    error = String(err);
  }

  const totalPages = Math.ceil(total / 50) || 1;
  const title = CATEGORY_TITLES[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Accounts`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <span>{total} accounts</span>
        </div>
      </div>

      <FilterBar />

      {error && (
        <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-4 mb-4 text-sm text-[#f85149]">
          Error loading accounts: {error}
        </div>
      )}

      <ItemGrid items={items} />

      <PaginationClient currentPage={page} totalPages={totalPages} total={total} />
    </div>
  );
}
