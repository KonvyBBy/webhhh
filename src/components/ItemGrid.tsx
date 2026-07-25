import ItemCard from "./ItemCard";

interface ItemGridProps {
  items: Record<string, unknown>[];
}

export default function ItemGrid({ items }: ItemGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 text-[#8b949e]">
        <p className="text-lg">No accounts found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <ItemCard key={item.item_id as number} item={item} />
      ))}
    </div>
  );
}
