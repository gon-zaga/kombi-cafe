// Owner sales report: fetches orders for the selected range from /api/orders and shows totals, average, top seller, and the 5 most recent orders
'use client'

import { useEffect, useMemo, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import DateFilterBar from "@/app/ui/DateFilterBar";
import { downloadCsv, exportTimestamp } from "@/app/lib/csv";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange, rangeSlug } from "@/app/lib/dateFilter";
import type { OrderSummary } from "@/app/lib/types";

export default function SalesReport() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadError, setLoadError] = useState("");

  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const query = useMemo(
    () => buildOrdersQuery(dateFilter, customRange),
    [dateFilter, customRange]
  );

  useEffect(() => {
    if (!query) return;

    let isMounted = true;

    fetch(`/api/orders${query}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) setOrders(data);
      })
      .catch((error) => {
        console.error("Failed to fetch orders:", error);
        if (isMounted) setLoadError("Could not load orders for this range.");
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSelectFilter = (f: DateFilter) => {
    setLoadError("");
    setDateFilter(f);
  };

  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  const topSellingItem = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "—";
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  const [menuOpen, setMenuOpen] = useState(false);

  const stamp = exportTimestamp();
  const slug = rangeSlug(dateFilter, customRange);

  const exportSales = () => {
    downloadCsv(`sales-report-${slug}-${stamp}.csv`, orders, [
      { header: "Order Ref", value: (o) => o.orderReference },
      {
        header: "Time",
        value: (o) => new Date(o.createdAt).toLocaleString("en-PH"),
      },
      { header: "Date", value: (o) => o.createdAt.slice(0, 10) },
      { header: "Status", value: (o) => o.status },
      { header: "Item Count", value: (o) => o.items.length },
      // Add-on revenue per order, so the export reconciles
      // with the receipt lines (items + add-ons = total)
      {
        header: "Add-ons",
        value: (o) =>
          o.items
            .reduce(
              (sum, item) =>
                sum + item.addOns.reduce((s, a) => s + a.price * a.quantity, 0),
              0
            )
            .toFixed(2),
      },
      { header: "Total", value: (o) => o.total.toFixed(2) },
    ]);
    setMenuOpen(false);
  };

  const exportOptions = [
    { label: "Sales & orders", hint: "One row per order", action: exportSales },
  ];

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="SALES REPORT" />

      <div className="px-4 mb-4">
        <DateFilterBar
          filter={dateFilter}
          customRange={customRange}
          onFilterChange={handleSelectFilter}
          onCustomApply={(range) => {
            setLoadError("");
            setCustomRange(range);
          }}
        />

        <p className="text-sm text-gray-600 mt-3">
          Report for {describeRange(dateFilter, customRange)}
        </p>

        {loadError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {loadError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 mb-4">
        <span className="text-sm text-gray-600">
          Showing {describeRange(dateFilter, customRange)} · {orders.length} order
          {orders.length === 1 ? "" : "s"}
        </span>

        <div className="relative">
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

      {/* Sales statistics */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">₱{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Average Order</p>
          <p className="text-2xl font-bold text-gray-900">₱{averageOrder.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Top Selling</p>
          <p className="text-lg font-bold text-gray-900">{topSellingItem}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="px-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h3>
        <div className="space-y-2">
          {recentOrders.length === 0 && (
            <p className="text-sm text-gray-500">No orders in this range.</p>
          )}
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg p-4 shadow flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">#{order.orderReference}</p>
                <p className="text-sm text-gray-500">
                  {order.items.length} items ·{" "}
                  {new Date(order.createdAt).toLocaleTimeString('en-PH', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">₱{order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}