'use client'

// Reusable "Change table" modal. Renders the same 7-table grid as the
// /table-select page, but inside an overlay so the customer never leaves the
// menu, cart, or item page. Tapping a table saves it to the store and closes
// the modal -- the current scroll position and cart are preserved.
import { useEffect } from "react";
import { useTableStore } from "@/store/TableStore";

const TOTAL_TABLES = 7;

interface ChangeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangeTableModal({ isOpen, onClose }: ChangeTableModalProps) {
  const { selectedTable, setTable } = useTableStore();

  // Escape closes the modal, matching the backdrop and X button
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (tableNumber: number) => {
    setTable(tableNumber);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
      onClick={(e) => {
        // Backdrop click closes; stopPropagation so a parent modal's backdrop
        // doesn't also fire if this is ever nested
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-table-title"
    >
      <div
        className="bg-card-cream w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="change-table-title"
            className="font-roboto-slab text-xl font-bold text-dark-brown"
          >
            Change Table
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-dark-brown/60 hover:bg-dark-brown/10 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-dark-brown/60 mb-5">
          Tap the table you are sitting at.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map((num) => {
            const isSelected = num === selectedTable;
            return (
              <button
                key={num}
                onClick={() => handleSelect(num)}
                className={`rounded-xl p-4 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 border-2 ${
                  isSelected
                    ? "bg-amber-800 border-amber-800 text-white shadow-lg"
                    : "bg-cream border-dark-brown/20 text-dark-brown hover:border-amber-800 hover:bg-amber-50"
                }`}
              >
                <span className="text-3xl font-roboto-slab font-bold">{num}</span>
                <span className="text-[10px] font-roboto-condensed tracking-wide uppercase opacity-70">
                  Table
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}