'use client'

import { useEffect, useMemo, useState } from "react";
import OwnerHeader from "./ui/OwnerHeader";
import StatsCard from "./ui/StatsCard";
import DateFilterBar from "@/app/ui/DateFilterBar";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange } from "@/app/lib/dateFilter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface AnalyticsData {
  range: { from: string | null; to: string | null };
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completed_orders: number;
  };
  revenueByCategory: { category: string; revenue: string; order_count: string }[];
  revenueByHour: { hour: number; orders: string; revenue: string }[];
  avgItemsPerOrder: number;
  addonAttachmentRate: number;
  staffPerformance: { user_id: number; username: string; first_name: string; last_name: string; orders_completed: string; avg_order_value: string; total_revenue: string }[];
  dailyTrend: { order_date: string; orders: string; revenue: string }[];
}

export default function OwnerDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => buildOrdersQuery(dateFilter, customRange),
    [dateFilter, customRange]
  );

  useEffect(() => {
    if (!query) return;

    let isMounted = true;

    async function loadAnalytics() {
      try {
        const response = await fetch(`/api/analytics${query}`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const d: AnalyticsData = await response.json();
        if (isMounted) {
          setAnalyticsData(d);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        if (isMounted) setError("Could not load analytics for this range.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => { isMounted = false; };
  }, [query]);

  const handleSelectFilter = (f: DateFilter) => {
    setError("");
    setDateFilter(f);
  };

  const COLORS = ["#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F5DEB3", "#8B7355"];

  if (loading && !analyticsData) {
    return (
      <section className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
      </section>
    );
  }

   const { summary, revenueByCategory, revenueByHour, avgItemsPerOrder, addonAttachmentRate, staffPerformance, dailyTrend } = analyticsData || {
     summary: { total_orders: 0, total_revenue: 0, avg_order_value: 0, completed_orders: 0 },
     revenueByCategory: [],
     revenueByHour: [],
     avgItemsPerOrder: 0,
     addonAttachmentRate: 0,
     staffPerformance: [],
     dailyTrend: [],
   };

  const categoryData = revenueByCategory.map((item, i) => ({
    name: item.category,
    revenue: Number(item.revenue),
    orders: Number(item.order_count),
    fill: COLORS[i % COLORS.length],
  }));

  const hourData = revenueByHour.map((h) => ({
    hour: `${h.hour}:00`,
    revenue: Number(h.revenue),
    orders: Number(h.orders),
  }));

  const dailyData = dailyTrend.map((d) => ({
    date: d.order_date,
    revenue: Number(d.revenue),
    orders: Number(d.orders),
  }));

   const staffData = staffPerformance.map((s) => ({
     name: `${s.first_name || s.username}`,
     orders: Number(s.orders_completed),
     revenue: Number(s.total_revenue),
     avgOrder: Number(s.avg_order_value),
   }));

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="DASHBOARD" />
      <StatsCard />

      <div className="px-4 mb-4">
        <DateFilterBar
          filter={dateFilter}
          customRange={customRange}
          onFilterChange={handleSelectFilter}
          onCustomApply={(range) => {
            setError("");
            setCustomRange(range);
          }}
        />
        <p className="text-sm text-gray-600 mt-3">
          Report for {describeRange(dateFilter, customRange)}
        </p>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="px-4 space-y-6 pb-10">
        {/* Revenue by Category - Bar Chart */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Hour - Line Chart */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours (Revenue by Hour)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8B4513" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend - Line Chart */}
        {dailyData.length > 1 && (
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8B4513" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orders" stroke="#D2691E" strokeWidth={2} name="Orders" dot={{ r: 3 }} yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Pie Chart */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Revenue Share</h3>
            <div className="h-64 flex">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Legend width="40%" />
            </div>
          </div>
        )}

         {/* Staff Performance Table */}
         {staffPerformance.length > 0 && (
           <div className="bg-white rounded-lg p-4 shadow">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-gray-200 text-left text-gray-500">
                     <th className="pb-2 pr-4">Staff</th>
                     <th className="pb-2 pr-4 text-right">Orders</th>
                     <th className="pb-2 pr-4 text-right">Revenue</th>
                     <th className="pb-2 pr-4 text-right">Avg Order</th>
                   </tr>
                 </thead>
                 <tbody>
                   {staffData.map((s, i) => (
                     <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                       <td className="py-2 pr-4 font-medium text-gray-900">{s.name}</td>
                       <td className="py-2 pr-4 text-right text-gray-700">{s.orders}</td>
                       <td className="py-2 pr-4 text-right text-gray-700">₱{s.revenue.toFixed(2)}</td>
                       <td className="py-2 pr-4 text-right text-gray-700">₱{s.avgOrder.toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}

         {/* Category Breakdown Table */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4 text-right">Revenue</th>
                    <th className="pb-2 pr-4 text-right">Orders</th>
                    <th className="pb-2 pr-4 text-right">Avg/Order</th>
                  </tr>
                </thead>
                <tbody>
                   {categoryData.map((c, i) => (
                     <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                       <td className="py-2 pr-4 font-medium text-gray-900 flex items-center gap-2">
                         <span className="w-3 h-3 rounded" style={{ background: c.fill }} />
                         {c.name}
                       </td>
                       <td className="py-2 pr-4 text-right text-gray-700">₱{c.revenue.toFixed(2)}</td>
                       <td className="py-2 pr-4 text-right text-gray-700">{c.orders}</td>
                       <td className="py-2 pr-4 text-right text-gray-700">₱{c.orders > 0 ? (c.revenue / c.orders).toFixed(2) : "0.00"}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}