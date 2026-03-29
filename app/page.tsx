'use client'
import './globals.css'
import Header from '@/app/ui/Header';
import Promotions from '@/app/ui/Promotions';
import CategoryBar from './ui/CategoryBar';
import React, {useState} from 'react';
export default function Home() {
  const [active, setActive] = useState("Kaffee");
  return (
    <div className='bg-cream min-h-screen'>
      <Header />
      <h2 className='font-roboto-slab text-2xl text-center mb-1 flex items-center justify-center'> MENU</h2>
      <Promotions />
      <CategoryBar active={active} setActive={setActive} />
      <div className="h-12 flex justify-center items-center">
        {active}
      </div>
      <hr />
    </div>
    );
}
