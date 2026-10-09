'use client'

import { useEffect, useMemo, useState } from "react";
import OwnerHeader from "./ui/OwnerHeader";
import StatsCard from "./ui/StatsCard";
import DateFilterBar from "@/app/ui/DateFilterBar";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange } from "@/app/lib/dateFilter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

interface AnalyticsData {
  range: { from: string | null; to: string | null };
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completed_orders: number;
  };
  revenueByCategory: {
    category: string;
    revenue: string;
    order_count: string;
  }[];
  revenueByHour: {
    hour: number;
    orders: string;
    revenue: string;
  }[];
  avgItemsPerOrder: number;
  addonAttachmentRate: number;
  staffPerformance: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    orders_completed: string;
    avg_order_value: string;
    total_revenue: string;
  }[];
  dailyTrend: {
    order_date: string;
    orders: string;
    revenue: string;
  }[];
  ingredientConsumption: {
    ingredient_name: string;
    total_used: string;
  }[];
}

export default function OwnerDashboard() {
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");

  const [customRange, setCustomRange] =
    useState<CustomRange | null>(null);

  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; openingTime: string; closingTime: string }>({
    isOpen: true,
    openingTime: "08:00 AM",
    closingTime: "08:00 PM"
  });

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

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const d: AnalyticsData = await response.json();

        if (isMounted) {
          setAnalyticsData(d);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);

        if (isMounted) {
          setError("Could not load analytics for this range.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [query]);

  // Fetch store status
    useEffect(() => {
      async function loadStoreStatus() {
        try {
          const response = await fetch('/api/settings');
          if (!response.ok) {
            throw new Error('Failed to fetch store settings');
          }
          const data = await response.json();

          // Get current time in Manila (UTC+8)
          const now = new Date();
          const manilaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for Manila timezone
          const manilaHours = manilaTime.getHours();
          const manilaMinutes = manilaTime.getMinutes();
          const currentManilaMinutes = manilaHours * 60 + manilaMinutes;

        // Parse opening and closing times (format: HH:MM or HH:MM:SS)
        const parseTime = (timeStr) => {
          // Handle null or undefined
          if (!timeStr) {
            return 0; // Default to midnight
          }
          const parts = timeStr.split(':');
          // Handle cases where the string doesn't have enough parts
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          return hours * 60 + minutes;
        };

           const openingMinutes = parseTime(data.opening_time);
           const closingMinutes = parseTime(data.closing_time);

           // Check if store is open using modulo arithmetic to handle crossing midnight
           const L = 24 * 60; // Minutes in a day
           const openDuration = (closingMinutes - openingMinutes + L) % L; // Ensure positive
           const isOpenNow = ((currentManilaMinutes - openingMinutes + L) % L) < openDuration;

           // Format opening and closing times for display (12-hour format with AM/PM)
           const formatTime = (totalMinutes) => {
             // Handle invalid input
             if (isNaN(totalMinutes) || totalMinutes < 0) {
               return "12:00 AM"; // Default to midnight
             }
             
             let hours = Math.floor(totalMinutes / 60);
             const minutes = totalMinutes % 60;
             const ampm = hours >= 12 ? 'PM' : 'AM';
             hours = hours % 12;
             hours = hours ? hours : 12; // the hour "0" should be "12"
             return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
           };

          setStoreStatus({
            isOpen: isOpenNow,
            openingTime: formatTime(openingMinutes),
            closingTime: formatTime(closingMinutes)
          });
        } catch (err) {
          console.error('Failed to load store status:', err);
          // Default values (08:00 opening, 20:00 closing)
          const defaultOpeningMinutes = 8 * 60; // 08:00
          const defaultClosingMinutes = 20 * 60; // 20:00
          setStoreStatus({
            isOpen: true,
            openingTime: formatTime(defaultOpeningMinutes),
            closingTime: formatTime(defaultClosingMinutes)
          });
        }
      }

      loadStoreStatus();

      // Update every minute
      const interval = setInterval(loadStoreStatus, 60 * 1000);
      return () => clearInterval(interval);
    }, []);

  const handleSelectFilter = (f: DateFilter) => {
    setError("");
    setDateFilter(f);
  };

  const COLORS = [
    "#8B4513",
    "#D2691E",
    "#CD853F",
    "#DEB887",
    "#F5DEB3",
    "#8B7355",
  ];

  const {
    summary,
    revenueByCategory,
    revenueByHour,
    avgItemsPerOrder,
    addonAttachmentRate,
    staffPerformance,
    dailyTrend,
    ingredientConsumption,
  } = analyticsData || {
    summary: {
      total_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      completed_orders: 0,
    },
    revenueByCategory: [],
    revenueByHour: [],
    avgItemsPerOrder: 0,
    addonAttachmentRate: 0,
    staffPerformance: [],
    dailyTrend: [],
    ingredientConsumption: [],
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

  const ingredientData = ingredientConsumption.map((item) => ({
    name: item.ingredient_name,
    used: Number(item.total_used),
  }));

  const showDailyTrend = dailyData.length > 1;

  return (
    <section className="min-h-screen bg-card-cream">
      <OwnerHeader title="DASHBOARD" />
      
      {/* Store Status Indicator */}
      <div className="px-4 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className={`w-3 h-3 rounded-full ${storeStatus.isOpen ? 'bg-green-500' : 'bg-red-500'} ${storeStatus.isOpen ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">
            Store is {storeStatus.isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Hours: {storeStatus.openingTime} - {storeStatus.closingTime}
        </div>
      </div>

      <StatsCard />

      {loading && !analyticsData && (
        <section className="min-h-screen bg-cream flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
        </section>
      )}

      {!loading && (
        <>
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

          <div className="px-4 pb-10 space-y-6">
            {/* Row 1: Revenue by Category | Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-cream rounded-lg p-4 shadow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Revenue by Category
                </h3>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `₱${v}`}
                      />
                      <Tooltip />

                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        radius={[4, 4, 0, 0]}
                      >
                        {categoryData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Peak Hours (Revenue by Hour)
                </h3>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `₱${v}`}
                      />
                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8B4513"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Daily Trend | Ingredient Consumption */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {showDailyTrend ? (
                <div className="bg-white rounded-lg p-4 shadow min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Trend
                  </h3>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                        />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `₱${v}`}
                        />
                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8B4513"
                          strokeWidth={2}
                          name="Revenue"
                          dot={{ r: 3 }}
                        />

                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#D2691E"
                          strokeWidth={2}
                          name="Orders"
                          dot={{ r: 3 }}
                          yAxisId="right"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 shadow min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category Breakdown
                  </h3>

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
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 pr-4 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded shrink-0"
                                  style={{ background: c.fill }}
                                />
                                {c.name}
                              </div>
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              ₱{c.revenue.toFixed(2)}
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              {c.orders}
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              ₱
                              {c.orders > 0
                                ? (c.revenue / c.orders).toFixed(2)
                                : "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg p-4 shadow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ingredient Consumption
                </h3>

                <div className="h-64">
                  {ingredientData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ingredientData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) =>
                            `${v} units`}
                        />
                        <Tooltip />

                        <Bar
                          dataKey="used"
                          name="Usage"
                          radius={[4, 4, 0, 0]}
                        >
                          {ingredientData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center text-center">
                      <p className="text-gray-600 font-medium">
                        Ingredient consumption chart
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        No consumption chart is connected in this dashboard
                        component yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Staff Performance | Category Breakdown */}
            {showDailyTrend && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {staffPerformance.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Staff Performance
                    </h3>

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
                            <tr
                              key={i}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-2 pr-4 font-medium text-gray-900">
                                {s.name}
                              </td>
                              <td className="py-2 pr-4 text-right text-gray-700">
                                {s.orders}
                              </td>
                              <td className="py-2 pr-4 text-right text-gray-700">
                                ₱{s.revenue.toFixed(2)}
                              </td>
                              <td className="py-2 pr-4 text-right text-gray-700">
                                ₱{s.avgOrder.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg p-4 shadow min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category Breakdown
                  </h3>

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
                          <tr
                            key={i}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 pr-4 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded shrink-0"
                                  style={{ background: c.fill }}
                                />
                                {c.name}
                              </div>
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              ₱{c.revenue.toFixed(2)}
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              {c.orders}
                            </td>

                            <td className="py-2 pr-4 text-right text-gray-700">
                              ₱
                              {c.orders > 0
                                ? (c.revenue / c.orders).toFixed(2)
                                : "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* When Daily Trend is hidden, keep Staff Performance below Row 2 */}
            {!showDailyTrend && staffPerformance.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Staff Performance
                </h3>

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
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 pr-4 font-medium text-gray-900">
                            {s.name}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-700">
                            {s.orders}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-700">
                            ₱{s.revenue.toFixed(2)}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-700">
                            ₱{s.avgOrder.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}