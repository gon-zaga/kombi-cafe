'use client'
import React, { useState } from "react";
import { menuItems, addOns } from "@/app/lib/data";

import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";
import AddOns from "./_ui/AddOns";
import AddToOrderButton from "./_ui/AddToOrderButton";

export default function OrderPage({ params }: { params: Promise<{ itemId: number }> }) {

  const { itemId } = React.use(params);
  const item = menuItems.find(i => i.itemId === Number(itemId));

  const [selectedAddOn, setSelectedAddOn] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item!.sizes[0]);

  const filteredAddOns = addOns.filter(addOn => selectedAddOn.includes(addOn.addOnsId));
  const addOnsTotal = filteredAddOns.reduce((acc, addOn) => acc + addOn.price, 0);

  if (!item) return null;

  return (
    <section className="min-h-screen bg-cream text-dark-brown">
      <div className="pb-24">
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-cream">
        <AddToOrderButton
          itemId={itemId}
          itemName={item.itemName}
          itemImg={item.itemImg}
          selectedSize={selectedSize}
          selectedAddOn={selectedAddOn}
          quantity={quantity}
          specialInstruction=""
        />
      </div>
    </section>
  );
}