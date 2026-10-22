'use client'

import { useEffect, useState } from "react";

interface OrderItem {
  itemName: string;
  sizeName: string;
  sizePrice: number;
  quantity: number;
  addOns: { addOnName: string; price: number }[];
}

interface OrderConfirmModalProps {
  isOpen: boolean;
  tableNumber: number;
  items: OrderItem[];
  paymentMethod: "counter" | "gcash";
  grandTotal: number;
  delayMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OrderConfirmModal({
  isOpen,
  tableNumber,
  items,
  paymentMethod,
  grandTotal,
  delayMs = 2000,
  onConfirm,
  onCancel,
}: OrderConfirmModalProps) {
  const [remaining, setRemaining] = useState(Math.ceil(delayMs / 1000));
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setRemaining(Math.ceil(delayMs / 1000));
  }

  useEffect(() => {
    if (!isOpen || remaining <= 0) return;

    const timer = setTimeout(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, remaining]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const locked = remaining > 0;

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const paymentBadge =
    paymentMethod === "gcash"
      ? (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          GCash
        </span>
      )
      : (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Counter
        </span>
      );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-confirm-modal-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center border-b border-dashed border-amber-300 pb-4 mb-4">
          <h2 id="order-confirm-modal-title" className="text-lg font-bold text-dark-brown font-roboto-slab tracking-wider mb-1">
            KOMBI CAFE
          </h2>
          <p className="text-xs text-dark-brown/60 font-roboto-mono tracking-widest">ORDER CONFIRMATION</p>
          <p className="text-xs text-dark-brown/50 font-roboto-mono mt-1">{formattedDate} · {formattedTime}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-amber-700 font-roboto-condensed tracking-wider mb-0.5">TABLE NUMBER</p>
          <p className="text-3xl font-bold text-amber-900 font-roboto-slab">{tableNumber}</p>
        </div>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div key={index} className="border-b border-amber-100 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-brown">{item.itemName}</p>
                  <p className="text-xs text-dark-brown/60 font-roboto-mono">
                    {item.sizeName} · ×{item.quantity}
                  </p>
                  {item.addOns.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.addOns.map((addOn, addOnIndex) => (
                        <p key={addOnIndex} className="text-xs text-dark-brown/50 pl-2 border-l border-amber-200">
                          + {addOn.addOnName}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-dark-brown font-roboto-mono whitespace-nowrap">
                  ₱{(item.sizePrice * item.quantity + item.addOns.reduce((sum, a) => sum + a.price * item.quantity, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-amber-300 pt-3 mb-3 flex items-center justify-between">
          <span className="text-xs text-dark-brown/60 font-roboto-condensed tracking-wider">PAYMENT</span>
          {paymentBadge}
        </div>

        <div className="border-t border-dashed border-amber-300 pt-3 mb-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-dark-brown/70 font-roboto-condensed tracking-wider">TOTAL</span>
            <span className="text-2xl font-bold text-dark-brown font-roboto-slab">₱{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={locked}
            className="flex-1 px-4 py-3 text-sm font-medium text-dark-brown bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={locked}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locked ? `Confirm (${remaining})` : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}