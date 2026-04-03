'use client'

function AddToOrderButton({ totalPrice }: { totalPrice: number }) {
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