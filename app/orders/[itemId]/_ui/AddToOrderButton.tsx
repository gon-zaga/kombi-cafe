'use client'

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
  specialInstruction: string, 

}       

function AddToOrderButton({itemId, itemName, itemImg, selectedSize, selectedAddOn, quantity, specialInstruction}: AddToOrderButtonProps) {

  const {addToOrder} = useOrderStore(); 
  const router = useRouter();

  const orderItem = {
  itemId: itemId,
  itemName: itemName,
  itemImg: itemImg, 
  selectedSize: selectedSize,
  selectedAddOn: selectedAddOn,
  quantity: quantity,
  specialInstruction: specialInstruction,
  }
  return (
    <div className="sticky bottom-0 w-full shadow-md">
      <div className="flex flex-col items-center px-4 py-2">

        
        {/* Button */}
        <button
          className="bg-dark-brown w-full text-white 
          flex items-center justify-center 
          py-3 rounded-lg"
          onClick={() => {
            addToOrder(orderItem);
            router.push('/');
          }}>
          Add to Cart
        </button>

      </div>
    </div>
  );
}

export default AddToOrderButton;