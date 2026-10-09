'use client'

// Popup shown when a customer taps Order while the store is closed
import type { StoreStatus } from "@/app/lib/storeHours";

export default function StoreClosedModal({
  status,
  onClose,
}: {
  status: StoreStatus | null;
  onClose: () => void;
}) {
  if (!status) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-closed-title"
    >
      <div
        className="bg-cream w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="store-closed-title" className="font-roboto-slab text-3xl font-bold text-dark-brown mb-2">
          STORE CLOSED
        </h2>
        <p className="text-dark-brown/70 mb-4">
          We&apos;re currently closed. Please come back during our opening hours.
        </p>
        <div className="bg-white/60 rounded-xl px-4 py-3 text-dark-brown/80 mb-5">
          {status.openingTime} - {status.closingTime}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-dark-brown text-white py-3 rounded-xl font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}