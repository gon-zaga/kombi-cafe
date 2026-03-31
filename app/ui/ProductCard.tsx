'use client'
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function ProductCard({item}: {item:{itemId: number, category: string, itemImg: string, itemName:string, ingredients: string[], sizes: {size: string, price: number}[], quantity: number}}) {
  const [quantity, setQuantity] = useState(0);

  const handleAddQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  }

  const handleRemoveQuantity = () => {
    setQuantity(prevQuantity => prevQuantity - 1);
  }

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
          />
        </div>

        {/* Price + Name */}
        <div className="flex flex-col items-start">
          <span className="font-bold text-lg">P{item.sizes[0].price}</span>
          <span className="font-medium text-sm">{item.itemName}</span>
        </div>
      </Link>

      {/* Non-clickable zone — quantity controls */}
      <div className="flex justify-end">
        {quantity === 0 ? (
          <button onClick={handleAddQuantity}>
            <Image
              src="/add-icon.svg"
              alt="add-btn"
              width={28}
              height={28}
            />
          </button>
        ) : (
          <div className="flex flex-row items-center gap-1 bg-white rounded-full px-2 py-1">
            <button onClick={handleRemoveQuantity}>
              <Image
                src="/trash-icon.svg"
                alt="trash button"
                width={28}
                height={28}
              />
            </button>
            <span>{quantity}</span>
            <button onClick={handleAddQuantity}>
              <Image
                src="/add-icon.svg"
                alt="add-btn"
                width={28}
                height={28}
              />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default ProductCard;