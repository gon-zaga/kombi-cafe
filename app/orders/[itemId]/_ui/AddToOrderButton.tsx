'use client'

// Sticky "Add to Cart" / "Done Editing" button with total price on the button
import { useOrderStore } from "@/store/OrderListStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Size } from "./SizeSelector";
import SimpleConfirmModal from "@/app/ui/SimpleConfirmModal";

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
  isEditing?: boolean;
  originalOrderKey?: string | null;
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
  isEditing = false,
  originalOrderKey = null,
}: AddToOrderButtonProps) {
  const { addToOrder, updateOrder } = useOrderStore();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const orderItem = {
    itemId,
    itemName,
    itemImg,
    selectedSize,
    selectedAddOn,
    quantity,
  };

  const handleAction = () => {
    if (isEditing) {
      setShowConfirm(true);
    } else {
      addToOrder(orderItem);
      router.push('/menu');
    }
  };

  const handleConfirm = () => {
    if (isEditing && originalOrderKey) {
      updateOrder(originalOrderKey, orderItem);
    }
    setShowConfirm(false);
    router.push('/order-list');
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const buttonText = isEditing ? "Done Editing" : "Add to Cart";

  return (
    <div className="sticky bottom-0 w-full shadow-xl">
      <div className="bg-cream border-t-2 border-amber-300 px-5 py-3">
        <button
          className="bg-dark-brown w-full text-white flex items-center justify-between py-4 rounded-xl font-semibold text-lg hover:bg-dark-brown/90 transition-all shadow-lg hover:shadow-xl"
          onClick={handleAction}
          disabled={disabled}
        >
          <span className="flex-1 text-center">{buttonText}</span>
          <span className="text-2xl font-extrabold text-amber-100 ml-4 pr-4">₱{totalPrice}</span>
        </button>
      </div>

      <SimpleConfirmModal
        isOpen={showConfirm}
        title="Confirm Edit"
        message="Save changes to this order?"
        confirmText="Save Changes"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default AddToOrderButton;