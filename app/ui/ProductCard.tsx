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
  // Set by the API. False means the owner switched the item off.
  isAvailable?: boolean;
  // True when one of the recipe ingredients is at or below its threshold.
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

  // Defaults to true so cards without the flag remain usable.
  const isAvailable = item.isAvailable ?? true;
  const isLowStock = isAvailable && item.isLowStock === true;

  // The card body is not a link when the item is unavailable.
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
        {/* Badges appear above the item name. */}
        {!isAvailable ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-600 rounded-full px-2 py-0.5">
            Unavailable
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-orange-500 rounded-full px-2 py-0.5">
            Low stock
          </span>
        ) : null}

        <span
          className={`font-bold text-lg ${
            isAvailable ? "" : "line-through opacity-60"
          }`}
        >
          ₱{Number(price).toFixed(2)}
        </span>

        <span
          className={`font-medium text-sm ${
            isAvailable ? "" : "opacity-60"
          }`}
        >
          {itemName}
        </span>

        <span className="text-xs opacity-75">
          {categoryLabel}
        </span>

        {/* Ingredients */}
        {Array.isArray(item.ingredients) &&
        item.ingredients.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="font-medium text-dark-brown text-xs">
              Ingredients:
            </span>

            {item.ingredients.map((ing, index) => (
              <span
                key={index}
                className="bg-dark-brown/10 text-dark-brown text-[10px] font-medium me-1 px-1.5 py-0.5 rounded"
              >
                {ing}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-dark-brown/50 mt-1">
            Ingredients: <span className="italic">none</span>
          </p>
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
      {/* NEW and BEST badges */}
      {tag === "new" && (
        <span className="absolute top-1.5 left-1.5 z-10 bg-green-800 text-white text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5">
          NEW
        </span>
      )}

      {tag === "best" && (
        <span className="absolute top-1.5 left-1.5 z-10 bg-amber-800 text-white text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5">
          BEST
        </span>
      )}

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

      {sublabel && (
        <span className="text-xs text-dark-brown/60 px-1">
          {sublabel}
        </span>
      )}
    </div>
  );
}

export default ProductCard;
