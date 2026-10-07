'use client'

// Displays the list of available add-ons as selectable cards with name, price, and a checkbox.
import { useState } from "react";
import type { AddOn } from "@/app/api/add-ons/route";

type selectedAddOnProp = {
  selectedAddOn: number[];
  setSelectedAddOn: React.Dispatch<React.SetStateAction<number[]>>;
  addOns: AddOn[];
};

function AddOns({ selectedAddOn, setSelectedAddOn, addOns }: selectedAddOnProp) {
  const [showAll, setShowAll] = useState(false);
  const sliceLimit = 4;

  const visibleAddons = showAll ? addOns : addOns.slice(0, sliceLimit);

  const toggleAddOn = (id: number) => {
    setSelectedAddOn((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-col p-3 rounded-xl text-dark-brown w-full">
      <div className="flex flex-col w-full gap-3">
        {visibleAddons.map((addon) => {
          const isSelected = selectedAddOn.includes(addon.addOnsId);
          return (
            <button
              key={addon.addOnsId}
              type="button"
              onClick={() => toggleAddOn(addon.addOnsId)}
              className={`flex items-center justify-between px-5 py-5 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "bg-dark-brown text-white border-dark-brown shadow-lg"
                  : "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Checkbox indicator */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-gray-300 text-transparent"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Name */}
                <span className="text-lg font-medium truncate">{addon.name}</span>
              </div>

              {/* Price column - right aligned */}
              <div className="flex items-center gap-3 ml-4">
                <span className="text-lg font-semibold text-amber-700 whitespace-nowrap">
                  ₱{addon.price}
                </span>
                {isSelected && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-full">
                    Added
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {addOns.length > sliceLimit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 w-full py-3 text-base text-amber-700 font-semibold border-2 border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
    </div>
  );
}

export default AddOns;