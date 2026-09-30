// Owner sales report: fetches orders for the selected range from /api/orders and shows totals, average, top seller, and the 5 most recent orders
'use client'

import { useEffect, useMemo, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import type { OrderSummary } from "@/app/lib/types";

export default function SalesReport() {
  // 1) State FIRST: dateFilter must exist before the effect below reads it
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("today");
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // 2) Refetch whenever the selected range changes; the server does the date filtering
  useEffect(() => {
    let isMounted = true;

    fetch(`/api/orders?range=${dateFilter}`)
      .then((r) => {
        // Check the status before parsing: a failing route returns an
        // { error } object, not an array
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) setOrders(data);
      })
      .catch((error) => console.error("Failed to fetch orders:", error));

    return () => {
      isMounted = false;
    };
  }, [dateFilter]);

  // 3) Aggregates
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Item with the highest total quantity sold in the selected range
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

  // Orders arrive newest-first from the API, so the first 5 are the most recent
  const recentOrders = orders.slice(0, 5);

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="SALES REPORT" />

      {/* Date filter buttons */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {(["today", "week", "month"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                dateFilter === f
                  ? "bg-dark-brown text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "today" ? "Today" : f === "week" ? "This Week" : "This Month"}
            </button>
          ))}
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