'use client'

// Owner dashboard stats: sales, processed/total orders, low stock count and the
// best seller for a selectable range (today, this week, all time, custom), laid
// out as a responsive card grid. Also exports each section as its own CSV file
// (sales, low stock, best sellers).
import { useEffect, useMemo, useState } from "react";
import DateFilterBar from "@/app/ui/DateFilterBar";
import { downloadCsv, exportTimestamp } from "@/app/lib/csv";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange, rangeSlug } from "@/app/lib/dateFilter";
import type { OrderSummary } from "@/app/lib/types";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
}

// One row per item sold in the selected range, aggregated across all orders
interface ItemSales {
  name: string;
  quantity: number;

  // Sum of quantity * unit_price. Excludes add-ons, which are charged at the
  // order level, so this is a floor rather than the real take per item
  revenue: number;
}

function StatsCard() {
  // Which period the cards cover. Defaults to today, but the owner can switch
  // to this week / all time / a custom window
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // The full ingredient list is kept, not just the low-stock count, because the
  // CSV export needs names, units and thresholds
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [menuOpen, setMenuOpen] = useState(false);

  // The API query for the current selection. Null while a custom filter has no
  // applied dates yet, which skips the fetch instead of sending a bad request.
  const query = useMemo(
    () => buildOrdersQuery(dateFilter, customRange),
    [dateFilter, customRange]
  );

  // Orders for the selected range. response.ok is checked before parsing,
  // otherwise an error object would be stored as the orders list and .filter()
  // would crash
  useEffect(() => {
    if (!query) return;

    let isMounted = true;

    fetch(`/api/orders${query}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) setOrders(data);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [query]);

  // Stock is a current snapshot, not a range, so this only loads once
  useEffect(() => {
    fetch("/api/ingredients")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setIngredients(data);
      })
      .catch(console.error);
  }, []);

  // An ingredient counts as low when current stock <= its restock threshold
  const lowStockItems = useMemo(
    () => ingredients.filter((i) => i.stockQty <= i.restockThreshold),
    [ingredients]
  );

  const processed = orders.filter((o) => o.status === "ready").length;
  const sales = orders.reduce((acc, o) => acc + o.total, 0);

  // Flattens every order's items into one list, then sums quantity and revenue
  // per item name. Names are the only key available in the API response
  // (menu_items.name is not unique), which is good enough for a sales ranking.
  const itemSales = useMemo<ItemSales[]>(() => {
    const totals: Record<string, ItemSales> = {};

    for (const order of orders) {
      for (const item of order.items) {
        const line = (totals[item.name] ??= {
          name: item.name,
          quantity: 0,
          revenue: 0,
        });
        line.quantity += item.quantity;
        line.revenue += item.quantity * item.unitPrice;
      }
    }

    return Object.values(totals).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const bestSeller = itemSales[0];

  // One CSV per section, so each file is clean data with one header row rather
  // than a summary block glued on top of a table. The range goes in the
  // filename so an exported file always says which period it came from
  const stamp = exportTimestamp();
  const slug = rangeSlug(dateFilter, customRange);

  const exportSales = () => {
    downloadCsv(`sales-orders-${slug}-${stamp}.csv`, orders, [
      { header: "Order Ref", value: (o) => o.orderReference },
      {
        header: "Time",
        value: (o) => new Date(o.createdAt).toLocaleString("en-PH"),
      },
      { header: "Date", value: (o) => o.createdAt.slice(0, 10) },
      { header: "Status", value: (o) => o.status },
      { header: "Item Count", value: (o) => o.items.length },
      { header: "Total", value: (o) => o.total.toFixed(2) },
    ]);
    setMenuOpen(false);
  };

  const exportLowStock = () => {
    downloadCsv(
      `low-stock-${stamp}.csv`,
      // Every ingredient, with a yes/no column, not just the low ones: the
      // owner usually wants the full stock picture to plan a restock run
      ingredients,
      [
        { header: "Ingredient", value: (i) => i.name },
        { header: "Stock", value: (i) => i.stockQty },
        { header: "Unit", value: (i) => i.unit },
        { header: "Restock Threshold", value: (i) => i.restockThreshold },
        {
          header: "Low Stock",
          value: (i) => (i.stockQty <= i.restockThreshold ? "Yes" : "No"),
        },
      ]
    );
    setMenuOpen(false);
  };

  const exportBestSellers = () => {
    downloadCsv(`best-sellers-${slug}-${stamp}.csv`, itemSales, [
      { header: "Rank", value: (_, rank) => rank },
      { header: "Item", value: (i) => i.name },
      { header: "Quantity Sold", value: (i) => i.quantity },
      { header: "Revenue (excl. add-ons)", value: (i) => i.revenue.toFixed(2) },
    ]);
    setMenuOpen(false);
  };

  const exportOptions = [
    { label: "Sales & orders", hint: "One row per order", action: exportSales },
    {
      label: "Low stock",
      hint: "Stock vs. threshold",
      action: exportLowStock,
    },
    {
      label: "Best sellers",
      hint: "Ranked by quantity",
      action: exportBestSellers,
    },
  ];

  const rangeLabel = describeRange(dateFilter, customRange);

  const cards = [
    { label: "TOTAL SALES", value: `₱${sales.toFixed(2)}` },
    { label: "ORDERS PROCESSED", value: String(processed) },
    { label: "LOW STOCK ITEMS", value: String(lowStockItems.length) },
    {
      label: "BEST SELLER",
      // Sizing the text down keeps a long drink name from breaking the card
      value: bestSeller ? `${bestSeller.name}` : "—",
    },
  ];

  return (
    <section>
      {/* Range chips. The dashboard used to be hardcoded to today, which made
          the numbers impossible to reason about past the current day. */}
      <div className="px-4 md:px-6 mb-4">
        <DateFilterBar
          filter={dateFilter}
          customRange={customRange}
          onFilterChange={setDateFilter}
          onCustomApply={setCustomRange}
        />
      </div>

      {/* Range context plus the export menu. Without the range label the
          numbers read as "all time", which they are not. */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 mb-4">
        <span className="text-sm text-gray-600">
          Showing {rangeLabel} · {orders.length} order
          {orders.length === 1 ? "" : "s"}
        </span>

        <div className="relative">
          {/* Invisible full-screen catcher: closes the menu on an outside click */}
          {menuOpen && (
            <button
              aria-label="Close export menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-20 cursor-default"
            />
          )}

          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="relative z-30 flex items-center gap-2 bg-amber-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            Export CSV
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30">
              {exportOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <span className="block text-sm font-medium text-gray-800">
                    {option.label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card grid: 1 column on phones, 2 on small screens, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6 pb-10">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-card-cream rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-28"
          >
            <span className="text-xs font-semibold tracking-wide text-gray-600">
              {card.label}
            </span>
            <span
              className={`font-bold text-dark-brown mt-3 break-words ${
                card.label === "BEST SELLER" ? "text-xl" : "text-3xl"
              }`}
            >
              {card.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsCard;