'use client'
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";
import { useBaristaStore } from "@/store/BaristaStore";
import { addOns } from "@/app/lib/data";
import { useState } from "react";

interface PlaceOrderButtonInt {
  grandtotal: number
}

function PlaceOrderButton({ grandtotal }: PlaceOrderButtonInt) {
  const router = useRouter();
  const { clearOrder } = useOrderStore();
  const currentId = 0;
  const [date] = useState(() => Date.now());

  const handlePlaceOrder = () => {
    const referenceId = String(currentId).padStart(4,'0');
    const transformedItems = order.map(order => ({
      name: order.itemName,
      size: order.selectedSize,
      addOns: addOns.filter(addon => order.selectedAddOn.includes(addon.addOnsId)).map(addon => addon.name),
      quantity: order.quantity,
      price: order.selectedSize.price
      }))
     const newOrder = {
      id: date,
      orderReference: referenceId,
      items: transformedItems,
      orderStatus: 'pending' as const,
      timestamp: new Date(),
      totalPrice: grandtotal
    }

    addOrder(newOrder)
    router.push(`/order-confirmation?ref=${referenceId}&total=${grandtotal}`);
    clearOrder()
  };

  const order = useOrderStore(state => state.orders);
  const addOrder = useBaristaStore(state => state.addOrder);


  return (
    <button
      onClick={handlePlaceOrder}  
      className="w-full bg-amber-800 text-white text-lg font-semibold py-4 rounded-2xl active:opacity-80"
    >
      Place Order · ₱{grandtotal.toFixed(2)}
    </button>
  );
}

export default PlaceOrderButton