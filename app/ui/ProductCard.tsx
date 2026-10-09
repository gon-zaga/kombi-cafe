'use client'

import React from "react";
import Link from "next/link";
import ItemImage from "./ItemImage";

type MenuCardItem = {
  itemId: number;
  category: string | null;
  itemImg: string | null;
  itemName: string;
  ingredients: string[];
  sizes: { size: string; price: number }[];
  isAvailable?: boolean;
  isLowStock?: boolean;
};

type ProductCardProps = {
  item: MenuCardItem;
  tag?: "new" | "best";
  sublabel?: string;
  className?: string;
};

function ProductCard({
  item,
  tag,
  sublabel,
  className,
}: ProductCardProps) {
  const firstSize = item.sizes?.[0];
  const price = firstSize?.price ?? 0;
  const imageSrc = item.itemImg || "/drinks/no-drink-image.svg";
  const itemName = item.itemName || "Menu item";
  const categoryLabel = item.category || "Other";

  const isAvailable = item.isAvailable ?? true;
  const isLowStock = isAvailable && item.isLowStock === true;

  const body = (
    <>
      <div className="flex justify-center items-center bg-white rounded-xl p-2">
        <ItemImage
          src={imageSrc}
          alt={itemName}
          width={110}
          height={110}
          loading="eager"
          className={isAvailable ? "" : "opacity-40 grayscale"}
        />
      </div>

      <div className="flex flex-col items-start gap-0.5">
        {/* Availability badges */}
        {!isAvailable ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-600 rounded-full px-2 py-0.5">
            Unavailable
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-orange-500 rounded-full px-2 py-0.5">
            Low stock
          </span>
        ) : null}

        {/* Price */}
        <span
          className={`font-bold text-lg ${
            isAvailable ? "" : "line-through opacity-60"
          }`}
        >
          ₱{Number(price).toFixed(2)}
        </span>

        {/* Product name */}
        <span
          className={`font-medium text-sm ${
            isAvailable ? "" : "opacity-60"
          }`}
        >
          {itemName}
        </span>

        {/* Category */}
        <span className="text-xs opacity-75">
          {categoryLabel}
        </span>

        {/* Styled ingredients */}
        {Array.isArray(item.ingredients) &&
        item.ingredients.length > 0 ? (
          <div className="mt-2 w-full border-t border-[#D8C7A5] pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B4F3A] mb-1.5">
              Ingredients
            </p>

            <div className="flex flex-wrap gap-1.5">
              {item.ingredients.map((ing, index) => (
                <span
                  key={`${ing}-${index}`}
                  className="inline-flex items-center rounded-full border border-[#D6C09A] bg-[#E8D9B8] px-2.5 py-1 text-[11px] font-medium text-[#4B3325] shadow-sm"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 w-full border-t border-[#D8C7A5] pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B4F3A] mb-1.5">
              Ingredients
            </p>

            <span className="inline-flex rounded-full border border-[#D6C09A] bg-[#E8D9B8] px-2.5 py-1 text-[11px] italic text-[#6B4F3A]">
              None listed
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`relative bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2 text-dark-brown ${
        isAvailable ? "" : "opacity-70"
      } ${className ?? ""}`}
    >
      {/* NEW badge */}
      {tag === "new" && (
        <span className="absolute top-1.5 left-1.5 z-10 bg-green-800 text-white text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5">
          NEW
        </span>
      )}

      {/* BEST badge */}
      {tag === "best" && (
        <span className="absolute top-1.5 left-1.5 z-10 bg-amber-800 text-white text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5">
          BEST
        </span>
      )}

      {/* Available items are clickable */}
      {isAvailable ? (
        <Link
          href={`/orders/${item.itemId}`}
          className="flex flex-col gap-2"
        >
          {body}
        </Link>
      ) : (
        <div className="flex flex-col gap-2 cursor-not-allowed">
          {body}
        </div>
      )}

      {/* Optional sublabel */}
      {sublabel && (
        <span className="text-xs text-dark-brown/60 px-1">
          {sublabel}
        </span>
      )}
    </div>
  );
}

export default ProductCard;
