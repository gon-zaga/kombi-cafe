'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";


type MenuCardItem = {
  itemId: number;
  category: string | null;
  itemImg: string | null;
  itemName: string;
  ingredients: string[];
  sizes: { size: string; price: number }[];
};

function ProductCard({ item }: { item: MenuCardItem }) {
  const firstSize = item.sizes?.[0];
  const price = firstSize?.price ?? 0;
  const imageSrc = item.itemImg || "/drinks/no-drink-image.svg";
  const itemName = item.itemName || "Menu item";
  const categoryLabel = item.category || "Other";

  return (
    <div className="bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2 text-dark-brown">
      <Link href={`/orders/${item.itemId}`} className="flex flex-col gap-2">
        <div className="flex justify-center items-center bg-white rounded-xl p-2">
          <Image
            src={imageSrc}
            alt={itemName}
            width={110}
            height={110}
            loading="eager"
          />
        </div>

        <div className="flex flex-col items-start">
          <span className="font-bold text-lg">P{price}</span>
          <span className="font-medium text-sm">{itemName}</span>
          <span className="text-xs opacity-75">{categoryLabel}</span>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;