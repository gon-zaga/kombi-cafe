// Sends the cart to POST /api/orders using IDs only.
// The server calculates the actual prices and total.
// Before submitting, the customer picks how they intend to pay
// (counter cash or GCash). A GCash order requires a reference
// number; the staff handles the actual payment at the counter,
// so nothing is charged here -- no payment integration in this system.

'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore, type OrderItem as StoreOrderItem } from "@/store/OrderListStore";
import { useTableStore } from "@/store/TableStore";
import { useOrderTypeStore } from "@/store/OrderTypeStore";
import PaymentMethodSelector, {
   type PaymentMethod,
 } from "./PaymentMethodSelector";
import OrderConfirmModal from "@/app/ui/OrderConfirmModal";
import type { AddOn } from "@/app/api/add-ons/route";

type OrderItem = StoreOrderItem;

function PlaceOrderButton({
  grandtotal,
  orders,
  addOns,
}: {
  grandtotal: number;
  orders: OrderItem[];
  addOns: AddOn[];
}) {
  const router = useRouter();
  const clearOrder = useOrderStore((state) => state.clearOrder);
  const selectedTable = useTableStore((state) => state.selectedTable);
  const orderType = useOrderTypeStore((state) => state.orderType);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("counter");
  const [gcashReference, setGcashReference] = useState("");
  const [gcashError, setGcashError] = useState("");
  const [gcashPhoto, setGcashPhoto] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // For takeout, table_number should be 0
  const tableNumber = orderType === 'takeout' ? 0 : selectedTable;

  // Clear GCash fields when switching payment method
  useEffect(() => {
    if (paymentMethod !== "gcash") {
      setGcashReference("");
      setGcashPhoto(null);
      setGcashError("");
    }
  }, [paymentMethod]);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError("");
    setGcashError("");

    // For dine-in, table is required; for takeout, table_number is 0
    if (orderType === 'dine_in' && selectedTable === null) {
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

    // Also require a GCash photo when using GCash
    if (paymentMethod === "gcash" && !gcashPhoto) {
      setGcashError("Please upload a photo of your GCash transaction.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber,
          order_type: orderType,
          items: orders.map((o) => ({
            itemId: o.itemId,
            sizeId: o.selectedSize.sizeId,
            quantity: o.quantity,
            addOnIds: o.selectedAddOn,
          })),
          payment_method: paymentMethod,
          gcash_reference: paymentMethod === "gcash" ? gcashReference.trim() : null,
          gcash_photo: paymentMethod === "gcash" ? gcashPhoto : null,
        }),
      });

     const data = await res.json();

     if (!res.ok) {
       throw new Error(data.error || "Failed to place order");
     }

router.push(
        `/order-confirmation?ref=${data.orderReference}&total=${data.total}&table=${data.table_number}&id=${data.order_id}&method=${data.payment_method}&type=${data.order_type}${data.gcash_reference ? `&gref=${encodeURIComponent(data.gcash_reference)}` : ""}`
      );
     clearOrder();
   } catch (err) {
     setError(
       err instanceof Error ? err.message : "Failed to place order"
     );
     setIsSubmitting(false);
   }
 };

  const handleConfirmClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(false);
    handlePlaceOrder();
  };

  const handleConfirmCancel = () => {
    setShowConfirm(false);
  };

  // Transform orders for the receipt modal
  const receiptItems = orders.map((order) => {
    const size = order.selectedSize;
    const itemAddOns = addOns
      .filter((a) => order.selectedAddOn.includes(a.addOnsId))
      .map((a) => ({ addOnName: a.name, price: a.price }));

    return {
      itemName: order.itemName,
      sizeName: size.size,
      sizePrice: size.price,
      quantity: order.quantity,
      addOns: itemAddOns,
    };
  });

return (
    <div className="px-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-2">
          {error}
        </div>
      )}

      {orderType === 'takeout' ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm mb-2">
          Takeout Order
        </div>
      ) : selectedTable !== null && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm mb-2">
          Ordering from Table {selectedTable}
        </div>
      )}

       <PaymentMethodSelector
         value={paymentMethod}
         onChange={setPaymentMethod}
         reference={gcashReference}
         onReferenceChange={setGcashReference}
         photo={gcashPhoto}
         onPhotoChange={setGcashPhoto}
         error={gcashError}
         photoError={gcashError}
       />

      <button
        onClick={handleConfirmClick}
        disabled={isSubmitting}
        className="w-full mt-3 bg-amber-800 text-white text-lg font-semibold py-4 rounded-2xl active:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "Placing Order..." : `Place Order · ₱${grandtotal.toFixed(2)}`}
      </button>

      <OrderConfirmModal
        isOpen={showConfirm}
        tableNumber={selectedTable ?? 0}
        orderType={orderType}
        items={receiptItems}
        paymentMethod={paymentMethod}
        grandTotal={grandtotal}
        delayMs={2000}
        onConfirm={handleConfirmSubmit}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}

export default PlaceOrderButton;