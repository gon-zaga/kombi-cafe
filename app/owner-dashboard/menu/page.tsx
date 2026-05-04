'use client'
import { useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import AddItemModal from "./ui/AddItemModal";
import AddItemButton from "./ui/AddItemButton";
import MenuItemCard from "./ui/MenuItemCard";
import { menuItems } from "@/app/lib/data";
import FilterBar from "./ui/FilterBar";
export default function MenuManagement() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [itemAvailability, setItemAvailability] = useState<Record<number, boolean>>({})

    const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    // Availabiliy Filter
    const isAvailable = itemAvailability[item.itemId] ?? true ;
    
    if(availability === "Available" && !isAvailable) {
      return false;
    }

    if (availability === "Unavailable" && isAvailable) {
      return false;
    }  
    return true;
  });


  return(
      <section className="min-h-screen">
        <OwnerHeader title="MENU MANAGEMENT"/>
        <section className="px-2 flex justify-center mb-4">
           <AddItemButton onClick={() => setIsModalOpen(true)}/>

            <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
        </section>

        <hr />
        {/**Filter  */}
        <section className="flex flex-row">
          
          <FilterBar currentAvailbility={availability} currentCategory={selectedCategory} onAvailabilityChange={setAvailability} onCategoryChange={setSelectedCategory}/>
        </section>
        <hr />

        {/**Item Horizontal List */}
        <section>
          {filteredItems.map(item => (
            <MenuItemCard 
              key={item.itemId} 
              item={item} 
              isAvailable={itemAvailability[item.itemId] ?? true}
              onToggle={(checked) => setItemAvailability(prev => ({...prev, [item.itemId]: checked}))}
            />
          ))}
        </section>
      </section>
  );
}

