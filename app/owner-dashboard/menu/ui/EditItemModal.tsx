
'use client'

// React hooks
import { useEffect, useState } from "react";

// Import the MenuItem type
import type { MenuItem } from "@/app/lib/types";


// Structure of a category
interface Category {
  id: number;
  name: string;
}


// Structure of a size option
interface SizeOption {
  id: number;
  label: string;
  oz: number | null;
  temperature: string | null;
}


// Props received by this component
interface EditItemModalProps {
  isOpen: boolean;          // Is the modal open?
  onClose: () => void;      // Function to close modal
  item: MenuItem | null;    // Item being edited
  onUpdated: () => void;    // Function after successful update
}


// Edit menu item modal
function EditItemModal({
  isOpen,
  onClose,
  item,
  onUpdated
}: EditItemModalProps) {

  // Store categories from the API
  const [categories, setCategories] = useState<Category[]>([]);

  // Store available sizes from the API
  const [sizeOptions, setSizeOptions] = useState<SizeOption[]>([]);

  // Store form values
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // Stores which sizes are selected
  // Example: { 1: true, 2: false }
  const [selectedSizes, setSelectedSizes] =
    useState<Record<number, boolean>>({});

  // Stores prices for each size
  const [prices, setPrices] =
    useState<Record<number, string>>({});

  // True while saving
  const [submitting, setSubmitting] = useState(false);

  // Stores error messages
  const [error, setError] = useState("");


  // Runs when the modal opens or the item changes
  useEffect(() => {

    // Stop if there is no item or modal is closed
    if (!isOpen || !item) return;


    // Load categories/sizes and fill the form
    async function loadOptionsAndPrefill() {
      try {

        // Get categories and sizes at the same time
        const [catRes, sizeRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/sizes'),
        ]);


        // Convert responses to JavaScript data
        const cats: Category[] = await catRes.json();
        const sizes: SizeOption[] = await sizeRes.json();


        // Save them in state
        setCategories(cats);
        setSizeOptions(sizes);


        // Put existing item information into the form
        setName(item!.itemName);
        setImageUrl(item!.itemImg ?? "");


        // Find the category matching the existing item
        const matchedCat = cats.find(
          c => c.name === item!.category
        );


        // Save the category ID
        setCategoryId(
          matchedCat ? String(matchedCat.id) : ""
        );


        // Objects to store selected sizes and prices
        const sel: Record<number, boolean> = {};
        const pr: Record<number, string> = {};


        // Check every available size
        for (const s of sizes) {

          // Check if the current item already has this size
          const match = item!.sizes.find(
            itemSize => itemSize.size === s.label
          );


          if (match) {

            // Mark this size as selected
            sel[s.id] = true;

            // Put its existing price into the form
            pr[s.id] = String(match.price);
          }
        }


        // Save selected sizes and prices
        setSelectedSizes(sel);
        setPrices(pr);


      } catch (err) {

        // Display error in browser console
        console.error(
          "Failed to load edit form data:",
          err
        );
      }
    }


    // Run the function
    loadOptionsAndPrefill();

  // Run again when modal or item changes
  }, [isOpen, item]);


  // Don't display anything if modal is closed
  // or there is no item
  if (!isOpen || !item) return null;


  // Close the modal
  const handleClose = () => {
    setError("");
    onClose();
  };


  // Select/unselect a size
  const toggleSize = (sizeId: number) => {

    // Keep the old selections and change this size
    setSelectedSizes(prev => ({
      ...prev,
      [sizeId]: !prev[sizeId]
    }));
  };


  // Runs when Save Changes is clicked
  const handleSubmit = async (e: React.FormEvent) => {

    // Prevent page refresh
    e.preventDefault();

    // Clear old error
    setError("");


    // Create the list of selected sizes
    const sizes = sizeOptions

      // Only keep selected sizes
      .filter(s => selectedSizes[s.id])

      // Convert them into the format the API expects
      .map(s => ({
        sizeId: s.id,
        price: Number(prices[s.id] || 0)
      }));


    // Make sure required information exists
    if (!name || !categoryId || sizes.length === 0) {
      setError(
        "Please fill in the item name, category, and at least one size with a price."
      );
      return;
    }


    // Disable the button while saving
    setSubmitting(true);


    try {

      // Send updated data to the backend
      // item.itemId identifies which item to update
      const response = await fetch(
        `/api/menu/${item.itemId}`,
        {
          // PATCH = update existing data
          method: 'PATCH',

          // Tell server we are sending JSON
          headers: {
            'Content-Type': 'application/json'
          },

          // Convert data into JSON
          body: JSON.stringify({
            name,
            categoryId: Number(categoryId),
            imageUrl: imageUrl || undefined,
            isAvailable,
            sizes,
          }),
        }
      );


      // Check if the server returned an error
      if (!response.ok) {

        // Get the error message
        const data = await response.json().catch(() => ({}));

        // Stop and go to catch
        throw new Error(
          data.error || "Failed to update item"
        );
      }


      // Tell parent component that update succeeded
      onUpdated();

      // Close the modal
      handleClose();


    } catch (err) {

      // Log error
      console.error(err);

      // Show error to the user
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update item"
      );


    } finally {

      // Allow saving again
      setSubmitting(false);
    }
  };


  // Display the modal
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"

      // Clicking outside closes the modal
      onClick={handleClose}
    >

      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"

        // Clicking inside should NOT close the modal
        onClick={(e) => e.stopPropagation()}
      >


        {/* Modal title and close button */}
        <div className="flex items-center justify-between mb-4">

          <h2 className="text-xl font-bold text-gray-900">
            Edit Menu Item
          </h2>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>

        </div>


        {/* Show error message if there is one */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}


        {/* Edit form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >


          {/* Name input */}
          <div>

            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Name
            </label>

            <input
              type="text"

              // Display current name
              value={name}

              // Update name when user types
              onChange={(e) => setName(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="Item name"
            />

          </div>


          {/* Category dropdown */}
          <div>

            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Category
            </label>

            <select
              value={categoryId}

              // Change selected category
              onChange={(e) => setCategoryId(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >

              <option value="">
                Select category
              </option>


              {/* Create an option for each category */}
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


          {/* Image URL input */}
          <div>

            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Edit Image URL
            </label>

            <input
              type="text"
              value={imageUrl}

              // Update image URL
              onChange={(e) => setImageUrl(e.target.value)}

              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"

              placeholder="/drinks/item-name.jpg"
            />

          </div>


          {/* Sizes and prices */}
          <div>

            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sizes & Prices
            </label>

            <div className="space-y-2">

              {/* Display every available size */}
              {sizeOptions.map((s) => (

                <div
                  key={s.id}
                  className="flex items-center gap-2"
                >

                  {/* Size checkbox */}
                  <input
                    type="checkbox"

                    // Check if size is selected
                    checked={!!selectedSizes[s.id]}

                    // Select/unselect size
                    onChange={() => toggleSize(s.id)}

                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />


                  {/* Size name */}
                  <span className="text-sm text-gray-700 w-32">
                    {s.label}

                    {s.oz
                      ? ` (${s.oz}oz ${s.temperature ?? ''})`
                      : ''}
                  </span>


                  {/* Show price input only if selected */}
                  {selectedSizes[s.id] && (

                    <input
                      type="number"
                      min="0"
                      step="0.01"

                      // Display current price
                      value={prices[s.id] ?? ''}

                      // Update price
                      onChange={(e) =>
                        setPrices(prev => ({
                          ...prev,
                          [s.id]: e.target.value
                        }))
                      }

                      placeholder="Price"

                      className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                    />

                  )}

                </div>

              ))}

            </div>
          </div>


          {/* Available checkbox */}
          <div>

            <label className="flex items-center">

              <input
                type="checkbox"

                // Current availability
                checked={isAvailable}

                // Change availability
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


          {/* Buttons */}
          <div className="flex gap-2 pt-4">

            {/* Cancel */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>


            {/* Save Changes */}
            <button
              type="submit"

              // Disable while saving
              disabled={submitting}

              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >

              {/* Change text while saving */}
              {submitting
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


// Allow other files to use this component
export default EditItemModal;

