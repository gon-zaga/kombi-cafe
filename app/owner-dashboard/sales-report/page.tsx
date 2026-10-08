'use client'

import { useEffect, useMemo, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import DateFilterBar from "@/app/ui/DateFilterBar";
import { exportTimestamp } from "@/app/lib/csv";
import { downloadXlsx } from "@/app/lib/xlsx";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange, rangeSlug } from "@/app/lib/dateFilter";
import type { OrderSummary } from "@/app/lib/types";

// --- Helper Components ---

function KPICard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

function TopListCard({ title, data, emptyMessage }: { title: string; data: { name: string; quantity: number }[]; emptyMessage: string }) {
  const maxQuantity = Math.max(...data.map((d) => d.quantity), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6 flex-1">
        {data.length > 0 ? (
          <div className="space-y-5">
            {data.map((item, index) => {
              const rank = index + 1;
              const percentage = (item.quantity / maxQuantity) * 100;
              
              let rankColor = "bg-gray-100 text-gray-600";
              if (rank === 1) rankColor = "bg-amber-100 text-amber-700";
              if (rank === 2) rankColor = "bg-gray-200 text-gray-700";
              if (rank === 3) rankColor = "bg-orange-100 text-orange-700";

              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${rankColor}`}>
                        {rank}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0 ml-2">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function SalesReport() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const query = useMemo(
    () => buildOrdersQuery(dateFilter, customRange),
    [dateFilter, customRange]
  );

  useEffect(() => {
    if (!query) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setIsLoading(true);
      }
    });

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
        if (isMounted) setLoadError("Could not load orders for this range. Please try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
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

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  const topSellingItems = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items || []) {
        counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  }, [orders]);

  const topAddons = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items || []) {
        for (const addon of item.addOns || []) {
          counts[addon.name] = (counts[addon.name] ?? 0) + addon.quantity;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  }, [orders]);

  const stamp = exportTimestamp();
  const slug = rangeSlug(dateFilter, customRange);

   const exportSales = () => {
     const columns = [
       { header: "Order Ref", value: (o: OrderSummary) => o.orderReference, width: 12 },
       { header: "Time", value: (o: OrderSummary) => new Date(o.createdAt).toLocaleString("en-PH"), width: 20 },
       { header: "Date", value: (o: OrderSummary) => o.createdAt.slice(0, 10), width: 15 },
       { header: "Status", value: (o: OrderSummary) => o.status, width: 12 },
       { header: "Item Count", value: (o: OrderSummary) => (o.items || []).length, width: 12 },
       {
         header: "Add-ons Total",
         value: (o: OrderSummary) =>
           (o.items || [])
             .reduce(
               (sum, item) =>
                 sum + (item.addOns || []).reduce((s, a) => s + a.price * a.quantity, 0),
               0
             )
             .toFixed(2),
         width: 15,
       },
       { header: "Total", value: (o: OrderSummary) => o.total.toFixed(2), width: 12 },
     ];
     downloadXlsx(`sales-report-${slug}-${stamp}.xlsx`, orders, columns);
     setMenuOpen(false);
   };

  const exportOptions = [
    { label: "Sales & orders", hint: "One row per order with add-on breakdown", action: exportSales },
  ];

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="SALES REPORT" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <DateFilterBar
              filter={dateFilter}
              customRange={customRange}
              onFilterChange={handleSelectFilter}
              onCustomApply={(range) => {
                setLoadError("");
                setCustomRange(range);
              }}
            />
            <p className="text-sm text-gray-500">
              Report for <span className="font-medium text-gray-700">{describeRange(dateFilter, customRange)}</span>
            </p>
          </div>

          {/* Export Menu */}
          <div className="relative">
            {menuOpen && (
              <button
                aria-label="Close export menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-20 bg-black/10 backdrop-blur-sm transition-opacity"
              />
            )}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              disabled={isLoading}
              aria-expanded={menuOpen}
              className={`relative z-30 flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md ${
                isLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-amber-700 text-white hover:bg-amber-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
               Export Excel
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {exportOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={option.action}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors group"
                  >
                    <span className="block text-sm font-semibold text-gray-800 group-hover:text-amber-800">
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {loadError}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-80" />
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-80" />
            </div>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
            <p className="text-gray-500 text-sm mt-1 text-center max-w-sm">
              There are no orders for the selected date range. Try adjusting the filters or check back later.
            </p>
          </div>
        ) : (
           /* Data State */
           <div className="space-y-6">
             {/* KPI Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <KPICard 
                 title="Total Sales" 
                 value={formatCurrency(totalSales)} 
                 icon={
                   <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 }
               />
               <KPICard 
                 title="Total Orders" 
                 value={totalOrders.toLocaleString('en-PH')} 
                 icon={
                   <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                   </svg>
                 }
               />
               <KPICard 
                 title="Average Order" 
                 value={formatCurrency(averageOrder)} 
                 icon={
                   <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                   </svg>
                 }
               />
             </div>

             {/* Top Items & Add-ons Lists */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <TopListCard 
                 title="Top 5 Selling Items" 
                 data={topSellingItems} 
                 emptyMessage="No items sold in this period." 
               />
               <TopListCard 
                 title="Top 5 Most Chosen Add-ons" 
                 data={topAddons} 
                 emptyMessage="No add-ons selected in this period." 
               />
             </div>

             {/* Orders List */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="px-6 py-4 border-b border-gray-100">
                 <h3 className="text-base font-semibold text-gray-900">Completed Orders</h3>
               </div>
               <div className="p-6">
                 {orders.length > 0 ? (
                   <div
                     className="space-y-4 pr-2"
                     style={{ maxHeight: '480px', overflowY: 'auto' }}
                   >
                      {[...orders]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((order) => (
                        <div key={order.id} className="border border-brown-800 rounded-lg p-4 mb-4 last:mb-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">Order #{order.orderReference}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleString('en-PH', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })} • {order.items.length} item{(order.items.length !== 1) ? 's' : ''}
                              </p>
                              {order.items.map((item, index) => (
                                <div key={`${order.id}-item-${index}`} className="mt-1 text-sm text-gray-700 pl-2">
                                  • {item.quantity}x {item.name}{item.size ? ` (${item.size})` : ''}
                                  {item.addOns.length > 0 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      (+{item.addOns.reduce((sum, addon) => sum + addon.quantity, 0)} add-on{(item.addOns.reduce((sum, addon) => sum + addon.quantity, 0) !== 1) ? 's' : ''})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : order.status === 'ready' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : order.status === 'preparing' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-8 text-center">
                     <p className="text-sm text-gray-500">No completed orders in this period.</p>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}
      </div>
    </section>
  );
}