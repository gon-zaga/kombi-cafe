'use client'

// Sticky "Add to Cart" button with total price on the button
import { useOrderStore } from "@/store/OrderListStore";
import { useRouter } from "next/navigation";
import { Size } from "./SizeSelector";

type AddToOrderButtonProps = {
  itemId: number;
  itemName: string;
  itemImg: string;
  selectedSize: Size;
  selectedAddOn: number[];
  quantity: number;
  totalPrice: number;
  addOnsTotal: number;
  basePrice: number;
  disabled?: boolean;
};

function AddToOrderButton({
  itemId,
  itemName,
  itemImg,
  selectedSize,
  selectedAddOn,
  quantity,
  totalPrice,
  addOnsTotal,
  basePrice,
  disabled = false,
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
  };

  return (
    <div className="sticky bottom-0 w-full shadow-xl">
      <div className="bg-cream border-t-2 border-amber-300 px-5 py-3">
         <button
           className="bg-dark-brown w-full text-white flex items-center justify-between py-4 rounded-xl font-semibold text-lg hover:bg-dark-brown/90 transition-all shadow-lg hover:shadow-xl"
            onClick={() => {
              addToOrder(orderItem);
              router.push('/menu');
            }}
           disabled={disabled}
         >
          <span className="flex-1 text-center">Add to Cart</span>
          <span className="text-2xl font-extrabold text-amber-100 ml-4 pr-4">₱{totalPrice}</span>
        </button>
      </div>
    </div>
  );
}

export default AddToOrderButton;