import ProductCard from "./ProductCard";
import type { MenuItem as MenuItemType } from "@/app/lib/types";

function MenuItem({ active, menuItems }: { active: string, menuItems: MenuItemType[] }) {
  const filtered = menuItems.filter(
    (item) => (item.category ?? "Other") === active
  );

  return (
    <div className="px-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {active === "All"
        ? menuItems.map((item) => <ProductCard item={item} key={item.uniqueKey} />)
        : filtered.map((item) => <ProductCard item={item} key={item.uniqueKey} />)}
    </div>
  );
}

export default MenuItem;
