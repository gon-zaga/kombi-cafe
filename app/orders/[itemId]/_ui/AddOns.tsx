  'use client'
  import { addOns } from "@/app/lib/data";
  import Image from "next/image";
  import { useState } from "react";

  type selectedAddOnProp = {
    selectedAddOn: number[],
    setSelectedAddOn:React.Dispatch<React.SetStateAction<number[]>>
  }
  
  function AddOns({selectedAddOn, setSelectedAddOn}: selectedAddOnProp) {
    const [showAll, setShowAll] = useState(false);
    const sliceLimit = 4;

    // Derivative Variable
    const visibleAddons = showAll ? addOns.slice(0, sliceLimit) : addOns

    const toggleAddOn = (id: number) => {
      setSelectedAddOn(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    }

    return (
      <div className="flex flex-col p-2 rounded-md text-dark-brown w-full items-center">

        <div className="flex flex-col w-4/5 gap-2">
          {visibleAddons.map((addon) => (
          <div 
    key={addon.addOnsId}  
    onClick={() => toggleAddOn(addon.addOnsId)}
    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer bg-card-cream
    ${selectedAddOn.includes(addon.addOnsId) ? "bg-dark-brown text-white" : ""}`}>
    {/* LEFT: Image */}
    <div className="w-14 shrink-0">
      <Image
        src={addon.addOnImg}
        alt="[]"
        width={50}
        height={50}
      />
    </div>

    {/* CENTER: Name */}
    <span className="flex-1 text-sm font-medium">
      {addon.name}
    </span>

    {/* PRICE (aligned vertically) */}
    <span className="w-20  text-sm">
      ₱{addon.price}
    </span>

    {/* CHECKBOX */}
    <input
      type="checkbox"
      name="addOn"
      checked={selectedAddOn.includes(addon.addOnsId)}
      onChange={() => toggleAddOn(addon.addOnsId)}
      className="ml-2"/>
    </div>
          ))}
        </div>
        {
          (addOns.length  > sliceLimit ) && 
            <button onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show All " : "Show Less"}
            </button>
        }
      </div>
    );
  }

  export default AddOns