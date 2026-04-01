'use client'
import React, {useState} from "react";
import { menuItems } from "@/app/lib/data";
import Image from "next/image";
import {useRouter} from 'next/navigation';

export default function OrderPage({params}: {params: Promise<{itemId: string}>})  {
  
  const {itemId} = React.use(params)
  const item = menuItems.find(i => i.itemId === Number(itemId));
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]);
  const router = useRouter();

  if(!item) return null;
  return (
    <section className="text-dark-brown">
    {/* The part with a black background */}
    <div className="fixed inset-0 bg-black/40">
    </div>
    {/*End of the Upper Part*/}


    <div className="h-[75vh] fixed bottom-0 right-0 left-0 overflow-y-auto
      bg-cream
    "> 
      <div className="bg-[#F4EBD0] flex justify-center h-auto w-full shrink-0 drop-shadow-lg relative">
        <Image 
          src={item.itemImg}
          alt={item.itemName}
          height={140}
          width={140}
        />
        <div className="absolute left-4 top-3 text-white bg-dark-brown rounded-full p-4 font-bold text-4xl font-roboto-mono">
          K{item.itemId}
        </div>
        <button onClick={() => router.back()}>
          <Image
            src="/cancel-icon.svg"
            alt="cancel-icon"
            width={48}
            height={48}
            className="fixed top-0 right-0 cursor-pointer"
          />
        </button>
      </div>
      {/*End of the Drink Upper Part */}
        <div className="flex flex-col gap-4 p-4"> 
          <div className="text-md font-bold">{item.itemName}</div>
          <div className="text-md font-bold">₱{selectedSize.price}</div>
          <div className="text-sm">{item.ingredients}[ingredients]</div>
        </div>

        {/* START OF SIZE PICK*/}
      <div className="flex justify-center">
        <section className="flex flex-col h-auto p-4 w-4/5 shrink-0 bg-[#F4EBD0] rounded-2xl shadow-lg cursor-pointer">
          {item.sizes.map((s) => (
            <div key={s.size} onClick={() => setSelectedSize(s)} className={`flex flex-row justify-between items-center 
              ${selectedSize.size === s.size
                  ? "text-white bg-dark-brown"
                  : ""
            }`} >
              <div className="w-3">{s.size}</div>
              <div>₱{s.price}</div>
              <input
                type="radio"
                name="size"
                value={s.size}
                checked={selectedSize.size === s.size}
                onChange={() => setSelectedSize(s)}
              />
            </div>
          ))}
        </section>
      </div>
        {/*END OF SIZE PICK*/}
    </div>
    {/**END OF DIV*/}
    </section>
  );
}