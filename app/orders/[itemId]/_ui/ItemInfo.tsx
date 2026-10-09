'use client'

type ItemInfoProps = {
  itemName: string;
  price: number;
  ingredients: string[];
};

function ItemInfo({
  itemName,
  price,
  ingredients,
}: ItemInfoProps) {
  const hasIngredients =
    Array.isArray(ingredients) && ingredients.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 text-dark-brown">
      {/* Product name */}
      <div className="text-lg font-bold">
        {itemName}
      </div>

      {/* Product price */}
      <div className="text-xl font-bold">
        ₱{Number(price).toFixed(2)}
      </div>

      {/* Ingredients */}
      <div className="border-t border-[#D8C7A5] pt-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4F3A] mb-2">
          Ingredients
        </h3>

        {hasIngredients ? (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => (
              <span
                key={`${ingredient}-${index}`}
                className="inline-flex items-center rounded-full border border-[#D6C09A] bg-[#E8D9B8] px-3 py-1.5 text-sm font-medium text-[#4B3325] shadow-sm"
              >
                {ingredient}
              </span>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full border border-[#D6C09A] bg-[#F4EBD0] px-3 py-1.5 text-sm italic text-[#6B4F3A]">
            No ingredients listed
          </span>
        )}
      </div>
    </div>
  );
}

export default ItemInfo;
