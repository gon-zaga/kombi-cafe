/**
 * The OrderPage component in TypeScript React renders a page for selecting item size, add-ons, and
 * quantity to place an order.
 * 
 * @param  The `OrderPage` component is a React functional component that displays information about a
 * specific item from a menu. Here's a breakdown of the key parts of the component:
 * 
 * @return The `OrderPage` component is being returned. It renders a section containing various UI
 * components such as `ItemHeader`, `ItemInfo`, `SizeSelector`, `AddOns`, and `AddToOrderButton`. The
 * component displays information about a selected item from the menu, allows the user to select a
 * size, add-ons, and quantity, and calculates the total order price based on the selected
 */

'use client'
import React, { useState } from "react";
import { menuItems, addOns } from "@/app/lib/data";

import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";
import AddOns from "./_ui/AddOns";
import AddToOrderButton from "./_ui/AddToOrderButton";

export default function OrderPage({ params }: { params: Promise<{ itemId: string }> }) {

  const { itemId } = React.use(params);
  const item = menuItems.find(i => i.itemId === Number(itemId));

  const [selectedAddOn, setSelectedAddOn] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item!.sizes[0]);

  const filteredAddOns = addOns.filter(addOn => selectedAddOn.includes(addOn.addOnsId));
  const addOnsTotal = filteredAddOns.reduce((acc, addOn) => acc + addOn.price, 0);
  const orderTotal = ((selectedSize?.price ?? 0) + addOnsTotal) * quantity;

  if (!item) return null;

  return (
    <section className="text-dark-brown">
      <div className="h-full fixed bottom-0 right-0 left-0 overflow-y-auto bg-cream">
        <ItemHeader
          itemImg={item.itemImg}
          itemName={item.itemName}
          itemId={item.itemId}
        />

        <ItemInfo
          itemName={item.itemName}
          price={selectedSize?.price ?? 0}
          ingredients={item.ingredients}
        />

        <SizeSelector
          sizes={item.sizes}
          selectedSize={selectedSize}
          onSelect={setSelectedSize}
        />

        <AddOns selectedAddOn={selectedAddOn} setSelectedAddOn={setSelectedAddOn} />

        <AddToOrderButton totalPrice={orderTotal} />
      </div>
    </section>
  );
}