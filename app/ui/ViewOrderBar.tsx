
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/OrderListStore";

function ViewOrderBar () {
  const {orders} = useOrderStore();
  const router = useRouter();
  const totalOrders = orders.reduce((acc, orders) =>  acc + orders.quantity, 0 );
  return(
      <div className="flex flex-row items justify-center sticky bottom-0 my-2.5">
        <button className=" text-white p-2 w-3xs flex flex-row justify-center border rounded-2xl bg-dark-brown" onClick={
          () => {router.push('\order-list')} }>
          VIEW ORDER
          <div className="h-auto flex border-l border-white mx-2.5 shrink-0"></div>
          {totalOrders}
        </button>
      </div>
  );
}

export default ViewOrderBar