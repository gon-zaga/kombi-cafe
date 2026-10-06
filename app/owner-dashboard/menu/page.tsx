
'use client'

// React hooks used in this component
// useState = stores changing data
// useEffect = runs code when something changes / when page loads
// useCallback = keeps the fetchMenu function from being recreated unnecessarily
import { useCallback, useEffect, useState } from "react";

// Components used by this page
import OwnerHeader from "../ui/OwnerHeader";
import AddItemModal from "./ui/AddItemModal";
import EditItemModal from "./ui/EditItemModal";
import AddItemButton from "./ui/AddItemButton";
import MenuItemCard from "./ui/MenuItemCard";
import RecipeModal from "./ui/RecipeModal";
import FilterBar from "./ui/FilterBar";
import ConfirmModal from "@/app/ui/ConfirmModal";
import { useToast } from "@/app/ui/Toast";

// MenuItem is the TypeScript type that describes a menu item
import type { MenuItem } from "@/app/lib/types";


// Main component for managing menu items
export default function MenuManagement() {

  // Stores all menu items retrieved from the database/API
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Keeps track of whether the menu is still loading
  const [loading, setLoading] = useState(true);

  // Controls whether the "Add Item" modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Controls whether the "Edit Item" modal is open
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Stores the menu item currently being edited
  // null means no item is currently selected for editing
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Stores the menu item whose recipe (ingredients used) is open
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);

  // Stores the currently selected category filter
  // "All" means show every category
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Stores the availability filter
  // "All" = show all
  // "Available" = show available items
  // "Unavailable" = show unavailable items
  const [availability, setAvailability] = useState("All");

  // Text search across item names (works with filters)
  const [search, setSearch] = useState("");

  // Stores whether each menu item is available
  //
  // Example:
  // {
  //   1: true,
  //   2: false,
  //   3: true
  // }
  //
  // The number is the item ID
  // true = available
  // false = unavailable
  const [itemAvailability, setItemAvailability] =
    useState<Record<number, boolean>>({});

  // The menu item the delete confirmation is open for; null means no modal.
  // This replaces the old window.confirm/window.alert pair.
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  // Holds a delete failure (e.g. the 409 "has past orders" message) so it can be
  // shown on the page instead of in a browser alert
  const [actionError, setActionError] = useState("");


  const { error: showError } = useToast();

  // Function used to get menu items from the API
