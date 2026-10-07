'use client'

// One row in the cart, using real add-on names from the fetched addOns list
import { OrderItem } from "@/store/OrderListStore";
import type { AddOn } from "@/app/api/add-ons/route"
import Image from "next/image";
import ItemImage from "@/app/ui/ItemImage";
import { useRouter } from "next/navigation";

interface OrderCardProps {
  order: OrderItem;
  addOns: AddOn[];
  onDelete: () => void;
}

function OrderCard({ order, addOns, onDelete }: OrderCardProps) {
  const router = useRouter();
  const selectedAddOns = addOns.filter((a) =>
    order.selectedAddOn.includes(a.addOnsId)
  );

  const handleEdit = () => {
    const params = new URLSearchParams({
      sizeId: String(order.selectedSize.sizeId),
      addOns: order.selectedAddOn.join(','),
      qty: String(order.quantity),
    });
    router.push(`/orders/${order.itemId}?${params.toString()}`);
  };

  const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const lineTotal = (order.selectedSize.price + addOnTotal) * order.quantity;

  return (
    <div className="flex items-center gap-4 bg-white border-2 border-amber-200 rounded-2xl p-4 my-4 shadow-lg hover:shadow-xl transition-shadow">
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-amber-50">
        <ItemImage
          src={order.itemImg}
          alt={order.itemName}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 gap-1">
        <p className="text-base font-semibold text-dark-brown leading-tight">
          {order.itemName}
        </p>

        <p className="text-sm text-gray-600 mt-1">
          {order.selectedSize.size} · <strong className="text-dark-brown">₱{order.selectedSize.price}</strong>
        </p>

        {selectedAddOns.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedAddOns.map((addOn) => (
              <span
                key={addOn.addOnsId}
                className="text-xs bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-3 py-1 font-medium"
              >
                + {addOn.name} (₱{addOn.price})
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-lg px-4 py-1.5">
            Qty: {order.quantity}
          </span>
          <span className="text-lg font-extrabold text-amber-700">₱{lineTotal}</span>
        </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <button
          onClick={handleEdit}
          aria-label="Edit item"
          className="w-24 h-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-semibold text-sm border-2 border-amber-300 hover:bg-amber-200 hover:border-amber-400 hover:shadow-md transition-all"
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          aria-label="Remove item"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-md transition-all"
        >
          <Image
            src="/delete-icon.svg"
            alt="delete"
            width={20}
            height={20}
          />
        </button>
      </div>
    </div>
  );
}

export default OrderCard;