
// This tells Next.js that this component runs in the browser
'use client'

import { useEffect, useState } from "react";
import ImagePicker from "@/app/ui/ImagePicker";
import IngredientPicker from "./IngredientPicker";
import { useToast } from "@/app/ui/Toast";


// Describes what a Category object looks like
interface Category {
  id: number;
  name: string;
}


// Describes what a SizeOption object looks like
interface SizeOption {
  id: number;
  label: string;
  oz: number | null;
  temperature: string | null;
}

// Describes what an IngredientOption object looks like
interface IngredientOption {
  id: number;
  name: string;
  unit: string;
}


// Describes the props that this component receives
interface AddItemModalProps {
  isOpen: boolean;       // Whether the modal is visible
  onClose: () => void;   // Function to close the modal
  onCreated: () => void; // Function called after an item is created
}


// Main component for the Add Item modal
function AddItemModal({ isOpen, onClose, onCreated }: AddItemModalProps) {

  // Stores the list of categories loaded from the database
  const [categories, setCategories] = useState<Category[]>([]);

  // Stores the available sizes loaded from the database
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);


  // Stores the value entered in the Item Name field
  const [name, setName] = useState("");

  // Stores the selected category ID
  const [categoryId, setCategoryId] = useState("");

  // Stores the image URL entered by the user
  const [imageUrl, setImageUrl] = useState("");

   // Stores whether the item is available for ordering
   const [isAvailable, setIsAvailable] = useState(true);


   // Stores which sizes have been selected
   // Example: { 1: true, 2: false, 3: true }
   const [selectedSizes, setSelectedSizes] =
     useState<Record<number, boolean>>({});


   // Stores the price for each selected size
   // Example: { 1: "80", 2: "90", 3: "100" }
   const [prices, setPrices] =
     useState<Record<number, string>>({});


   // Tracks whether the form is currently being submitted
   const [submitting, setSubmitting] = useState(false);

   // Stores the list of ingredients loaded from the database
   const [ingredients, setIngredients] = useState<IngredientOption[]>([]);

   // Stores the recipe rows being built for this new item
   // Each row: ingredientId, quantityNeeded, sizeId (null for all sizes)
   const [recipeRows, setRecipeRows] = useState<Array<{ ingredientId: number; quantityNeeded: number; sizeId: number | null }>>([]);

    // The row currently being filled in
    const [tempIngredientId, setTempIngredientId] = useState("");
    const [tempQuantity, setTempQuantity] = useState("");
    const [tempSizeId, setTempSizeId] = useState("");

    // Controls whether the ingredient creation modal is open
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    // Function that loads categories, sizes, and ingredients
    async function loadOptions() {
      try {

        // Request categories, sizes, and ingredients at the same time
        const [catRes, sizeRes, ingredientRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/sizes'),
          fetch('/api/ingredients'),
        ]);


        // Convert the responses into JSON
        // Then store them in React state
        setCategories(await catRes.json());
        setSizeOptions(await sizeRes.json());
        setIngredients(await ingredientRes.json());


      } catch (err) {

        // Show an error in the browser console if loading fails
        console.error("Failed to load category/size/ingredient options:", err);
      }
    }



   // "Regular" size (oz === null && temperature === null) is for snacks only.
   // Default to drink mode (Regular disabled). Auto-toggle based on category.
   const [isDrink, setIsDrink] = useState(true);


  // useEffect runs when the component opens
  useEffect(() => {




     // Don't load the options if the modal isn't open
     if (!isOpen) return;




    // Run the function
    loadOptions();

  // Run this effect whenever isOpen changes
  }, [isOpen]);

  // Auto-update isDrink when category changes: Regular size only for snacks
  useEffect(() => {
    if (!categoryId) return;
    const cat = categories.find(c => c.id === Number(categoryId));
    if (cat) {
      const isSnackCategory = cat.name.toLowerCase().includes('snack');
      setIsDrink(!isSnackCategory);
    }
  }, [categoryId, categories]);


  // If the modal isn't open, don't display anything
  if (!isOpen) return null;


  // Reset all form fields back to their default values
  const resetForm = () => {
    setName("");
    setCategoryId("");
    setImageUrl("");
    setIsAvailable(true);
    setSelectedSizes({});
    setPrices({});
  };


  // Close the modal and reset the form
  const handleClose = () => {
    resetForm();
    onClose();
  };


  // Select or unselect a size
  const toggleSize = (sizeId: number) => {

    // Keep the previous selected sizes
    // and change the selected state of this size
    setSelectedSizes(prev => ({
      ...prev,
      [sizeId]: !prev[sizeId]
    }));
  };


  // Runs when the Add Item form is submitted
  const handleSubmit = async (e: React.FormEvent) => {

    // Prevent the browser from refreshing the page
    e.preventDefault();


    // Create the list of selected sizes and their prices
    const sizes = sizeOptions
      .filter(s => selectedSizes[s.id])
      .map(s => ({
        sizeId: s.id,
        price: Number(prices[s.id] || 0)
      }));


     // Check if the required information was provided
     if (!name || !categoryId || !imageUrl || sizes.length === 0) {
       showError(
         "Please fill in the item name, category, image, and at least one size with a price."
       );
       return;
     }


    // Tell the UI that the form is being submitted
    setSubmitting(true);


    try {

      // Send the menu item data to the backend API
      const response = await fetch('/api/menu', {

        // Use POST because we are creating a new item
        method: 'POST',

        // Tell the server that we're sending JSON
        headers: {
          'Content-Type': 'application/json'
        },

        // Convert the form data into JSON
         body: JSON.stringify({
           name,

           // Convert categoryId from a string to a number
           categoryId: Number(categoryId),

           // If there is no image URL, send undefined
           imageUrl: imageUrl || undefined,

           isAvailable,

           // Send the selected sizes and prices
           sizes,
           recipes: recipeRows.map(row => ({
             ingredientId: row.ingredientId,
             quantityNeeded: row.quantityNeeded,
             sizeId: row.sizeId,
           })),
         }),
      });


      // Check if the server returned an error
      if (!response.ok) {

        // Try to get the error message from the server
        const data = await response.json().catch(() => ({}));

        // Stop and go to the catch block
        throw new Error(
          data.error || "Failed to create item"
        );
      }


      // Tell the parent component that an item was created
      onCreated();

      // Show success toast
      success("Menu item created successfully!");

      // Close the modal after successful creation
      handleClose();


    } catch (err) {

      // Show the error in the browser console
      console.error(err);

      // Display the error message to the user
      showError(
        err instanceof Error
          ? err.message
          : "Failed to create item"
      );


    } finally {

      // Allow the form to be submitted again
      setSubmitting(false);
    }
  };


  // The visual part of the component
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"

      // Clicking outside the modal closes it
      onClick={handleClose}
    >

      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"

        // Prevent clicking inside the modal from closing it
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal header */}
        <div className="flex items-center justify-between mb-4">

          <h2 className="text-xl font-bold text-gray-900">
            Add New Item
          </h2>

          {/* X button */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Main form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>

            <input
              type="text"
              required

              // Show the current name value
              value={name}

              // Update name when the user types
              onChange={(e) => setName(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="e.g. Kombi Latte"
            />
          </div>


          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>

            <select
              required

              // Show the currently selected category
              value={categoryId}

              // Update category when the user selects one
              onChange={(e) => setCategoryId(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >

              <option value="">
                Select a category
              </option>

              {/* Create an option for every category */}
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}

            </select>
          </div>


          {/* File picker + pasted path. Whichever is used, the value is a
              string stored in menu_items.image_url. */}
          <ImagePicker label="Image" value={imageUrl} onChange={setImageUrl} itemName={name} />


          {/* Sizes and Prices */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Sizes & Prices
            </label>

            <div className="space-y-2">

              {/* Create a row for every available size */}
              {sizeOptions.map((s) => {
                const isRegular = s.oz === null && s.temperature === null;
                const isDrinkSize = s.oz !== null;
                // Snacks: only Regular enabled. Drinks: only drink sizes enabled.
                const disabled = isDrink ? isRegular : isDrinkSize;

                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedSizes[s.id]}
                      onChange={() => !disabled && toggleSize(s.id)}
                      disabled={disabled}
                      className={`w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 ${
                        disabled ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    />

                    <span className="text-sm text-gray-700 w-32">
                      {s.label}
                      {s.oz ? ` (${s.oz}oz ${s.temperature ?? ''})` : ''}
                      {disabled && (isDrink ? " (drinks only)" : " (snacks only)")}
                    </span>

                    {selectedSizes[s.id] && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[s.id] ?? ''}
                        onChange={(e) =>
                          setPrices(prev => ({ ...prev, [s.id]: e.target.value }))
                        }
                        placeholder="Price"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                  </div>
                );
              })}

            </div>
          </div>

           {/* Ingredients (at least one required) */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Ingredients
             </label>
             <div className="space-y-2">
               {recipeRows.length === 0 ? (
                 <p className="text-xs text-gray-500">
                   No ingredients added yet. Please add at least one ingredient.
                 </p>
               ) : (
                 <ul className="space-y-1">
                   {recipeRows.map((row) => {
                     const ingredient = ingredients.find(i => i.id === row.ingredientId);
                     const sizeLabel = row.sizeId === null ? 'All sizes' : sizeOptions.find(s => s.id === row.sizeId)?.label ?? `Size #${row.sizeId}`;
                     return (
                       <li key={`${row.ingredientId}-${row.sizeId}`} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                         <div className="min-w-0">
                           <span className="text-sm text-gray-900 font-medium">
                             {ingredient?.name ?? 'Unknown'}
                           </span>
                           <span className="text-sm text-gray-600">
                             {' '}
                             — {row.quantityNeeded} {ingredient?.unit ?? ''}
                           </span>
                           <span className="block text-xs text-gray-500">
                             {sizeLabel}
                           </span>
       </div>
       <AddingIngredientModal
         isOpen={isIngredientModalOpen}
         onClose={() => setIsIngredientModalOpen(false)}
         onAdded={loadOptions}
       />
                         <button
                           onClick={() => {
                             setRecipeRows(prev => prev.filter(r => !(r.ingredientId === row.ingredientId && r.sizeId === row.sizeId)));
                           }}
                           className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors shrink-0"
                         >
                           Remove
                         </button>
                       </li>
                     );
                   })}
                 </ul>
               )}
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <label className="block text-sm font-semibold text-gray-900">
                   Add Ingredient
                 </label>
                 <button
                   type="button"
                   onClick={() => setIsIngredientModalOpen(true)}
                   className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                 >
                   + New Ingredient
                 </button>
               </div>

               <IngredientPicker
                 ingredients={ingredients}
                 value={tempIngredientId}
                 onChange={setTempIngredientId}
               />

               <div className="flex gap-2">
                 <input
                   type="number"
                   min="0"
                   step="0.01"
                   value={tempQuantity}
                   onChange={(e) => setTempQuantity(e.target.value)}
                   placeholder="Quantity"
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                 />

                 <select
                   value={tempSizeId}
                   onChange={(e) => setTempSizeId(e.target.value)}
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                 >
                   <option value="">All sizes</option>
                   {sizeOptions.map((s) => (
                     <option key={s.id} value={s.id}>
                       {s.label} only
                     </option>
                   ))}
                 </select>
               </div>

               <button
                 onClick={() => {
                   // Validate and add the row
                   const ingredientIdNum = Number(tempIngredientId);
                   const quantityNum = Number(tempQuantity);
                   const sizeIdValue = tempSizeId === '' || tempSizeId === null ? null : Number(tempSizeId);
                   if (!ingredientIdNum || isNaN(ingredientIdNum) || quantityNum <= 0 || isNaN(quantityNum)) {
                     // Should not happen if we disable button, but just in case
                     return;
                   }
                   setRecipeRows(prev => [
                     ...prev,
                     { ingredientId: ingredientIdNum, quantityNeeded: quantityNum, sizeId: sizeIdValue }
                   ]);
                   // Reset temporary form
                   setTempIngredientId('');
                   setTempQuantity('');
                   setTempSizeId('');
                 }}
                 disabled={tempIngredientId === '' || tempQuantity === '' || Number(tempQuantity) <= 0}
                 className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
               >
                 {tempIngredientId === '' || tempQuantity === '' || Number(tempQuantity) <= 0 ? 'Adding...' : 'Add to Recipe'}
               </button>
             </div>
           </div>
          {/* Available for ordering checkbox */}
          <div>
            <label className="flex items-center">

              <input
                type="checkbox"

                // Checked if the item is available
                checked={isAvailable}

                // Update availability when clicked
                onChange={(e) =>
                  setIsAvailable(e.target.checked)
                }

                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />

              <span className="ml-2 text-sm text-gray-700">
                Available for ordering
              </span>

            </label>
          </div>


          {/* Cancel and Add Item buttons */}
          <div className="flex gap-2 pt-4">

            {/* Cancel button */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>


            {/* Submit button */}
            <button
              type="submit"

              // Disable the button while submitting
              disabled={submitting}

              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >

              {/* Change button text while submitting */}
              {submitting
                ? "Adding..."
                : "Add Item"}

            </button>

          </div>

        </form>
      </div>
    </div>
  );
}


// Make this component available for other files to import
export default AddItemModal;

