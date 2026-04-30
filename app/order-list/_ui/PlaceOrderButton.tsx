'use client'
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";
import { useBaristaStore } from "@/store/BaristaStore";

interface PlaceOrderButtonInt {
  grandtotal: number
}

function PlaceOrderButton({ grandtotal }: PlaceOrderButtonInt) {
  const router = useRouter();
  const { clearOrder } = useOrderStore();
  const currentId = 0;

  const handlePlaceOrder = () => {
    const referenceId = String(currentId).padStart(4,'0');
    router.push(`/order-confirmation?ref=${referenceId}&total=${grandtotal}`);
    clearOrder()
  };

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