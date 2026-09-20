'use client'

import React, { useEffect, useState } from "react";
import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";
import AddOns from "./_ui/AddOns";
import AddToOrderButton from "./_ui/AddToOrderButton";
import { MenuRow, MenuItem } from "@/app/lib/types";
import type { Size } from "./_ui/SizeSelector";

export default function OrderPage({ params }: { params: Promise<{ itemId: number }> }) {
  const { itemId } = React.use(params);

  const [item, setItem] = useState<MenuItem | null>(null);
  const [addOns, setAddOns] = useState<{ addOnsId: number; name: string; price: number; imgUrl: string}[]>([]);
  const [selectedAddOn, setSelectedAddOn] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchItemData() {
      try {
        const menuResponse = await fetch('/api/menu');
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
          specialInstruction=""
        />
      </div>
    </section>
  );
}