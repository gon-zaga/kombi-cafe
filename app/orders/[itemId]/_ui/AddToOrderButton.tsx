'use client'

// Sticky "Add to Cart" button: builds one OrderItem and pushes it into the Zustand cart
import { useOrderStore } from "@/store/OrderListStore";
import { useRouter } from "next/navigation";
import { Size } from "./SizeSelector";

type AddToOrderButtonProps = {
  itemId: number,
  itemName: string,
  itemImg: string,
  selectedSize: Size,
  selectedAddOn: number[],
  quantity: number,
}

function AddToOrderButton({
  itemId,
  itemName,
  itemImg,
  selectedSize,
  selectedAddOn,
  quantity,
}: AddToOrderButtonProps) {
  const { addToOrder } = useOrderStore();
  const router = useRouter();

  const orderItem = {
    itemId,
    itemName,
    itemImg,
    selectedSize,
    selectedAddOn,
    quantity,
  }

  return (
    <div className="sticky bottom-0 w-full shadow-md">
      <div className="flex flex-col items-center px-4 py-2">
        <button
          className="bg-dark-brown w-full text-white flex items-center justify-center py-3 rounded-lg"
          onClick={() => {
            addToOrder(orderItem);
            router.push('/');
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default AddToOrderButton;