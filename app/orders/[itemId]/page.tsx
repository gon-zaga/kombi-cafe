'use client'

// Customer order page: loads one menu item + add-ons, then lets the user pick size/add-ons and add to cart
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";
import AddOns from "./_ui/AddOns";
import AddToOrderButton from "./_ui/AddToOrderButton";
import QuantitySelector from "./_ui/QuantitySelector";
import ChangeTableModal from "../../ui/ChangeTableModal";
import { useTableStore } from "@/store/TableStore";
import { useOrderTypeStore } from "@/store/OrderTypeStore";
import { MenuItem } from "@/app/lib/types";
import type { Size } from "./_ui/SizeSelector";
import { usePolling } from "@/app/lib/usePolling";

// Types for our data fetching
type Recipe = {
  id: number;
  menuItemId: number;
  sizeId: number | null;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantityNeeded: number;
};

type IngredientStock = {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
};

export default function OrderPage({ params }: { params: Promise<{ itemId: number }> }) {
  const { itemId } = React.use(params);
  const searchParams = useSearchParams();

  // Detect edit mode from URL params
  const editSizeId = searchParams.get('sizeId');
  const editAddOns = searchParams.get('addOns');
  const editQty = searchParams.get('qty');
  const isEditing = editSizeId !== null && editAddOns !== null && editQty !== null;

  // Build original order key for updateOrder
  const originalOrderKey = isEditing
    ? `${itemId}-${editSizeId}-${editAddOns}`
    : null;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [addOns, setAddOns] = useState<{ addOnsId: number; name: string; price: number; imgUrl: string }[]>([]);
  const [selectedAddOn, setSelectedAddOn] = useState<number[]>(isEditing ? editAddOns.split(',').map(Number) : []);
  const [quantity, setQuantity] = useState(isEditing ? Number(editQty) : 1);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const selectedTable = useTableStore(state => state.selectedTable);
  const orderType = useOrderTypeStore(state => state.orderType);
  
  // Stock-based maximum orderable quantity (considers restock thresholds)
  const [maxOrderableQuantity, setMaxOrderableQuantity] = useState(99);
  const [stockLoading, setStockLoading] = useState(false);

  // Ordering requires a table for dine-in; bounce back to the grid if none is set
  useEffect(() => {
    if (orderType === 'dine_in' && selectedTable === null) {
      window.location.href = '/table-select';
    }
  }, [selectedTable, orderType]);

  // Calculate total price (base + add-ons) * quantity
  const addOnsTotal = addOns
    .filter((a) => selectedAddOn.includes(a.addOnsId))
    .reduce((sum, a) => sum + a.price, 0);
  const basePrice = selectedSize?.price ?? 0;
  const totalPrice = (basePrice + addOnsTotal) * quantity;

useEffect(() => {
      let isMounted = true;

      async function fetchItemData() {
        try {
          // ?unavailable=true so a switched-off item can be shown with an explanation
          // instead of the misleading "Item not found"
          const menuResponse = await fetch('/api/menu?unavailable=true');
          const menuData: MenuItem[] = await menuResponse.json();
          const foundItem = menuData.find((entry) => entry.itemId === Number(itemId));

          if (!isMounted) return;

          if (foundItem) {
            setItem(foundItem);
            // In edit mode, pre-select the size from URL params
            if (isEditing && editSizeId) {
              const size = foundItem.sizes.find(s => s.sizeId === Number(editSizeId));
              setSelectedSize(size ?? foundItem.sizes[0] ?? null);
            } else {
              setSelectedSize(foundItem.sizes[0] ?? null);
            }
          } else {
            setItem(null);
            setSelectedSize(null);
          }
        } catch (error) {
          console.error(' Failed to fetch menu item:', error);
          if (isMounted) {
            setItem(null);
            setSelectedSize(null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      async function fetchAddOns() {
        try {
          const response = await fetch('/api/add-ons');
          const data = await response.json();
          if (isMounted) {
            setAddOns(data);
          }
        } catch (error) {
          console.error('Failed to fetch add-ons:', error);
        }
      }

      // Fetch all data
      fetchItemData();
      fetchAddOns();

      return () => {
        isMounted = false;
      };
    }, [itemId]);

    // Re-reads stock and item flags so the max quantity and Low stock/Unavailable state follow other customers' orders
    const refreshStock = useCallback(async () => {
      if (!item || !selectedSize) return;

      try {
        const [recipeRes, ingredientRes, menuRes] = await Promise.all([
          fetch(`/api/recipes?menuItemId=${itemId}`, { cache: 'no-store' }),
          fetch('/api/ingredients', { cache: 'no-store' }),
          fetch('/api/menu?unavailable=true', { cache: 'no-store' }),
        ]);
        if (!recipeRes.ok || !ingredientRes.ok) throw new Error('Stock request failed');

        const recipes: Recipe[] = await recipeRes.json();
        const ingredients: IngredientStock[] = await ingredientRes.json();
        const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));

        let calculatedMax = 99;
        for (const recipe of recipes.filter(
          (r) => r.sizeId === selectedSize.sizeId || r.sizeId === null
        )) {
          const ingredient = ingredientMap.get(recipe.ingredientId);
          if (!ingredient) continue;

          const available = ingredient.stockQty - ingredient.restockThreshold;
          if (available < 0) {
            calculatedMax = 0;
            break;
          }
          calculatedMax = Math.min(calculatedMax, Math.floor(available / recipe.quantityNeeded));
        }
        setMaxOrderableQuantity(calculatedMax);

        // Update flags only; the selected size must not reset
        if (menuRes.ok) {
          const menu: MenuItem[] = await menuRes.json();
          const fresh = menu.find((m) => m.itemId === Number(itemId));
          if (fresh) setItem(fresh);
        }
      } catch (error) {
        console.error('Failed to refresh stock:', error);
      } finally {
        setStockLoading(false);
      }
    }, [item, selectedSize, itemId]);

    usePolling(refreshStock, 5000, item !== null && selectedSize !== null);

    // Adjust quantity when max orderable quantity changes to ensure it's within bounds
   useEffect(() => {
     if (quantity > maxOrderableQuantity) {
       setQuantity(Math.max(1, maxOrderableQuantity));
     }
     // Also ensure quantity is at least 1
     if (quantity < 1) {
       setQuantity(1);
     }
   }, [quantity, maxOrderableQuantity]);

  if (loading) {
    return <p className="text-center py-10 text-dark-brown">Loading item...</p>;
  }

  if (!item || !selectedSize) {
    return <p className="text-center py-10 text-dark-brown">Item not found.</p>;
  }

  // Unavailable: show the page read-only, with no way to add it to the cart.
  // /api/menu/[itemId] also 404s unavailable items, so this is a convenience,
  // not the guard -- the server is what actually refuses the order.
  if (!item.isAvailable) {
    return (
      <section className="min-h-screen bg-cream text-dark-brown">
        <div className="pb-24">
          <ItemHeader
            itemImg={item.itemImg ?? '/drinks/no-drink-image.svg'}
            itemName={item.itemName}
            itemId={item.itemId}
          />
          <div className="px-5">
            <span className="inline-block text-xs font-bold uppercase tracking-wide text-white bg-red-600 rounded-full px-3 py-1">
              Unavailable
            </span>
            <p className="mt-3 text-sm text-gray-700">
              This item is currently unavailable. Please check back later or ask
              the counter for alternatives.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-cream text-dark-brown">
      <div className="pb-24">
        <ItemHeader
          itemImg={item.itemImg ?? '/drinks/no-drink-image.svg'}
          itemName={item.itemName}
          itemId={item.itemId}
        />

        {/* Table indicator bar */}
        {(selectedTable !== null || orderType === 'takeout') && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-roboto-condensed tracking-wide text-amber-900">
              {orderType === 'takeout' ? 'Takeout' : `TABLE ${selectedTable}`}
            </span>
            {orderType !== 'takeout' && (
              <button
                onClick={() => setTableModalOpen(true)}
                className="text-xs text-amber-900 hover:underline cursor-pointer"
              >
                Change table
              </button>
            )}
          </div>
        )}

        <ChangeTableModal
          isOpen={tableModalOpen}
          onClose={() => setTableModalOpen(false)}
        />

        <ItemInfo
          itemName={item.itemName}
          price={selectedSize.price}
          ingredients={item.ingredients}
        />

        {/* Warning only. The item is still orderable: the order API refuses an
            order on a genuine shortage, so this is a heads-up, not a block. */}
        {item.isLowStock && (
          <div className="mx-5 mt-3 bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-lg px-3 py-2">
            Low stock &mdash; some ingredients for this item are running low.
          </div>
        )}
         <SizeSelector
           sizes={item.sizes}
           selectedSize={selectedSize}
           onSelect={setSelectedSize}
         />
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            max={maxOrderableQuantity}
          />
          {stockLoading ? (
            <p className="text-xs text-dark-brown/50 text-center">
              Checking stock availability...
            </p>
          ) : maxOrderableQuantity === 0 ? (
            <p className="text-xs text-red-600 text-center font-medium">
              Not enough stock available (below restock threshold)
            </p>
          ) : maxOrderableQuantity < 99 ? (
            <p className="text-xs text-dark-brown/50 text-center">
              Maximum available: {maxOrderableQuantity}{maxOrderableQuantity === 1 ? ' item' : ' items'}
              {item.isLowStock && (
                <> (ingredients below restock threshold)</>
              )}
            </p>
          ) : (
            <p className="text-xs text-dark-brown/50 text-center">
              Use ± buttons or type directly
              {item.isLowStock && (
                <> * (ingredients below restock threshold)</>
              )}
            </p>
          )}
         <AddOns
          selectedAddOn={selectedAddOn}
          setSelectedAddOn={setSelectedAddOn}
          addOns={addOns}
        />
      </div>

<div className="fixed bottom-0 left-0 right-0 bg-cream">
          <AddToOrderButton
            itemId={Number(itemId)}
            itemName={item.itemName}
            itemImg={item.itemImg ?? '/drinks/no-drink-image.svg'}
            selectedSize={selectedSize}
            selectedAddOn={selectedAddOn}
            quantity={quantity}
            totalPrice={totalPrice}
            addOnsTotal={addOnsTotal}
            basePrice={basePrice}
            disabled={maxOrderableQuantity === 0}
            isEditing={isEditing}
            originalOrderKey={originalOrderKey}
          />
        </div>
    </section>
  );
}