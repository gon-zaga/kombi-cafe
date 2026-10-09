'use client';

// Customer-facing queue board: polls today's real orders and lists, per order, the
// reference number (the large figure customers verify at the counter) plus a smaller
// line with the table number and the database orderId. 'pending' and 'completed'
// are excluded by the two filters below, so a collected order disappears off the
// customer board as soon as the barista completes it.
// The two states sit side by side with a vertical divider between them, so the
// split is the same shape on every screen.
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { OrderSummary } from "@/app/lib/types";

// Longest-waiting first, so the top number in a column is the next one due
const byOldestFirst = (a: OrderSummary, b: OrderSummary) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

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

  const preparing = orders.filter((o) => o.status === 'preparing').sort(byOldestFirst);
  const ready = orders.filter((o) => o.status === 'ready').sort(byOldestFirst);

  return (
    <div className="min-h-screen bg-card-cream flex flex-col">
      <header className="flex items-center justify-between bg-dark-brown text-white px-4 py-3">
        <span className="font-roboto-mono text-xl tracking-[0.25em]">ORDERS</span>

         <button
           className="cursor-pointer hover:opacity-70 transition-opacity"
           onClick={() => router.push('/menu')}
           aria-label="Back to menu"
         >
          <Image
            src="/cream-close.svg"
            alt="exit-button"
            width={28}
            height={28}
          />
        </button>
      </header>

      <div className="flex-1 flex">
        <section className="flex-1 min-w-0 flex flex-col items-center gap-6 px-3 py-8">
          <h2 className="font-roboto-condensed text-base tracking-[0.2em] text-dark-brown/60">
            PREPARING
          </h2>

          <div className="flex flex-col items-center gap-4">
            {preparing.length === 0 ? (
              <p className="text-2xl text-dark-brown/30">-</p>
            ) : (
              preparing.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col items-center"
                >
                  <span className="font-roboto-mono text-3xl sm:text-4xl text-dark-brown">
                    #{order.orderReference}
                  </span>
                  <span className="font-roboto-mono text-xs text-dark-brown/60 mt-0.5">
                    Table {order.tableNumber ?? '-'} · #{order.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* The vertical divider that splits the two states */}
        <div className="w-px shrink-0 bg-dark-brown/20" aria-hidden="true" />

        <section className="flex-1 min-w-0 flex flex-col items-center gap-6 px-3 py-8">
          <h2 className="font-roboto-condensed text-base tracking-[0.2em] text-dark-brown/60">
            READY
          </h2>

          <div className="flex flex-col items-center gap-4">
            {ready.length === 0 ? (
              <p className="text-2xl text-dark-brown/30">-</p>
            ) : (
              ready.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col items-center"
                >
                  <span className="font-roboto-mono text-3xl sm:text-4xl text-green-700">
                    #{order.orderReference}
                  </span>
                  <span className="font-roboto-mono text-xs text-green-700/60 mt-0.5">
                    Table {order.tableNumber ?? '-'} · #{order.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Shown only after the first poll returns, so it never flashes
          "nothing here" while the list is still on its way */}
      {!isLoading && preparing.length === 0 && ready.length === 0 && (
        <p className="text-center text-dark-brown/60 pb-8">
          No orders right now. Your number will appear here.
        </p>
      )}
    </div>
  );
}
