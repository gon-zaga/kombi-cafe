'use client'

// Order confirmation: shows the reference number, then a
// receipt-style breakdown of the placed order (each line with
// its add-on amounts) read back from the stored order record,
// plus a grocery-style change calculator for counting back
// cash at the counter.
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import ChangeTableModal from "../ui/ChangeTableModal";
import ChangeCalculator from "../ui/ChangeCalculator";
import { useTableStore } from "@/store/TableStore";
import type { OrderSummary } from "@/app/lib/types";

function ConfirmOrder() {
  const confirmParam = useSearchParams();
  const router = useRouter();
  const ref = confirmParam.get('ref');
  const total = confirmParam.get('total');
  const table = confirmParam.get('table');
  const orderId = confirmParam.get('id');
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const { clearTable } = useTableStore();

  // The receipt is read back from the order record (the same
  // rows the barista board and the reports read), so the
  // amounts the customer sees are the amounts the café's
  // records justify. The URL only carries the id.
  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;

    fetch(`/api/orders/${orderId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch(() => {
        // The reference number above stays visible; a failed
        // read must not block the confirmation itself
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleNewOrder = () => {
    // A new order starts at a fresh table so the next customer isn't
    // silently left at the previous table
    clearTable();
    router.push('/table-select');
  };

  return (
    <section className="bg-cream flex min-h-screen items-center justify-center">
      {/* Confirm Card */}
      <div className="flex flex-col items-center justify-center w-4/5 gap-2">
        <Image
          src="/check-circle.svg"
          alt="check-icon"
          width={48}
          height={48}
        />
        <span className="font-mono text-sm tracking-widest text-dark-brown">ORDER PLACED</span>
        <span className="text-2xl font-semibold">You&apos; re all set!</span>
        <p className="text-sm text-gray-600 text-center mt-1">
          Please verify your reference number at the counter to prepare your order
        </p>

        <div className="mt-3 bg-dark-brown text-white py-4 px-8 rounded-2xl text-center w-full">
          <span className="text-sm tracking-widest font-mono">REFERENCE NUMBER</span>
          <p className="text-3xl font-bold font-mono mt-1">{ref}</p>
        </div>

        {table && (
          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
            Table {table}
          </div>
        )}

        <hr className="w-full border-dark-brown/20 my-2" />

        {order ? (
          <>
            {/* Receipt: line items with add-on amounts, mirroring
                the stored order_items / order_item_addons rows */}
            <div className="w-full bg-white border-2 border-dark-brown/20 rounded-2xl p-4 font-mono text-sm text-dark-brown">
              <div className="text-center border-b border-dashed border-dark-brown/30 pb-2 mb-2">
                <p className="text-xs tracking-[0.2em]">KOMBI CAFE RECEIPT</p>
                <p className="text-xs text-gray-500">REF #{order.orderReference}</p>
                {order.tableNumber != null && (
                  <p className="text-xs text-gray-500">TABLE {order.tableNumber}</p>
                )}
              </div>

              {order.items.map((item, index) => {
                const addOnTotal = item.addOns.reduce(
                  (sum, a) => sum + a.price * a.quantity,
                  0
                );
                const lineTotal = (Number(item.unitPrice) + addOnTotal) * item.quantity;

                return (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between gap-2">
                      <span>{item.quantity}x {item.name} ({item.size})</span>
                      <span className="shrink-0">₱{lineTotal.toFixed(2)}</span>
                    </div>
                    {item.addOns.map((addOn, addOnIndex) => (
                      <div
                        key={addOnIndex}
                        className="flex justify-between gap-2 pl-3 text-xs text-gray-600"
                      >
                        <span>+ {addOn.name} x{addOn.quantity}</span>
                        <span className="shrink-0">₱{(addOn.price * addOn.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div className="border-t border-dashed border-dark-brown/30 mt-2 pt-2 flex justify-between font-bold">
                <span>TOTAL</span>
                <span>₱{Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Change calculator: counts back cash at the counter.
                Nothing is stored -- the order record is the receipt. */}
            <div className="w-full mt-2">
              <ChangeCalculator total={Number(order.total)} />
            </div>
          </>
        ) : (
          <span className="text-lg font-medium">
            Total: ₱{Number(total).toFixed(2)}
          </span>
        )}

        <button
          onClick={handleNewOrder}
          className="w-full mt-2 bg-amber-800 text-white text-lg font-semibold py-4 rounded-2xl active:opacity-80"
        >
          New Order
        </button>

        <ChangeTableModal
          isOpen={tableModalOpen}
          onClose={() => setTableModalOpen(false)}
        />
      </div>
    </section>
  );  
}

export default function ConfirmOrderPage() {
  return ( 
    <Suspense>  
      <ConfirmOrder />
    </Suspense>
  );
}
