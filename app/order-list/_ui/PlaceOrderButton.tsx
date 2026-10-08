// Sends the cart to POST /api/orders using IDs only.
// The server calculates the actual prices and total.
// Before submitting, the customer picks how they intend to pay
// (counter cash or GCash). A GCash order requires a reference
// number; the staff handles the actual payment at the counter,
// so nothing is charged here -- no payment integration in this system.

'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";
import { useTableStore } from "@/store/TableStore";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "./PaymentMethodSelector";

function PlaceOrderButton({ grandtotal }: { grandtotal: number }) {
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);
  const clearOrder = useOrderStore((state) => state.clearOrder);
  const selectedTable = useTableStore((state) => state.selectedTable);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The reference field is only meaningful for GCash, but it is kept
  // uncontrolled here so the parent can clear it if the method changes
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("counter");
  const [gcashReference, setGcashReference] = useState("");
  const [gcashError, setGcashError] = useState("");

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError("");
    setGcashError("");

    if (selectedTable === null) {
      setError("Please select a table first.");
      setIsSubmitting(false);
      return;
    }

    // A GCash order must carry a reference number the customer reads
    // from their GCash app. Block the submit here so the field is
    // visibly required rather than a server round-trip.
    const trimmed = gcashReference.trim();
    if (paymentMethod === "gcash" && !/^\d{13}$/.test(trimmed)) {
      setGcashError("GCash reference number must be exactly 13 digits.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: selectedTable,
          items: orders.map((o) => ({
            itemId: o.itemId,
            sizeId: o.selectedSize.sizeId,
            quantity: o.quantity,
            addOnIds: o.selectedAddOn,
          })),
          payment_method: paymentMethod,
          gcash_reference: paymentMethod === "gcash" ? gcashReference.trim() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      router.push(
        `/order-confirmation?ref=${data.orderReference}&total=${data.total}&table=${data.table_number}&id=${data.order_id}&method=${data.payment_method}${data.gcash_reference ? `&gref=${encodeURIComponent(data.gcash_reference)}` : ""}`
      );
      clearOrder();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to place order"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-2">
          {error}
        </div>
      )}

      {selectedTable !== null && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm mb-2">
          Ordering from Table {selectedTable}
        </div>
      )}

      <PaymentMethodSelector
        value={paymentMethod}
        onChange={setPaymentMethod}
        reference={gcashReference}
        onReferenceChange={setGcashReference}
        error={gcashError}
      />

      <button
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
        className="w-full mt-3 bg-amber-800 text-white text-lg font-semibold py-4 rounded-2xl active:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "Placing Order..." : `Place Order · ₱${grandtotal.toFixed(2)}`}
      </button>
    </div>
  );
}

export default PlaceOrderButton;