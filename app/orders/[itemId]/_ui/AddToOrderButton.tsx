'use client'

import { useOrderStore } from "@/store/OrderListStore";
import { useRouter } from "next/navigation";
import { OrderItem } from "@/store/OrderListStore";
import { Size } from "./SizeSelector";
import { menuItems } from "@/app/lib/data";

type AddToOrderButtonProps = {
  itemId: number,
  itemName: string,
  itemImg: string,
  selectedSize: Size,
  selectedAddOn: number[], 
  quantity: number, 
  specialInstruction: string, 
  totalPrice: number,
}

function AddToOrderButton({itemId, itemName, itemImg, selectedSize, selectedAddOn, quantity, specialInstruction, totalPrice}: AddToOrderButtonProps) {

  const {orders, addToOrder} = useOrderStore(); 

  const orderItem = {
  itemId: itemId,
  itemName: itemName,
  itemImg: itemImg, 
  selectedSize: selectedSize,
  selectedAddOn: selectedAddOn,
  quantity: quantity,
  specialInstruction: specialInstruction,
  totalPrice: totalPrice
  }
  return (
    <div className="sticky bottom-0 w-full shadow-md">
      <div className="flex flex-col items-center px-4 py-2">

        {/* Price */}
        <span className="self-start font-semibold text-lg mb-1">
          ₱{totalPrice}
        </span>

        {/* Button */}
        <button
          className="bg-dark-brown w-full text-white 
          flex items-center justify-center 
          py-3 rounded-lg"
          
>
          Confirm Order
        </button>

      </div>
    </div>
  );
}

export default AddToOrderButton;