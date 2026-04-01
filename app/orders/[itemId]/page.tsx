'use client'
import React, {useState} from "react";
import { menuItems } from "@/app/lib/data";

import ItemHeader from "./_ui/ItemHeader";
import ItemInfo from "./_ui/ItemInfo";
import SizeSelector from "./_ui/SizeSelector";

export default function OrderPage({params}: {params: Promise<{itemId: string}>})  {
  
  const {itemId} = React.use(params)
  const item = menuItems.find(i => i.itemId === Number(itemId));
  // Target the whole object to access price and size
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]);

  if(!item) return null;
  return (
    <section className="text-dark-brown">
    {/* The part with a black background */}
    <div className="fixed inset-0 bg-black/40">
    </div>
    {/*End of the Upper Part*/}


    <div className="h-[75vh] fixed bottom-0 right-0 left-0 overflow-y-auto
      bg-cream
    "> 
      <ItemHeader 
        itemImg = {item.itemImg}
        itemName = {item.itemName}
        itemId = {item.itemId}
      />
      
      <ItemInfo
        itemName = {item.itemName}
        price = {selectedSize.price}
        ingredients={item.ingredients}
      /> 

      <SizeSelector
        sizes={item.sizes}
        selectedSize={selectedSize}
        onSelect={setSelectedSize}
      />

      
    </div>
    {/**END OF DIV*/}
    </section>
  );
}