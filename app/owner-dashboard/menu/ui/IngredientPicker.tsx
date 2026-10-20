'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/ui/Toast";

interface IngredientOption {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  restockThreshold: number;
}

interface IngredientPickerProps {
  ingredients: IngredientOption[];

  // Selected ingredient id, or '' when nothing is chosen
  value: string;
  onChange: (id: string) => void;

  placeholder?: string;
}

function IngredientPicker({
  ingredients,
  value,
  onChange,
  placeholder = "Select ingredient",
}: IngredientPickerProps) {
  const { error: showErrorToast } = useToast();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = ingredients.find((i) => String(i.id) === value);

  // Check if an ingredient is low stock
  const isLowStock = (ingredient: IngredientOption) => 
    ingredient.stockQty <= ingredient.restockThreshold;

  // Case-insensitive substring match on the name. A menu item with 20+ items
  // is unusable by scrolling, so typing is the primary way to find one.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, query]);

   // Reset highlight when the filtered list (`matches`) changes
   useEffect(() => {
     if (matches.length > 0) {
       setActiveIndex(0);
     } else {
       setActiveIndex(-1);
     }
   }, [matches]);

   // Keep the highlighted item scrolled into view during keyboard navigation
   useEffect(() => {
     if (!isOpen || !listRef.current) return;
     // Only scroll if activeIndex is a valid index
     if (activeIndex >= 0 && activeIndex < matches.length) {
       const el = listRef.current.children[activeIndex] as HTMLElement;
       el.scrollIntoView({ block: "nearest" });
     }
   }, [activeIndex, isOpen, matches]);

   const close = () => {
     setIsOpen(false);
     setQuery("");
   };

   const handlePick = (id: number) => {
     onChange(String(id));
     close();
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
     // ✅ SAFETY: Prevent navigation logic from running when there are no matches
     if (matches.length === 0) {
       if (e.key === "Escape") {
         e.preventDefault();
         close();
       }
       return;
     }

     if (e.key === "ArrowDown") {
       e.preventDefault();
       setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
     } else if (e.key === "ArrowUp") {
       e.preventDefault();
       setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = matches[activeIndex];
        if (pick && !isLowStock(pick)) handlePick(pick.id);
        else if (pick && isLowStock(pick)) {
          showErrorToast('Cannot add ingredient because it is low in stock.');
        }
      } else if (e.key === "Escape") {
       e.preventDefault();
       close();
     }
   };

   return (
     <div className="relative">
       <button
         type="button"
         onClick={() => setIsOpen((prev) => !prev)}
         aria-haspopup="listbox"
         aria-expanded={isOpen}
         className="w-full min-h-[56px] px-4 py-3 border-2 border-gray-300 rounded-lg text-base text-left focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-between gap-3"
       >
         <span className={selected ? "text-gray-900" : "text-gray-500"}>
           {selected ? `${selected.name} (${selected.unit})` : placeholder}
         </span>
         <span className="text-gray-400 text-lg shrink-0">▾</span>
       </button>

       {isOpen && (
         <>
           {/* Click-away layer, so clicking elsewhere closes the list */}
           <div className="fixed inset-0 z-10" onClick={close} />

           <div className="absolute z-20 left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
             <div className="p-3 border-b border-gray-200">
               <input
                 // autoFocus so the user can type immediately on opening
                 autoFocus
                 type="text"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Search ingredients..."
                 className="w-full min-h-[52px] px-4 py-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
               />
             </div>

             <ul ref={listRef} role="listbox" className="max-h-80 overflow-y-auto divide-y divide-gray-100">
               {matches.length === 0 && (
                 <li className="px-4 py-4 text-base text-gray-500">
                   No ingredient matches &quot;{query}&quot;
                 </li>
               )}

               {matches.map((i, index) => {
                 const itemIsLowStock = isLowStock(i);
                 return (
                   <li key={i.id} role="option" aria-selected={String(i.id) === value} aria-disabled={itemIsLowStock}>
                     {itemIsLowStock ? (
                       <div
                         className={`w-full min-h-[56px] text-left px-5 py-4 text-base flex items-center justify-between gap-3 ${
                           index === activeIndex ? "bg-amber-50" : ""
                       } opacity-50 cursor-not-allowed`}
                       >
                         <span className="text-gray-900 font-medium">{i.name}</span>
                         <span className="text-sm text-gray-500 shrink-0">{i.unit}</span>
                         <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-orange-500 rounded-full px-2 py-0.5 ml-2">
                           Low stock
                         </span>
                       </div>
                     ) : (
                       <button
                         type="button"
                         onClick={() => handlePick(i.id)}
                         onMouseEnter={() => setActiveIndex(index)}
                         className={`w-full min-h-[56px] text-left px-5 py-4 text-base hover:bg-amber-50 transition-colors flex items-center justify-between gap-3 ${
                           index === activeIndex ? "bg-amber-50" : ""
                         }`}
                       >
                         <span className="text-gray-900 font-medium">{i.name}</span>
                         <span className="text-sm text-gray-500 shrink-0">{i.unit}</span>
                       </button>
                     )}
                   </li>
                 );
               })}
             </ul>
           </div>
         </>
       )}
     </div>
   );
 }

 export default IngredientPicker;