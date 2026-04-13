'use client'
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function ProductCard({item}: {item:{itemId: number, category: string, itemImg: string, itemName:string, ingredients: string[], sizes: {size: string, price: number}[], quantity: number}}) {

  return (
    <div className="bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2 text-dark-brown">
      
      {/* Clickable zone */}
      <Link href={`/orders/${item.itemId}`} className="flex flex-col gap-2">
        {/* Image */}
        <div className="flex justify-center items-center bg-white rounded-xl p-2">
          <Image
            src={`${item.itemImg}`}
            alt={item.itemName}
            width={110}
            height={110}
            loading="eager"
          />
        </div>

        {/* Price + Name */}
        <div className="flex flex-col items-start">
          <span className="font-bold text-lg">P{item.sizes[0].price}</span>
          <span className="font-medium text-sm">{item.itemName}</span>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;