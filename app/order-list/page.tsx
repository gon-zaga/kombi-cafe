'use client'

// Renders the cart page: lists all items currently in the order store as OrderCards,
// fetches real add-on data for display, and shows the PlaceOrderButton when the cart isn't empty
import OrderCard from './_ui/OrderCard';
import Header from '../ui/Header';
import { useOrderStore } from '@/store/OrderListStore';
import PlaceOrderButton from './_ui/PlaceOrderButton';
import EmptyOrder from './_ui/EmptyOrder';
import { useEffect, useState } from 'react';
import type { AddOn } from "@/app/api/add-ons/route";

function OrdersLists() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const { orders, removeOrder } = useOrderStore();
  const grandtotal = orders.reduce((acc, order) => acc + order.selectedSize.price * order.quantity, 0);
  const [hydrated, setHydrated] = useState(false);

  // Waits for Zustand's persisted store to finish loading from localStorage before rendering,
  // so we don't briefly show an empty cart before the saved orders load in
  useEffect(() => {
    const unsub = useOrderStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useOrderStore.persist.hasHydrated()) {
      // Deferred to a microtask (rather than called synchronously) to avoid the
      // "setState synchronously within an effect" lint warning
      Promise.resolve().then(() => setHydrated(true));
    }

    return () => unsub();
  }, []);

  // Fetches the current list of available add-ons from the database,
  // so OrderCard can show real add-on names instead of mock data
  useEffect(() => {
    let isMounted = true;

    async function fetchAddOns() {
      try {
        const response = await fetch('/api/add-ons');
        const data = await response.json();

        if (isMounted) {
          setAddOns(data);
        }
      } catch (error) {
        console.error("Failed to fetch add-ons: ", error);
      }
    }

    fetchAddOns();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!hydrated) return null;

  return (
    <div className='min-h-screen'>
      <Header />

      {orders.length === 0

        ? <EmptyOrder />

        : orders.map((order) => (
          // Key combines itemId + selected add-ons so two cart lines for the same
          // item with different add-on combos don't collide
          <OrderCard key={`${order.itemId}-${JSON.stringify(order.selectedAddOn)}`} order={order} addOns={addOns} onDelete={() => removeOrder(order)} />
        ))
      }

      {
        orders.length > 0 && (
          <PlaceOrderButton grandtotal={grandtotal} />
        )
      }

    </div>
  );
}

export default OrdersLists