'use client';

// Customer-facing queue board: polls today's real orders and lists reference numbers
// under PREPARING and READY so customers can see when their number is called
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { OrderSummary } from "@/app/lib/types";

export default function OrderQueue() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?range=today');
      if (!response.ok) throw new Error('Failed to fetch orders');
      setOrders(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      // Only hide the placeholder on the first load; a later failed poll
      // should keep the last good list on screen instead of blanking it
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // setOrders happens inside the async callback, not in the effect body,
    // so this reads as a subscription to an external system
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Newest first from the API, which is the order a customer cares about
  // when several numbers are showing at once
  const preparing = orders.filter((o) => o.status === 'preparing');
  const ready = orders.filter((o) => o.status === 'ready');

  return (
    <div className="min-h-screen bg-card-cream flex flex-col">
      <header className="flex flex-row bg-dark-brown text-white font-roboto-mono justify-between items-center p-2 mb-7">
        <span>ORDERS</span>
        <button
          className="cursor-pointer"
          onClick={() => router.push('/')}
          aria-label="Back to menu"
        >
          <Image
            src="/cream-close.svg"
            alt="exit-button"
            width={32}
            height={32}
          />
        </button>
      </header>

      {/* Preparing Orders */}
      <section className="flex flex-col mb-6">
        <header className="flex flex-row bg-dark-brown text-white font-roboto-condensed p-1 mb-3">
          PREPARING
        </header>
        <div className="flex flex-row flex-wrap gap-2 px-3">
          {preparing.map((order) => (
            <span
              key={order.id}
              className="bg-dark-brown text-white font-roboto-mono text-sm px-3 py-1 rounded"
            >
              #{order.orderReference}
            </span>
          ))}
        </div>
      </section>

      {/* Ready Orders */}
      <section className="flex flex-col">
        <header className="flex flex-row bg-dark-brown text-white font-roboto-condensed p-1 mb-3">
          READY
        </header>
        <div className="flex flex-row flex-wrap gap-2 px-3">
          {ready.map((order) => (
            <span
              key={order.id}
              className="bg-dark-brown text-white font-roboto-mono text-sm px-3 py-1 rounded"
            >
              #{order.orderReference}
            </span>
          ))}
        </div>
      </section>

      {/* Empty state, shown only once we've actually loaded and there's nothing to show */}
      {!isLoading && preparing.length === 0 && ready.length === 0 && (
        <p className="text-center text-dark-brown mt-8">
          No orders yet. Your number will appear here.
        </p>
      )}
    </div>
  );
}
