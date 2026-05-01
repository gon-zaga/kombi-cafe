'use client'

import { Order } from "@/store/BaristaStore";
import { getRelativeTime } from "@/app/lib/utils";

interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
  onUpdateStatus: (id: number, status: 'pending' | 'preparing'| 'ready') => void
  onDelete: (id: number) => void
}

function OrderDetailModal({order, onClose, onUpdateStatus, onDelete}: OrderDetailModalProps){
  if(!order) return null;

  const handleUpdateStatus = (status: 'pending' | 'preparing' | 'ready') => {
    onUpdateStatus(order.id, status);
    onClose();
  };

  const handleDelete = () => {
    onDelete(order.id);
    onClose();
  };

  return (
    // BACKDROP
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* MODAL CONTENT */}
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Order Reference */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-500">Order Reference</p>
          <p className="text-2xl font-mono font-bold text-gray-900">{order.orderReference}</p>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {order.orderStatus === 'pending' && (
            <span className="inline-block text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1">
              Pending
            </span>
          )}
          {order.orderStatus === 'preparing' && (
            <span className="inline-block text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200 rounded-full px-3 py-1">
              Preparing
            </span>
          )}
          {order.orderStatus === 'ready' && (
            <span className="inline-block text-sm font-medium bg-green-50 text-green-800 border border-green-200 rounded-full px-3 py-1">
              Ready
            </span>
          )}
        </div>

        {/* Items List */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Items:</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="font-semibold text-gray-900">₱{item.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {item.size.size} ({item.}oz) · Qty: {item.quantity}
                </p>
                {item.addOns.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Add-ons:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.addOns.map((addon, i) => (
                        <span key={i} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5">
                          {addon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Time:</span>
            <span className="text-gray-900">{getRelativeTime(order.timestamp)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">₱{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {order.orderStatus === 'pending' && (
            <button
              onClick={() => handleUpdateStatus('preparing')}
              className="w-full text-sm font-medium bg-blue-50 border border-blue-200 text-blue-800 rounded-lg py-3 hover:bg-blue-100 active:scale-95 transition-transform"
            >
              Mark as Preparing
            </button>
          )}

          {order.orderStatus === 'preparing' && (
            <button
              onClick={() => handleUpdateStatus('ready')}
              className="w-full text-sm font-medium bg-green-50 border border-green-200 text-green-800 rounded-lg py-3 hover:bg-green-100 active:scale-95 transition-transform"
            >
              Mark as Ready
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full text-sm font-medium bg-red-50 border border-red-200 text-red-800 rounded-lg py-3 hover:bg-red-100 active:scale-95 transition-transform"
          >
            Delete Order
          </button>

          <button
            onClick={onClose}
            className="w-full text-sm font-medium bg-gray-100 text-gray-700 rounded-lg py-3 hover:bg-gray-200 active:scale-95 transition-transform"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal