'use client'
import './globals.css'
import Header from '@/app/ui/Header';
import Promotions from '@/app/ui/Promotions';
import CategoryBar from './ui/CategoryBar';
import MenuItem from './ui/MenuItem';
import React, {useState} from 'react';
import ViewOrderBar from './ui/ViewOrderBar';


export default function Home() {
  const [active, setActive] = useState("All");
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
      <MenuItem active={active}/>
      <ViewOrderBar />
    </div>
    );
}
