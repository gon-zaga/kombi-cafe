'use client'

import { Order } from "@/store/BaristaStore";


interface OrderDetailModalProps  {
  order: Order | null
  onClose: () => void
  onUpdateStatus: (id: number, status: 'pending' | 'preparing'| 'ready') => void
  onDelete: (id: number) => void
};  

function   OrderDetailModal({order, onClose, onUpdateStatus, onDelete}: OrderDetailModalProps){
  if(!order) return null;

 return (
    // BACKDROP
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* MODAL CONTENT */}
      <div
        className="bg-white w-[400px] rounded-xl shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Order Details</h2>

        <p><strong>Status:</strong> {order.orderStatus}</p>

        <div className="mt-3">
          <strong>Items:</strong>
          <ul className="list-disc ml-5">
            {order.items.map((item, index) => (
              <li key={index}>{item.name}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


export default OrderDetailModal