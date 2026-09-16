'use client'
import './globals.css'
import { useEffect } from 'react';
import Header from '@/app/ui/Header';
import Promotions from '@/app/ui/Promotions';
import CategoryBar from './ui/CategoryBar';
import MenuItem from './ui/MenuItem';
import React, {useState} from 'react';
import ViewOrderBar from './ui/ViewOrderBar';
import type { MenuItem as MenuItemType} from "@/app/api/menu/route";

export default function Home() {
  const [active, setActive] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function fetchMenu() {
    const response = await fetch('/api/menu');
    const data = await response.json();
    setMenuItems(data);
    setLoading(false);
  }

  fetchMenu();
}, []);
  if (loading) {
      return <p className="text-center py-10">Loading menu...</p>;
  }

  return (
    <div className='bg-cream min-h-screen'>
      <Header />
      <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'> MENU</h2>
      <Promotions />
      <CategoryBar active={active} setActive={setActive} />
      <div className="h-12 flex justify-center items-center font-bold text-dark-brown">
        {active}
      </div>
      <hr className='mb-3'/>
      <MenuItem active={active} menuItems={menuItems}/>
      <ViewOrderBar />
    </div>
    );
}
