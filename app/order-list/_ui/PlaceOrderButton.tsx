
// Sends the cart to POST /api/orders using IDs only.
// The server calculates the actual prices and total.
// After a successful order, the user is sent to the confirmation page.

'use client'

// useState is used to store whether the order is being submitted
// and to store any error message.
import { useState } from "react";

// useRouter lets us navigate to another page using JavaScript.
import { useRouter } from "next/navigation";

// Get the order data and functions from the Zustand order store.
import { useOrderStore } from "@/store/OrderListStore";

function PlaceOrderButton({ grandtotal }: { grandtotal: number }) {

  // Create the router so we can navigate after placing the order.
  const router = useRouter();

  // Get the current items in the cart.
  const orders = useOrderStore(state => state.orders);

  // Get the function that clears the cart.
  const clearOrder = useOrderStore(state => state.clearOrder);

  // Keeps track of whether the order is currently being submitted.
  // It starts as false because the user has not clicked the button yet.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stores an error message if placing the order fails.
  const [error, setError] = useState("");

  // This function runs when the user clicks "Place Order".
  const handlePlaceOrder = async () => {

    // Disable the button and show "Placing Order..."
    // while the request is being processed.
    setIsSubmitting(true);

    // Clear any previous error message.
    setError("");

    try {

      // Send the cart data to the orders API.
      const res = await fetch('/api/orders', {
        method: 'POST',

        // Tell the server that we are sending JSON.
        headers: { 'Content-Type': 'application/json' },

        // Convert the cart information into JSON.
        body: JSON.stringify({

          // Send every cart item to the server.
          items: orders.map(o => ({

            // ID of the menu item.
            itemId: o.itemId,

            // ID of the selected size.
            sizeId: o.selectedSize.sizeId,

            // Number of this item being ordered.
            quantity: o.quantity,

            // IDs of the selected add-ons.
            // The actual add-on prices are NOT sent.
            addOnIds: o.selectedAddOn,
          })),

        }),
      });

      // Read the JSON response sent back by the API.
      const data = await res.json();

      // If the server returned an error status,
      // create an error using the server's error message.
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // The server successfully created the order.
      // Use the reference number and total calculated by the server
      // to build the confirmation page URL.
      router.push(
        `/order-confirmation?ref=${data.orderReference}&total=${data.total}`
      );

      // Clear the cart after navigation starts.
      // This prevents the empty-cart screen from appearing
      // briefly before the confirmation page loads.
      clearOrder();

    } catch (err) {

      // If something went wrong, show the error message.
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order"
      );

      // Allow the user to click the button again and retry.
      // The cart is NOT cleared because the order failed.
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4">

      {/* Show the error message only when an error exists. */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-2">
          {error}
        </div>
      )}

      {/* Button that starts the order submission. */}
      <button
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
        className="w-full bg-amber-800 text-white text-lg font-semibold py-4 rounded-2xl active:opacity-80 disabled:opacity-50"
      >

        {/* Change the button text while the order is being submitted. */}
        {isSubmitting
          ? "Placing Order..."
          : `Place Order · ₱${grandtotal.toFixed(2)}`}
      </button>

    </div>
  );
}

export default PlaceOrderButton

