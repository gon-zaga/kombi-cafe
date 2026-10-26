'use client'

// Floating bar at the bottom of the viewport: jump to the cart with a live item count.
// Fixed (not sticky) so it follows the scroll in both directions; the page adds
// pb-24 in app/page.tsx so the last menu item isn't hidden behind it.
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";
import { useTableStore } from "@/store/TableStore";

function ViewOrderBar() {
  const { orders } = useOrderStore();
  const { selectedTable } = useTableStore();
  const router = useRouter();
  const totalOrders = orders.reduce((acc, order) => acc + order.quantity, 0);

  const handleClick = () => {
    // If no table is selected, send user back to table selection
    if (selectedTable === null) {
      router.push('/table-select');
      return;
    }
    router.push('/order-list');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 safe-bottom pointer-events-none">
      <button
        className="pointer-events-auto text-white px-6 py-3 rounded-2xl bg-dark-brown font-medium text-sm min-h-[48px] min-w-[140px] flex items-center justify-center gap-2 shadow-lg"
        onClick={handleClick}
      >
        <span>VIEW ORDER</span>
        <div className="h-6 w-px bg-white/30"></div>
        <span className="font-bold">{totalOrders}</span>
      </button>
    </div>
  );
}

export default ViewOrderBar;