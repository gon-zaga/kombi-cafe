'use client'

// One row in the cart, using real add-on names from the fetched addOns list
import { OrderItem } from "@/store/OrderListStore";
import type { AddOn } from "@/app/api/add-ons/route"
import Image from "next/image";

interface OrderCardProps {
  order: OrderItem;
  addOns: AddOn[];
  onDelete: () => void;
}

function OrderCard({ order, addOns, onDelete }: OrderCardProps) {
  const selectedAddOns = addOns.filter((a) =>
    order.selectedAddOn.includes(a.addOnsId)
  );

  return (
    <div className="flex items-start gap-3 bg-cream border-stone-200 rounded-2xl p-3 my-4 shadow-sm">
      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-stone-100">
        <Image
          src={order.itemImg}
          alt={order.itemName}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 gap-1">
        <p className="text-sm font-medium text-stone-800 leading-tight">
          {order.itemName}
        </p>

        <p className="text-xs text-stone-500 mt-0.5">
          {order.selectedSize.size} · <strong>₱{order.selectedSize.price}</strong>
        </p>

        {selectedAddOns.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedAddOns.map((addOn) => (
              <span
                key={addOn.addOnsId}
                className="text-[11px] bg-stone-100 text-stone-500 border border-stone-200 rounded-full px-2 py-0.5"
              >
                {addOn.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200 rounded-md px-2.5 py-0.5">
            Qty {order.quantity}
          </span>
        </div>
      </div>

      <button
        onClick={onDelete}
        aria-label="Remove item"
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 hover:bg-red-50 hover:border-red-200 transition-colors"
      >
        <Image
          src="/delete-icon.svg"
          alt="delete"
          width={42}
          height={42}
        />
      </button>
    </div>
  );
}

export default OrderCard;