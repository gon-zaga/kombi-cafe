'use client'

import React, { useState } from "react";
import Link from "next/link";
import ItemImage from "./ItemImage";

type MenuCardItem = {
  itemId: number;
  category: string | null;
  itemImg: string | null;
  itemName: string;
  ingredients: string[];
  sizes: { size: string; price: number; sizeId: number; oz?: number | null; temperature?: string | null }[];
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
  const imageSrc = item.itemImg || "/drinks/no-drink-image.svg";
  const itemName = item.itemName || "Menu item";
  const categoryLabel = item.category || "Other";

  const isAvailable = item.isAvailable ?? true;
  const isLowStock = isAvailable && item.isLowStock === true;
  const isNotPurchasable = !isAvailable || isLowStock;

  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const visibleIngredients = showAllIngredients
    ? item.ingredients
    : item.ingredients.slice(0, 3);
  const hasMoreIngredients = item.ingredients.length > 3;

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const body = (
    <>
      <div className="flex justify-center items-center bg-white rounded-xl p-2 relative overflow-hidden w-full aspect-square shrink-0">
        <ItemImage
          src={imageSrc}
          alt={itemName}
          loading="eager"
          className={isNotPurchasable ? "opacity-40 grayscale w-full h-full object-cover" : "w-full h-full object-cover"}
        />
        
        {/* Unavailable overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <span className="text-white font-bold text-sm px-3 py-1.5 bg-red-600/90 rounded-full backdrop-blur-sm">
              Sold Out
            </span>
          </div>
        )}
        
        {/* Low stock overlay */}
        {isLowStock && isAvailable && (
          <div className="absolute inset-0 bg-black/30 flex items-end p-2 rounded-xl pointer-events-none">
            <span className="text-white font-medium text-xs px-2 py-1 bg-orange-500/90 rounded-full backdrop-blur-sm">
              Low Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-1.5 w-full">
        {/* Size/Price chips */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full" role="list" aria-label="Available sizes">
            {item.sizes.map((sizeOption) => (
              <span
                key={sizeOption.sizeId}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-150 min-h-[44px] ${
                  isNotPurchasable
                    ? "border-dark-brown/20 bg-dark-brown/5 text-dark-brown/40 line-through"
                    : "border-[#D6C09A] bg-[#E8D9B8] text-[#4B3325] hover:bg-[#D6C09A] hover:text-[#3D2B1F]"
                }`}
                role="listitem"
              >
                {sizeOption.size}: ₱{Number(sizeOption.price).toFixed(2)}
              </span>
            ))}
          </div>
        )}

        {/* Product name */}
        <span
          className={`font-medium text-base w-full truncate ${
            isNotPurchasable ? "opacity-60" : ""
          }`}
        >
          {itemName}
        </span>

        {/* Category */}
        <span className="text-sm opacity-75 font-roboto-condensed tracking-wide">
          {categoryLabel}
        </span>

        {/* Styled ingredients - collapsible */}
        {(Array.isArray(item.ingredients) && item.ingredients.length > 0) ? (
          <div className="mt-2 w-full border-t border-[#D8C7A5] pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B4F3A]">
                Ingredients
              </p>
              {hasMoreIngredients && (
                <button
                  type="button"
                  onClick={() => setShowAllIngredients(!showAllIngredients)}
                  className="text-sm font-medium text-[#8B4513] hover:text-[#6B4F3A] transition-colors px-2 py-1 min-h-[44px] min-w-[44px] flex items-center"
                  aria-expanded={showAllIngredients}
                  aria-controls="ingredients-list"
                >
                  {showAllIngredients ? "Show less" : "Show more"}
                </button>
              )}
            </div>

            <div 
              id="ingredients-list"
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Ingredients"
            >
              {visibleIngredients.map((ing, index) => (
                <span
                  key={`${ing}-${index}`}
                  className="inline-flex items-center rounded-full border border-[#D6C09A] bg-[#E8D9B8] px-3 py-1.5 text-sm font-medium text-[#4B3325] shadow-sm min-h-[44px]"
                  role="listitem"
                >
                  {ing}
                </span>
              ))}
              {hasMoreIngredients && !showAllIngredients && (
                <span className="inline-flex items-center rounded-full border border-[#D6C09A]/50 bg-transparent px-3 py-1.5 text-sm font-medium text-[#6B4F3A]/60 min-h-[44px]">
                  +{item.ingredients.length - 3} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 w-full border-t border-[#D8C7A5] pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B4F3A] mb-1.5">
              Ingredients
            </p>

            <span className="inline-flex rounded-full border border-[#D6C09A] bg-[#E8D9B8] px-3 py-1.5 text-sm italic text-[#6B4F3A] min-h-[44px]">
              None listed
            </span>
          </div>
        )}
      </div>
    </>
  );

  const cardStyle: React.CSSProperties = {
    transform: isPressed && !isNotPurchasable ? "scale(0.98)" : "scale(1)",
    transition: "transform 0.1s ease-out, box-shadow 0.2s ease-out",
    boxShadow: isPressed && !isNotPurchasable 
      ? "0 2px 8px rgba(61,43,31,0.15)" 
      : "0 4px 16px rgba(61,43,31,0.1)",
  };

  return (
    <div
      className={`relative bg-[#F4EBD0] rounded-2xl drop-shadow-lg flex flex-col p-4 gap-2.5 text-dark-brown ${
        isNotPurchasable ? "opacity-70" : ""
      } ${className ?? ""}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseLeave}
    >
      {/* NEW badge */}
      {tag === "new" && (
        <span className="absolute top-2 left-2 z-10 bg-green-800 text-white text-xs font-bold uppercase tracking-wide rounded-full px-2 py-1">
          NEW
        </span>
      )}

      {/* BEST badge */}
      {tag === "best" && (
        <span className="absolute top-2 left-2 z-10 bg-amber-800 text-white text-xs font-bold uppercase tracking-wide rounded-full px-2 py-1">
          BEST
        </span>
      )}

      {/* Available items are clickable */}
      {isNotPurchasable ? (
        <div className="flex flex-col gap-2.5 cursor-not-allowed">
          {body}
        </div>
      ) : (
        <Link
          href={`/orders/${item.itemId}`}
          className="flex flex-col gap-2.5"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseLeave}
        >
          {body}
        </Link>
      )}

      {/* Optional sublabel */}
      {sublabel && (
        <span className="text-sm text-dark-brown/60 px-1">
          {sublabel}
        </span>
      )}
    </div>
  );
}

export default ProductCard;