'use client'
import { useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import AddItemModal from "./ui/AddItemModal";
import AddItemButton from "./AddItemButton";
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
      </section>
  );
}

