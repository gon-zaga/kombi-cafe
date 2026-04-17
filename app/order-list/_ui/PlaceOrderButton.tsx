'use client'
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";

interface PlaceOrderButtonInt {
  grandtotal: number
}

function PlaceOrderButton({ grandtotal }: PlaceOrderButtonInt) {
  const router = useRouter();
  const { clearOrder } = useOrderStore();

  const handlePlaceOrder = () => {
    const referenceId = `KMB-${Date.now().toString(36).toUpperCase()}`
    router.push(`/order-confirmation?ref=${referenceId}&total=${grandtotal}`)
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