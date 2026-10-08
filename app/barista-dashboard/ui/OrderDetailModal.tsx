'use client'

// Detail overlay for one barista order; shows a receipt-style
// breakdown (line totals with add-on amounts) so the price on
// screen reconciles with the order total, plus a cash calculator
// for counting change back. Status buttons call the parent PATCH handler
import { useState } from "react";
import { getRelativeTime } from "@/app/lib/utils";
import ConfirmModal from "@/app/ui/ConfirmModal";
import ChangeCalculator from "@/app/ui/ChangeCalculator";
import type { OrderSummary } from "@/app/lib/types";

interface OrderDetailModalProps {
  order: OrderSummary | null
  onClose: () => void
  onUpdateStatus: (id: number, status: 'pending' | 'preparing' | 'ready' | 'completed') => void
}

function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  // Reverting is a correction, not routine flow, so the button turns into an
  // in-app confirm first, using the shared ConfirmModal so no native dialog is
  // used. delayMs is 0 because a revert is itself reversible (mark ready again)
  // and baristas do it often; the 3s lock is for irreversible deletes.
  const [confirmingRevert, setConfirmingRevert] = useState(false);

  if (!order) return null;

  // 'ready' and 'completed' both end the order's turn, so the parent
  // auto-advances to the next order. 'preparing' keeps this card open on the
  // same order.
  const handleUpdateStatus = (status: 'pending' | 'preparing' | 'ready' | 'completed') => {
    if (status === 'ready' || status === 'completed') onClose();
    onUpdateStatus(order.id, status);
  };

  const handleRevert = () => {
    onUpdateStatus(order.id, 'preparing');
    setConfirmingRevert(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-500">Order Reference</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{order.orderReference}</p>
          {order.tableNumber != null && (
            <p className="text-sm text-gray-600 mt-1">
              Table <span className="font-semibold text-gray-900">{order.tableNumber}</span>
            </p>
          )}
        </div>

        <div className="mb-4">
          {order.status === 'pending' && (
            <span className="inline-block text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1">
              Pending
            </span>
          )}
          {order.status === 'preparing' && (
            <span className="inline-block text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-3 py-1">
              Preparing
            </span>
          )}
          {order.status === 'ready' && (
            <span className="inline-block text-sm font-medium bg-green-50 text-green-800 border border-green-200 rounded-full px-3 py-1">
              Ready
            </span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Items:</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              // Add-ons count once per drink, matching how the
              // order total was priced server-side
              const addOnTotal = item.addOns.reduce(
                (sum, a) => sum + a.price * a.quantity,
                0
              );
              const lineTotal = (Number(item.unitPrice) + addOnTotal) * item.quantity;

              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="font-semibold text-gray-900">₱{lineTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.size} · Qty: {item.quantity} × ₱{Number(item.unitPrice).toFixed(2)}
                  </p>
                  {item.addOns.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">Add-ons:</p>
                      {item.addOns.map((addon, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs bg-white border border-gray-200 rounded px-2 py-1"
                        >
                          <span>+ {addon.name} × {addon.quantity}</span>
                          <span className="font-mono">₱{(addon.price * addon.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Time:</span>
            <span className="text-gray-900">{getRelativeTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">₱{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Cash calculator: the barista keys in what the customer
            handed over and reads the change back before preparing.
            Nothing is stored -- the order record above is the receipt. */}
        <div className="mb-4">
          <ChangeCalculator total={Number(order.total)} />
        </div>

        <div className="space-y-2">
          {order.status === 'pending' && (
            <button
              onClick={() => handleUpdateStatus('preparing')}
              className="w-full text-sm font-medium bg-blue-50 border border-blue-200 text-blue-800 rounded-lg py-3 hover:bg-blue-100 active:scale-95 transition-transform"
            >
              Mark as Preparing
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => handleUpdateStatus('ready')}
              className="w-full text-sm font-medium bg-green-50 border border-green-200 text-green-800 rounded-lg py-3 hover:bg-green-100 active:scale-95 transition-transform"
            >
              Mark as Ready
            </button>
          )}

          {/* Ready means it's on the counter waiting to be collected. Completing it is
              what actually clears the order off the board, so it gets the
              prominent button and sits above the revert. */}
          {order.status === 'ready' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              className="w-full text-sm font-medium bg-green-600 text-white rounded-lg py-3 hover:bg-green-700 active:scale-95 transition-transform"
            >
              Mark as Completed
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => setConfirmingRevert(true)}
              className="w-full text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800 rounded-lg py-3 hover:bg-amber-100 active:scale-95 transition-transform"
            >
              Move Back to Preparing
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full text-sm font-medium bg-gray-100 text-gray-700 rounded-lg py-3 hover:bg-gray-200 active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>

      {/* Revert confirmation: a second overlay stacked above the detail card,
          so it reads as its own modal rather than part of the order card */}
      <ConfirmModal
        isOpen={confirmingRevert}
        title="Move Back to Preparing?"
        message={`Order #${order.orderReference} will go back to Preparing and be counted in the queue again.`}
        confirmLabel="Yes, Move It Back"
        tone="primary"
        delayMs={0}
        onCancel={() => setConfirmingRevert(false)}
        onConfirm={handleRevert}
      />
    </div>
  );
}

export default OrderDetailModal;