'use client';

// Best-sellers shelf for the customer menu: shows the most-ordered drinks from
// the last 30 days, ranked client-side from /api/orders so it needs no new
// endpoint. Each card points at its item page and carries a BEST ribbon plus
// the sold count, so a customer can tap straight to it.
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/app/ui/ProductCard";
import type { MenuItem, OrderSummary } from "@/app/lib/types";

export default function BestSellers({ menuItems }: { menuItems: MenuItem[] }) {
  // name -> quantity sold across completed orders in the selected range
  const [soldByName, setSoldByName] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/orders?range=month');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders: OrderSummary[] = await res.json();

        const tally: Record<string, number> = {};
        for (const order of orders) {
          for (const item of order.items) {
            tally[item.name] = (tally[item.name] ?? 0) + item.quantity;
          }
        }
        if (!cancelled) setSoldByName(tally);
      } catch (error) {
        console.error(error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Top 3 drink names by quantity sold, mapped back to real (available) menu
  // items. Items are matched by name: menu_items.name is not unique, but it is
  // the only key the orders response carries (see PROJECT_CONTEXT note), which
  // is fine for a ranking.
  const top = useMemo(() => {
    return Object.entries(soldByName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) =>
        menuItems.find((m) => m.isAvailable && m.itemName === name)
      )
      .filter((m): m is MenuItem => m !== undefined);
  }, [soldByName, menuItems]);

  if (top.length === 0) return null;

  return (
    <section className="px-4 mb-6">
      <h3 className="font-roboto-condensed text-sm tracking-[0.2em] text-dark-brown/60 mb-3">
        BEST SELLERS
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {top.map((item) => (
          <div key={item.itemId} className="min-w-[130px]">
            <ProductCard
              item={item}
              tag="best"
              sublabel={`${soldByName[item.itemName] ?? 0} sold`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
