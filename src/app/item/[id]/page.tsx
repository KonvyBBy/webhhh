import { productService } from "@/services/product.service";
import ItemDetailClient from "./ItemDetailClient";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let item: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    const data = await productService.getProductDetail(id);
    item = data.item;
  } catch (err) {
    error = String(err);
  }

  if (error) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-12">
        <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-6 text-center">
          <p className="text-[#f85149] font-medium">Error loading item</p>
          <p className="text-sm text-[#8b949e] mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-12">
        <div className="text-center py-16">
          <p className="text-lg text-[#8b949e]">Item not found</p>
          <p className="text-sm text-[#8b949e] mt-1">This account may have been removed</p>
        </div>
      </div>
    );
  }

  return <ItemDetailClient item={item} itemId={id} />;
}
