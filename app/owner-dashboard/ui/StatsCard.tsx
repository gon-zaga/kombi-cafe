'use client'

import { useEffect, useMemo, useState } from "react";
import type { CustomRange, DateFilter } from "@/app/lib/dateFilter";
import { buildOrdersQuery, describeRange } from "@/app/lib/dateFilter";
import type { OrderSummary } from "@/app/lib/types";

function StatsCard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const [orders, setOrders] = useState<OrderSummary[]>([]);

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
        if (isMounted && Array.isArray(data)) setOrders(data);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [query]);

  const rangeLabel = describeRange(dateFilter, customRange);

  return (
    <section>
      <div className="px-4 md:px-6 mb-4">
        <span className="text-sm text-gray-600">
          Showing {rangeLabel} · {orders.length} order
          {orders.length === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}

export default StatsCard;