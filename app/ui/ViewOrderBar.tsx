'use client'

// Sticky bar on the menu: jump to the cart with a live item count
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
    <div className="flex flex-row items justify-center sticky bottom-0 my-2.5">
      <button
        className="text-white p-2 w-3xs flex flex-row justify-center border rounded-2xl bg-dark-brown"
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