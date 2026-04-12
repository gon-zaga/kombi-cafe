'use client'
import { OrderItem } from "@/store/OrderListStore";
import { addOns } from "@/app/lib/data";
import { useOrderStore  } from '@/store/OrderListStore';
import Image from "next/image";



interface OrderCardProps {
  order: OrderItem
  addOns: typeof addOns
  onDelete: () => void
}


function OrderCard({order, addOns, onDelete}: OrderCardProps) {
  const selectedAddOns = addOns.filter((a) => order.selectedAddOn.includes(a.addOnsId));
  return(
    <section className="py-2 flex justify-center bg-card-cream"> 
      <div className="w-4/5 h-24 flex flex-row bg-cream items-center gap-2 p-2 rounded-2xl shadow-2xs">
      {/* Item Image */}
        <div>
          <Image 
            src={order.itemImg}
            alt={order.itemName}
            width={34}
            height={34}
          />
        </div>
      {/* Item Image */}

      {/* Item Name, price, size, quantity */}
       <div className="flex flex-col">
        <span>{order.itemName}</span> 
        <span>₱{order.selectedSize.price}, Size: {order.selectedSize.size}, Qty: {order.quantity}</span>
        <div>
        {selectedAddOns.map((addOn) => (
          <span key={addOn.addOnsId} className="text-xs">{addOn.name} </span>
        ))}
        </div>
       </div>
      {/* Item Name, price, size, quantity */}
      <div>
        <button onClick={onDelete}>
          <Image
            src="/delete-icon.svg"
            alt="delete-icon"
            width={28}
            height={28}
          />
        </button>
      </div>
      </div>
    </section>
  );
}

export default OrderCard
