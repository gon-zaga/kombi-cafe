'use client'

import { useBaristaStore } from "@/store/BaristaStore";
import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function OrderQueue() {
  const orders = useBaristaStore(state => state.orders);
  const router = useRouter();

  const preparing = orders.filter(
    (order) => order.orderStatus === 'preparing'
  );

  const ready = orders.filter(
    (order) => order.orderStatus === 'ready'
  );

  useEffect(() => {
    // Fetch/ refresh every 3 seconds
    const interval = setInterval(() => {

    }, 3000);
    
    return () => clearInterval(interval);
  }, [])

  return (
    <div className="min-h-screen bg-card-cream flex flex-col">
      <header className="flex flex-row bg-dark-brown text-white font-roboto-mono justify-between items-center p-2 mb-7">
        <span>ORDERS</span>
        <button className="cursor-pointer" onClick={() => router.push('/')}>
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
    </div>
  );
}