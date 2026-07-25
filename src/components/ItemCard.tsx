"use client";

import Link from "next/link";

interface ItemCardProps {
  item: Record<string, unknown>;
}

function formatPrice(item: Record<string, unknown>): string {
  const price = item.price;
  const currency = item.currency as Record<string, unknown> | undefined;
  const symbol = (currency?.symbol as string) || "$";
  if (typeof price === "number") return `${symbol}${price.toFixed(2)}`;
  return `${symbol}0.00`;
}

function getImageUrl(item: Record<string, unknown>): string | null {
  const images = item.images as Record<string, unknown>[] | undefined;
  if (images && images.length > 0) {
    const url = images[0].url as string;
    const thumbUrl = images[0].thumb_url as string;
    return url || thumbUrl || null;
  }
  return null;
}

export default function ItemCard({ item }: ItemCardProps) {
  const itemId = item.item_id as number;
  const title = (item.title_en as string) || (item.title as string) || `Item #${itemId}`;
  const guarantee = item.guarantee as string;

  return (
    <Link href={`/item/${itemId}`} className="block bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#58a6ff] transition-all hover:shadow-lg hover:shadow-[#58a6ff]/5 group">
      <div className="aspect-[4/3] bg-[#0d1117] flex items-center justify-center overflow-hidden">
        {getImageUrl(item) ? (
          <img src={getImageUrl(item)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          (() => {
            const skins = item.fortniteSkins as Record<string, unknown>[] | undefined;
            if (skins && skins.length > 0) {
              return (
                <div className="w-full h-full bg-[#0d1117] overflow-hidden p-1">
                  <div className="grid grid-cols-4 gap-0.5 h-full">
                    {skins.slice(0, 16).map((s) => (
                      <div key={s.id as string} className="bg-[#161b22] rounded overflow-hidden flex items-center justify-center">
                        <img src={`https://fortnite-api.com/images/cosmetics/br/${(s.id as string).toLowerCase()}/smallicon.png`}
                          alt="" className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return <div className="w-full h-full bg-[#0d1117]" />;
          })()
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#c9d1d9] truncate group-hover:text-[#58a6ff] transition-colors">{title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#8b949e]">
          {guarantee && <span className="text-[#3fb950]">{guarantee}</span>}
        </div>
        <div className="mt-2 pt-2 border-t border-[#21262d]">
          <span className="text-base font-bold text-white">{formatPrice(item)}</span>
        </div>
      </div>
    </Link>
  );
}
