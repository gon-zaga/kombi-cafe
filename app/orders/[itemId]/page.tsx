'use client'

// Customer order page: loads one menu item + add-ons, then lets the user pick size/add-ons and add to cart
import React, { useEffect, useState } from "react";
import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";
import AddOns from "./_ui/AddOns";
import AddToOrderButton from "./_ui/AddToOrderButton";
import { MenuItem } from "@/app/lib/types";
import type { Size } from "./_ui/SizeSelector";

export default function OrderPage({ params }: { params: Promise<{ itemId: number }> }) {
  const { itemId } = React.use(params);

  const [item, setItem] = useState<MenuItem | null>(null);
  const [addOns, setAddOns] = useState<{ addOnsId: number; name: string; price: number; imgUrl: string }[]>([]);
  const [selectedAddOn, setSelectedAddOn] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(true);

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
          setSelectedSize(foundItem.sizes[0] ?? null);
        } else {
          setItem(null);
          setSelectedSize(null);
        }
      } catch (error) {
        console.error('Failed to fetch menu item:', error);
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

    fetchItemData();
    fetchAddOns();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

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
        />
      </div>
    </section>
  );
}