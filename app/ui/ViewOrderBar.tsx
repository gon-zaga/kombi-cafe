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
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none">
      <button
        className="pointer-events-auto text-white p-2 w-3xs flex flex-row justify-center border rounded-2xl bg-dark-brown"
        onClick={handleClick}
      >
        VIEW ORDER
        <div className="h-auto flex border-l border-white mx-2.5 shrink-0"></div>
        {totalOrders}
      </button>
    </div>
  );
}

export default ViewOrderBar;