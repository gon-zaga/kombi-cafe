'use client'

// Renders the cart page: lists all items currently in the order store as OrderCards,
// fetches real add-on data for display, and shows the PlaceOrderButton when the cart isn't empty
import OrderCard from './_ui/OrderCard';
import Header from '../ui/Header';
import { useOrderStore } from '@/store/OrderListStore';
import PlaceOrderButton from './_ui/PlaceOrderButton';
import EmptyOrder from './_ui/EmptyOrder';
import ChangeTableModal from '../ui/ChangeTableModal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTableStore } from '@/store/TableStore';
import type { AddOn } from "@/app/api/add-ons/route";

function OrdersLists() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const { orders, removeOrder } = useOrderStore();
  const { selectedTable } = useTableStore();
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const router = useRouter();
  // Cart grand total including add-ons, matching the server's calculation
  const grandtotal = orders.reduce((acc, order) => {
    const addOnTotal = addOns
      .filter(a => order.selectedAddOn.includes(a.addOnsId))
      .reduce((sum, a) => sum + a.price, 0);
    return acc + (order.selectedSize.price + addOnTotal) * order.quantity;
  }, 0);
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

  // Redirect to table selection if no table is selected
  useEffect(() => {
    if (hydrated && selectedTable === null) {
      router.push('/table-select');
    }
  }, [hydrated, selectedTable, router]);

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

      {/* Table indicator */}
      {selectedTable !== null && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-roboto-condensed tracking-wide text-amber-900">
            TABLE {selectedTable}
          </span>
          <button
            onClick={() => setTableModalOpen(true)}
            className="text-xs text-amber-900 hover:underline cursor-pointer"
          >
            Change table
          </button>
        </div>
      )}

      <ChangeTableModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
      />

      {orders.length === 0

        ? <EmptyOrder />

        : orders.map((order) => (
          // itemId + sizeId + add-ons must all be in the key, because those
          // three fields are what make a cart line unique in the store
          <OrderCard
            key={`${order.itemId}-${order.selectedSize.sizeId}-${JSON.stringify(order.selectedAddOn)}`}
            order={order}
            addOns={addOns}
            onDelete={() => removeOrder(order)}
          />
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