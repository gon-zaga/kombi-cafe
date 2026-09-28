
'use client'

// useState is used to store the values entered in the form
import { useState } from "react";


// Props are information/functions that this component receives
interface AddingIngredientModalProps {
  // Controls whether the modal is visible
  isOpen: boolean

  // Function used to close the modal
  onClose: () => void

  // Function called after an ingredient is successfully added
  onAdded: () => void
}


// Component for adding a new ingredient
function AddingIngredientModal({
  isOpen,
  onClose,
  onAdded
}: AddingIngredientModalProps) {

  // Stores the ingredient name
  const [name, setName] = useState("");

  // Stores the unit of measurement
  // Example: g, ml, pcs, kg, L
  const [unit, setUnit] = useState("");

  // Stores the starting stock quantity
  const [stockQty, setStockQty] = useState("");

  // Stores the amount where the system should
  // warn that the ingredient needs to be restocked
  const [restockThreshold, setRestockThreshold] = useState("");

  // Tracks whether the ingredient is currently being added
  const [submitting, setSubmitting] = useState(false);

  // Stores an error message if something goes wrong
  const [error, setError] = useState("");


  // If the modal is not supposed to be open,
  // don't display anything.
  if (!isOpen) return null;


  // Clears all form fields
  const resetForm = () => {
    setName("");
    setUnit("");
    setStockQty("");
    setRestockThreshold("");
    setError("");
  };


  // Handles closing the modal
  const handleClose = () => {

    // Clear the form first
    resetForm();

    // Tell the parent component to close the modal
    onClose();
  };


  // Runs when the form is submitted
  const handleSubmit = async (e: React.FormEvent) => {

    // Prevent the browser from refreshing the page
    e.preventDefault();

    // Remove any previous error message
    setError("");


    // Make sure all required fields have values
    if (
      !name ||
      !unit ||
      stockQty === "" ||
      restockThreshold === ""
    ) {
      setError("Please fill in all fields.");
      return;
    }


    // Tell the UI that the form is currently being submitted
    setSubmitting(true);


    try {

      // Send the ingredient information to the backend API
      const response = await fetch('/api/ingredients', {

        // POST means we are creating a new ingredient
        method: 'POST',

        // Tell the server that we are sending JSON
        headers: {
          'Content-Type': 'application/json'
        },

        // Convert the JavaScript object into JSON
        body: JSON.stringify({

          // Ingredient name
          name,

          // Unit of measurement
          unit,

          // Convert the stock quantity from a string to a number
          stockQty: Number(stockQty),

          // Convert the threshold from a string to a number
          restockThreshold: Number(restockThreshold),
        }),
      });


      // response.ok is false when the server returns
      // an HTTP error status such as 400 or 500.
      if (!response.ok) {

        // Try to get the error message from the API
        const data = await response.json().catch(() => ({}));

        // Stop the process and show the error
        throw new Error(
          data.error || "Failed to add ingredient"
        );
      }


      // Tell the parent component that
      // the ingredient was successfully added.
      //
      // The parent can use this to refresh the ingredient list.
      onAdded();


      // Clear the form and close the modal
      handleClose();


    } catch (err) {

      // Show the error in the browser console
      console.error(err);

      // Display the error message in the modal
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add ingredient"
      );


    } finally {

      // Submission is finished.
      // Enable the button again.
      setSubmitting(false);
    }
  };


  // The modal's user interface
  return (
    <div

      // Creates the dark background behind the modal
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"

      // Clicking the dark background closes the modal
      onClick={handleClose}
    >

      <div

        // The actual white modal box
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"

        // Prevent clicking inside the modal
        // from triggering the outer onClick.
        //
        // Without this, clicking an input could
        // accidentally close the modal.
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">

          {/* Modal title */}
          <h2 className="text-xl font-bold text-gray-900">
            Add New Ingredient
          </h2>


          {/* X button used to close the modal */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>

        </div>


        {/* 
          Display an error message if the error state
          contains something.
        */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}


        {/* 
          Form for entering the ingredient information.

          When the form is submitted,
          handleSubmit() is called.
        */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >


          {/* ==============================
              INGREDIENT NAME
              ============================== */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredient Name
            </label>


            <input
              type="text"

              // Browser requires this field to have a value
              required

              // The input displays the current name state
              value={name}

              // Update name whenever the user types
              onChange={(e) => setName(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="e.g. Espresso Beans"
            />

          </div>


          {/* ==============================
              UNIT
              ============================== */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>


            <select

              // Field is required
              required

              // Current selected unit
              value={unit}

              // Update unit when the user selects an option
              onChange={(e) => setUnit(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >

              {/* Default option */}
              <option value="">
                Select unit
              </option>

              {/* Available units */}
              <option value="g">
                Grams (g)
              </option>

              <option value="ml">
                Milliliters (ml)
              </option>

              <option value="pcs">
                Pieces (pcs)
              </option>

              <option value="kg">
                Kilograms (kg)
              </option>

              <option value="L">
                Liters (L)
              </option>

            </select>

          </div>


          {/* ==============================
              INITIAL STOCK
              ============================== */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Stock Quantity
            </label>


            <input
              type="number"

              // Field is required
              required

              // Don't allow negative numbers
              min="0"

              // Allow decimal values
              // Example: 10.50
              step="0.01"

              // Current stock quantity
              value={stockQty}

              // Update stock quantity when user types
              onChange={(e) => setStockQty(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="0"
            />

          </div>


          {/* ==============================
              RESTOCK THRESHOLD
              ============================== */}
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restock Threshold
            </label>


            <input
              type="number"

              // Field is required
              required

              // Don't allow negative values
              min="0"

              // Allow decimal values
              step="0.01"

              // Current threshold value
              value={restockThreshold}

              // Update threshold when user types
              onChange={(e) =>
                setRestockThreshold(e.target.value)
              }

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="e.g. 500"
            />


            {/* Small explanation shown under the input */}
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below this amount
            </p>

          </div>


          {/* ==============================
              BUTTONS
              ============================== */}
          <div className="flex gap-2 pt-4">


            {/* Cancel button */}
            <button

              // type="button" prevents this button
              // from submitting the form
              type="button"

              // Close the modal
              onClick={handleClose}

              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>


            {/* Add Ingredient button */}
            <button

              // Submit the form
              type="submit"

              // Disable button while request is being processed
              disabled={submitting}

              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >

              {/* 
                Change the button text while submitting.

                submitting = true
                -> "Adding..."

                submitting = false
                -> "Add Ingredient"
              */}
              {submitting
                ? "Adding..."
                : "Add Ingredient"
              }

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// Export the component so other files can use it
export default AddingIngredientModal;
