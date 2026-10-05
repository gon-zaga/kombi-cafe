import ProductCard from "./ProductCard";
import type { MenuItem as MenuItemType } from "@/app/lib/types";
import { isNewItem } from "@/app/lib/utils";

function MenuItem({ active, menuItems }: { active: string, menuItems: MenuItemType[] }) {
  const filtered = menuItems.filter(
    (item) => (item.category ?? "Other") === active
  );

  return (
    <div className="px-5 grid grid-cols-2 gap-4">
      {active === "All"
        ? menuItems.map((item) => (
            <ProductCard
              key={item.itemId}
              item={item}
              tag={isNewItem(item.createdAt) ? "new" : undefined}
            />
          ))
        : filtered.map((item) => (
            <ProductCard
              key={item.itemId}
              item={item}
              tag={isNewItem(item.createdAt) ? "new" : undefined}
            />
          ))}
    </div>
  );
}

export default MenuItem;