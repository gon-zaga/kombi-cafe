import ProductCard from "./ProductCard";
import type { MenuItem as MenuItemType } from "@/app/api/menu/route";

function MenuItem({ active, menuItems }: { active: string, menuItems: MenuItemType[] }) {
  const filtered = menuItems.filter(
    (item) => (item.category ?? "Other") === active
  );

  return (
    <div className="px-5 grid grid-cols-2 gap-4">
      {active === "All"
        ? menuItems.map((item) => <ProductCard item={item} key={item.itemId} />)
        : filtered.map((item) => <ProductCard item={item} key={item.itemId} />)}
    </div>
  );
}

export default MenuItem;