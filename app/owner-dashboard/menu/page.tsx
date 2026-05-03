'use client'
import { useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import AddItemModal from "./ui/AddItemModal";
import AddItemButton from "./ui/AddItemButton";
import MenuItemCard from "./ui/MenuItemCard";
import { menuItems } from "@/app/lib/data";
export default function MenuManagement() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  return(
      <section className="min-h-screen">
        <OwnerHeader title="MENU MANAGEMENT"/>
        <section className="px-2 flex justify-center mb-4">
           <AddItemButton onClick={() => setIsModalOpen(true)}/>

            <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
        </section>

        <hr />

        <section>
          {menuItems.map(item => (
            <MenuItemCard key={item.itemId} item={item} name={item.itemName} category={item.category}
            img={item.itemImg}
            />
          ))}
        </section>
      </section>
  );
}

