'use client'
import { addOns } from "@/app/lib/data";
import Image from "next/image";
import { useState } from "react";
function AddOns() {
    const [selectedAddOn, setSelectedAddOn] = useState<number[]>([]);

    // function that receives the id that was clicked
    // Check if the id is already in the array if yea then remove
    const toggleAddOn = (id:number) => {
      setSelectedAddOn(prev => prev.includes(id) ? prev.filter(a => a !== id ): [...prev, id]);
    }
  return(
    
    <div className="flex bg-[#F4EBD0] p-2 rounded-md text-dark-brown justify-between items-center">
      <div className="flex flex-col justify-between items-center">
        {addOns.map((addon) =>  ( 
          <div key={addon.addOnsId} className="flex ">
            <Image
              src={addon.addOnImg}
              alt=""
              width={50}
              height={50}
            />
            {addon.name}
            {addon.price}
            <input type="checkbox" name="addOn"
              checked={selectedAddOn.includes(addon.addOnsId)}
              onChange={() => toggleAddOn(addon.addOnsId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AddOns 