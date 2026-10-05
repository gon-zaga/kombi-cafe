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

  // Set by the API. isAvailable false means the owner switched the item off;
  // isLowStock means one of its recipe ingredients is at/below its threshold
  isAvailable?: boolean;
  isLowStock?: boolean;
};

// A single menu item on the customer grid, or inside the Best Sellers shelf.
// Optional `tag` stamps a NEW (recently added) or BEST (top seller) ribbon on the
// card, and `sublabel` adds a one-line note (e.g. "3 sold") under the price.
function ProductCard({ item, tag, sublabel }: { item: MenuCardItem; tag?: "new" | "best"; sublabel?: string }) {
  const firstSize = item.sizes?.[0];
  const price = firstSize?.price ?? 0;
  const imageSrc = item.itemImg || "/drinks/no-drink-image.svg";
  const itemName = item.itemName || "Menu item";
  const categoryLabel = item.category || "Other";

  // Defaults to true so a card built from data without the flag still works
  const isAvailable = item.isAvailable ?? true;
  const isLowStock = isAvailable && item.isLowStock === true;

  // The image + name block. Unavailable items render this instead of a Link,
  // which is what makes them unclickable: there is no href to follow, so the
  // order page can't be reached even by keyboard.
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
        {/* Badges sit above the name so they read before the price */}
        {!isAvailable ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-600 rounded-full px-2 py-0.5">
            Unavailable
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-orange-500 rounded-full px-2 py-0.5">
            Low stock
          </span>
        ) : null}

        <span className={`font-bold text-lg ${isAvailable ? "" : "line-through opacity-60"}`}>
          P{price}
        </span>
        <span className={`font-medium text-sm ${isAvailable ? "" : "opacity-60"}`}>
          {itemName}
        </span>
        <span className="text-xs opacity-75">{categoryLabel}</span>
      </div>
    </>
  );

  return (
    <div
      className={`relative bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-3 gap-2 text-dark-brown ${
        isAvailable ? "" : "opacity-70"
      }`}
    >
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
        <Link href={`/orders/${item.itemId}`} className="flex flex-col gap-2">
          {body}
        </Link>
      ) : (
        <div className="flex flex-col gap-2 cursor-not-allowed">{body}</div>
      )}

      {sublabel && (
        <span className="text-xs text-dark-brown/60 px-1">{sublabel}</span>
      )}
    </div>
  );
}

export default ProductCard;