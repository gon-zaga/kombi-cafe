
'use client'

// React hooks
// useState = stores changing data
// useEffect = runs code when the component loads/changes
// useCallback = keeps a function from being recreated unnecessarily
import { useCallback, useEffect, useState } from "react";

// Header displayed at the top of the page
import OwnerHeader from "../ui/OwnerHeader";

// Modal used to add a new ingredient
import AddingIngredientModal from "./ui/AddingIngredientModal";


// Describes the structure of an ingredient
interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
}


// Main Inventory Management component
export default function Inventory() {

  // Controls whether the Add Ingredient modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stores all ingredients retrieved from the API
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Keeps track of whether the inventory is still loading
  const [loading, setLoading] = useState(true);


  // ==========================================
  // GET INGREDIENTS
  // ==========================================

  // Function that retrieves the ingredients from the backend
  const fetchIngredients = useCallback(async () => {

    try {

      // Send a GET request to the ingredients API
      const response = await fetch('/api/ingredients');

      // Convert the JSON response into JavaScript data
      const data: Ingredient[] = await response.json();

      // Store the ingredients in React state
      setIngredients(data);

    } catch (error) {

      // If something goes wrong, show the error
      // in the browser console
      console.error(
        "Failed to fetch ingredients:",
        error
      );

    } finally {

      // Loading is finished whether the request
      // succeeded or failed
      setLoading(false);
    }

  }, []);


  // Run fetchIngredients() when the page first loads
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);


  // ==========================================
  // RESTOCK INGREDIENT
  // ==========================================

  // Called when the user clicks the Restock button
  const handleRestock = async (ingredient: Ingredient) => {

    // Ask the user how much stock they want to add
    //
    // Example:
    // "Add how much g to Espresso Beans?"
    //
    // The second argument "0" is the default value.
    const input = window.prompt(
      `Add how much ${ingredient.unit} to ${ingredient.name}?`,
      "0"
    );


    // If the user cancels the prompt or gives no input,
    // stop the function.
    if (!input) return;


    // Convert the input from a string into a number
    const amount = Number(input);


    // Make sure the entered amount is a valid
    // positive number.
    //
    // Example:
    // 500 = valid
    // 0 = invalid
    // -10 = invalid
    // "hello" = invalid
    if (isNaN(amount) || amount <= 0) return;


    try {

      // Send the new stock amount to the backend
      //
      // Example:
      // PATCH /api/ingredients/5
      //
      // This means we are updating ingredient ID 5.
      await fetch(`/api/ingredients/${ingredient.id}`, {

        // PATCH is used to update an existing ingredient
        method: 'PATCH',

        // Tell the API that we are sending JSON
        headers: {
          'Content-Type': 'application/json'
        },

        // Add the entered amount to the existing stock
        //
        // Example:
        // Current stock = 5000
        // Restock amount = 1000
        //
        // New stock = 6000
        body: JSON.stringify({
          stockQty: ingredient.stockQty + amount
        }),
      });


      // Fetch the ingredients again so the screen
      // shows the updated stock quantity
      fetchIngredients();

    } catch (error) {

      // Display an error if the update fails
      console.error(
        "Failed to restock ingredient:",
        error
      );
    }
  };


  // ==========================================
  // DELETE INGREDIENT
  // ==========================================

  // Called when the user clicks Delete
  const handleDelete = async (ingredientId: number) => {

    try {

      // Send a DELETE request to the API
      //
      // Example:
      // DELETE /api/ingredients/5
      //
      // This deletes ingredient ID 5.
      await fetch(
        `/api/ingredients/${ingredientId}`,
        {
          method: 'DELETE'
        }
      );


      // Refresh the ingredient list
      // so the deleted ingredient disappears
      fetchIngredients();

    } catch (error) {

      // Show an error if deleting fails
      console.error(
        "Failed to delete ingredient:",
        error
      );
    }
  };


  // ==========================================
  // LOW STOCK COUNT
  // ==========================================

  // Count how many ingredients are at or below
  // their restock threshold.
  //
  // Example:
  //
  // Espresso:
  // stock = 500
  // threshold = 1000
  // -> LOW STOCK
  //
  // Milk:
  // stock = 3000
  // threshold = 1000
  // -> NOT LOW STOCK
  const lowStockCount = ingredients.filter(
    i => i.stockQty <= i.restockThreshold
  ).length;


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  // If the ingredients are still loading,
  // don't display the inventory yet.
  if (loading) {
    return (
      <p className="text-center py-10 text-dark-brown">
        Loading inventory...
      </p>
    );
  }


  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <section className="min-h-screen bg-cream">

      {/* Page header */}
      <OwnerHeader title="INVENTORY MANAGEMENT" />


      {/* ======================================
          ADD INGREDIENT BUTTON
          ====================================== */}

      <div className="px-4 mb-4">

        {/* 
          Clicking this button changes
          isModalOpen from false to true.

          That causes the Add Ingredient modal
          to appear.
        */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-dark-brown text-white py-3 rounded-lg font-medium hover:bg-dark-brown/90 transition-colors"
        >
          + Add Ingredient
        </button>

      </div>


      {/* ======================================
          LOW STOCK ALERT
          ====================================== */}

      {/* 
        Only show this section if there is
        at least one ingredient with low stock.
      */}
      {lowStockCount > 0 && (

        <div className="px-4 mb-4">

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">

            {/* Alert title */}
            <p className="text-sm font-semibold text-red-800 mb-1">
              ⚠️ Low Stock Alert
            </p>


            {/* 
              Show how many ingredients are low.

              If there is only 1:
              "1 ingredient below threshold"

              If there are multiple:
              "2 ingredients below threshold"
            */}
            <p className="text-xs text-red-600">
              {lowStockCount} ingredient
              {lowStockCount > 1 ? 's' : ''}
              {" "}below threshold
            </p>

          </div>

        </div>
      )}


      {/* ======================================
          INGREDIENT LIST
          ====================================== */}

      <div className="px-4 space-y-3">

        {/* 
          map() goes through every ingredient
          and creates an ingredient card.
        */}
        {ingredients.map((ingredient) => {

          // Check whether this ingredient is low stock
          const isLowStock =
            ingredient.stockQty <=
            ingredient.restockThreshold;


          // Return the card for this ingredient
          return (

            <div
              // React needs a unique key for every item
              key={ingredient.id}

              // If the ingredient is low stock,
              // add a red border around the card.
              className={`bg-white rounded-lg p-4 shadow ${
                isLowStock
                  ? 'border-2 border-red-300'
                  : ''
              }`}
            >


              {/* ==================================
                  INGREDIENT NAME
                  ================================== */}

              <div className="flex items-start justify-between mb-2">

                <div className="flex-1">

                  {/* Ingredient name */}
                  <h3 className="font-semibold text-gray-900">
                    {ingredient.name}
                  </h3>


                  {/* Unit of measurement */}
                  <p className="text-sm text-gray-500">
                    Unit: {ingredient.unit}
                  </p>

                </div>


                {/* 
                  Show "Low Stock" badge only
                  when stock is low.
                */}
                {isLowStock && (

                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                    Low Stock
                  </span>

                )}

              </div>


              {/* ==================================
                  STOCK INFORMATION
                  ================================== */}

              <div className="mb-3">

                {/* Current stock */}
                <div className="flex justify-between text-sm mb-1">

                  <span className="text-gray-600">
                    Current Stock
                  </span>

                  <span className="font-semibold text-gray-900">
                    {ingredient.stockQty} {ingredient.unit}
                  </span>

                </div>


                {/* Restock threshold */}
                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">
                    Restock Threshold
                  </span>

                  <span className="text-gray-700">
                    {ingredient.restockThreshold} {ingredient.unit}
                  </span>

                </div>

              </div>


              {/* ==================================
                  STOCK PROGRESS BAR
                  ================================== */}

              <div className="mb-3">

                {/* Background of the progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">

                  {/* 
                    The inner div represents
                    the current stock level.

                    Math.min(..., 100) makes sure
                    the width cannot go above 100%.
                  */}
                  <div
                    className={`h-2 rounded-full ${
                      isLowStock
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}

                    style={{
                      width: `${
                        Math.min(
                          (
                            ingredient.stockQty /
                            (ingredient.restockThreshold * 2)
                          ) * 100,
                          100
                        )
                      }%`
                    }}
                  />

                </div>

              </div>


              {/* ==================================
                  ACTION BUTTONS
                  ================================== */}

              <div className="flex gap-2">

                {/* RESTOCK BUTTON */}
                <button
                  onClick={() =>
                    handleRestock(ingredient)
                  }
                  className="flex-1 text-sm font-medium text-blue-700 bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Restock
                </button>


                {/* DELETE BUTTON */}
                <button
                  onClick={() =>
                    handleDelete(ingredient.id)
                  }
                  className="text-sm font-medium text-red-700 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>

              </div>

            </div>
          );
        })}

      </div>


      {/* ======================================
          ADD INGREDIENT MODAL
          ====================================== */}

      {/* 
        The modal receives three things:

        isOpen:
        Controls whether the modal is visible.

        onClose:
        Closes the modal.

        onAdded:
        Runs fetchIngredients() after an ingredient
        is successfully added.
      */}
      <AddingIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchIngredients}
      />

    </section>
  );
}