const fetchMenu = useCallback(async () => {
  try {
      const response = await fetch('/api/menu?all=true');
      const data: MenuItem[] = await response.json();
      setMenuItems(data);

    setItemAvailability(Object.fromEntries(data.map(i => [i.itemId, i.isAvailable])));
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
  } finally {
    setLoading(false);
  }
}, []);


  // Run fetchMenu when the component first loads
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);


  // Create a new list containing only the menu items
  // that match the selected filters and search text.
  const filteredItems = menuItems.filter(item => {

    // Text search across item name
    if (search.trim().length > 0) {
      if (!item.itemName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }

    // Check the category filter
    //
    // If the selected category is NOT "All"
    // and the item's category does not match,
    // remove the item from the results.
    if (
      selectedCategory !== 'All' &&
      item.category !== selectedCategory
    ) {
      return false;
    }


    // Get the availability status of this item
    //
    // If no value exists yet, assume it is available.
    const isAvailable =
      itemAvailability[item.itemId] ?? true;


    // If the user selected "Available",
    // hide items that are unavailable.
    if (availability === "Available" && !isAvailable) {
      return false;
    }


    // If the user selected "Unavailable",
    // hide items that are available.
    if (availability === "Unavailable" && isAvailable) {
      return false;
    }


    // If none of the filters removed the item,
    // keep it in the filtered list.
    return true;
  });


  // Called when the availability switch/checkbox is changed
  const handleToggleAvailability = async (itemId: number, checked: boolean) => {
  setItemAvailability(prev => ({ ...prev, [itemId]: checked })); // optimistic
  try {
    const res = await fetch(`/api/menu/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: checked }),
    });
    if (!res.ok) throw new Error("PATCH failed");
    showError(`${checked ? "Item is now available" : "Item is now unavailable"}`, { type: checked ? 'success' : 'error' });
  } catch (error) {
    console.error("Failed to update availability:", error);
    setItemAvailability(prev => ({ ...prev, [itemId]: !checked })); // revert
    showError("Failed to update availability");
  }
};

// Owner menu page: DELETE the confirmed item, then refetch. Runs only after the
// ConfirmModal countdown finishes, and surfaces the 409 message on the page.
const handleDelete = async (item: MenuItem) => {
  setActionError("");
  try {
    const res = await fetch(`/api/menu/${item.itemId}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete item");
    }

    setDeletingItem(null);
    fetchMenu();
    showError(`${item.itemName} deleted successfully`, { type: 'error' });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    setActionError(
      error instanceof Error ? error.message : "Failed to delete item"
    );
  }
}

  // The actual page UI
  return (
    <section className="min-h-screen bg-cream">

      {loading ? (
        // Loading skeleton
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-spin" />
            <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-2 border-4 border-amber-100 rounded-full border-b-transparent animate-spin reverse" style={{ animationDuration: '1.5s' }} />
          </div>
          <p className="text-dark-brown font-roboto-slab text-xl font-medium">Loading menu items...</p>
          <p className="text-dark-brown/50 text-sm mt-1">Fetching your delicious items</p>
          
          {/* Skeleton cards */}
          <div className="w-full max-w-4xl mt-8 space-y-4 px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-amber-100 rounded w-3/4" />
                    <div className="h-4 bg-amber-100 rounded w-1/2" />
                    <div className="h-4 bg-amber-100 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-10 bg-amber-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>

      {/* Header at the top of the menu management page */}
      <OwnerHeader title="MENU MANAGEMENT" />


      {/* Section containing the Add Item button and modal */}
      <section className="px-2 flex justify-center mb-4">

        {/* 
          When the button is clicked:
          setIsModalOpen(true)
          -> opens the Add Item modal
        */}
        <AddItemButton
          onClick={() => setIsModalOpen(true)}
        />


        {/* 
          AddItemModal is the form used to create a new menu item.

          isOpen:
          Tells the modal whether it should be visible.

          onClose:
          Closes the modal.

          onCreated:
          Runs fetchMenu after an item is successfully created,
          so the menu list gets updated.
        */}
        <AddItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchMenu}
        />

      </section>


      {/* Horizontal line separating sections */}
      <hr />


{/* Filter section */}
      <section className="flex flex-row">

        {/* 
          FilterBar allows the user to choose:
          - Category
          - Availability
        */}
        <FilterBar
          currentAvailbility={availability}
          currentCategory={selectedCategory}

          // Update the availability filter
          onAvailabilityChange={setAvailability}

          // Update the category filter
          onCategoryChange={setSelectedCategory}
        />  

      </section>

      {/* Search input */}
      <section className="px-2 mb-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-dark-brown/30 rounded-xl bg-white font-roboto-mono text-dark-brown focus:outline-none focus:ring-2 focus:ring-amber-800/30 placeholder:text-dark-brown/50"
          aria-label="Search menu items"
        />
      </section>

      {/* Another horizontal line */}
      <hr />


      {/* Menu item list */}
      <section>

        {/*
          map() goes through every item that passed
          the filters and creates a MenuItemCard for it.
        */}
        {filteredItems.map(item => (

          <MenuItemCard
            // React needs a unique key for every item
            key={item.itemId}

            // Give the menu item information to the card
            item={item}

            // Give the card its current availability status
            isAvailable={
              itemAvailability[item.itemId] ?? true
            }
            

            // Called when the availability switch is changed
            //
            // The card gives us the new checked value.
            // We then call handleToggleAvailability()
            onToggle={(checked) =>
              handleToggleAvailability(
                item.itemId,
                checked
              )
            }


            // Called when the Edit button is clicked
            onEdit={() => {

              // Remember which item the user wants to edit
              setEditingItem(item);

              // Open the edit modal
              setIsEditModalOpen(true);
            }}
            
            onDelete={ () => { setActionError(""); setDeletingItem(item); }}
            onIngredients={() => setRecipeItem(item)}
          />

        ))}

      </section>


      {/* 
        Edit Item Modal

        This modal is used when the user wants
        to modify an existing menu item.
      */}
      <EditItemModal

        // Controls whether the modal is visible
        isOpen={isEditModalOpen}

        // Pass the selected menu item to the modal
        item={editingItem}


        // What happens when the modal is closed
        onClose={() => {

          // Close the modal
          setIsEditModalOpen(false);

          // Remove the selected item
          setEditingItem(null);
        }}


        // After the item is successfully updated,
        // fetch the latest menu data again.
        onUpdated={fetchMenu}
      />

      {/* Recipe editor, opened from the card's Ingredients button */}
      <RecipeModal
        isOpen={recipeItem !== null}
        item={recipeItem}
        onClose={() => setRecipeItem(null)}
        onChanged={fetchMenu}
      />

      {/* Delete failure banner, e.g. "This item has past orders" (409) */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded-lg text-sm flex items-center justify-between gap-4">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError("")}
            className="text-red-700 hover:text-red-900 font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Delete confirmation with a 3-second lock before the buttons respond */}
      <ConfirmModal
        isOpen={deletingItem !== null}
        title="Delete menu item?"
        message={
          deletingItem
            ? `"${deletingItem.itemName}" will be removed from the menu permanently.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => setDeletingItem(null)}
        onConfirm={() => deletingItem && handleDelete(deletingItem)}
      />
        </>
      )}

    </section>
  );
}

