'use client'
import { useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";

export default function SalesReport() {
  const [dateFilter, setDateFilter] = useState("today");

  const salesData = {
    totalSales: 15420.50,
    totalOrders: 87,
    averageOrder: 177.25,
    topSellingItem: "Kombi Latte"
  };

  const recentOrders = [
    { id: 1, ref: "0087", items: 3, total: 340.00, time: "2:45 PM" },
    { id: 2, ref: "0086", items: 2, total: 220.00, time: "2:30 PM" },
    { id: 3, ref: "0085", items: 1, total: 120.00, time: "2:15 PM" },
    { id: 4, ref: "0084", items: 4, total: 480.00, time: "2:00 PM" },
    { id: 5, ref: "0083", items: 2, total: 240.00, time: "1:45 PM" },
  ];

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="SALES REPORT" />

      {/* Date Filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setDateFilter("today")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              dateFilter === "today"
                ? "bg-dark-brown text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              dateFilter === "week"
                ? "bg-dark-brown text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              dateFilter === "month"
                ? "bg-dark-brown text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter("custom")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              dateFilter === "custom"
                ? "bg-dark-brown text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-6 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">₱{salesData.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{salesData.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Average Order</p>
          <p className="text-2xl font-bold text-gray-900">₱{salesData.averageOrder.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-xs text-gray-500 mb-1">Top Selling</p>
          <p className="text-lg font-bold text-gray-900">{salesData.topSellingItem}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="px-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h3>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg p-4 shadow flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">#{order.ref}</p>
                <p className="text-sm text-gray-500">{order.items} items · {order.time}</p>
              </div>
              <p className="text-lg font-bold text-gray-900">₱{order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="px-4 mt-6 pb-6">
        <button className="w-full bg-dark-brown text-white py-3 rounded-lg font-medium hover:bg-dark-brown/90 transition-colors">
          Export Report
        </button>
      </div>
    </section>
  );
}
