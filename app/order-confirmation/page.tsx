'use client'

// Order confirmation: shows the reference number, the payment
// method the customer chose, and the order total. The receipt
// breakdown and the cash change calculator live on the barista
// dashboard, where staff count back money at the counter.
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import ChangeTableModal from "../ui/ChangeTableModal";
import { useTableStore } from "@/store/TableStore";
import type { OrderSummary } from "@/app/lib/types";

// Resolves the payment method shown on the confirmation screen. The order
// record is the source of truth; the URL value is only a fallback so the
// screen still shows the method if the record read fails.
function resolvePayment(order: OrderSummary | null, urlMethod: string | null) {
  if (order?.paymentMethod === "counter" || order?.paymentMethod === "gcash") {
    return {
      method: order.paymentMethod as "counter" | "gcash",
      reference: order.gcashReference ?? null,
    };
  }
  if (urlMethod === "gcash") {
    return { method: "gcash" as const, reference: null };
  }
  return { method: "counter" as const, reference: null };
}

function ConfirmOrder() {
  const confirmParam = useSearchParams();
  const router = useRouter();
  const ref = confirmParam.get('ref');
  const total = confirmParam.get('total');
  const table = confirmParam.get('table');
  const orderId = confirmParam.get('id');
  // The payment method and GCash reference ride along on the URL so the
  // confirmation screen can show them even if the order record read
  // fails. The order record itself also carries them.
  const method = confirmParam.get('method');
  const gref = confirmParam.get('gref');
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

        {/* How the customer intends to pay. The staff handles the actual
            payment at the counter -- nothing is charged here. */}
        {(() => {
          const payment = resolvePayment(order, method);
          return payment.method === "gcash" ? (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm w-full">
              <p className="font-semibold">Payment: GCash</p>
              <p className="mt-1">
                Reference number{" "}
                <span className="font-mono font-semibold">
                  {gref || payment.reference || "—"}
                </span>
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                The barista will verify the reference order before preparing your order
              </p>
            </div>
          ) : (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm w-full">
              <p className="font-semibold">Payment: Counter</p>
              <p className="text-xs text-amber-700 mt-1">
                Pay cash at the counter for the order to be prepared.
              </p>
            </div>
          );
        })()}

        {table && (
          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
            Table {table}
          </div>
        )}

        <hr className="w-full border-dark-brown/20 my-2" />

        {order ? (
          <p className="text-lg font-medium">
            Total: ₱{Number(order.total).toFixed(2)}
          </p>
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
